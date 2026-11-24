
import { useState, useEffect, useCallback } from "react";
import {
    useParams,
    useNavigate,
    useLocation
} from "react-router-dom";

import Header from "../components/Header Student";
import Footer from "../components/Footer";
import { useAuth } from "../contexts/AuthContext";

import { getActivityById } from "../services/activitystudent";

import {
    registerForActivity,
    cancelMyRegistration,
    getMyRegistrations
} from "../services/registrationService";

import "../styles/styles-activity-detail.css";

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
    if (Array.isArray(data?.registrations)) return data.registrations;

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
// TRẠNG THÁI HOẠT ĐỘNG
// =====================================

const activityStatusMap = {
    DRAFT: "Bản nháp",
    PUBLISHED: "Đã công bố",
    REGISTERING: "Đang mở đăng ký",
    ONGOING: "Đang diễn ra",
    COMPLETED: "Đã kết thúc",
    CANCELLED: "Đã hủy"
};

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
// COMPONENT
// =====================================

function ActivityDetail() {
    const { activityId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    // =====================================
    // ĐƯỜNG DẪN QUAY LẠI
    // =====================================

    const returnPath =
        typeof location.state?.from === "string" &&
        location.state.from.startsWith("/activities")
            ? location.state.from
            : "/activities";

    const returnOrganizationCode =
        location.state?.organizationCode || null;

    const handleBack = () => {
        navigate(returnPath, {
            state: {
                organizationCode: returnOrganizationCode
            }
        });
    };

    // =====================================
    // STATE
    // =====================================

    const [activity, setActivity] = useState(null);
    const [registration, setRegistration] = useState(null);

    // Theo dõi riêng trạng thái tải đăng ký cá nhân
    const [registrationLoadError, setRegistrationLoadError] = useState("");

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // =====================================
    // TẢI CHI TIẾT HOẠT ĐỘNG
    // VÀ TRẠNG THÁI ĐĂNG KÝ CỦA SINH VIÊN
    // =====================================

    const loadData = useCallback(async (signal) => {
        try {
            setIsLoading(true);
            setError("");
            setRegistrationLoadError("");

            const activityResponse = await getActivityById(
                activityId,
                signal
            );

            if (signal?.aborted) return;

            const activityData = extractData(activityResponse);

            if (!activityData || !activityData.activity_id) {
                throw new Error(
                    "Không tìm thấy thông tin hoạt động."
                );
            }

            setActivity(activityData);

            // Chưa đăng nhập thì không cần tải đăng ký cá nhân.
            if (!user?.userId) {
                setRegistration(null);
                return;
            }

            // Tải trạng thái đăng ký của sinh viên.
            try {
                const registrationResponse =
                    await getMyRegistrations({
                        page: 1,
                        limit: 100
                    });

                if (signal?.aborted) return;

                const registrationList =
                    extractList(registrationResponse);

                const myRegistration = registrationList.find(
                    (item) =>
                        Number(item.activity_id) ===
                        Number(activityId)
                );

                setRegistration(myRegistration || null);
                setRegistrationLoadError("");

            } catch (registrationError) {
                console.error(
                    "Không thể tải trạng thái đăng ký:",
                    registrationError
                );

                // Không được mặc định là chưa đăng ký.
                setRegistration(null);

                setRegistrationLoadError(
                    registrationError.message ||
                    "Không thể kiểm tra trạng thái đăng ký của bạn."
                );
            }

        } catch (loadError) {
            if (
                signal?.aborted ||
                loadError.name === "AbortError"
            ) {
                return;
            }

            console.error(
                "Lỗi tải chi tiết hoạt động:",
                loadError
            );

            setError(
                loadError.message ||
                "Không thể tải thông tin hoạt động."
            );

        } finally {
            if (!signal?.aborted) {
                setIsLoading(false);
            }
        }
    }, [activityId, user?.userId]);

    useEffect(() => {
        const controller = new AbortController();

        loadData(controller.signal);

        return () => controller.abort();
    }, [loadData]);

    // =====================================
    // KIỂM TRA ĐIỀU KIỆN ĐĂNG KÝ
    // =====================================

    const now = new Date();

    const registrationStart = activity
        ? new Date(activity.registration_start)
        : null;

    const registrationEnd = activity
        ? new Date(activity.registration_end)
        : null;

    const activityStart = activity
        ? new Date(activity.activity_start)
        : null;

    const validRegistrationDates =
        registrationStart &&
        registrationEnd &&
        !Number.isNaN(registrationStart.getTime()) &&
        !Number.isNaN(registrationEnd.getTime());

    const isRegistrationTimeValid =
        validRegistrationDates &&
        now >= registrationStart &&
        now <= registrationEnd;

    const activityStatus = activity?.status;

    const canRegisterByActivityStatus = [
        "PUBLISHED",
        "REGISTERING"
    ].includes(activityStatus);

    const currentParticipants =
        Number(activity?.current_participants || 0);

    const maxParticipants =
        activity?.max_participants == null
            ? null
            : Number(activity.max_participants);

    const isFull =
        maxParticipants !== null &&
        currentParticipants >= maxParticipants;

    // =====================================
    // TRẠNG THÁI ĐĂNG KÝ CÁ NHÂN
    // =====================================

    const currentRegistrationStatus =
        registration?.registration_status ||
        registration?.status ||
        null;

    // Đã đăng ký và đang chờ duyệt hoặc đã được duyệt.
    const hasActiveRegistration = [
        "PENDING",
        "APPROVED"
    ].includes(currentRegistrationStatus);

    // Chỉ được hủy khi đã đăng ký và hoạt động chưa bắt đầu.
    const canCancel =
        hasActiveRegistration &&
        activityStart &&
        !Number.isNaN(activityStart.getTime()) &&
        now < activityStart;

    // =====================================
    // ĐIỀU KIỆN ĐƯỢC PHÉP ĐĂNG KÝ
    // =====================================

    const canRegister = Boolean(
        user?.userId &&
        !registrationLoadError &&
        canRegisterByActivityStatus &&
        isRegistrationTimeValid &&
        !isFull &&
        !hasActiveRegistration
    );

    // =====================================
    // THÔNG BÁO ĐIỀU KIỆN ĐĂNG KÝ
    // =====================================

    const getRegistrationMessage = () => {
        if (!user?.userId) {
            return "Vui lòng đăng nhập bằng tài khoản sinh viên để đăng ký hoạt động.";
        }

        if (hasActiveRegistration) {
            return "";
        }

        if (activityStatus === "DRAFT") {
            return "Hoạt động hiện chưa được công bố.";
        }

        if (activityStatus === "CANCELLED") {
            return "Hoạt động đã bị hủy.";
        }

        if (activityStatus === "COMPLETED") {
            return "Hoạt động đã kết thúc.";
        }

        if (activityStatus === "ONGOING") {
            return "Hoạt động đang diễn ra, không thể đăng ký mới.";
        }

        if (!validRegistrationDates) {
            return "Thông tin thời gian đăng ký chưa hợp lệ.";
        }

        if (now < registrationStart) {
            return "Hoạt động chưa đến thời gian mở đăng ký.";
        }

        if (now > registrationEnd) {
            return "Hoạt động đã đóng đăng ký.";
        }

        if (isFull) {
            return "Hoạt động đã đủ số lượng người tham gia.";
        }

        if (registrationLoadError) {
            return registrationLoadError;
        }

        return "Hiện tại bạn chưa thể đăng ký hoạt động này.";
    };

    // =====================================
    // ĐĂNG KÝ HOẠT ĐỘNG
    // =====================================

    const handleRegister = async () => {
        if (!canRegister || isSubmitting) return;

        try {
            setIsSubmitting(true);
            setError("");
            setSuccessMessage("");

            const result = await registerForActivity(activityId);

            setSuccessMessage(
                result.message ||
                "Đăng ký hoạt động thành công."
            );

            await loadData();

        } catch (registerError) {
            console.error(
                "Lỗi đăng ký hoạt động:",
                registerError
            );

            setError(
                registerError.message ||
                "Không thể đăng ký hoạt động. Vui lòng thử lại."
            );

        } finally {
            setIsSubmitting(false);
        }
    };

    // =====================================
    // HỦY ĐĂNG KÝ
    // =====================================

    const handleCancelRegistration = async () => {
        if (!canCancel || isSubmitting) return;

        const confirmed = window.confirm(
            "Bạn có chắc chắn muốn hủy đăng ký hoạt động này?"
        );

        if (!confirmed) return;

        try {
            setIsSubmitting(true);
            setError("");
            setSuccessMessage("");

            const result = await cancelMyRegistration(activityId);

            setSuccessMessage(
                result.message ||
                "Hủy đăng ký thành công."
            );

            await loadData();

        } catch (cancelError) {
            console.error(
                "Lỗi hủy đăng ký:",
                cancelError
            );

            setError(
                cancelError.message ||
                "Không thể hủy đăng ký. Vui lòng thử lại."
            );

        } finally {
            setIsSubmitting(false);
        }
    };

    // =====================================
    // GIAO DIỆN LOADING
    // =====================================

    if (isLoading) {
        return (
            <div className="student-activity-detail-layout">
                <Header role="STUDENT" />

                <main className="activity-detail-page">
                    <div className="container py-5 text-center">
                        <div
                            className="spinner-border text-primary"
                            role="status"
                        ></div>

                        <p className="mt-3">
                            Đang tải thông tin hoạt động...
                        </p>
                    </div>
                </main>

                <Footer />
            </div>
        );
    }

    // =====================================
    // GIAO DIỆN LỖI
    // =====================================

    if (error && !activity) {
        return (
            <div className="student-activity-detail-layout">
                <Header role="STUDENT" />

                <main className="activity-detail-page">
                    <div className="container py-5">
                        <div className="alert alert-danger">
                            <i className="bi bi-exclamation-circle me-2"></i>
                            {error}
                        </div>

                        <button
                            type="button"
                            className="btn btn-outline-primary"
                            onClick={handleBack}
                        >
                            <i className="bi bi-arrow-left me-2"></i>
                            Quay lại danh sách hoạt động
                        </button>
                    </div>
                </main>

                <Footer />
            </div>
        );
    }

    if (!activity) return null;

    // =====================================
    // GIAO DIỆN CHÍNH
    // =====================================

    return (
        <div className="student-activity-detail-layout">
            <Header role="STUDENT" />

            <main className="activity-detail-page">
                <div className="container py-4">

                    {/* QUAY LẠI */}
                    <button
                        type="button"
                        className="activity-back-button"
                        onClick={handleBack}
                    >
                        <i className="bi bi-arrow-left me-2"></i>
                        Quay lại danh sách hoạt động
                    </button>

                    {/* THÔNG BÁO LỖI */}
                    {error && (
                        <div className="alert alert-danger mt-3">
                            {error}
                        </div>
                    )}

                    {/* THÔNG BÁO THÀNH CÔNG */}
                    {successMessage && (
                        <div className="alert alert-success mt-3">
                            <i className="bi bi-check-circle me-2"></i>
                            {successMessage}
                        </div>
                    )}

                    {/* TIÊU ĐỀ HOẠT ĐỘNG */}
                    <section className="activity-detail-header">
                        <div className="activity-detail-header-content">
                            <span className="activity-detail-eyebrow">
                                THÔNG TIN HOẠT ĐỘNG
                            </span>

                            <h2>{activity.activity_name}</h2>

                            <p className="activity-detail-organization">
                                <i className="bi bi-building me-2"></i>
                                {activity.organization_name ||
                                    "Đơn vị tổ chức"}
                            </p>

                            <span
                                className={`activity-status-badge status-${String(activityStatus).toLowerCase()}`}
                            >
                                {activityStatusMap[activityStatus] ||
                                    activityStatus}
                            </span>
                        </div>
                    </section>

                    <div className="row g-4 mt-1">

                        {/* =====================================
                            NỘI DUNG HOẠT ĐỘNG
                        ===================================== */}

                        <div className="col-lg-8">
                            <section className="activity-detail-card">
                                <h4>
                                    <i className="bi bi-info-circle me-2"></i>
                                    Giới thiệu hoạt động
                                </h4>

                                <div className="activity-detail-description">
                                    {activity.description
                                        ? activity.description
                                        : "Chưa có nội dung giới thiệu hoạt động."}
                                </div>

                                <hr />

                                <h4>
                                    <i className="bi bi-calendar-event me-2"></i>
                                    Thời gian và địa điểm
                                </h4>

                                <div className="activity-information-list">

                                    <div className="activity-information-item">
                                        <i className="bi bi-geo-alt"></i>

                                        <div>
                                            <span>Địa điểm</span>
                                            <strong>
                                                {activity.location ||
                                                    "Chưa cập nhật"}
                                            </strong>
                                        </div>
                                    </div>

                                    <div className="activity-information-item">
                                        <i className="bi bi-calendar-plus"></i>

                                        <div>
                                            <span>Bắt đầu đăng ký</span>
                                            <strong>
                                                {formatDateTime(
                                                    activity.registration_start
                                                )}
                                            </strong>
                                        </div>
                                    </div>

                                    <div className="activity-information-item">
                                        <i className="bi bi-calendar-x"></i>

                                        <div>
                                            <span>Kết thúc đăng ký</span>
                                            <strong>
                                                {formatDateTime(
                                                    activity.registration_end
                                                )}
                                            </strong>
                                        </div>
                                    </div>

                                    <div className="activity-information-item">
                                        <i className="bi bi-clock"></i>

                                        <div>
                                            <span>Thời gian diễn ra</span>
                                            <strong>
                                                {formatDateTime(
                                                    activity.activity_start
                                                )}
                                            </strong>
                                        </div>
                                    </div>

                                    <div className="activity-information-item">
                                        <i className="bi bi-clock-history"></i>

                                        <div>
                                            <span>Kết thúc hoạt động</span>
                                            <strong>
                                                {formatDateTime(
                                                    activity.activity_end
                                                )}
                                            </strong>
                                        </div>
                                    </div>

                                </div>
                            </section>
                        </div>

                        {/* =====================================
                            THÔNG TIN ĐĂNG KÝ
                        ===================================== */}

                        <div className="col-lg-4">
                            <section className="activity-detail-card activity-registration-card">

                                <h4>
                                    <i className="bi bi-people me-2"></i>
                                    Thông tin đăng ký
                                </h4>

                                {/* SỐ LƯỢNG THAM GIA */}
                                <div className="activity-participant-number">
                                    <strong>
                                        {currentParticipants}
                                        {maxParticipants !== null
                                            ? ` / ${maxParticipants}`
                                            : ""}
                                    </strong>

                                    <span>
                                        {maxParticipants === null
                                            ? "Sinh viên đã đăng ký"
                                            : "Số lượng đã đăng ký"}
                                    </span>
                                </div>

                                {/* THANH TIẾN ĐỘ */}
                                {maxParticipants !== null && (
                                    <div className="progress activity-participant-progress">
                                        <div
                                            className="progress-bar"
                                            role="progressbar"
                                            style={{
                                                width: `${Math.min(
                                                    100,
                                                    maxParticipants > 0
                                                        ? currentParticipants /
                                                            maxParticipants * 100
                                                        : 0
                                                )}%`
                                            }}
                                        ></div>
                                    </div>
                                )}

                                {/* HÌNH THỨC ĐĂNG KÝ */}
                                <div className="activity-registration-mode">
                                    <span>Hình thức đăng ký</span>

                                    <strong>
                                        {activity.registration_mode === "APPROVAL"
                                            ? "Có xét duyệt"
                                            : "Đăng ký trực tiếp"}
                                    </strong>
                                </div>

                                {/* ĐIỂM PHỤC VỤ CỘNG ĐỒNG */}
                                <div className="activity-point-information">
                                    <div className="activity-point-icon">
                                        <i className="bi bi-award-fill"></i>
                                    </div>

                                    <div className="activity-point-content">
                                        <span>Điểm phục vụ cộng đồng</span>

                                        <strong>
                                            {Number(activity.expected_points ?? activity.expectedPoints ?? 0)} điểm
                                        </strong>

                                        <small>
                                            Được cộng sau khi bạn hoàn thành hoạt động
                                            và được đơn vị tổ chức xác nhận.
                                        </small>
                                    </div>
                                </div>

                                <hr />

                                {/* =====================================
                                    TRẠNG THÁI CÁ NHÂN
                                ===================================== */}

                                <h5>Trạng thái của bạn</h5>

                                {registrationLoadError ? (
                                    <div className="alert alert-warning">
                                        <i className="bi bi-exclamation-triangle me-2"></i>
                                        {registrationLoadError}
                                    </div>
                                ) : registration ? (
                                    <div
                                        className={`registration-status-box registration-${getRegistrationStatusClass(currentRegistrationStatus)}`}
                                    >
                                        <strong>
                                            {registrationStatusMap[
                                                currentRegistrationStatus
                                            ] || currentRegistrationStatus}
                                        </strong>

                                        {registration.approval_note && (
                                            <p>
                                                {registration.approval_note}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-secondary">
                                        Bạn chưa đăng ký hoạt động này.
                                    </p>
                                )}

                                {/* =====================================
                                    NÚT ĐĂNG KÝ THAM GIA

                                    Hiển thị khi sinh viên chưa có
                                    đăng ký PENDING hoặc APPROVED.

                                    Nếu không đủ điều kiện thì nút
                                    vẫn hiển thị nhưng bị vô hiệu hóa.
                                ===================================== */}

                                {!hasActiveRegistration && (
                                    <button
                                        type="button"
                                        className="btn btn-primary w-100 mt-3"
                                        onClick={handleRegister}
                                        disabled={
                                            !canRegister ||
                                            isSubmitting
                                        }
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                Đang xử lý...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-plus-circle me-2"></i>
                                                Đăng ký tham gia
                                            </>
                                        )}
                                    </button>
                                )}

                                {/* =====================================
                                    NÚT HỦY ĐĂNG KÝ
                                ===================================== */}

                                {canCancel && (
                                    <button
                                        type="button"
                                        className="btn btn-outline-danger w-100 mt-3"
                                        onClick={handleCancelRegistration}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting
                                            ? "Đang xử lý..."
                                            : (
                                                <>
                                                    <i className="bi bi-x-circle me-2"></i>
                                                    Hủy đăng ký
                                                </>
                                            )}
                                    </button>
                                )}

                                {/* =====================================
                                    LÝ DO KHÔNG THỂ ĐĂNG KÝ

                                    Không hiển thị khi đã có đăng ký
                                    đang chờ duyệt hoặc đã được duyệt.
                                ===================================== */}

                                {!canRegister &&
                                    !hasActiveRegistration && (
                                        <div className="activity-registration-notice mt-3">
                                            {getRegistrationMessage()}
                                        </div>
                                    )}

                                {/* =====================================
                                    THÔNG BÁO TRẠNG THÁI ĐĂNG KÝ
                                ===================================== */}

                                {currentRegistrationStatus === "PENDING" && (
                                    <div className="activity-registration-notice mt-3">
                                        <i className="bi bi-hourglass-split me-2"></i>
                                        Đăng ký của bạn đang chờ đơn vị tổ chức xét duyệt.
                                    </div>
                                )}

                                {currentRegistrationStatus === "APPROVED" && (
                                    <div className="activity-registration-notice mt-3">
                                        <i className="bi bi-check-circle me-2"></i>
                                        Bạn đã được duyệt tham gia hoạt động.
                                    </div>
                                )}

                            </section>

                            {/* =====================================
                                MÃ HOẠT ĐỘNG
                            ===================================== */}

                            <section className="activity-detail-card mt-4">
                                <h5>Mã hoạt động</h5>

                                <strong className="activity-code">
                                    {activity.activity_code ||
                                        activity.activity_id}
                                </strong>

                                <div className="activity-created-date">
                                    Ngày tạo: {formatDate(activity.created_at)}
                                </div>
                            </section>
                        </div>

                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default ActivityDetail;
