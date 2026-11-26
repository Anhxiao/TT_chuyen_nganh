import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import Header from "../components/Header Organizer.jsx";
import Footer from "../components/Footer.jsx";
import { AuthContext } from "../contexts/AuthContext";

import "../styles/styles-dashboard.css";

const API_BASE_URL = (
    import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

const ACTIVITY_STATUSES = [
    "DRAFT",
    "PUBLISHED",
    "REGISTERING",
    "ONGOING",
    "COMPLETED",
    "CANCELLED"
];

const STATUS_LABELS = {
    DRAFT: "Bản nháp",
    PUBLISHED: "Đã công bố",
    REGISTERING: "Đang mở đăng ký",
    ONGOING: "Đang diễn ra",
    COMPLETED: "Đã hoàn thành",
    CANCELLED: "Đã hủy"
};

const STATUS_CLASSES = {
    DRAFT: "draft",
    PUBLISHED: "published",
    REGISTERING: "registering",
    ONGOING: "ongoing",
    COMPLETED: "completed",
    CANCELLED: "cancelled"
};

const ORGANIZATION_NAMES = {
    TECH_UNION: "Đoàn Trường Kỹ thuật và Công nghệ",
    LAW_UNION: "Đoàn Trường Kinh tế và Luật",
    MED_UNION: "Đoàn Trường Y Dược",
    LIFE_SKILL_CLUB: "Câu lạc bộ Kỹ năng sống",
    MEDIA_CLUB: "Câu lạc bộ Truyền thông TVU",
    ART_CLUB: "Câu lạc bộ Văn hóa Nghệ thuật TVU"
};

const CLUB_CODES = [
    "LIFE_SKILL_CLUB",
    "MEDIA_CLUB",
    "ART_CLUB"
];

function getOrganizationInfo(user) {
    const organization =
        user?.organization ||
        (Array.isArray(user?.organizations) &&
        user.organizations.length > 0
            ? user.organizations[0]
            : null);

    const id =
        user?.organizationId ??
        user?.organization_id ??
        organization?.organizationId ??
        organization?.organization_id ??
        organization?.id ??
        null;

    const code =
        (typeof user?.organization === "string"
            ? user.organization
            : null) ||
        user?.organizationCode ||
        user?.organization_code ||
        organization?.organizationCode ||
        organization?.organization_code ||
        organization?.code ||
        "";

    const name =
        user?.organizationName ||
        user?.organization_name ||
        organization?.organizationName ||
        organization?.organization_name ||
        organization?.name ||
        ORGANIZATION_NAMES[code] ||
        user?.fullName?.replace(/^Tài khoản\s+/i, "") ||
        "Chưa xác định đơn vị";

    const type = String(
        organization?.organizationType ||
        organization?.organization_type ||
        organization?.type ||
        organization?.category ||
        user?.organizationType ||
        user?.organization_type ||
        ""
    ).toUpperCase();

    return {
        id: id ? Number(id) : null,
        code: String(code).toUpperCase(),
        name,
        type
    };
}

function formatDateTime(value) {
    if (!value) return "Chưa cập nhật";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Chưa cập nhật";
    }

    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    }).format(date);
}

function getActivityId(activity) {
    return (
        activity.activity_id ??
        activity.activityId ??
        activity.id
    );
}

function getActivityStatus(activity) {
    return String(activity.status || "").toUpperCase();
}

function OrganizerDashboard() {
    const { user } = useContext(AuthContext);

    const [activities, setActivities] = useState([]);
    const [loadingActivities, setLoadingActivities] = useState(true);
    const [activityError, setActivityError] = useState("");

    const organization = useMemo(
        () => getOrganizationInfo(user),
        [user]
    );

    const isClub =
        CLUB_CODES.includes(organization.code) ||
        organization.type === "CLUB";

    // Lấy tất cả hoạt động thuộc đơn vị đang đăng nhập.
    const loadActivities = useCallback(async (signal) => {
        if (!organization.id) {
            setActivities([]);
            setActivityError(
                "Không xác định được đơn vị tổ chức của tài khoản."
            );
            setLoadingActivities(false);
            return;
        }

        setLoadingActivities(true);
        setActivityError("");

        try {
            const token = sessionStorage.getItem("accessToken");

            const results = await Promise.all(
                ACTIVITY_STATUSES.map(async (status) => {
                    const params = new URLSearchParams({
                        organizationId: String(organization.id),
                        status,
                        page: "1",
                        limit: "100"
                    });

                    const response = await fetch(
                        `${API_BASE_URL}/activities?${params.toString()}`,
                        {
                            method: "GET",
                            headers: {
                                Accept: "application/json",
                                ...(token
                                    ? {
                                        Authorization: `Bearer ${token}`
                                    }
                                    : {})
                            },
                            signal
                        }
                    );

                    let result;

                    try {
                        result = await response.json();
                    } catch {
                        throw new Error(
                            "Máy chủ trả về dữ liệu hoạt động không hợp lệ."
                        );
                    }

                    if (!response.ok || result.success === false) {
                        throw new Error(
                            result.message ||
                            `Không thể tải hoạt động ở trạng thái ${status}.`
                        );
                    }

                    const rows = result.data ?? result;

                    return Array.isArray(rows) ? rows : [];
                })
            );

            // Gộp dữ liệu và loại bỏ bản ghi trùng.
            const activityMap = new Map();

            results.flat().forEach((activity) => {
                const id = getActivityId(activity);

                if (id !== undefined && id !== null) {
                    activityMap.set(String(id), activity);
                }
            });

            const activityList = Array.from(activityMap.values())
                .sort((a, b) => {
                    const dateA = new Date(
                        a.created_at || a.createdAt || 0
                    ).getTime();

                    const dateB = new Date(
                        b.created_at || b.createdAt || 0
                    ).getTime();

                    return dateB - dateA;
                });

            if (!signal.aborted) {
                setActivities(activityList);
            }
        } catch (error) {
            if (error.name !== "AbortError") {
                console.error(
                    "Lỗi tải hoạt động của đơn vị:",
                    error
                );

                setActivityError(
                    error.message ||
                    "Không thể tải danh sách hoạt động."
                );
            }
        } finally {
            if (!signal.aborted) {
                setLoadingActivities(false);
            }
        }
    }, [organization.id]);

    useEffect(() => {
        const controller = new AbortController();

        loadActivities(controller.signal);

        return () => {
            controller.abort();
        };
    }, [loadActivities]);

    const statistics = useMemo(() => {
        return {
            total: activities.length,
            published: activities.filter((item) =>
                ["PUBLISHED", "REGISTERING"].includes(
                    getActivityStatus(item)
                )
            ).length,
            ongoing: activities.filter(
                (item) => getActivityStatus(item) === "ONGOING"
            ).length,
            completed: activities.filter(
                (item) => getActivityStatus(item) === "COMPLETED"
            ).length
        };
    }, [activities]);

    return (
        <div className="dashboard-page">
            <Header role="ORGANIZER" />

            <main className="dashboard-container container-fluid">

                {/* THÔNG TIN ĐƠN VỊ */}
                <section className="organizer-welcome">
                    <div className="organizer-welcome-content">
                        <div className="organizer-welcome-label">
                            <i className="bi bi-building-check"></i>
                            HỆ THỐNG QUẢN LÝ HOẠT ĐỘNG TVU
                        </div>

                        <h2>
                            Xin chào,
                            <br />
                            <span>{organization.name}</span>
                        </h2>

                        <div className="organizer-account-info">
                            <span className="organizer-role">
                                <i className="bi bi-shield-check"></i>
                                Tài khoản đơn vị tổ chức
                            </span>

                            {user?.username && (
                                <span className="organizer-username">
                                    <i className="bi bi-person-circle"></i>
                                    {user.username}
                                </span>
                            )}
                        </div>

                        <p>
                            Chào mừng <strong>{organization.name}</strong> đến với
                            Hệ thống quản lý hoạt động phục vụ cộng đồng của
                            Trường Đại học Trà Vinh. Tại đây, đơn vị có thể tạo
                            và quản lý hoạt động,
                            {isClub
                                ? " xét duyệt đăng ký thành viên câu lạc bộ,"
                                : ""}
                            {" "}xác nhận kết quả tham gia và ghi nhận điểm
                            phục vụ cộng đồng cho sinh viên.
                        </p>
                    </div>

                    <div className="organizer-welcome-icon">
                        <i className="bi bi-buildings"></i>
                    </div>

                    <Link
                        to="/organizer/activities/create"
                        className="organizer-create-button"
                    >
                        <i className="bi bi-plus-circle"></i>
                        Tạo hoạt động mới
                    </Link>
                </section>

                {/* THỐNG KÊ */}
                <section className="dashboard-section">
                    <div className="dashboard-section-heading">
                        <div>
                            <h4>Tổng quan hoạt động</h4>
                            <p>
                                Thống kê hoạt động thuộc đơn vị đang đăng nhập
                            </p>
                        </div>

                        <button
                            type="button"
                            className="dashboard-refresh-button"
                            onClick={() => {
                                const controller = new AbortController();
                                loadActivities(controller.signal);
                            }}
                            disabled={loadingActivities}
                        >
                            <i className={`bi bi-arrow-clockwise ${
                                loadingActivities ? "dashboard-spin" : ""
                            }`}></i>
                            Làm mới
                        </button>
                    </div>

                    <div className="row g-3">
                        <div className={`col-6 ${isClub ? "col-xl-3" : "col-xl-4"}`}>
                            <div className="dashboard-stat-card">
                                <div className="stat-icon blue">
                                    <i className="bi bi-calendar-event"></i>
                                </div>
                                <div>
                                    <p>Tổng hoạt động</p>
                                    <h3>
                                        {loadingActivities
                                            ? "—"
                                            : statistics.total}
                                    </h3>
                                </div>
                            </div>
                        </div>

                        <div className={`col-6 ${isClub ? "col-xl-3" : "col-xl-4"}`}>
                            <div className="dashboard-stat-card">
                                <div className="stat-icon cyan">
                                    <i className="bi bi-megaphone"></i>
                                </div>
                                <div>
                                    <p>Đang mở đăng ký</p>
                                    <h3>
                                        {loadingActivities
                                            ? "—"
                                            : statistics.published}
                                    </h3>
                                </div>
                            </div>
                        </div>

                        {isClub && (
                            <div className="col-6 col-xl-3">
                                <div className="dashboard-stat-card">
                                    <div className="stat-icon orange">
                                        <i className="bi bi-person-check"></i>
                                    </div>
                                    <div>
                                        <p>Đăng ký thành viên chờ duyệt</p>
                                        <h3>—</h3>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className={`col-6 ${isClub ? "col-xl-3" : "col-xl-4"}`}>
                            <div className="dashboard-stat-card">
                                <div className="stat-icon green">
                                    <i className="bi bi-clipboard-check"></i>
                                </div>
                                <div>
                                    <p>Đã hoàn thành</p>
                                    <h3>
                                        {loadingActivities
                                            ? "—"
                                            : statistics.completed}
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* DANH SÁCH HOẠT ĐỘNG */}
                <section className="dashboard-section">
                    <div className="dashboard-section-heading">
                        <div>
                            <h4>Hoạt động do đơn vị quản lý</h4>
                            <p>
                                Danh sách hoạt động mới nhất của đơn vị
                            </p>
                        </div>

                        <Link
                            to="/organizer/history"
                            className="dashboard-view-all"
                        >
                            Xem tất cả
                            <i className="bi bi-arrow-right"></i>
                        </Link>
                    </div>

                    <div className="dashboard-content-card organizer-activity-panel">
                        {loadingActivities ? (
                            <div className="dashboard-activity-message">
                                <div className="spinner-border text-primary"></div>
                                <span>Đang tải danh sách hoạt động...</span>
                            </div>
                        ) : activityError ? (
                            <div className="dashboard-activity-message dashboard-activity-error">
                                <i className="bi bi-exclamation-triangle"></i>
                                <span>{activityError}</span>

                                <button
                                    type="button"
                                    className="btn btn-outline-primary btn-sm"
                                    onClick={() => {
                                        const controller = new AbortController();
                                        loadActivities(controller.signal);
                                    }}
                                >
                                    Thử lại
                                </button>
                            </div>
                        ) : activities.length === 0 ? (
                            <div className="dashboard-activity-message">
                                <i className="bi bi-calendar2-x"></i>
                                <h5>Chưa có hoạt động</h5>
                                <p>
                                    Các hoạt động do đơn vị tạo và công bố
                                    sẽ được hiển thị tại đây.
                                </p>

                                <Link
                                    to="/organizer/activities/create"
                                    className="btn btn-primary btn-sm"
                                >
                                    <i className="bi bi-plus-circle me-1"></i>
                                    Tạo hoạt động
                                </Link>
                            </div>
                        ) : (
                            <div className="organizer-activity-scroll">
                                <div className="organizer-activity-list">
                                    {activities.slice(0, 20).map((activity) => {
                                        const id = getActivityId(activity);
                                        const status = getActivityStatus(activity);
                                        const statusClass =
                                            STATUS_CLASSES[status] || "draft";

                                        const activityName =
                                            activity.activity_name ||
                                            activity.activityName ||
                                            "Chưa có tên hoạt động";

                                        const start =
                                            activity.activity_start ||
                                            activity.activityStart;

                                        const end =
                                            activity.activity_end ||
                                            activity.activityEnd;

                                        const currentParticipants =
                                            activity.current_participants ??
                                            activity.currentParticipants ??
                                            0;

                                        const maxParticipants =
                                            activity.max_participants ??
                                            activity.maxParticipants;

                                        return (
                                            <article
                                                className="organizer-activity-item"
                                                key={id}
                                            >
                                                <div className="organizer-activity-main">
                                                    <div className="organizer-activity-icon">
                                                        <i className="bi bi-calendar2-event"></i>
                                                    </div>

                                                    <div className="organizer-activity-info">
                                                        <div className="organizer-activity-title-row">
                                                            <h5 title={activityName}>
                                                                {activityName}
                                                            </h5>

                                                            <span className={`activity-status-badge ${statusClass}`}>
                                                                {STATUS_LABELS[status] || status}
                                                            </span>
                                                        </div>

                                                        <div className="organizer-activity-meta">
                                                            <span>
                                                                <i className="bi bi-upc"></i>
                                                                {activity.activity_code ||
                                                                    activity.activityCode ||
                                                                    `ID: ${id}`}
                                                            </span>

                                                            <span>
                                                                <i className="bi bi-geo-alt"></i>
                                                                {activity.location || "Chưa cập nhật địa điểm"}
                                                            </span>

                                                            <span>
                                                                <i className="bi bi-calendar3"></i>
                                                                {formatDateTime(start)}
                                                                {" – "}
                                                                {formatDateTime(end)}
                                                            </span>

                                                            <span>
                                                                <i className="bi bi-people"></i>
                                                                {currentParticipants}
                                                                {maxParticipants
                                                                    ? ` / ${maxParticipants}`
                                                                    : ""}
                                                                {" "}người
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="organizer-activity-actions">
                                                    <Link
                                                        to={`/organizer/activities/${id}`}
                                                        className="btn btn-outline-primary btn-sm"
                                                    >
                                                        <i className="bi bi-eye me-1"></i>
                                                        Chi tiết
                                                    </Link>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>

                                {activities.length > 20 && (
                                    <div className="organizer-activity-footer">
                                        Đang hiển thị 20 hoạt động mới nhất trên tổng số{" "}
                                        {activities.length} hoạt động.
                                        <Link to="/organizer/history">
                                            Xem toàn bộ danh sách
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </section>

                {/* ĐĂNG KÝ THÀNH VIÊN CÂU LẠC BỘ */}
                {isClub && (
                    <section className="dashboard-section">
                        <div className="dashboard-section-heading">
                            <div>
                                <h4>Đăng ký thành viên cần xử lý</h4>
                                <p>
                                    Danh sách sinh viên gửi yêu cầu tham gia
                                    câu lạc bộ đang chờ xét duyệt
                                </p>
                            </div>

                            <Link
                                to="/organizer/registrations"
                                className="dashboard-view-all"
                            >
                                Quản lý đăng ký
                                <i className="bi bi-arrow-right"></i>
                            </Link>
                        </div>

                        <div className="dashboard-content-card">
                            <div className="table-responsive">
                                <table className="table dashboard-table align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th>Sinh viên</th>
                                            <th>Hoạt động</th>
                                            <th>Thời gian đăng ký</th>
                                            <th>Trạng thái</th>
                                            <th>Thao tác</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        <tr>
                                            <td colSpan="5" className="text-center py-5">
                                                <i className="bi bi-inbox empty-table-icon"></i>
                                                <p className="mb-0 mt-2">
                                                    Không có đăng ký cần xử lý
                                                </p>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                )}

                {/* CÔNG VIỆC QUẢN LÝ */}
                <section className="dashboard-section">
                    <div className="dashboard-section-heading">
                        <div>
                            <h4>Công việc quản lý</h4>
                            <p>
                                Truy cập nhanh các chức năng dành cho đơn vị tổ chức
                            </p>
                        </div>
                    </div>

                    <div className="row g-3">
                        <div className="col-12 col-md-4">
                            <Link
                                to="/organizer/history"
                                className="quick-link-card"
                            >
                                <i className="bi bi-calendar2-plus"></i>
                                <div>
                                    <h6>Quản lý hoạt động</h6>
                                    <p>Xem và quản lý hoạt động đã tạo</p>
                                </div>
                                <i className="bi bi-arrow-right"></i>
                            </Link>
                        </div>

                        {isClub && (
                            <div className="col-12 col-md-4">
                                <Link
                                    to="/organizer/registrations"
                                    className="quick-link-card"
                                >
                                    <i className="bi bi-people"></i>
                                    <div>
                                        <h6>Duyệt đăng ký thành viên</h6>
                                        <p>
                                            Chấp nhận hoặc từ chối sinh viên
                                            đăng ký vào câu lạc bộ
                                        </p>
                                    </div>
                                    <i className="bi bi-arrow-right"></i>
                                </Link>
                            </div>
                        )}

                        <div className="col-12 col-md-4">
                            <Link
                                to="/organizer/participation"
                                className="quick-link-card"
                            >
                                <i className="bi bi-award"></i>
                                <div>
                                    <h6>Xác nhận và ghi nhận điểm</h6>
                                    <p>Xác nhận tham gia, ghi nhận kết quả</p>
                                </div>
                                <i className="bi bi-arrow-right"></i>
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}

export default OrganizerDashboard;