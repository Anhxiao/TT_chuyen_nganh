
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";

import Header from "../components/Header Student";
import Footer from "../components/Footer";

import { useAuth } from "../contexts/AuthContext";

import {
    getActivitiesByOrganization
} from "../services/activitystudent";

import {
    getMyRegistrations
} from "../services/registrationService";

import clubService from "../services/clubService";

import "../styles/styles-dashboard.css";

// =====================================
// CÁC ĐƠN VỊ TỔ CHỨC
// =====================================

const organizations = [
    {
        id: "TECH_UNION",
        name: "Đoàn Trường Kỹ thuật và Công nghệ"
    },
    {
        id: "LAW_UNION",
        name: "Đoàn Trường Kinh tế và Luật"
    },
    {
        id: "MED_UNION",
        name: "Đoàn Trường Y Dược"
    },
    {
        id: "LIFE_SKILL_CLUB",
        name: "Câu lạc bộ Kỹ năng sống"
    },
    {
        id: "MEDIA_CLUB",
        name: "Câu lạc bộ Truyền thông TVU"
    },
    {
        id: "ART_CLUB",
        name: "Câu lạc bộ Văn hóa Nghệ thuật TVU"
    }
];

// =====================================
// XÁC ĐỊNH ĐOÀN TRƯỜNG CỦA SINH VIÊN
// =====================================

const getStudentOrganizationId = (user) => {
    if (!user) return null;

    const validOrganizationIds = [
        "TECH_UNION",
        "LAW_UNION",
        "MED_UNION"
    ];

    const organizationId =
        user.organizationId ||
        user.organization_id ||
        user.student?.organizationId ||
        user.student?.organization_id;

    if (validOrganizationIds.includes(organizationId)) {
        return organizationId;
    }

    const faculty =
        user.faculty ||
        user.facultyName ||
        user.faculty_name ||
        user.student?.faculty ||
        user.student?.facultyName ||
        user.student?.faculty_name ||
        user.studentInfo?.faculty ||
        user.studentInfo?.facultyName ||
        user.student_info?.faculty ||
        user.student_info?.faculty_name ||
        "";

    const facultyName =
        typeof faculty === "object"
            ? (
                faculty.name ||
                faculty.facultyName ||
                faculty.faculty_name ||
                faculty.code ||
                ""
            )
            : faculty;

    const normalizedFaculty = String(facultyName)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

    const facultyOrganizations = {
        "trường kỹ thuật và công nghệ": "TECH_UNION",
        "kỹ thuật và công nghệ": "TECH_UNION",
        "tech_union": "TECH_UNION",

        "trường kinh tế và luật": "LAW_UNION",
        "kinh tế và luật": "LAW_UNION",
        "law_union": "LAW_UNION",

        "trường y dược": "MED_UNION",
        "y dược": "MED_UNION",
        "med_union": "MED_UNION"
    };

    return facultyOrganizations[normalizedFaculty] || null;
};

// =====================================
// CHUẨN HÓA MÃ ĐƠN VỊ
// =====================================

const normalizeCode = (value) =>
    String(value || "")
        .trim()
        .toUpperCase();

const getOrganizationCode = (club) =>
    normalizeCode(
        club?.organization_code ||
        club?.organizationCode ||
        club?.organization?.organization_code ||
        club?.organization?.organizationCode ||
        club?.code
    );

const getMembershipStatus = (club) =>
    normalizeCode(
        club?.membership_status ||
        club?.membershipStatus ||
        club?.member_status ||
        club?.memberStatus
    );

// =====================================
// CHUẨN HÓA DỮ LIỆU API
// =====================================

const extractData = (response) =>
    response?.data?.data ??
    response?.data ??
    response;

const extractList = (response) => {
    const data = extractData(response);

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.activities)) return data.activities;
    if (Array.isArray(data?.registrations)) return data.registrations;
    if (Array.isArray(data?.clubs)) return data.clubs;

    return [];
};

// =====================================
// ĐỊNH DẠNG NGÀY GIỜ
// =====================================

const formatDateTime = (value) => {
    if (!value) return "Chưa cập nhật";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Chưa cập nhật";
    }

    return date.toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
};

const formatDate = (value) => {
    if (!value) return "Chưa cập nhật";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Chưa cập nhật";
    }

    return date.toLocaleDateString("vi-VN");
};

// =====================================
// TRẠNG THÁI ĐĂNG KÝ
// =====================================

const registrationStatusMap = {
    PENDING: "Đang chờ duyệt",
    APPROVED: "Đã được duyệt",
    REJECTED: "Đã bị từ chối",
    CANCELLED: "Đã hủy đăng ký"
};

const getRegistrationStatusClass = (status) => {
    switch (status) {
        case "APPROVED":
            return "success";

        case "PENDING":
            return "warning";

        case "REJECTED":
            return "danger";

        case "CANCELLED":
            return "secondary";

        default:
            return "secondary";
    }
};

// =====================================
// LỌC HOẠT ĐỘNG ĐÃ CÔNG BỐ
// =====================================

const isPublishedActivity = (activity) =>
    ["PUBLISHED", "REGISTERING"].includes(
        normalizeCode(activity?.status)
    );

// =====================================
// COMPONENT
// =====================================

const StudentDashboard = () => {
    const { user } = useAuth();

    const studentOrganizationId =
        getStudentOrganizationId(user);

    const [activities, setActivities] = useState([]);
    const [registrations, setRegistrations] = useState([]);

    const [isLoadingActivities, setIsLoadingActivities] =
        useState(true);

    const [isLoadingRegistrations, setIsLoadingRegistrations] =
        useState(true);

    const [activityError, setActivityError] = useState("");
    const [registrationError, setRegistrationError] = useState("");

    // =====================================
    // TẢI HOẠT ĐỘNG PHÙ HỢP
    // =====================================

    const loadSuitableActivities = useCallback(
        async (signal) => {
            try {
                setIsLoadingActivities(true);
                setActivityError("");

                if (!user?.userId) {
                    setActivities([]);
                    return;
                }

                // Các đơn vị mà sinh viên được phép xem hoạt động.
                const allowedOrganizationIds = [];

                // Đoàn trường thuộc trường của sinh viên.
                if (studentOrganizationId) {
                    allowedOrganizationIds.push(
                        studentOrganizationId
                    );
                }

                // Lấy danh sách câu lạc bộ của sinh viên.
                let clubList = [];

                try {
                    const clubResponse =
                        await clubService.getClubs();

                    clubList = extractList(clubResponse);

                } catch (clubError) {
                    console.error(
                        "Không thể tải danh sách câu lạc bộ:",
                        clubError
                    );
                }

                if (signal?.aborted) return;

                // Chỉ thêm CLB mà sinh viên đã là thành viên ACTIVE.
                const activeClubIds = clubList
                    .filter(
                        (club) =>
                            getMembershipStatus(club) === "ACTIVE"
                    )
                    .map(getOrganizationCode)
                    .filter(Boolean);

                allowedOrganizationIds.push(...activeClubIds);

                // Loại bỏ mã đơn vị trùng lặp.
                const uniqueOrganizationIds = [
                    ...new Set(allowedOrganizationIds)
                ];

                if (uniqueOrganizationIds.length === 0) {
                    setActivities([]);
                    return;
                }

                // Tải hoạt động của tất cả đơn vị phù hợp.
                const activityResults = await Promise.allSettled(
                    uniqueOrganizationIds.map(
                        (organizationId) =>
                            getActivitiesByOrganization(
                                organizationId,
                                signal
                            )
                    )
                );

                if (signal?.aborted) return;

                const allActivities = [];

                activityResults.forEach((result) => {
                    if (result.status !== "fulfilled") {
                        console.error(
                            "Không thể tải hoạt động của một đơn vị:",
                            result.reason
                        );
                        return;
                    }

                    const activityList = extractList(
                        result.value
                    );

                    allActivities.push(...activityList);
                });

                // Chỉ hiển thị hoạt động đã được công bố.
                const publishedActivities = allActivities.filter(
                    isPublishedActivity
                );

                // Loại bỏ hoạt động trùng lặp.
                const uniqueActivities = Array.from(
                    new Map(
                        publishedActivities.map((activity) => [
                            String(activity.activity_id),
                            activity
                        ])
                    ).values()
                );

                // Sắp xếp hoạt động mới nhất trước.
                uniqueActivities.sort((a, b) => {
                    const dateA = new Date(
                        a.created_at || a.activity_start || 0
                    ).getTime();

                    const dateB = new Date(
                        b.created_at || b.activity_start || 0
                    ).getTime();

                    return dateB - dateA;
                });

                setActivities(uniqueActivities);

                if (
                    activityResults.every(
                        (result) => result.status === "rejected"
                    )
                ) {
                    setActivityError(
                        "Không thể tải hoạt động từ các đơn vị phù hợp."
                    );
                }

            } catch (error) {
                if (error.name === "AbortError") return;

                console.error(
                    "Lỗi tải hoạt động phù hợp:",
                    error
                );

                setActivityError(
                    error.message ||
                    "Không thể tải danh sách hoạt động phù hợp."
                );

                setActivities([]);

            } finally {
                if (!signal?.aborted) {
                    setIsLoadingActivities(false);
                }
            }
        },
        [user?.userId, studentOrganizationId]
    );

    // =====================================
    // TẢI ĐĂNG KÝ GẦN ĐÂY
    // =====================================

    const loadRecentRegistrations = useCallback(
        async () => {
            try {
                setIsLoadingRegistrations(true);
                setRegistrationError("");

                if (!user?.userId) {
                    setRegistrations([]);
                    return;
                }

                const response = await getMyRegistrations({
                    page: 1,
                    limit: 100
                });

                const registrationList = extractList(response);

                // Sắp xếp theo thời gian đăng ký mới nhất.
                registrationList.sort((a, b) => {
                    const dateA = new Date(
                        a.registered_at ||
                        a.created_at ||
                        0
                    ).getTime();

                    const dateB = new Date(
                        b.registered_at ||
                        b.created_at ||
                        0
                    ).getTime();

                    return dateB - dateA;
                });

                setRegistrations(registrationList.slice(0, 5));

            } catch (error) {
                console.error(
                    "Lỗi tải đăng ký gần đây:",
                    error
                );

                setRegistrationError(
                    error.message ||
                    "Không thể tải danh sách đăng ký gần đây."
                );

                setRegistrations([]);

            } finally {
                setIsLoadingRegistrations(false);
            }
        },
        [user?.userId]
    );

    // =====================================
    // TẢI DỮ LIỆU TRANG CHỦ
    // =====================================

    useEffect(() => {
        const controller = new AbortController();

        loadSuitableActivities(controller.signal);
        loadRecentRegistrations();

        return () => {
            controller.abort();
        };
    }, [
        loadSuitableActivities,
        loadRecentRegistrations
    ]);

    // =====================================
    // GIAO DIỆN
    // =====================================

    return (
        <div className="dashboard-page">
            <Header role="STUDENT" />

            <main className="dashboard-container container-fluid">

                {/* =====================================
                    THÔNG TIN SINH VIÊN
                ===================================== */}

                <section className="dashboard-welcome">
                    <div>
                        <span className="dashboard-eyebrow">
                            SINH VIÊN - ĐẠI HỌC TRÀ VINH
                        </span>

                        <h2>
                            Xin chào,{" "}
                            {user?.fullName ||
                                "Chưa xác định tên sinh viên"}!
                        </h2>

                        <p>
                            <i className="bi bi-person-badge me-2"></i>
                            Mã sinh viên:{" "}
                            {user?.student?.studentCode ||
                                "Chưa cập nhật"}

                            <br />

                            <i className="bi bi-journal-bookmark me-2"></i>
                            Mã lớp:{" "}
                            {user?.student?.className ||
                                "Chưa cập nhật"}

                            <br />

                            <i className="bi bi-mortarboard me-2"></i>
                            Trường đào tạo:{" "}
                            {user?.student?.facultyName ||
                                user?.student?.faculty_name ||
                                "Chưa cập nhật"}

                            <br />

                            <i className="bi bi-people me-2"></i>
                            Câu lạc bộ:{" "}
                            {user?.organizations?.length > 0
                                ? user.organizations
                                    .map(
                                        (org) =>
                                            org.organizationName
                                    )
                                    .join(", ")
                                : "Chưa tham gia câu lạc bộ"}
                        </p>
                    </div>

                    <div className="d-flex justify-content-end mt-3">
                        <Link
                            to="/activities"
                            className="btn btn-primary"
                        >
                            <i className="bi bi-search me-2"></i>
                            Tìm hoạt động
                        </Link>
                    </div>
                </section>

                {/* =====================================
                    THỐNG KÊ
                ===================================== */}

                <section className="dashboard-section">
                    <div className="row g-3">

                        <div className="col-6 col-xl-3">
                            <div className="dashboard-stat-card">
                                <div className="stat-icon blue">
                                    <i className="bi bi-award"></i>
                                </div>

                                <div>
                                    <p>Điểm hoạt động</p>
                                    <h3>—</h3>
                                </div>
                            </div>
                        </div>

                        <div className="col-6 col-xl-3">
                            <div className="dashboard-stat-card">
                                <div className="stat-icon cyan">
                                    <i className="bi bi-calendar-check"></i>
                                </div>

                                <div>
                                    <p>Đã đăng ký</p>
                                    <h3>
                                        {isLoadingRegistrations
                                            ? "..."
                                            : registrations.length}
                                    </h3>
                                </div>
                            </div>
                        </div>

                        <div className="col-6 col-xl-3">
                            <div className="dashboard-stat-card">
                                <div className="stat-icon green">
                                    <i className="bi bi-check-circle"></i>
                                </div>

                                <div>
                                    <p>Hoàn thành</p>
                                    <h3>—</h3>
                                </div>
                            </div>
                        </div>

                        <div className="col-6 col-xl-3">
                            <div className="dashboard-stat-card">
                                <div className="stat-icon orange">
                                    <i className="bi bi-hourglass-split"></i>
                                </div>

                                <div>
                                    <p>Chờ duyệt</p>
                                    <h3>
                                        {isLoadingRegistrations
                                            ? "..."
                                            : registrations.filter(
                                                (item) =>
                                                    normalizeCode(
                                                        item.registration_status ||
                                                        item.status
                                                    ) === "PENDING"
                                            ).length}
                                    </h3>
                                </div>
                            </div>
                        </div>

                    </div>
                </section>

                {/* =====================================
                    HOẠT ĐỘNG PHÙ HỢP VÀ ĐĂNG KÝ GẦN ĐÂY
                ===================================== */}

                <section className="dashboard-section">
                    <div className="row g-4">

                        {/* =====================================
                            HOẠT ĐỘNG PHÙ HỢP
                        ===================================== */}

                        <div className="col-lg-7">
                            <div className="dashboard-section-heading">
                                <div>
                                    <h4>Hoạt động phù hợp</h4>

                                    <p>
                                        Hoạt động đã công bố bởi đơn vị phù hợp với bạn
                                    </p>
                                </div>

                                <Link
                                    to="/activities"
                                    className="dashboard-view-all"
                                >
                                    Xem tất cả{" "}
                                    <i className="bi bi-arrow-right"></i>
                                </Link>
                            </div>

                            <div className="dashboard-content-card">

                                {isLoadingActivities ? (
                                    <div className="text-center py-5">
                                        <div
                                            className="spinner-border text-primary"
                                            role="status"
                                        ></div>

                                        <p className="mt-3 mb-0">
                                            Đang tải hoạt động phù hợp...
                                        </p>
                                    </div>
                                ) : activityError ? (
                                    <div className="alert alert-danger mb-0">
                                        <i className="bi bi-exclamation-circle me-2"></i>
                                        {activityError}

                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-danger ms-3"
                                            onClick={() => {
                                                const controller =
                                                    new AbortController();

                                                loadSuitableActivities(
                                                    controller.signal
                                                );
                                            }}
                                        >
                                            Thử lại
                                        </button>
                                    </div>
                                ) : activities.length === 0 ? (
                                    <div className="text-center py-4 empty-state">
                                        <i className="bi bi-calendar2-x"></i>

                                        <h5>
                                            Chưa có hoạt động phù hợp
                                        </h5>

                                        <p>
                                            Các hoạt động sẽ xuất hiện tại đây
                                            khi đơn vị phù hợp công bố hoạt động mới.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="dashboard-activity-list">
                                        {activities.slice(0, 5).map(
                                            (activity) => (
                                                <div
                                                    className="dashboard-activity-item"
                                                    key={activity.activity_id}
                                                >
                                                    <div className="dashboard-activity-content">
                                                        <div className="d-flex flex-wrap justify-content-between gap-2">
                                                            <h5>
                                                                {activity.activity_name}
                                                            </h5>

                                                            <span className="badge bg-success">
                                                                {normalizeCode(activity.status) === "REGISTERING"
                                                                    ? "Đang mở đăng ký"
                                                                    : "Đã công bố"}
                                                            </span>
                                                        </div>

                                                        <p>
                                                            <i className="bi bi-building me-2"></i>
                                                            {activity.organization_name ||
                                                                "Đơn vị tổ chức"}
                                                        </p>

                                                        <p>
                                                            <i className="bi bi-geo-alt me-2"></i>
                                                            {activity.location ||
                                                                "Chưa cập nhật địa điểm"}
                                                        </p>

                                                        <p>
                                                            <i className="bi bi-calendar-event me-2"></i>
                                                            Bắt đầu:{" "}
                                                            {formatDateTime(
                                                                activity.activity_start
                                                            )}
                                                        </p>

                                                        <p>
                                                            <i className="bi bi-calendar-check me-2"></i>
                                                            Hạn đăng ký:{" "}
                                                            {formatDateTime(
                                                                activity.registration_end
                                                            )}
                                                        </p>

                                                        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3">
                                                            <span className="text-muted">
                                                                <i className="bi bi-people me-2"></i>
                                                                Đã đăng ký:{" "}
                                                                {activity.current_participants ?? 0}

                                                                {activity.max_participants != null
                                                                    ? ` / ${activity.max_participants}`
                                                                    : " / Không giới hạn"}
                                                            </span>

                                                            <Link
                                                                to={`/activities/${activity.activity_id}`}
                                                                state={{
                                                                    from: "/",
                                                                    organizationCode:
                                                                        activity.organization_id ||
                                                                        studentOrganizationId
                                                                }}
                                                                className="btn btn-sm btn-outline-primary"
                                                            >
                                                                <i className="bi bi-eye me-1"></i>
                                                                Xem chi tiết
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}

                            </div>
                        </div>

                        {/* =====================================
                            ĐĂNG KÝ GẦN ĐÂY
                        ===================================== */}

                        <div className="col-lg-5">
                            <div className="dashboard-section-heading">
                                <div>
                                    <h4>Đăng ký gần đây</h4>

                                    <p>
                                        Theo dõi trạng thái đăng ký hoạt động
                                    </p>
                                </div>

                                <Link
                                    to="/my-registrations"
                                    className="dashboard-view-all"
                                >
                                    Xem tất cả{" "}
                                    <i className="bi bi-arrow-right"></i>
                                </Link>
                            </div>

                            <div className="dashboard-content-card">

                                {isLoadingRegistrations ? (
                                    <div className="text-center py-5">
                                        <div
                                            className="spinner-border text-primary"
                                            role="status"
                                        ></div>

                                        <p className="mt-3 mb-0">
                                            Đang tải đăng ký...
                                        </p>
                                    </div>
                                ) : registrationError ? (
                                    <div className="alert alert-danger mb-0">
                                        {registrationError}
                                    </div>
                                ) : registrations.length === 0 ? (
                                    <div className="text-center py-4">
                                        <i className="bi bi-inbox empty-table-icon"></i>

                                        <p className="mb-0 mt-2 text-muted">
                                            Chưa có đăng ký nào
                                        </p>

                                        <Link
                                            to="/activities"
                                            className="btn btn-sm btn-outline-primary mt-3"
                                        >
                                            Tìm hoạt động
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="dashboard-registration-list">
                                        {registrations.map(
                                            (registration) => {
                                                const status =
                                                    normalizeCode(
                                                        registration.registration_status ||
                                                        registration.status
                                                    );

                                                const activityId =
                                                    registration.activity_id;

                                                return (
                                                    <div
                                                        className="dashboard-registration-item"
                                                        key={
                                                            registration.registration_id ||
                                                            `${activityId}-${registration.registered_at}`
                                                        }
                                                    >
                                                        <div className="d-flex justify-content-between align-items-start gap-2">
                                                            <div>
                                                                <h6>
                                                                    {registration.activity_name ||
                                                                        registration.activity?.activity_name ||
                                                                        "Hoạt động sinh viên"}
                                                                </h6>

                                                                <p>
                                                                    <i className="bi bi-building me-2"></i>
                                                                    {registration.organization_name ||
                                                                        registration.organization?.organization_name ||
                                                                        "Đơn vị tổ chức"}
                                                                </p>
                                                            </div>

                                                            <span
                                                                className={`badge bg-${getRegistrationStatusClass(status)}`}
                                                            >
                                                                {registrationStatusMap[status] ||
                                                                    status ||
                                                                    "Chưa xác định"}
                                                            </span>
                                                        </div>

                                                        <p>
                                                            <i className="bi bi-calendar-plus me-2"></i>
                                                            Ngày đăng ký:{" "}
                                                            {formatDate(
                                                                registration.registered_at ||
                                                                registration.created_at
                                                            )}
                                                        </p>

                                                        {activityId && (
                                                            <Link
                                                                to={`/activities/${activityId}`}
                                                                className="btn btn-sm btn-outline-primary mt-2"
                                                            >
                                                                Xem hoạt động{" "}
                                                                <i className="bi bi-arrow-right ms-1"></i>
                                                            </Link>
                                                        )}
                                                    </div>
                                                );
                                            }
                                        )}
                                    </div>
                                )}

                            </div>
                        </div>

                    </div>
                </section>

            </main>

            <Footer />
        </div>
    );
};

export default StudentDashboard;
