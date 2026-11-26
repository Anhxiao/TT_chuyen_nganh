
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";

import { Link, useParams } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";

import Header from "../components/Header Organizer";
import Footer from "../components/Footer";

import "../styles/organizer-activity-detail.css";

const API_BASE_URL = "/api";

// ======================================================
// 1. CẤU HÌNH TAB
// ======================================================

const TABS = [
    { id: "overview", label: "Tổng quan", icon: "bi-info-circle" },
    { id: "registrations", label: "Đăng ký", icon: "bi-people" },
    { id: "attendance", label: "Điểm danh QR", icon: "bi-qr-code-scan" },
    { id: "evidence", label: "Minh chứng", icon: "bi-file-earmark-check" },
    { id: "result", label: "Kết quả", icon: "bi-bar-chart" }
];

// ======================================================
// 2. HÀM XỬ LÝ DỮ LIỆU
// ======================================================

function getApiData(response) {
    return (
        response?.data?.data ??
        response?.data ??
        response
    );
}

function getActivityData(response) {
    const data = getApiData(response);

    return (
        data?.activity ??
        data?.data?.activity ??
        data
    );
}

function getRegistrationData(response) {
    const data = getApiData(response);

    const rows = Array.isArray(data)
        ? data
        : Array.isArray(data?.registrations)
            ? data.registrations
            : Array.isArray(data?.items)
                ? data.items
                : Array.isArray(data?.rows)
                    ? data.rows
                    : Array.isArray(data?.recordset)
                        ? data.recordset
                        : Array.isArray(data?.data)
                            ? data.data
                            : [];

    const totalValue =
        data?.total ??
        data?.totalRecords ??
        data?.totalCount ??
        data?.pagination?.total ??
        data?.pagination?.totalRecords;

    return {
        rows,
        total: Number(totalValue ?? rows.length) || 0
    };
}

function getAttendanceData(response) {
    const data = getApiData(response);

    const rows = Array.isArray(data)
        ? data
        : Array.isArray(data?.attendance)
            ? data.attendance
            : Array.isArray(data?.items)
                ? data.items
                : Array.isArray(data?.rows)
                    ? data.rows
                    : Array.isArray(data?.recordset)
                        ? data.recordset
                        : Array.isArray(data?.data)
                            ? data.data
                            : [];

    return rows;
}

function getAttendanceSessionData(response) {
    const data = getApiData(response);

    return (
        data?.session ??
        data?.attendanceSession ??
        data?.data?.session ??
        data
    );
}

function getErrorMessage(result, fallback) {
    return (
        result?.message ||
        result?.error?.message ||
        result?.errors?.[0]?.message ||
        fallback
    );
}

function formatDate(value) {
    if (!value) return "Chưa cập nhật";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Chưa cập nhật";
    }

    return date.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function getStatusLabel(status) {
    const labels = {
        DRAFT: "Bản nháp",
        PUBLISHED: "Đã công bố",
        REGISTERING: "Đang mở đăng ký",
        ONGOING: "Đang diễn ra",
        COMPLETED: "Đã hoàn thành",
        CANCELLED: "Đã hủy"
    };

    return labels[status] || status || "Chưa xác định";
}

function getRegistrationStatusLabel(status) {
    const labels = {
        PENDING: "Chờ duyệt",
        APPROVED: "Đã duyệt",
        REJECTED: "Đã từ chối",
        CANCELLED: "Đã hủy"
    };

    return labels[status] || status || "Chưa xác định";
}

function getAttendanceStatusLabel(status) {
    const labels = {
        ATTENDED: "Có mặt",
        PRESENT: "Có mặt",
        PARTIAL: "Tham gia một phần",
        ABSENT: "Vắng mặt",
        PENDING: "Chưa điểm danh"
    };

    return labels[status] || status || "Chưa xác định";
}

// ======================================================
// 3. COMPONENT CHÍNH
// ======================================================

function OrganizerActivityDetail() {
    const { activityId } = useParams();

    // --------------------------------------------------
    // STATE CHUNG
    // --------------------------------------------------

    const [activeTab, setActiveTab] = useState("overview");
    const [activity, setActivity] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    // --------------------------------------------------
    // STATE ĐĂNG KÝ
    // --------------------------------------------------

    const [registrations, setRegistrations] = useState([]);
    const [registrationTotal, setRegistrationTotal] = useState(0);

    const [registrationsLoading, setRegistrationsLoading] =
        useState(false);

    const [registrationError, setRegistrationError] = useState("");
    const [registrationKeyword, setRegistrationKeyword] = useState("");
    const [registrationFilter, setRegistrationFilter] = useState("ALL");

    const [processingRegistrationId, setProcessingRegistrationId] =
        useState(null);

    const [registrationNote, setRegistrationNote] = useState("");

    // --------------------------------------------------
    // STATE MINH CHỨNG
    // --------------------------------------------------

    const [evidenceFile, setEvidenceFile] = useState(null);

    // --------------------------------------------------
    // STATE ĐIỂM DANH
    // --------------------------------------------------

    const [attendanceRows, setAttendanceRows] = useState([]);
    const [attendanceKeyword, setAttendanceKeyword] = useState("");

    const [attendanceLoading, setAttendanceLoading] = useState(false);
    const [attendanceError, setAttendanceError] = useState("");

    const [attendanceSession, setAttendanceSession] = useState(null);
    const [attendanceSessionToken, setAttendanceSessionToken] =
        useState("");

    const [attendanceSessionLoading, setAttendanceSessionLoading] =
        useState(false);

    const [closingSession, setClosingSession] = useState(false);

    const qrCanvasRef = useRef(null);

    // --------------------------------------------------
    // TOKEN VÀ HEADER
    // --------------------------------------------------

    const token = sessionStorage.getItem("accessToken");

    const headers = useMemo(() => ({
        ...(token
            ? { Authorization: `Bearer ${token}` }
            : {})
    }), [token]);

    // ==================================================
    // 4. LẤY THÔNG TIN HOẠT ĐỘNG
    // ==================================================

    const loadActivity = useCallback(async () => {
        if (!activityId) {
            setError("Không tìm thấy mã hoạt động.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await fetch(
                `${API_BASE_URL}/activities/${encodeURIComponent(activityId)}`,
                {
                    method: "GET",
                    headers
                }
            );

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    getErrorMessage(
                        result,
                        "Không thể tải thông tin hoạt động."
                    )
                );
            }

            const activityData = getActivityData(result);

            if (!activityData || typeof activityData !== "object") {
                throw new Error(
                    "Dữ liệu hoạt động từ máy chủ không hợp lệ."
                );
            }

            setActivity(activityData);
        } catch (err) {
            console.error("Lỗi tải chi tiết hoạt động:", err);
            setError(err.message || "Đã xảy ra lỗi khi tải hoạt động.");
        } finally {
            setLoading(false);
        }
    }, [activityId, headers]);

    // ==================================================
    // 5. LẤY DANH SÁCH ĐĂNG KÝ
    // ==================================================

    const loadRegistrations = useCallback(async () => {
        if (!activityId) return;

        setRegistrationsLoading(true);
        setRegistrationError("");

        try {
            const response = await fetch(
                `${API_BASE_URL}/registrations/activities/${encodeURIComponent(activityId)}?page=1&limit=100`,
                {
                    method: "GET",
                    headers
                }
            );

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    getErrorMessage(
                        result,
                        "Không thể tải danh sách đăng ký."
                    )
                );
            }

            const normalized = getRegistrationData(result);

            setRegistrations(normalized.rows);
            setRegistrationTotal(normalized.total);
        } catch (err) {
            console.error("Lỗi tải danh sách đăng ký:", err);

            setRegistrationError(
                err.message || "Đã xảy ra lỗi khi tải danh sách đăng ký."
            );
        } finally {
            setRegistrationsLoading(false);
        }
    }, [activityId, headers]);

    // ==================================================
    // 6. API ĐIỂM DANH - LẤY DANH SÁCH
    // ==================================================

    const loadAttendance = useCallback(async () => {
        if (!activityId) return;

        setAttendanceLoading(true);
        setAttendanceError("");

        try {
            const response = await fetch(
                `${API_BASE_URL}/attendance/activities/${encodeURIComponent(activityId)}`,
                {
                    method: "GET",
                    headers
                }
            );

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    getErrorMessage(
                        result,
                        "Không thể tải danh sách điểm danh."
                    )
                );
            }

            setAttendanceRows(getAttendanceData(result));
        } catch (err) {
            console.error("Lỗi tải danh sách điểm danh:", err);

            setAttendanceError(
                err.message || "Không thể tải danh sách điểm danh."
            );
        } finally {
            setAttendanceLoading(false);
        }
    }, [activityId, headers]);

    // ==================================================
    // 7. API ĐIỂM DANH - LẤY PHIÊN ĐANG HOẠT ĐỘNG
    // ==================================================

    const loadActiveAttendanceSession = useCallback(async () => {
        if (!activityId) return;

        setAttendanceSessionLoading(true);

        try {
            const response = await fetch(
                `${API_BASE_URL}/attendance/activities/${encodeURIComponent(activityId)}/sessions/active`,
                {
                    method: "GET",
                    headers
                }
            );

            const result = await response.json().catch(() => ({}));

            // Không có phiên đang hoạt động.
            if (response.status === 404) {
                setAttendanceSession(null);
                setAttendanceSessionToken("");
                return;
            }

            if (!response.ok) {
                throw new Error(
                    getErrorMessage(
                        result,
                        "Không thể kiểm tra phiên điểm danh."
                    )
                );
            }

            const session = getAttendanceSessionData(result);

            if (!session || !session.session_id) {
                setAttendanceSession(null);
                setAttendanceSessionToken("");
                return;
            }

            setAttendanceSession(session);

            // Token chỉ được trả về khi tạo phiên.
            // Máy chủ chỉ lưu hash nên không thể lấy lại token gốc
            // thông qua API lấy phiên đang hoạt động.
            const storageKey =
                `attendanceQr:${activityId}:${session.session_id}`;

            const savedToken = sessionStorage.getItem(storageKey);

            setAttendanceSessionToken(
                session.session_token || savedToken || ""
            );
        } catch (err) {
            console.error("Lỗi lấy phiên điểm danh:", err);

            setAttendanceError(
                err.message || "Không thể kiểm tra phiên điểm danh."
            );
        } finally {
            setAttendanceSessionLoading(false);
        }
    }, [activityId, headers]);

    // ==================================================
    // 8. API ĐIỂM DANH - TẠO PHIÊN
    // ==================================================

    const createAttendanceSession = async () => {
        if (!activityId) {
            setAttendanceError("Không tìm thấy mã hoạt động.");
            return;
        }

        if (!token) {
            setAttendanceError(
                "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
            );
            return;
        }

        if (
            attendanceSession?.status === "OPEN" &&
            !attendanceSessionToken
        ) {
            setAttendanceError(
                "Hoạt động đã có phiên điểm danh đang mở nhưng trình duyệt không còn lưu mã QR. Vui lòng sử dụng ảnh QR đã tải trước đó hoặc đóng phiên hiện tại rồi tạo phiên mới."
            );
            return;
        }

        setAttendanceSessionLoading(true);
        setAttendanceError("");
        setNotice("");

        try {
            const response = await fetch(
                `${API_BASE_URL}/attendance/activities/${activityId}/sessions`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    getErrorMessage(
                        result,
                        "Không thể tạo phiên điểm danh."
                    )
                );
            }

            const session = getAttendanceSessionData(result);

            const sessionToken =
                session?.session_token ??
                session?.sessionToken ??
                result?.data?.session_token ??
                result?.session_token;

            const sessionId =
                session?.session_id ??
                session?.sessionId;

            if (!sessionToken || !sessionId) {
                throw new Error(
                    "Máy chủ đã phản hồi nhưng không có session_token hoặc session_id. Kiểm tra lại dữ liệu API tạo phiên."
                );
            }

            setAttendanceSession(session);
            setAttendanceSessionToken(sessionToken);

            // Lưu token trong phiên làm việc hiện tại của trình duyệt.
            // Không lưu token vào CSDL hoặc localStorage.
            const storageKey =
                `attendanceQr:${activityId}:${sessionId}`;

            sessionStorage.setItem(storageKey, sessionToken);

            setNotice(
                "Tạo phiên điểm danh thành công. Mã QR đã sẵn sàng."
            );

            await loadAttendance();
        } catch (err) {
            console.error("Lỗi tạo phiên điểm danh:", err);

            setAttendanceError(
                err.message || "Không thể tạo phiên điểm danh."
            );

            // Nếu máy chủ báo phiên đã tồn tại,
            // kiểm tra lại phiên đang hoạt động.
            await loadActiveAttendanceSession();
        } finally {
            setAttendanceSessionLoading(false);
        }
    };

    // ==================================================
    // 9. API ĐIỂM DANH - ĐÓNG PHIÊN
    // ==================================================

    const closeAttendanceSession = async () => {
        const sessionId = attendanceSession?.session_id;

        if (!sessionId) {
            setAttendanceError("Không tìm thấy mã phiên điểm danh.");
            return;
        }

        const confirmed = window.confirm(
            "Bạn có chắc chắn muốn đóng phiên điểm danh này không? Sinh viên sẽ không thể sử dụng mã QR của phiên sau khi đóng."
        );

        if (!confirmed) return;

        setClosingSession(true);
        setAttendanceError("");
        setNotice("");

        try {
            const response = await fetch(
                `${API_BASE_URL}/attendance/sessions/${encodeURIComponent(sessionId)}/close`,
                {
                    method: "PATCH",
                    headers
                }
            );

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    getErrorMessage(
                        result,
                        "Không thể đóng phiên điểm danh."
                    )
                );
            }

            setAttendanceSession({
                ...attendanceSession,
                status: "CLOSED"
            });

            setNotice("Đã đóng phiên điểm danh thành công.");

            await Promise.all([
                loadAttendance(),
                loadActiveAttendanceSession()
            ]);
        } catch (err) {
            console.error("Lỗi đóng phiên điểm danh:", err);

            setAttendanceError(
                err.message || "Không thể đóng phiên điểm danh."
            );
        } finally {
            setClosingSession(false);
        }
    };

    // ==================================================
    // 10. TẢI MÃ QR VỀ THIẾT BỊ
    // ==================================================

    const downloadAttendanceQR = () => {
        const canvas = qrCanvasRef.current;

        if (!canvas) {
            setAttendanceError(
                "Không tìm thấy mã QR để tải xuống."
            );
            return;
        }

        try {
            const imageUrl = canvas.toDataURL("image/png");

            const link = document.createElement("a");

            link.href = imageUrl;
            link.download = `QR-Diem-Danh-${activityId}.png`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setNotice(
                "Đã tạo ảnh mã QR. Nếu trình duyệt trên điện thoại không tự lưu ảnh, hãy chọn tải xuống trong thông báo của trình duyệt."
            );
        } catch (err) {
            console.error("Lỗi tải mã QR:", err);

            setAttendanceError(
                "Không thể tải mã QR. Vui lòng thử lại trên trình duyệt khác."
            );
        }
    };

    // ==================================================
    // 11. TẢI DỮ LIỆU KHI MỞ TRANG
    // ==================================================

    useEffect(() => {
        loadActivity();
        loadRegistrations();
    }, [loadActivity, loadRegistrations]);

    // Chỉ gọi API điểm danh khi mở tab điểm danh.
    useEffect(() => {
        if (activeTab === "attendance" && activityId) {
            loadAttendance();
            loadActiveAttendanceSession();
        }
    }, [
        activeTab,
        activityId,
        loadAttendance,
        loadActiveAttendanceSession
    ]);

    // ==================================================
    // 12. DUYỆT / TỪ CHỐI ĐĂNG KÝ
    // ==================================================

    const handleRegistrationAction = async (
        registrationId,
        action
    ) => {
        if (!registrationId) {
            setRegistrationError(
                "Không tìm thấy mã đăng ký của sinh viên."
            );
            return;
        }

        if (!["approve", "reject"].includes(action)) {
            setRegistrationError("Thao tác đăng ký không hợp lệ.");
            return;
        }

        const actionLabel =
            action === "approve" ? "duyệt" : "từ chối";

        const confirmed = window.confirm(
            `Bạn có chắc chắn muốn ${actionLabel} đăng ký này không?`
        );

        if (!confirmed) return;

        setProcessingRegistrationId(registrationId);
        setRegistrationError("");
        setNotice("");

        try {
            const response = await fetch(
                `${API_BASE_URL}/registrations/${encodeURIComponent(registrationId)}/${action}`,
                {
                    method: "PATCH",
                    headers: {
                        ...headers,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        note: registrationNote.trim() || null
                    })
                }
            );

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    getErrorMessage(
                        result,
                        `Không thể ${actionLabel} đăng ký.`
                    )
                );
            }

            setNotice(
                action === "approve"
                    ? "Đã duyệt đăng ký của sinh viên thành công."
                    : "Đã từ chối đăng ký của sinh viên."
            );

            setRegistrationNote("");

            await Promise.all([
                loadRegistrations(),
                loadActivity()
            ]);
        } catch (err) {
            console.error(`Lỗi ${actionLabel} đăng ký:`, err);

            setRegistrationError(
                err.message || `Không thể ${actionLabel} đăng ký.`
            );
        } finally {
            setProcessingRegistrationId(null);
        }
    };

    // ==================================================
    // 13. CHUẨN HÓA THÔNG TIN HOẠT ĐỘNG
    // ==================================================

    const activityName =
        activity?.activity_name ||
        activity?.activityName ||
        "Hoạt động chưa có tên";

    const organizationName =
        activity?.organization_name ||
        activity?.organizationName ||
        "Đơn vị tổ chức";

    const activityStatus = activity?.status || "";

    const location =
        activity?.location || "Chưa cập nhật địa điểm";

    const startDate =
        activity?.activity_start ||
        activity?.activityStart;

    const endDate =
        activity?.activity_end ||
        activity?.activityEnd;

    const registrationStart =
        activity?.registration_start ||
        activity?.registrationStart;

    const registrationEnd =
        activity?.registration_end ||
        activity?.registrationEnd;

    const maxParticipants =
        activity?.max_participants ??
        activity?.maxParticipants;

    const description =
        activity?.description ||
        "Hoạt động chưa có mô tả.";

    const activityPointsValue =
        activity?.expected_points ??
        activity?.expectedPoints ??
        0;

    const activityPoints = Number(activityPointsValue);

    const displayedActivityPoints =
        Number.isFinite(activityPoints) && activityPoints >= 0
            ? activityPoints
            : 0;

    // ==================================================
    // 14. LỌC DANH SÁCH ĐĂNG KÝ
    // ==================================================

    const filteredRegistrations = useMemo(() => {
        const keyword = registrationKeyword.trim().toLowerCase();

        return registrations.filter((item) => {
            const studentCode = String(
                item.student_code || item.studentCode || ""
            ).toLowerCase();

            const fullName = String(
                item.full_name || item.fullName || ""
            ).toLowerCase();

            const className = String(
                item.class_name || item.className || ""
            ).toLowerCase();

            const matchesKeyword =
                !keyword ||
                studentCode.includes(keyword) ||
                fullName.includes(keyword) ||
                className.includes(keyword);

            const status =
                item.registration_status || item.status;

            const matchesStatus =
                registrationFilter === "ALL" ||
                status === registrationFilter;

            return matchesKeyword && matchesStatus;
        });
    }, [
        registrations,
        registrationKeyword,
        registrationFilter
    ]);

    const pendingCount = registrations.filter(
        item =>
            (item.registration_status || item.status) === "PENDING"
    ).length;

    const approvedCount = registrations.filter(
        item =>
            (item.registration_status || item.status) === "APPROVED"
    ).length;

    // ==================================================
    // 15. LỌC DANH SÁCH ĐIỂM DANH
    // ==================================================

    const filteredAttendance = useMemo(() => {
        const keyword = attendanceKeyword.trim().toLowerCase();

        return attendanceRows.filter((item) => {
            const studentCode = String(
                item.student_code ||
                item.studentCode ||
                ""
            ).toLowerCase();

            const fullName = String(
                item.full_name ||
                item.fullName ||
                ""
            ).toLowerCase();

            const className = String(
                item.class_name ||
                item.className ||
                ""
            ).toLowerCase();

            return (
                !keyword ||
                studentCode.includes(keyword) ||
                fullName.includes(keyword) ||
                className.includes(keyword)
            );
        });
    }, [attendanceRows, attendanceKeyword]);

    const attendanceCount = attendanceRows.length;

    const attendedCount = attendanceRows.filter((item) =>
        ["ATTENDED", "PRESENT"].includes(
            item.attendance_status || item.status
        )
    ).length;

    const absentCount = attendanceRows.filter(
        item =>
            (item.attendance_status || item.status) === "ABSENT"
    ).length;

    const sessionIsOpen =
        attendanceSession?.status === "OPEN";

    // ==================================================
    // 16. CHỌN FILE MINH CHỨNG
    // ==================================================

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];

        setNotice("");

        if (!file) {
            setEvidenceFile(null);
            return;
        }

        const fileName = file.name.toLowerCase();

        const isWordFile =
            fileName.endsWith(".doc") ||
            fileName.endsWith(".docx");

        if (!isWordFile) {
            setEvidenceFile(null);

            setNotice(
                "Vui lòng chọn file Word có định dạng .doc hoặc .docx."
            );

            event.target.value = "";
            return;
        }

        setEvidenceFile(file);

        setNotice(
            "Đã chọn file minh chứng. File hiện chỉ nằm trên thiết bị và chưa được tải lên máy chủ."
        );
    };

    // ==================================================
    // 17. TAB TỔNG QUAN
    // ==================================================

    const renderOverview = () => (
        <div className="activity-detail-content">
            <div className="activity-overview-grid">
                <section className="activity-detail-panel activity-main-info">
                    <div className="activity-panel-heading">
                        <div>
                            <span className="activity-panel-eyebrow">
                                THÔNG TIN HOẠT ĐỘNG
                            </span>

                            <h2>{activityName}</h2>
                        </div>

                        <span
                            className={`activity-detail-status ${activityStatus.toLowerCase()}`}
                        >
                            {getStatusLabel(activityStatus)}
                        </span>
                    </div>

                    <p className="activity-detail-description">
                        {description}
                    </p>

                    <div className="activity-information-list">
                        <div className="activity-information-item">
                            <i className="bi bi-building"></i>
                            <div>
                                <span>Đơn vị tổ chức</span>
                                <strong>{organizationName}</strong>
                            </div>
                        </div>

                        <div className="activity-information-item">
                            <i className="bi bi-geo-alt"></i>
                            <div>
                                <span>Địa điểm</span>
                                <strong>{location}</strong>
                            </div>
                        </div>

                        <div className="activity-information-item">
                            <i className="bi bi-calendar-event"></i>
                            <div>
                                <span>Thời gian bắt đầu</span>
                                <strong>{formatDate(startDate)}</strong>
                            </div>
                        </div>

                        <div className="activity-information-item">
                            <i className="bi bi-calendar-check"></i>
                            <div>
                                <span>Thời gian kết thúc</span>
                                <strong>{formatDate(endDate)}</strong>
                            </div>
                        </div>

                        <div className="activity-information-item">
                            <i className="bi bi-clock-history"></i>
                            <div>
                                <span>Bắt đầu đăng ký</span>
                                <strong>{formatDate(registrationStart)}</strong>
                            </div>
                        </div>

                        <div className="activity-information-item">
                            <i className="bi bi-calendar2-x"></i>
                            <div>
                                <span>Kết thúc đăng ký</span>
                                <strong>{formatDate(registrationEnd)}</strong>
                            </div>
                        </div>
                    </div>
                </section>

                <aside className="activity-detail-panel activity-stat-panel">
                    <div className="activity-panel-heading">
                        <div>
                            <span className="activity-panel-eyebrow">
                                THỐNG KÊ
                            </span>

                            <h2>Tình hình tham gia</h2>
                        </div>

                        <i className="bi bi-graph-up-arrow"></i>
                    </div>

                    <div className="activity-stat-item">
                        <span>Số lượng tối đa</span>
                        <strong>
                            {maxParticipants ?? "Không giới hạn"}
                        </strong>
                    </div>

                    <div className="activity-stat-item">
                        <span>Điểm cộng khi hoàn thành hoạt động</span>
                        <strong>{displayedActivityPoints} điểm</strong>
                    </div>

                    <div className="activity-stat-item">
                        <span>Tổng sinh viên đăng ký</span>
                        <strong>
                            {registrationsLoading ? "..." : registrationTotal}
                        </strong>
                    </div>

                    <div className="activity-stat-item">
                        <span>Chờ duyệt</span>
                        <strong>
                            {registrationsLoading ? "..." : pendingCount}
                        </strong>
                    </div>

                    <div className="activity-stat-item">
                        <span>Đã được duyệt</span>
                        <strong>
                            {registrationsLoading ? "..." : approvedCount}
                        </strong>
                    </div>

                    <div className="activity-stat-item">
                        <span>Đã điểm danh</span>
                        <strong>
                            {attendanceLoading ? "..." : attendanceCount}
                        </strong>
                    </div>

                    <div className="activity-stat-item">
                        <span>File minh chứng</span>
                        <strong>Chưa có dữ liệu</strong>
                    </div>

                    <div className="activity-stat-note">
                        <i className="bi bi-info-circle"></i>

                        Mức điểm trên là số điểm đơn vị tổ chức thiết lập
                        cho hoạt động. Sinh viên chỉ được ghi nhận điểm sau
                        khi hoàn thành hoạt động và được xác nhận theo quy
                        trình của hệ thống.
                    </div>
                </aside>
            </div>

            <section className="activity-detail-panel activity-process-panel">
                <div className="activity-panel-heading">
                    <div>
                        <span className="activity-panel-eyebrow">
                            QUY TRÌNH QUẢN LÝ
                        </span>

                        <h2>Các bước thực hiện hoạt động</h2>
                    </div>
                </div>

                <div className="activity-process-list">
                    <div className="activity-process-step">
                        <span className="process-step-number">01</span>
                        <div>
                            <strong>Tiếp nhận đăng ký</strong>
                            <p>
                                Theo dõi danh sách sinh viên đăng ký và
                                xử lý yêu cầu tham gia.
                            </p>
                        </div>
                    </div>

                    <div className="activity-process-step">
                        <span className="process-step-number">02</span>
                        <div>
                            <strong>Điểm danh bằng QR</strong>
                            <p>
                                Đơn vị tổ chức tạo mã QR phiên điểm danh.
                                Sinh viên đăng nhập và quét mã để ghi nhận
                                tham gia.
                            </p>
                        </div>
                    </div>

                    <div className="activity-process-step">
                        <span className="process-step-number">03</span>
                        <div>
                            <strong>Tổng hợp minh chứng</strong>
                            <p>
                                Kiểm tra danh sách điểm danh và lập hồ sơ
                                minh chứng cho hoạt động.
                            </p>
                        </div>
                    </div>

                    <div className="activity-process-step">
                        <span className="process-step-number">04</span>
                        <div>
                            <strong>Xác nhận kết quả</strong>
                            <p>
                                Xác nhận mức độ tham gia và ghi nhận điểm
                                phục vụ cộng đồng theo quy định.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );

    // ==================================================
    // 18. TAB ĐĂNG KÝ
    // ==================================================

    const renderRegistrations = () => (
        <section className="activity-detail-panel">
            <div className="activity-panel-heading">
                <div>
                    <span className="activity-panel-eyebrow">
                        QUẢN LÝ SINH VIÊN
                    </span>

                    <h2>Danh sách đăng ký tham gia</h2>

                    <p>
                        Theo dõi thông tin sinh viên và xử lý các yêu cầu
                        đăng ký hoạt động.
                    </p>
                </div>

                <span className="attendance-total">
                    {registrationTotal} lượt đăng ký
                </span>
            </div>

            {registrationError && (
                <div className="alert alert-danger">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {registrationError}

                    <button
                        type="button"
                        className="btn btn-sm btn-outline-danger ms-3"
                        onClick={loadRegistrations}
                        disabled={registrationsLoading}
                    >
                        Tải lại
                    </button>
                </div>
            )}

            <div className="activity-table-toolbar">
                <div className="activity-search-box">
                    <i className="bi bi-search"></i>

                    <input
                        type="text"
                        value={registrationKeyword}
                        onChange={event =>
                            setRegistrationKeyword(event.target.value)
                        }
                        placeholder="Tìm theo MSSV, họ tên hoặc lớp..."
                    />
                </div>

                <select
                    className="form-select"
                    style={{ maxWidth: "190px" }}
                    value={registrationFilter}
                    onChange={event =>
                        setRegistrationFilter(event.target.value)
                    }
                >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="PENDING">Chờ duyệt</option>
                    <option value="APPROVED">Đã duyệt</option>
                    <option value="REJECTED">Đã từ chối</option>
                    <option value="CANCELLED">Đã hủy</option>
                </select>

                <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={loadRegistrations}
                    disabled={registrationsLoading}
                >
                    <i className="bi bi-arrow-clockwise me-1"></i>
                    Làm mới
                </button>
            </div>

            <div className="mb-3">
                <label
                    htmlFor="registrationNote"
                    className="form-label"
                >
                    Ghi chú xử lý đăng ký (không bắt buộc)
                </label>

                <input
                    id="registrationNote"
                    type="text"
                    className="form-control"
                    value={registrationNote}
                    onChange={event =>
                        setRegistrationNote(event.target.value)
                    }
                    placeholder="Nhập ghi chú khi duyệt hoặc từ chối..."
                />
            </div>

            <div className="activity-table-responsive">
                <table className="activity-data-table">
                    <thead>
                        <tr>
                            <th>STT</th>
                            <th>MSSV</th>
                            <th>Họ và tên</th>
                            <th>Lớp</th>
                            <th>Email</th>
                            <th>Số điện thoại</th>
                            <th>Thời gian đăng ký</th>
                            <th>Trạng thái</th>
                            <th>Ghi chú</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>

                    <tbody>
                        {registrationsLoading ? (
                            <tr>
                                <td colSpan="10" className="activity-table-empty">
                                    <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                                    Đang tải danh sách đăng ký...
                                </td>
                            </tr>
                        ) : filteredRegistrations.length === 0 ? (
                            <tr>
                                <td colSpan="10" className="activity-table-empty">
                                    <i className="bi bi-person-x"></i>

                                    <strong>
                                        {registrations.length === 0
                                            ? "Chưa có sinh viên đăng ký"
                                            : "Không tìm thấy sinh viên phù hợp"}
                                    </strong>

                                    <span>
                                        Danh sách sẽ được cập nhật khi sinh viên
                                        đăng ký tham gia hoạt động.
                                    </span>
                                </td>
                            </tr>
                        ) : (
                            filteredRegistrations.map((item, index) => {
                                const status =
                                    item.registration_status || item.status;

                                const registrationId =
                                    item.registration_id ?? item.registrationId;

                                const studentCode =
                                    item.student_code ?? item.studentCode;

                                const fullName =
                                    item.full_name ?? item.fullName;

                                const className =
                                    item.class_name ?? item.className;

                                const registeredAt =
                                    item.registered_at ?? item.registeredAt;

                                const approvalNote =
                                    item.approval_note ?? item.approvalNote;

                                const isProcessing =
                                    processingRegistrationId === registrationId;

                                return (
                                    <tr key={registrationId || index}>
                                        <td>{index + 1}</td>
                                        <td>{studentCode || "--"}</td>
                                        <td>{fullName || "--"}</td>
                                        <td>{className || "--"}</td>
                                        <td>{item.email || "--"}</td>
                                        <td>
                                            {item.phone ||
                                                item.phone_number ||
                                                "--"}
                                        </td>
                                        <td>{formatDate(registeredAt)}</td>
                                        <td>
                                            <span
                                                className={`activity-detail-status ${String(status || "").toLowerCase()}`}
                                            >
                                                {getRegistrationStatusLabel(status)}
                                            </span>
                                        </td>
                                        <td>{approvalNote || "--"}</td>
                                        <td>
                                            {status === "PENDING" ? (
                                                <div className="d-flex gap-2">
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-success"
                                                        disabled={
                                                            processingRegistrationId !== null
                                                        }
                                                        onClick={() =>
                                                            handleRegistrationAction(
                                                                registrationId,
                                                                "approve"
                                                            )
                                                        }
                                                    >
                                                        {isProcessing
                                                            ? "Đang xử lý..."
                                                            : "Duyệt"}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-danger"
                                                        disabled={
                                                            processingRegistrationId !== null
                                                        }
                                                        onClick={() =>
                                                            handleRegistrationAction(
                                                                registrationId,
                                                                "reject"
                                                            )
                                                        }
                                                    >
                                                        Từ chối
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-muted">
                                                    Không có thao tác
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-3 text-muted">
                Đang hiển thị {filteredRegistrations.length} sinh viên
                trong số {registrationTotal} lượt đăng ký.
            </div>
        </section>
    );

    // ==================================================
    // 19. TAB ĐIỂM DANH QR
    // ==================================================

    const renderAttendance = () => (
        <div className="activity-detail-content">
            <section className="activity-detail-panel attendance-intro-panel">
                <div className="activity-panel-heading">
                    <div>
                        <span className="activity-panel-eyebrow">
                            ĐIỂM DANH SINH VIÊN
                        </span>

                        <h2>Điểm danh bằng mã QR</h2>

                        <p>
                            Đơn vị tổ chức tạo phiên điểm danh cho hoạt động.
                            Sinh viên đăng nhập vào hệ thống và sử dụng
                            điện thoại để quét mã QR.
                        </p>
                    </div>

                    <span className="attendance-qr-icon">
                        <i className="bi bi-qr-code-scan"></i>
                    </span>
                </div>

                <div className="attendance-instruction">
                    <div>
                        <i className="bi bi-qr-code"></i>
                        <strong>Tạo phiên điểm danh</strong>
                        <p>
                            Máy chủ tạo phiên và cấp mã QR riêng
                            cho hoạt động.
                        </p>
                    </div>

                    <div>
                        <i className="bi bi-phone"></i>
                        <strong>Sinh viên quét mã</strong>
                        <p>
                            Sinh viên đăng nhập và quét QR bằng
                            chức năng điểm danh trên hệ thống.
                        </p>
                    </div>

                    <div>
                        <i className="bi bi-clipboard-check"></i>
                        <strong>Ghi nhận kết quả</strong>
                        <p>
                            Máy chủ xác thực phiên và thông tin
                            sinh viên trước khi ghi nhận điểm danh.
                        </p>
                    </div>
                </div>

                {attendanceError && (
                    <div className="alert alert-danger mt-3">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        {attendanceError}

                        <button
                            type="button"
                            className="btn-close float-end"
                            aria-label="Đóng"
                            onClick={() => setAttendanceError("")}
                        ></button>
                    </div>
                )}

                {attendanceSessionLoading && (
                    <div className="text-center py-3">
                        <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                        Đang kết nối API điểm danh...
                    </div>
                )}

                <div className="attendance-scanner-placeholder">
                    {sessionIsOpen && attendanceSessionToken ? (
                        <>
                            <span className="badge bg-success mb-3">
                                Phiên điểm danh đang mở
                            </span>

                            <h3>Mã QR điểm danh hoạt động</h3>

                            <p>
                                Sinh viên sử dụng chức năng quét QR
                                trong tài khoản của mình để điểm danh.
                            </p>

                            <div
                                className="bg-white rounded p-3 d-inline-block my-3"
                                style={{
                                    border: "1px solid #dee2e6"
                                }}
                            >
                                <QRCodeCanvas
                                    ref={qrCanvasRef}
                                    value={attendanceSessionToken}
                                    size={256}
                                    level="H"
                                    includeMargin
                                />
                            </div>

                            <div className="small text-muted mb-3">
                                Mã phiên:{" "}
                                {attendanceSession.session_id}
                            </div>

                            <div className="small text-muted mb-3">
                                Hạn sử dụng:{" "}
                                {formatDate(attendanceSession.expires_at)}
                            </div>

                            <div className="d-flex justify-content-center flex-wrap gap-2">
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={downloadAttendanceQR}
                                >
                                    <i className="bi bi-download me-2"></i>
                                    Tải QR về thiết bị
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-outline-danger"
                                    onClick={closeAttendanceSession}
                                    disabled={closingSession}
                                >
                                    {closingSession
                                        ? "Đang đóng phiên..."
                                        : "Đóng phiên điểm danh"}
                                </button>
                            </div>
                        </>
                    ) : sessionIsOpen && !attendanceSessionToken ? (
                        <>
                            <i className="bi bi-exclamation-circle text-warning"></i>

                            <h3>Phiên điểm danh đang hoạt động</h3>

                            <p>
                                Trình duyệt hiện tại không còn lưu mã QR
                                gốc của phiên này. Vì máy chủ chỉ lưu mã
                                băm bảo mật, hệ thống không thể tạo lại
                                QR từ thông tin phiên.
                            </p>

                            <p>
                                Vui lòng sử dụng ảnh QR đã tải trước đó.
                                Nếu không còn ảnh, hãy đóng phiên hiện tại
                                rồi tạo phiên mới.
                            </p>

                            <button
                                type="button"
                                className="btn btn-outline-danger"
                                onClick={closeAttendanceSession}
                                disabled={closingSession}
                            >
                                {closingSession
                                    ? "Đang đóng phiên..."
                                    : "Đóng phiên hiện tại"}
                            </button>
                        </>
                    ) : (
                        <>
                            <i className="bi bi-qr-code"></i>

                            <h3>Chưa có phiên điểm danh</h3>

                            <p>
                                Nhấn nút bên dưới để gửi yêu cầu tạo phiên
                                điểm danh đến máy chủ.
                            </p>

                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={createAttendanceSession}
                                disabled={attendanceSessionLoading}
                            >
                                <i className="bi bi-plus-circle me-2"></i>

                                {attendanceSessionLoading
                                    ? "Đang tạo phiên..."
                                    : "Tạo mã QR điểm danh"}
                            </button>

                            <span className="d-block mt-3">
                                Mã QR được tạo từ session_token do máy chủ
                                trả về.
                            </span>
                        </>
                    )}
                </div>
            </section>

            <section className="activity-detail-panel">
                <div className="activity-panel-heading attendance-list-heading">
                    <div>
                        <span className="activity-panel-eyebrow">
                            DỮ LIỆU ĐIỂM DANH
                        </span>

                        <h2>Danh sách sinh viên đã điểm danh</h2>

                        <p>
                            Thông tin sinh viên được lấy từ cơ sở dữ liệu
                            sau khi máy chủ xác thực yêu cầu điểm danh.
                        </p>
                    </div>

                    <span className="attendance-total">
                        {attendanceCount} lượt điểm danh
                    </span>
                </div>

                <div className="activity-table-toolbar">
                    <div className="activity-search-box">
                        <i className="bi bi-search"></i>

                        <input
                            type="text"
                            value={attendanceKeyword}
                            onChange={event =>
                                setAttendanceKeyword(event.target.value)
                            }
                            placeholder="Tìm theo MSSV, họ tên hoặc lớp..."
                        />
                    </div>

                    <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={loadAttendance}
                        disabled={attendanceLoading}
                    >
                        <i className="bi bi-arrow-clockwise me-1"></i>
                        {attendanceLoading ? "Đang tải..." : "Làm mới"}
                    </button>
                </div>

                <div className="activity-table-responsive">
                    <table className="activity-data-table">
                        <thead>
                            <tr>
                                <th>STT</th>
                                <th>MSSV</th>
                                <th>Họ và tên</th>
                                <th>Lớp</th>
                                <th>Thời gian điểm danh</th>
                                <th>Trạng thái</th>
                            </tr>
                        </thead>

                        <tbody>
                            {attendanceLoading ? (
                                <tr>
                                    <td colSpan="6" className="activity-table-empty">
                                        <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                                        Đang tải danh sách điểm danh...
                                    </td>
                                </tr>
                            ) : attendanceError ? (
                                <tr>
                                    <td colSpan="6" className="activity-table-empty">
                                        Không thể tải dữ liệu điểm danh.
                                    </td>
                                </tr>
                            ) : filteredAttendance.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="activity-table-empty">
                                        <i className="bi bi-person-x"></i>

                                        <strong>
                                            {attendanceRows.length === 0
                                                ? "Chưa có sinh viên điểm danh"
                                                : "Không tìm thấy sinh viên phù hợp"}
                                        </strong>

                                        <span>
                                            Danh sách sẽ được cập nhật sau khi
                                            sinh viên quét mã QR thành công.
                                        </span>
                                    </td>
                                </tr>
                            ) : (
                                filteredAttendance.map((item, index) => {
                                    const studentCode =
                                        item.student_code ??
                                        item.studentCode ??
                                        "--";

                                    const fullName =
                                        item.full_name ??
                                        item.fullName ??
                                        "--";

                                    const className =
                                        item.class_name ??
                                        item.className ??
                                        "--";

                                    const attendedAt =
                                        item.attended_at ??
                                        item.attendedAt ??
                                        item.check_in_at ??
                                        item.checkInAt;

                                    const status =
                                        item.attendance_status ??
                                        item.attendanceStatus ??
                                        item.status;

                                    return (
                                        <tr
                                            key={
                                                item.participation_id ??
                                                item.participationId ??
                                                `${studentCode}-${index}`
                                            }
                                        >
                                            <td>{index + 1}</td>
                                            <td>{studentCode}</td>
                                            <td>{fullName}</td>
                                            <td>{className}</td>
                                            <td>{formatDate(attendedAt)}</td>
                                            <td>
                                                <span
                                                    className={`activity-detail-status ${String(status || "").toLowerCase()}`}
                                                >
                                                    {getAttendanceStatusLabel(status)}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="mt-3 text-muted">
                    Đang hiển thị {filteredAttendance.length} trong số{" "}
                    {attendanceCount} lượt điểm danh.
                </div>
            </section>
        </div>
    );

    // ==================================================
    // 20. TAB MINH CHỨNG
    // ==================================================

    const renderEvidence = () => (
        <div className="activity-detail-content">
            <section className="activity-detail-panel">
                <div className="activity-panel-heading">
                    <div>
                        <span className="activity-panel-eyebrow">
                            MINH CHỨNG THAM GIA
                        </span>

                        <h2>Danh sách và hồ sơ minh chứng</h2>

                        <p>
                            Minh chứng được tổng hợp dựa trên danh sách
                            sinh viên đã điểm danh thực tế tại hoạt động.
                        </p>
                    </div>

                    <span className="evidence-heading-icon">
                        <i className="bi bi-file-earmark-check"></i>
                    </span>
                </div>

                <div className="evidence-process">
                    <div className="evidence-process-item">
                        <span>1</span>
                        <strong>Điểm danh QR</strong>
                        <p>Ghi nhận sinh viên có mặt.</p>
                    </div>

                    <div className="evidence-process-item">
                        <span>2</span>
                        <strong>Kiểm tra danh sách</strong>
                        <p>Đối chiếu thông tin sinh viên.</p>
                    </div>

                    <div className="evidence-process-item">
                        <span>3</span>
                        <strong>Tổng hợp minh chứng</strong>
                        <p>Lập hồ sơ tham gia hoạt động.</p>
                    </div>

                    <div className="evidence-process-item">
                        <span>4</span>
                        <strong>Công bố minh chứng</strong>
                        <p>Cho sinh viên kiểm tra và xác nhận.</p>
                    </div>
                </div>
            </section>

            <section className="activity-detail-panel">
                <div className="activity-panel-heading">
                    <div>
                        <span className="activity-panel-eyebrow">
                            TỆP MINH CHỨNG
                        </span>

                        <h2>Chọn file minh chứng</h2>
                    </div>
                </div>

                <div className="evidence-upload-area">
                    <i className="bi bi-cloud-arrow-up"></i>

                    <h3>Chọn file Word minh chứng</h3>

                    <p>
                        Chọn file tổng hợp danh sách sinh viên đã tham gia
                        hoạt động (.doc hoặc .docx).
                    </p>

                    <label className="evidence-select-button">
                        <i className="bi bi-folder2-open"></i>
                        Chọn tệp

                        <input
                            type="file"
                            accept=".doc,.docx"
                            onChange={handleFileChange}
                        />
                    </label>

                    {evidenceFile && (
                        <div className="evidence-selected-file">
                            <i className="bi bi-file-earmark-word"></i>

                            <span>{evidenceFile.name}</span>

                            <small>
                                {(evidenceFile.size / 1024).toFixed(1)} KB
                            </small>
                        </div>
                    )}

                    <button
                        type="button"
                        className="evidence-upload-button"
                        disabled={!evidenceFile}
                        onClick={() => {
                            setNotice(
                                "File đã được chọn nhưng chức năng tải lên máy chủ chưa được tích hợp."
                            );
                        }}
                    >
                        <i className="bi bi-upload"></i>
                        Tải minh chứng lên
                    </button>

                    <span className="evidence-upload-note">
                        Hiện tại hệ thống mới hỗ trợ chọn file trên giao diện.
                        Chưa lưu file lên máy chủ.
                    </span>
                </div>
            </section>

            <section className="activity-detail-panel">
                <div className="activity-panel-heading">
                    <div>
                        <span className="activity-panel-eyebrow">
                            LỊCH SỬ MINH CHỨNG
                        </span>

                        <h2>Các file minh chứng đã tải lên</h2>
                    </div>
                </div>

                <div className="activity-feature-placeholder compact-placeholder">
                    <i className="bi bi-folder2-open"></i>

                    <h3>Chưa có file minh chứng</h3>

                    <p>
                        Danh sách file sẽ được hiển thị sau khi chức năng
                        tải và quản lý minh chứng được kết nối với máy chủ.
                    </p>
                </div>
            </section>
        </div>
    );

    // ==================================================
    // 21. TAB KẾT QUẢ
    // ==================================================

    const renderResult = () => (
        <section className="activity-detail-panel">
            <div className="activity-panel-heading">
                <div>
                    <span className="activity-panel-eyebrow">
                        TỔNG KẾT HOẠT ĐỘNG
                    </span>

                    <h2>Kết quả tham gia</h2>

                    <p>
                        Tổng hợp số lượng sinh viên đăng ký, điểm danh
                        và minh chứng sau khi hoạt động kết thúc.
                    </p>
                </div>
            </div>

            <div className="activity-result-grid">
                <div className="activity-result-card">
                    <i className="bi bi-people"></i>
                    <span>Tổng sinh viên đăng ký</span>
                    <strong>
                        {registrationsLoading ? "..." : registrationTotal}
                    </strong>
                </div>

                <div className="activity-result-card">
                    <i className="bi bi-person-check"></i>
                    <span>Đã điểm danh</span>
                    <strong>
                        {attendanceLoading ? "..." : attendedCount}
                    </strong>
                </div>

                <div className="activity-result-card">
                    <i className="bi bi-person-x"></i>
                    <span>Vắng mặt</span>
                    <strong>
                        {attendanceLoading ? "..." : absentCount}
                    </strong>
                </div>

                <div className="activity-result-card">
                    <i className="bi bi-award"></i>
                    <span>Điểm cộng khi hoàn thành</span>
                    <strong>{displayedActivityPoints}</strong>
                </div>
            </div>

            <div className="activity-feature-placeholder">
                <i className="bi bi-bar-chart-line"></i>

                <h3>Chưa có dữ liệu tổng kết đầy đủ</h3>

                <p>
                    Kết quả sẽ được tổng hợp sau khi hoàn thành đăng ký,
                    điểm danh, xác nhận minh chứng và ghi nhận điểm.
                </p>
            </div>
        </section>
    );

    // ==================================================
    // 22. HIỂN THỊ TAB
    // ==================================================

    const renderActiveTab = () => {
        switch (activeTab) {
            case "registrations":
                return renderRegistrations();

            case "attendance":
                return renderAttendance();

            case "evidence":
                return renderEvidence();

            case "result":
                return renderResult();

            default:
                return renderOverview();
        }
    };

    // ==================================================
    // 23. GIAO DIỆN CHÍNH
    // ==================================================

    return (
        <>
            <Header />

            <main className="organizer-activity-detail-page">
                <div className="container">
                    <div className="activity-detail-breadcrumb">
                        <Link to="/organizer/history">
                            <i className="bi bi-arrow-left"></i>
                            Các hoạt động đã tạo
                        </Link>

                        <span>/</span>

                        <span>Chi tiết hoạt động</span>
                    </div>

                    {loading ? (
                        <div className="activity-detail-loading">
                            <div className="spinner-border text-primary"></div>
                            <p>Đang tải thông tin hoạt động...</p>
                        </div>
                    ) : error ? (
                        <div className="alert alert-danger">
                            <i className="bi bi-exclamation-triangle me-2"></i>

                            {error}

                            <div className="mt-3">
                                <button
                                    type="button"
                                    className="btn btn-outline-danger"
                                    onClick={loadActivity}
                                >
                                    Thử tải lại
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="activity-detail-page-heading">
                                <div>
                                    <span className="activity-page-eyebrow">
                                        QUẢN LÝ HOẠT ĐỘNG
                                    </span>

                                    <h1>{activityName}</h1>

                                    <p>
                                        Quản lý đăng ký, điểm danh, minh chứng
                                        và kết quả của hoạt động.
                                    </p>
                                </div>

                                <span
                                    className={`activity-detail-status ${activityStatus.toLowerCase()}`}
                                >
                                    {getStatusLabel(activityStatus)}
                                </span>
                            </div>

                            {notice && (
                                <div className="alert alert-info activity-detail-notice">
                                    {notice}

                                    <button
                                        type="button"
                                        className="btn-close"
                                        aria-label="Đóng"
                                        onClick={() => setNotice("")}
                                    ></button>
                                </div>
                            )}

                            <nav className="activity-detail-tabs">
                                {TABS.map(tab => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        className={
                                            activeTab === tab.id
                                                ? "activity-detail-tab active"
                                                : "activity-detail-tab"
                                        }
                                        onClick={() => {
                                            setActiveTab(tab.id);
                                            setNotice("");
                                            setAttendanceError("");
                                        }}
                                    >
                                        <i className={`bi ${tab.icon}`}></i>
                                        {tab.label}
                                    </button>
                                ))}
                            </nav>

                            {renderActiveTab()}
                        </>
                    )}
                </div>
            </main>

            <Footer />
        </>
    );
}

export default OrganizerActivityDetail;
