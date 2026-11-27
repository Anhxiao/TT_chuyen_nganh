
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

const ALLOWED_EXTENSIONS = [
    "pdf", "doc", "docx",
    "xls", "xlsx",
    "jpg", "jpeg", "png"
];

const TABS = [
    { id: "overview", label: "Tổng quan", icon: "bi-info-circle" },
    { id: "registrations", label: "Đăng ký", icon: "bi-people" },
    { id: "attendance", label: "Điểm danh QR", icon: "bi-qr-code-scan" },
    { id: "evidence", label: "Minh chứng", icon: "bi-file-earmark-check" },
    { id: "result", label: "Kết quả", icon: "bi-bar-chart" }
];

// ======================================================
// 1. HÀM XỬ LÝ DỮ LIỆU
// ======================================================

function getApiData(response) {
    return response?.data?.data ?? response?.data ?? response;
}

function getActivityData(response) {
    const data = getApiData(response);
    return data?.activity ?? data?.data?.activity ?? data;
}

function getRegistrationData(response) {
    const data = getApiData(response);

    const rows = Array.isArray(data)
        ? data
        : data?.registrations ??
        data?.items ??
        data?.rows ??
        data?.recordset ??
        data?.data ??
        [];

    const total =
        data?.total ??
        data?.totalRecords ??
        data?.totalCount ??
        data?.pagination?.total ??
        data?.pagination?.totalRecords;

    return {
        rows: Array.isArray(rows) ? rows : [],
        total: Number(total ?? rows.length) || 0
    };
}

function getAttendanceData(response) {
    const data = getApiData(response);

    const rows = Array.isArray(data)
        ? data
        : data?.attendance ??
        data?.items ??
        data?.rows ??
        data?.recordset ??
        data?.data ??
        [];

    return Array.isArray(rows) ? rows : [];
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

function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getFileExtension(fileName) {
    return String(fileName || "")
        .split(".")
        .pop()
        .toLowerCase();
}

function getFileIcon(fileName) {
    const extension = getFileExtension(fileName);

    if (["jpg", "jpeg", "png"].includes(extension)) {
        return "bi-file-earmark-image";
    }

    if (extension === "pdf") {
        return "bi-file-earmark-pdf";
    }

    if (["doc", "docx"].includes(extension)) {
        return "bi-file-earmark-word";
    }

    if (["xls", "xlsx"].includes(extension)) {
        return "bi-file-earmark-excel";
    }

    return "bi-file-earmark";
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

function escapeWordHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ======================================================
// 2. COMPONENT CHÍNH
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
    const [registrationsLoading, setRegistrationsLoading] = useState(false);
    const [registrationError, setRegistrationError] = useState("");

    const [registrationKeyword, setRegistrationKeyword] = useState("");
    const [registrationFilter, setRegistrationFilter] = useState("ALL");
    const [registrationNote, setRegistrationNote] = useState("");
    const [processingRegistrationId, setProcessingRegistrationId] = useState(null);

    // --------------------------------------------------
    // STATE ĐIỂM DANH
    // --------------------------------------------------

    const [attendanceRows, setAttendanceRows] = useState([]);
    const [attendanceKeyword, setAttendanceKeyword] = useState("");
    const [attendanceLoading, setAttendanceLoading] = useState(false);
    const [attendanceError, setAttendanceError] = useState("");

    const [attendanceSession, setAttendanceSession] = useState(null);
    const [attendanceSessionToken, setAttendanceSessionToken] = useState("");

    const [attendanceSessionLoading, setAttendanceSessionLoading] = useState(false);
    const [closingSession, setClosingSession] = useState(false);

    const qrCanvasRef = useRef(null);

    // --------------------------------------------------
    // STATE XUẤT MINH CHỨNG
    // --------------------------------------------------

    const [showEvidencePreview, setShowEvidencePreview] = useState(false);

    // --------------------------------------------------
    // STATE ĐĂNG TẢI MINH CHỨNG
    // --------------------------------------------------

    const fileInputRef = useRef(null);

    const [evidenceFiles, setEvidenceFiles] = useState([]);
    const [uploadedEvidenceFiles, setUploadedEvidenceFiles] = useState([]);

    const [isDragging, setIsDragging] = useState(false);
    const [showUploadConfirm, setShowUploadConfirm] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const [uploadNotice, setUploadNotice] = useState("");

    // --------------------------------------------------
    // TOKEN VÀ HEADER
    // --------------------------------------------------

    const token = sessionStorage.getItem("accessToken");

    const headers = useMemo(
        () => ({
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        }),
        [token]
    );

    const attendancePageUrl = attendanceSessionToken
        ? `${window.location.origin}/student/attendance?token=${encodeURIComponent(
            attendanceSessionToken
        )}`
        : "";

    // ==================================================
    // 3. API LẤY THÔNG TIN HOẠT ĐỘNG
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
                    getErrorMessage(result, "Không thể tải thông tin hoạt động.")
                );
            }

            const activityData = getActivityData(result);

            if (!activityData || typeof activityData !== "object") {
                throw new Error("Dữ liệu hoạt động không hợp lệ.");
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
    // 4. API LẤY DANH SÁCH ĐĂNG KÝ
    // ==================================================

    const loadRegistrations = useCallback(async () => {
        if (!activityId) return;

        setRegistrationsLoading(true);
        setRegistrationError("");

        try {
            const response = await fetch(
                `${API_BASE_URL}/registrations/activities/${encodeURIComponent(
                    activityId
                )}?page=1&limit=100`,
                {
                    method: "GET",
                    headers
                }
            );

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    getErrorMessage(result, "Không thể tải danh sách đăng ký.")
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
    // 5. API LẤY DANH SÁCH ĐIỂM DANH
    // ==================================================

    const loadAttendance = useCallback(async () => {
        if (!activityId) return;

        setAttendanceLoading(true);
        setAttendanceError("");

        try {
            const response = await fetch(
                `${API_BASE_URL}/attendance/activities/${encodeURIComponent(
                    activityId
                )}`,
                {
                    method: "GET",
                    headers
                }
            );

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    getErrorMessage(result, "Không thể tải danh sách điểm danh.")
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
    // 6. API LẤY PHIÊN ĐIỂM DANH ĐANG HOẠT ĐỘNG
    // ==================================================

    const loadActiveAttendanceSession = useCallback(async () => {
        if (!activityId) return;

        setAttendanceSessionLoading(true);

        try {
            const response = await fetch(
                `${API_BASE_URL}/attendance/activities/${encodeURIComponent(
                    activityId
                )}/sessions/active`,
                {
                    method: "GET",
                    headers
                }
            );

            const result = await response.json().catch(() => ({}));

            if (response.status === 404) {
                setAttendanceSession(null);
                setAttendanceSessionToken("");
                return;
            }

            if (!response.ok) {
                throw new Error(
                    getErrorMessage(result, "Không thể kiểm tra phiên điểm danh.")
                );
            }

            const session = getAttendanceSessionData(result);

            if (!session || !session.session_id) {
                setAttendanceSession(null);
                setAttendanceSessionToken("");
                return;
            }

            setAttendanceSession(session);

            const storageKey = `attendanceQr:${activityId}:${session.session_id}`;
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
    // 7. TẠO PHIÊN ĐIỂM DANH
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
                "Phiên điểm danh đang mở nhưng trình duyệt không còn lưu mã QR. Vui lòng sử dụng ảnh QR đã tải trước đó hoặc đóng phiên hiện tại rồi tạo phiên mới."
            );
            return;
        }

        setAttendanceSessionLoading(true);
        setAttendanceError("");
        setNotice("");

        try {
            const response = await fetch(
                `${API_BASE_URL}/attendance/activities/${encodeURIComponent(
                    activityId
                )}/sessions`,
                {
                    method: "POST",
                    headers: {
                        ...headers,
                        "Content-Type": "application/json"
                    }
                }
            );

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    getErrorMessage(result, "Không thể tạo phiên điểm danh.")
                );
            }

            const session = getAttendanceSessionData(result);

            const sessionToken =
                session?.session_token ??
                session?.sessionToken ??
                result?.data?.session_token ??
                result?.session_token;

            const sessionId =
                session?.session_id ?? session?.sessionId;

            if (!sessionToken || !sessionId) {
                throw new Error(
                    "Máy chủ không trả về session_token hoặc session_id."
                );
            }

            setAttendanceSession(session);
            setAttendanceSessionToken(sessionToken);

            const storageKey = `attendanceQr:${activityId}:${sessionId}`;
            sessionStorage.setItem(storageKey, sessionToken);

            setNotice("Tạo phiên điểm danh thành công. Mã QR đã sẵn sàng.");

            await loadAttendance();
        } catch (err) {
            console.error("Lỗi tạo phiên điểm danh:", err);

            setAttendanceError(
                err.message || "Không thể tạo phiên điểm danh."
            );

            await loadActiveAttendanceSession();
        } finally {
            setAttendanceSessionLoading(false);
        }
    };

    // ==================================================
    // 8. ĐÓNG PHIÊN ĐIỂM DANH
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
                `${API_BASE_URL}/attendance/sessions/${encodeURIComponent(
                    sessionId
                )}/close`,
                {
                    method: "PATCH",
                    headers
                }
            );

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    getErrorMessage(result, "Không thể đóng phiên điểm danh.")
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
    // 9. TẢI MÃ QR
    // ==================================================

    const downloadAttendanceQR = () => {
        const canvas = qrCanvasRef.current;

        if (!canvas) {
            setAttendanceError("Không tìm thấy mã QR để tải xuống.");
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

            setNotice("Đã tạo ảnh mã QR để tải xuống.");
        } catch (err) {
            console.error("Lỗi tải mã QR:", err);
            setAttendanceError("Không thể tải mã QR. Vui lòng thử lại.");
        }
    };

    // ==================================================
    // 10. TẢI DỮ LIỆU KHI MỞ TRANG
    // ==================================================

    useEffect(() => {
        loadActivity();
        loadRegistrations();
    }, [loadActivity, loadRegistrations]);

    useEffect(() => {
        if (activeTab === "attendance" && activityId) {
            loadAttendance();
            loadActiveAttendanceSession();
        }

        if (activeTab === "evidence" && activityId) {
            loadAttendance();
        }
    }, [
        activeTab,
        activityId,
        loadAttendance,
        loadActiveAttendanceSession
    ]);

    // ==================================================
    // 11. DUYỆT / TỪ CHỐI ĐĂNG KÝ
    // ==================================================

    const handleRegistrationAction = async (registrationId, action) => {
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

        const actionLabel = action === "approve" ? "duyệt" : "từ chối";

        const confirmed = window.confirm(
            `Bạn có chắc chắn muốn ${actionLabel} đăng ký này không?`
        );

        if (!confirmed) return;

        setProcessingRegistrationId(registrationId);
        setRegistrationError("");
        setNotice("");

        try {
            const response = await fetch(
                `${API_BASE_URL}/registrations/${encodeURIComponent(
                    registrationId
                )}/${action}`,
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
    // 12. CHUẨN HÓA THÔNG TIN HOẠT ĐỘNG
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
        activity?.activity_start || activity?.activityStart;

    const endDate =
        activity?.activity_end || activity?.activityEnd;

    const registrationStart =
        activity?.registration_start || activity?.registrationStart;

    const registrationEnd =
        activity?.registration_end || activity?.registrationEnd;

    const maxParticipants =
        activity?.max_participants ?? activity?.maxParticipants;

    const description =
        activity?.description || "Hoạt động chưa có mô tả.";

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
    // 13. LỌC DANH SÁCH ĐĂNG KÝ
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

            const status =
                item.registration_status || item.status;

            const matchesKeyword =
                !keyword ||
                studentCode.includes(keyword) ||
                fullName.includes(keyword) ||
                className.includes(keyword);

            const matchesStatus =
                registrationFilter === "ALL" ||
                status === registrationFilter;

            return matchesKeyword && matchesStatus;
        });
    }, [registrations, registrationKeyword, registrationFilter]);

    const pendingCount = registrations.filter(
        item =>
            (item.registration_status || item.status) === "PENDING"
    ).length;

    const approvedCount = registrations.filter(
        item =>
            (item.registration_status || item.status) === "APPROVED"
    ).length;

    // ==================================================
    // 14. LỌC DANH SÁCH ĐIỂM DANH
    // ==================================================

    const filteredAttendance = useMemo(() => {
        const keyword = attendanceKeyword.trim().toLowerCase();

        return attendanceRows.filter((item) => {
            const studentCode = String(
                item.student_code || item.studentCode || ""
            ).toLowerCase();

            const fullName = String(
                item.full_name || item.fullName || ""
            ).toLowerCase();

            const className = String(
                item.class_name || item.className || ""
            ).toLowerCase();

            return (
                !keyword ||
                studentCode.includes(keyword) ||
                fullName.includes(keyword) ||
                className.includes(keyword)
            );
        });
    }, [attendanceRows, attendanceKeyword]);

    // ==================================================
    // 15. TỔNG HỢP SINH VIÊN CÓ MẶT LẬP MINH CHỨNG
    // ==================================================

    const evidenceStudents = useMemo(() => {
        const uniqueStudents = new Map();

        attendanceRows.forEach((item) => {
            const status = String(
                item.attendance_status ??
                item.attendanceStatus ??
                ""
            ).toUpperCase();

            if (!["ATTENDED", "PRESENT"].includes(status)) {
                return;
            }

            const studentCode = String(
                item.student_code ??
                item.studentCode ??
                ""
            ).trim();

            const studentId =
                item.student_id ??
                item.studentId ??
                item.user_id ??
                item.userId;

            const uniqueKey = studentCode
                ? `MSSV:${studentCode.toUpperCase()}`
                : studentId
                    ? `ID:${studentId}`
                    : null;

            if (!uniqueKey) return;

            const student = {
                student_id: studentId,
                student_code: studentCode,
                full_name:
                    item.full_name ??
                    item.fullName ??
                    "",
                class_name:
                    item.class_name ??
                    item.className ??
                    "",
                note: "Có mặt"
            };

            if (!uniqueStudents.has(uniqueKey)) {
                uniqueStudents.set(uniqueKey, student);
            }
        });

        return Array.from(uniqueStudents.values()).sort((a, b) =>
            String(a.student_code).localeCompare(
                String(b.student_code),
                "vi"
            )
        );
    }, [attendanceRows]);

    const attendedCount = evidenceStudents.length;
    const attendanceCount = attendedCount;

    const absentCount = attendanceRows.filter((item) => {
        const status = String(
            item.attendance_status ??
            item.attendanceStatus ??
            ""
        ).toUpperCase();

        return status === "ABSENT";
    }).length;

    const sessionIsOpen =
        attendanceSession?.status === "OPEN";

    // ==================================================
    // 16. XỬ LÝ ĐĂNG TẢI FILE MINH CHỨNG
    // ==================================================

    const addEvidenceFiles = (selectedFiles) => {
        const incomingFiles = Array.from(selectedFiles || []);

        const validFiles = [];
        const invalidFiles = [];

        incomingFiles.forEach((file) => {
            const extension = getFileExtension(file.name);

            if (ALLOWED_EXTENSIONS.includes(extension)) {
                validFiles.push(file);
            } else {
                invalidFiles.push(file.name);
            }
        });

        setEvidenceFiles((currentFiles) => {
            const combinedFiles = [...currentFiles];

            validFiles.forEach((file) => {
                const duplicated = combinedFiles.some(
                    (currentFile) =>
                        currentFile.name === file.name &&
                        currentFile.size === file.size &&
                        currentFile.lastModified === file.lastModified
                );

                if (!duplicated) {
                    combinedFiles.push(file);
                }
            });

            return combinedFiles;
        });

        if (invalidFiles.length > 0) {
            setUploadError(
                `Các tệp sau không được hỗ trợ: ${invalidFiles.join(", ")}`
            );
        } else {
            setUploadError("");
        }

        setUploadNotice("");
    };

    const handleEvidenceFileChange = (event) => {
        addEvidenceFiles(event.target.files);

        // Cho phép chọn lại cùng một tệp sau khi xóa.
        event.target.value = "";
    };

    const handleEvidenceDrop = (event) => {
        event.preventDefault();
        setIsDragging(false);

        addEvidenceFiles(event.dataTransfer.files);
    };

    const removeEvidenceFile = (index) => {
        setEvidenceFiles((currentFiles) =>
            currentFiles.filter((_, fileIndex) => fileIndex !== index)
        );

        setUploadError("");
        setUploadNotice("");
    };

    const openUploadConfirmation = () => {
        setUploadError("");
        setUploadNotice("");

        if (evidenceFiles.length === 0) {
            setUploadError("Vui lòng chọn ít nhất một tệp minh chứng.");
            return;
        }

        setShowUploadConfirm(true);
    };

    // Xác nhận đăng tải ở giao diện.
    // Chưa gửi dữ liệu hoặc file lên máy chủ.
    const confirmEvidenceUpload = () => {
        const uploadedAt = new Date().toISOString();

        const newUploadedFiles = evidenceFiles.map((file, index) => ({
            id: `${Date.now()}-${index}`,
            name: file.name,
            size: file.size,
            type: file.type,
            uploadedAt
        }));

        setUploadedEvidenceFiles((currentFiles) => [
            ...newUploadedFiles,
            ...currentFiles
        ]);

        setEvidenceFiles([]);
        setShowUploadConfirm(false);
        setUploadError("");

        setUploadNotice(
            `Đã xác nhận đăng tải ${newUploadedFiles.length} tệp trên giao diện. Chức năng lưu file lên máy chủ sẽ được tích hợp ở bước tiếp theo.`
        );
    };

    // ==================================================
    // 17. TẠO TÊN FILE MINH CHỨNG
    // ==================================================

    const getEvidenceFileName = () => {
        const safeName = activityName
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9]+/g, "-")
            .replace(/^-|-$/g, "");

        return `Minh-chung-${safeName || activityId}.doc`;
    };

    // ==================================================
    // 18. TẠO NỘI DUNG FILE WORD
    // ==================================================

    const buildEvidenceWordDocument = () => {
        const rowsHtml = evidenceStudents.map((student, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${escapeWordHtml(student.full_name)}</td>
                <td>${escapeWordHtml(student.class_name)}</td>
                <td>${escapeWordHtml(student.note)}</td>
            </tr>
        `).join("");

        const documentDate = new Date().toLocaleDateString("vi-VN");

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Danh sách sinh viên tham gia hoạt động</title>

                <style>
                    @page {
                        size: A4;
                        margin: 2cm;
                    }

                    body {
                        font-family: "Times New Roman", serif;
                        font-size: 13pt;
                        color: #000;
                        line-height: 1.5;
                    }

                    .header {
                        text-align: center;
                        font-weight: bold;
                        line-height: 1.5;
                    }

                    .document-date {
                        text-align: right;
                        margin-top: 24px;
                        font-style: italic;
                    }

                    h2 {
                        text-align: center;
                        font-size: 16pt;
                        margin-top: 28px;
                        margin-bottom: 22px;
                    }

                    .activity-info {
                        margin: 8px 0;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 18px;
                    }

                    th, td {
                        border: 1px solid #000;
                        padding: 8px;
                        text-align: center;
                    }

                    th {
                        font-weight: bold;
                    }

                    .total {
                        margin-top: 16px;
                        font-weight: bold;
                    }

                    .signature {
                        width: 100%;
                        margin-top: 45px;
                    }

                    .signature td {
                        border: none;
                        width: 50%;
                        vertical-align: top;
                        text-align: center;
                    }

                    .signature-space {
                        height: 85px;
                    }
                </style>
            </head>

            <body>
                <div class="header">
                    <div>TRƯỜNG ĐẠI HỌC TRÀ VINH</div>
                    <div>${escapeWordHtml(organizationName).toUpperCase()}</div>
                </div>

                <div class="document-date">
                    Ngày lập: ${escapeWordHtml(documentDate)}
                </div>

                <h2>DANH SÁCH SINH VIÊN THAM GIA HOẠT ĐỘNG</h2>

                <p class="activity-info">
                    <strong>Tên hoạt động:</strong>
                    ${escapeWordHtml(activityName)}
                </p>

                <p class="activity-info">
                    <strong>Thời gian:</strong>
                    ${escapeWordHtml(formatDate(startDate))}
                    đến
                    ${escapeWordHtml(formatDate(endDate))}
                </p>

                <p class="activity-info">
                    <strong>Đơn vị tổ chức:</strong>
                    ${escapeWordHtml(organizationName)}
                </p>

                <table>
                    <thead>
                        <tr>
                            <th style="width: 10%">STT</th>
                            <th style="width: 40%">HỌ VÀ TÊN</th>
                            <th style="width: 25%">LỚP</th>
                            <th style="width: 25%">GHI CHÚ</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>

                <p class="total">
                    Tổng số sinh viên có mặt: ${evidenceStudents.length}
                </p>

                <table class="signature">
                    <tr>
                        <td>
                            <strong>ĐẠI DIỆN ĐƠN VỊ TỔ CHỨC</strong>
                            <br />
                            <em>(Ký và ghi rõ họ tên)</em>
                            <div class="signature-space"></div>
                        </td>

                        <td>
                            <strong>NGƯỜI LẬP DANH SÁCH</strong>
                            <br />
                            <em>(Ký và ghi rõ họ tên)</em>
                            <div class="signature-space"></div>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `;
    };

    // ==================================================
    // 19. TẢI FILE WORD MINH CHỨNG
    // ==================================================

    const downloadEvidenceWord = () => {
        if (evidenceStudents.length === 0) {
            setNotice(
                "Chưa có sinh viên điểm danh có mặt để xuất minh chứng."
            );
            return;
        }

        try {
            const documentHtml = buildEvidenceWordDocument();

            const blob = new Blob(
                ["\ufeff", documentHtml],
                {
                    type: "application/msword;charset=utf-8"
                }
            );

            const fileUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");

            link.href = fileUrl;
            link.download = getEvidenceFileName();

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            window.setTimeout(() => {
                URL.revokeObjectURL(fileUrl);
            }, 1000);

            setShowEvidencePreview(false);
            setNotice(
                "Đã tạo file Word minh chứng từ danh sách sinh viên điểm danh có mặt."
            );
        } catch (err) {
            console.error("Lỗi xuất file minh chứng:", err);

            setNotice(
                "Không thể tạo file minh chứng. Vui lòng thử lại."
            );
        }
    };

    // ==================================================
    // 20. MỞ HỘP THOẠI XUẤT MINH CHỨNG
    // ==================================================

    const openEvidencePreview = async () => {
        setAttendanceError("");
        setNotice("");

        setAttendanceLoading(true);

        try {
            const response = await fetch(
                `${API_BASE_URL}/attendance/activities/${encodeURIComponent(
                    activityId
                )}`,
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
                        "Không thể cập nhật danh sách điểm danh."
                    )
                );
            }

            setAttendanceRows(getAttendanceData(result));
            setShowEvidencePreview(true);
        } catch (err) {
            console.error("Lỗi cập nhật dữ liệu minh chứng:", err);

            setAttendanceError(
                err.message || "Không thể tải dữ liệu minh chứng."
            );
        } finally {
            setAttendanceLoading(false);
        }
    };

    // ==================================================
    // 21. TAB TỔNG QUAN
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
                        <span>Sinh viên có mặt</span>
                        <strong>
                            {attendanceLoading ? "..." : attendedCount}
                        </strong>
                    </div>

                    <div className="activity-stat-item">
                        <span>File minh chứng</span>
                        <strong>
                            {uploadedEvidenceFiles.length} tệp
                        </strong>
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
    // 22. TAB ĐĂNG KÝ
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
                                                className={`activity-detail-status ${String(
                                                    status || ""
                                                ).toLowerCase()}`}
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
    // 23. TAB ĐIỂM DANH QR
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
                                style={{ border: "1px solid #dee2e6" }}
                            >
                                <QRCodeCanvas
                                    ref={qrCanvasRef}
                                    value={attendancePageUrl}
                                    size={256}
                                    level="H"
                                />
                            </div>

                            <div className="small text-muted mb-3">
                                Mã phiên: {attendanceSession.session_id}
                            </div>

                            <div className="small text-muted mb-3">
                                Hạn sử dụng: {formatDate(attendanceSession.expires_at)}
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
                            Danh sách được tổng hợp từ dữ liệu điểm danh
                            đã lưu trong cơ sở dữ liệu.
                        </p>
                    </div>

                    <span className="attendance-total">
                        {attendedCount} sinh viên có mặt
                    </span>
                </div>

                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
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

                    <div className="d-flex flex-wrap gap-2">
                        <button
                            type="button"
                            className="btn btn-outline-primary"
                            onClick={loadAttendance}
                            disabled={attendanceLoading}
                        >
                            <i className="bi bi-arrow-clockwise me-1"></i>
                            {attendanceLoading ? "Đang tải..." : "Làm mới"}
                        </button>

                        <button
                            type="button"
                            className="btn btn-success"
                            onClick={openEvidencePreview}
                            disabled={attendanceLoading}
                        >
                            <i className="bi bi-file-earmark-word me-2"></i>
                            Xuất file minh chứng
                        </button>
                    </div>
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
                                                ? "Chưa có dữ liệu điểm danh"
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
                                        "PENDING";

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
                                                    className={`activity-detail-status ${String(
                                                        status
                                                    ).toLowerCase()}`}
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
                    Đang hiển thị {filteredAttendance.length} dòng dữ liệu.
                    Có {attendedCount} sinh viên có mặt sau khi loại bỏ
                    các bản ghi trùng.
                </div>
            </section>
        </div>
    );

    // ==================================================
    // 24. KHU VỰC ĐĂNG TẢI FILE MINH CHỨNG
    // ==================================================

    const renderEvidenceUpload = () => (
        <section className="activity-detail-panel evidence-upload-panel">
            <div className="activity-panel-heading">
                <div>
                    <span className="activity-panel-eyebrow">
                        HỒ SƠ MINH CHỨNG
                    </span>

                    <h2>Đăng tải file minh chứng</h2>

                    <p>
                        Đơn vị tổ chức có thể tải lên các tài liệu,
                        hình ảnh và hồ sơ liên quan đến hoạt động.
                    </p>
                </div>

                <span className="evidence-heading-icon">
                    <i className="bi bi-cloud-arrow-up"></i>
                </span>
            </div>

            {uploadError && (
                <div className="alert alert-danger d-flex align-items-start gap-2">
                    <i className="bi bi-exclamation-triangle mt-1"></i>
                    <span>{uploadError}</span>

                    <button
                        type="button"
                        className="btn-close ms-auto"
                        aria-label="Đóng"
                        onClick={() => setUploadError("")}
                    ></button>
                </div>
            )}

            {uploadNotice && (
                <div className="alert alert-info d-flex align-items-start gap-2">
                    <i className="bi bi-info-circle mt-1"></i>
                    <span>{uploadNotice}</span>

                    <button
                        type="button"
                        className="btn-close ms-auto"
                        aria-label="Đóng"
                        onClick={() => setUploadNotice("")}
                    ></button>
                </div>
            )}

            <div
                className={`evidence-dropzone ${
                    isDragging ? "dragging" : ""
                }`}
                onDragEnter={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                }}
                onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                }}
                onDragLeave={(event) => {
                    event.preventDefault();

                    if (!event.currentTarget.contains(event.relatedTarget)) {
                        setIsDragging(false);
                    }
                }}
                onDrop={handleEvidenceDrop}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        fileInputRef.current?.click();
                    }
                }}
            >
                <div className="evidence-upload-icon">
                    <i className="bi bi-cloud-arrow-up"></i>
                </div>

                <h5 className="fw-bold mt-3 mb-2">
                    Kéo và thả tệp minh chứng vào đây
                </h5>

                <p className="text-muted mb-3">
                    Hoặc chọn tệp từ máy tính của bạn
                </p>

                <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={(event) => {
                        event.stopPropagation();
                        fileInputRef.current?.click();
                    }}
                >
                    <i className="bi bi-folder2-open me-2"></i>
                    Chọn tệp
                </button>

                <div className="small text-muted mt-3">
                    Định dạng hỗ trợ: PDF, DOC, DOCX, XLS, XLSX,
                    JPG, JPEG, PNG.
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    hidden
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                    onChange={handleEvidenceFileChange}
                />
            </div>

            {/* DANH SÁCH FILE ĐANG CHỜ ĐĂNG TẢI */}

            <div className="mt-4">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                    <div>
                        <h5 className="fw-bold mb-1">
                            Tệp đang chờ đăng tải
                        </h5>

                        <p className="text-muted mb-0">
                            Kiểm tra danh sách trước khi xác nhận.
                        </p>
                    </div>

                    <span className="badge bg-primary">
                        {evidenceFiles.length} tệp
                    </span>
                </div>

                {evidenceFiles.length === 0 ? (
                    <div className="evidence-empty-files">
                        <i className="bi bi-file-earmark-text"></i>

                        <strong>Chưa có tệp nào được chọn</strong>

                        <span>
                            Chọn tệp hoặc kéo thả tệp vào khu vực phía trên.
                        </span>
                    </div>
                ) : (
                    <div className="evidence-file-list">
                        {evidenceFiles.map((file, index) => (
                            <div
                                className="evidence-file-item"
                                key={`${file.name}-${file.lastModified}-${index}`}
                            >
                                <div className="evidence-file-information">
                                    <div className="evidence-file-icon">
                                        <i className={`bi ${getFileIcon(file.name)}`}></i>
                                    </div>

                                    <div className="evidence-file-text">
                                        <strong>{file.name}</strong>
                                        <span>{formatFileSize(file.size)}</span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => removeEvidenceFile(index)}
                                    title="Xóa tệp khỏi danh sách"
                                >
                                    <i className="bi bi-trash"></i>
                                    <span className="ms-1">Xóa</span>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="d-flex justify-content-end mt-4">
                <button
                    type="button"
                    className="btn btn-primary px-4"
                    onClick={openUploadConfirmation}
                    disabled={evidenceFiles.length === 0}
                >
                    <i className="bi bi-cloud-upload me-2"></i>
                    Đăng tải ({evidenceFiles.length})
                </button>
            </div>

            {/* DANH SÁCH FILE ĐÃ ĐĂNG TẢI TRÊN GIAO DIỆN */}

            <div className="mt-5">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                    <div>
                        <h5 className="fw-bold mb-1">
                            Danh sách tệp đã đăng tải
                        </h5>

                        <p className="text-muted mb-0">
                            Các tệp đã được xác nhận đăng tải trong phiên làm việc này.
                        </p>
                    </div>

                    <span className="badge bg-success">
                        {uploadedEvidenceFiles.length} tệp
                    </span>
                </div>

                {uploadedEvidenceFiles.length === 0 ? (
                    <div className="evidence-empty-files">
                        <i className="bi bi-folder2-open"></i>

                        <strong>Chưa có tệp minh chứng nào</strong>

                        <span>
                            Các tệp được xác nhận sẽ hiển thị tại đây.
                        </span>
                    </div>
                ) : (
                    <div className="evidence-file-list">
                        {uploadedEvidenceFiles.map((file) => (
                            <div
                                className="evidence-file-item uploaded"
                                key={file.id}
                            >
                                <div className="evidence-file-information">
                                    <div className="evidence-file-icon">
                                        <i className={`bi ${getFileIcon(file.name)}`}></i>
                                    </div>

                                    <div className="evidence-file-text">
                                        <strong>{file.name}</strong>

                                        <span>
                                            {formatFileSize(file.size)}
                                            {" · "}
                                            {formatDate(file.uploadedAt)}
                                        </span>
                                    </div>
                                </div>

                                <span className="badge bg-success">
                                    <i className="bi bi-check-circle me-1"></i>
                                    Đã xác nhận
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );

    // ==================================================
    // 25. TAB MINH CHỨNG
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
                            Danh sách minh chứng chỉ bao gồm sinh viên đã
                            điểm danh thành công và được ghi nhận có mặt.
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
                        <strong>Đăng tải hồ sơ</strong>
                        <p>Gửi tài liệu minh chứng của hoạt động.</p>
                    </div>
                </div>
            </section>

            {/* DANH SÁCH SINH VIÊN CÓ MẶT */}

            <section className="activity-detail-panel">
                <div className="activity-panel-heading">
                    <div>
                        <span className="activity-panel-eyebrow">
                            DANH SÁCH MINH CHỨNG
                        </span>

                        <h2>Sinh viên được ghi nhận có mặt</h2>

                        <p>
                            Dữ liệu được tổng hợp từ tất cả các phiên QR
                            của hoạt động và loại bỏ sinh viên trùng lặp.
                        </p>
                    </div>

                    <span className="attendance-total">
                        {evidenceStudents.length} sinh viên
                    </span>
                </div>

                {attendanceError && (
                    <div className="alert alert-danger">
                        {attendanceError}
                    </div>
                )}

                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                    <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={loadAttendance}
                        disabled={attendanceLoading}
                    >
                        <i className="bi bi-arrow-clockwise me-1"></i>
                        Làm mới danh sách
                    </button>

                    <button
                        type="button"
                        className="btn btn-success"
                        onClick={() => setShowEvidencePreview(true)}
                        disabled={
                            attendanceLoading ||
                            evidenceStudents.length === 0
                        }
                    >
                        <i className="bi bi-file-earmark-word me-2"></i>
                        Xuất file Word
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
                                <th>Ghi chú</th>
                            </tr>
                        </thead>

                        <tbody>
                            {attendanceLoading ? (
                                <tr>
                                    <td colSpan="5" className="activity-table-empty">
                                        <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                                        Đang tải dữ liệu minh chứng...
                                    </td>
                                </tr>
                            ) : evidenceStudents.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="activity-table-empty">
                                        <i className="bi bi-person-x"></i>

                                        <strong>
                                            Chưa có sinh viên được ghi nhận có mặt
                                        </strong>

                                        <span>
                                            Sinh viên sẽ xuất hiện tại đây sau
                                            khi điểm danh QR thành công.
                                        </span>
                                    </td>
                                </tr>
                            ) : (
                                evidenceStudents.map((student, index) => (
                                    <tr
                                        key={
                                            student.student_id ||
                                            student.student_code ||
                                            index
                                        }
                                    >
                                        <td>{index + 1}</td>
                                        <td>{student.student_code || "--"}</td>
                                        <td>{student.full_name || "--"}</td>
                                        <td>{student.class_name || "--"}</td>
                                        <td>
                                            <span className="badge bg-success">
                                                Có mặt
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="mt-3 text-muted">
                    Tổng cộng {evidenceStudents.length} sinh viên có mặt.
                    Mỗi sinh viên chỉ được hiển thị một lần trong danh sách
                    minh chứng.
                </div>
            </section>

            {/* KHU VỰC ĐĂNG TẢI FILE */}

            {renderEvidenceUpload()}
        </div>
    );

    // ==================================================
    // 26. TAB KẾT QUẢ
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
                    <span>Đã điểm danh có mặt</span>
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
    // 27. HỘP THOẠI XEM TRƯỚC MINH CHỨNG
    // ==================================================

    const renderEvidencePreviewModal = () => {
        if (!showEvidencePreview) return null;

        return (
            <div
                className="evidence-modal-backdrop"
                onMouseDown={event => {
                    if (event.target === event.currentTarget) {
                        setShowEvidencePreview(false);
                    }
                }}
            >
                <div
                    className="evidence-modal"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="evidenceModalTitle"
                >
                    <div className="evidence-modal-header">
                        <div>
                            <span className="activity-panel-eyebrow">
                                XUẤT HỒ SƠ MINH CHỨNG
                            </span>

                            <h2 id="evidenceModalTitle">
                                Danh sách sinh viên có mặt
                            </h2>
                        </div>

                        <button
                            type="button"
                            className="evidence-modal-close"
                            aria-label="Đóng"
                            onClick={() => setShowEvidencePreview(false)}
                        >
                            <i className="bi bi-x-lg"></i>
                        </button>
                    </div>

                    <div className="evidence-modal-body">
                        <div className="evidence-modal-summary">
                            <div>
                                <span>Hoạt động</span>
                                <strong>{activityName}</strong>
                            </div>

                            <div>
                                <span>Đơn vị tổ chức</span>
                                <strong>{organizationName}</strong>
                            </div>

                            <div>
                                <span>Thời gian</span>
                                <strong>
                                    {formatDate(startDate)} - {formatDate(endDate)}
                                </strong>
                            </div>

                            <div>
                                <span>Số sinh viên có mặt</span>
                                <strong className="text-success">
                                    {evidenceStudents.length} sinh viên
                                </strong>
                            </div>
                        </div>

                        <div className="alert alert-info">
                            <i className="bi bi-info-circle me-2"></i>
                            Danh sách chỉ bao gồm sinh viên có trạng thái
                            điểm danh là <strong>Có mặt</strong>. Sinh viên
                            trùng lặp giữa các phiên QR chỉ được tính một lần.
                        </div>

                        <div className="activity-table-responsive evidence-preview-table">
                            <table className="activity-data-table">
                                <thead>
                                    <tr>
                                        <th>STT</th>
                                        <th>MSSV</th>
                                        <th>Họ và tên</th>
                                        <th>Lớp</th>
                                        <th>Ghi chú</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {evidenceStudents.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="5"
                                                className="activity-table-empty"
                                            >
                                                Chưa có sinh viên có mặt.
                                            </td>
                                        </tr>
                                    ) : (
                                        evidenceStudents.map((student, index) => (
                                            <tr
                                                key={
                                                    student.student_id ||
                                                    student.student_code ||
                                                    index
                                                }
                                            >
                                                <td>{index + 1}</td>
                                                <td>{student.student_code || "--"}</td>
                                                <td>{student.full_name || "--"}</td>
                                                <td>{student.class_name || "--"}</td>
                                                <td>Có mặt</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="evidence-modal-footer">
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => setShowEvidencePreview(false)}
                        >
                            Đóng
                        </button>

                        <button
                            type="button"
                            className="btn btn-outline-primary"
                            onClick={() => {
                                setShowEvidencePreview(false);
                                setActiveTab("evidence");
                            }}
                        >
                            <i className="bi bi-eye me-2"></i>
                            Xem chi tiết
                        </button>

                        <button
                            type="button"
                            className="btn btn-success"
                            onClick={downloadEvidenceWord}
                            disabled={evidenceStudents.length === 0}
                        >
                            <i className="bi bi-download me-2"></i>
                            Lưu về
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // ==================================================
    // 28. HỘP THOẠI XÁC NHẬN ĐĂNG TẢI
    // ==================================================

    const renderUploadConfirmModal = () => {
        if (!showUploadConfirm) return null;

        const totalSize = evidenceFiles.reduce(
            (total, file) => total + file.size,
            0
        );

        return (
            <div
                className="evidence-modal-backdrop"
                onMouseDown={(event) => {
                    if (event.target === event.currentTarget) {
                        setShowUploadConfirm(false);
                    }
                }}
            >
                <div
                    className="evidence-confirm-modal"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="uploadConfirmTitle"
                >
                    <div className="evidence-modal-header">
                        <div>
                            <span className="activity-panel-eyebrow">
                                XÁC NHẬN THAO TÁC
                            </span>

                            <h2 id="uploadConfirmTitle">
                                Xác nhận đăng tải minh chứng
                            </h2>
                        </div>

                        <button
                            type="button"
                            className="evidence-modal-close"
                            aria-label="Đóng"
                            onClick={() => setShowUploadConfirm(false)}
                        >
                            <i className="bi bi-x-lg"></i>
                        </button>
                    </div>

                    <div className="evidence-modal-body">
                        <div className="alert alert-warning">
                            <i className="bi bi-exclamation-circle me-2"></i>

                            Bạn có chắc chắn muốn đăng tải các tệp minh chứng
                            đã chọn cho hoạt động này không?
                        </div>

                        <div className="evidence-confirm-activity">
                            <span>Hoạt động</span>
                            <strong>{activityName}</strong>
                        </div>

                        <div className="evidence-confirm-activity">
                            <span>Đơn vị đăng tải</span>
                            <strong>{organizationName}</strong>
                        </div>

                        <div className="d-flex justify-content-between align-items-center mt-4 mb-2">
                            <strong>Danh sách tệp ({evidenceFiles.length})</strong>

                            <span className="text-muted small">
                                Tổng dung lượng: {formatFileSize(totalSize)}
                            </span>
                        </div>

                        <div className="evidence-confirm-file-list">
                            {evidenceFiles.map((file, index) => (
                                <div
                                    className="evidence-confirm-file"
                                    key={`${file.name}-${file.lastModified}-${index}`}
                                >
                                    <div className="d-flex align-items-center gap-2 overflow-hidden">
                                        <i className={`bi ${getFileIcon(file.name)} text-primary fs-5`}></i>

                                        <span className="text-break">
                                            {file.name}
                                        </span>
                                    </div>

                                    <small className="text-muted flex-shrink-0">
                                        {formatFileSize(file.size)}
                                    </small>
                                </div>
                            ))}
                        </div>

                        <div className="small text-muted mt-3">
                            Sau khi xác nhận, danh sách tệp sẽ được chuyển
                            sang mục tệp đã đăng tải trên giao diện.
                        </div>
                    </div>

                    <div className="evidence-modal-footer">
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => setShowUploadConfirm(false)}
                        >
                            Hủy
                        </button>

                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={confirmEvidenceUpload}
                            disabled={evidenceFiles.length === 0}
                        >
                            <i className="bi bi-cloud-upload me-2"></i>
                            Xác nhận đăng tải
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // ==================================================
    // 29. HIỂN THỊ TAB
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
    // 30. GIAO DIỆN CHÍNH
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

            {renderEvidencePreviewModal()}
            {renderUploadConfirmModal()}
        </>
    );
}

export default OrganizerActivityDetail;
