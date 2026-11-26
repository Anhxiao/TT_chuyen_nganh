
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import Header from "../components/Header Organizer";
import Footer from "../components/Footer";

import "../styles/organizer-activity-detail.css";

const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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

function getActivityData(response) {
    return (
        response?.data?.data?.activity ||
        response?.data?.activity ||
        response?.data?.data ||
        response?.activity ||
        response?.data ||
        response
    );
}

function getRegistrationData(response) {
    const data = response?.data ?? response;

    // Hỗ trợ các dạng dữ liệu trả về phổ biến
    const rows =
        Array.isArray(data) ? data :
        Array.isArray(data?.registrations) ? data.registrations :
        Array.isArray(data?.items) ? data.items :
        Array.isArray(data?.rows) ? data.rows :
        Array.isArray(data?.recordset) ? data.recordset :
        Array.isArray(data?.data) ? data.data :
        [];

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
    // STATE MINH CHỨNG
    // --------------------------------------------------

    const [evidenceFile, setEvidenceFile] = useState(null);

    // --------------------------------------------------
    // STATE ĐIỂM DANH
    // --------------------------------------------------

    const [attendanceKeyword, setAttendanceKeyword] = useState("");

    // --------------------------------------------------
    // STATE ĐĂNG KÝ
    // --------------------------------------------------

    const [registrations, setRegistrations] = useState([]);
    const [registrationTotal, setRegistrationTotal] = useState(0);

    const [registrationsLoading, setRegistrationsLoading] =
        useState(false);

    const [registrationError, setRegistrationError] = useState("");

    const [registrationKeyword, setRegistrationKeyword] =
        useState("");

    const [registrationFilter, setRegistrationFilter] =
        useState("ALL");

    const [processingRegistrationId, setProcessingRegistrationId] =
        useState(null);

    const [registrationNote, setRegistrationNote] = useState("");

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
    // 3. LẤY THÔNG TIN HOẠT ĐỘNG
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
                    result.message ||
                    "Không thể tải thông tin hoạt động."
                );
            }

            setActivity(getActivityData(result));
        } catch (err) {
            console.error("Lỗi tải chi tiết hoạt động:", err);

            setError(
                err.message ||
                "Đã xảy ra lỗi khi tải hoạt động."
            );
        } finally {
            setLoading(false);
        }
    }, [activityId, headers]);

    // ==================================================
    // 4. LẤY DANH SÁCH ĐĂNG KÝ
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
                    result.message ||
                    "Không thể tải danh sách đăng ký."
                );
            }

            const normalized = getRegistrationData(result);

            setRegistrations(normalized.rows);
            setRegistrationTotal(normalized.total);
        } catch (err) {
            console.error("Lỗi tải danh sách đăng ký:", err);

            setRegistrationError(
                err.message ||
                "Đã xảy ra lỗi khi tải danh sách đăng ký."
            );
        } finally {
            setRegistrationsLoading(false);
        }
    }, [activityId, headers]);

    // ==================================================
    // 5. TẢI DỮ LIỆU KHI MỞ TRANG
    // ==================================================

    useEffect(() => {
        loadActivity();
        loadRegistrations();
    }, [loadActivity, loadRegistrations]);

    // ==================================================
    // 6. XỬ LÝ DUYỆT / TỪ CHỐI ĐĂNG KÝ
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
                    result.message ||
                    `Không thể ${actionLabel} đăng ký.`
                );
            }

            setNotice(
                action === "approve"
                    ? "Đã duyệt đăng ký của sinh viên thành công."
                    : "Đã từ chối đăng ký của sinh viên."
            );

            setRegistrationNote("");

            // Tải lại danh sách và thông tin hoạt động
            await Promise.all([
                loadRegistrations(),
                loadActivity()
            ]);
        } catch (err) {
            console.error(
                `Lỗi ${actionLabel} đăng ký:`,
                err
            );

            setRegistrationError(
                err.message ||
                `Không thể ${actionLabel} đăng ký.`
            );
        } finally {
            setProcessingRegistrationId(null);
        }
    };

    // ==================================================
    // 7. DỮ LIỆU HOẠT ĐỘNG
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
    
        // Điểm phục vụ cộng đồng dự kiến của hoạt động
    const activityPoints = Number(
        activity?.expected_points ??
        activity?.expectedPoints ??
        0
    );
    // ==================================================
    // 8. LỌC DANH SÁCH ĐĂNG KÝ
    // ==================================================

    const filteredRegistrations = useMemo(() => {
        const keyword = registrationKeyword.trim().toLowerCase();

        return registrations.filter((item) => {
            const studentCode =
                String(item.student_code || "").toLowerCase();

            const fullName =
                String(item.full_name || "").toLowerCase();

            const className =
                String(item.class_name || "").toLowerCase();

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

    // Thống kê trạng thái trên danh sách đã tải
    const pendingCount = registrations.filter(
        item =>
            (item.registration_status || item.status) === "PENDING"
    ).length;

    const approvedCount = registrations.filter(
        item =>
            (item.registration_status || item.status) === "APPROVED"
    ).length;

    // ==================================================
    // 9. XỬ LÝ FILE MINH CHỨNG
    // ==================================================

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            setEvidenceFile(null);
            return;
        }

        const allowedExtensions = [".doc", ".docx"];

        const fileName = file.name.toLowerCase();

        const isWordFile = allowedExtensions.some(
            extension => fileName.endsWith(extension)
        );

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
            "Đã chọn file minh chứng trên thiết bị. File chưa được tải lên máy chủ."
        );
    };

    // ==================================================
    // 10. DỮ LIỆU ĐIỂM DANH
    // ==================================================

    // Chưa kết nối API điểm danh
    const filteredAttendance = [];

    const attendanceCount = filteredAttendance.length;

    // ==================================================
    // 11. TAB TỔNG QUAN
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

                        <span className={`activity-detail-status ${activityStatus.toLowerCase()}`}>
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
                        <strong>{activityPoints} điểm</strong>
                    </div>

                    <div className="activity-stat-item">
                        <span>Tổng sinh viên đăng ký</span>
                        <strong>
                            {registrationsLoading
                                ? "..."
                                : registrationTotal}
                        </strong>
                    </div>

                    <div className="activity-stat-item">
                        <span>Chờ duyệt</span>
                        <strong>
                            {registrationsLoading
                                ? "..."
                                : pendingCount}
                        </strong>
                    </div>

                    <div className="activity-stat-item">
                        <span>Đã được duyệt</span>
                        <strong>
                            {registrationsLoading
                                ? "..."
                                : approvedCount}
                        </strong>
                    </div>

                    <div className="activity-stat-item">
                        <span>Đã điểm danh</span>
                        <strong>{attendanceCount}</strong>
                    </div>

                    <div className="activity-stat-item">
                        <span>File minh chứng</span>
                        <strong>Chưa có dữ liệu</strong>
                    </div>

                    <div className="activity-stat-note">
                        <i className="bi bi-info-circle"></i>

                        Số điểm trên là mức điểm được đơn vị tổ chức thiết lập
                        cho sinh viên khi hoàn thành hoạt động. Sinh viên chỉ
                        được ghi nhận điểm sau khi tham gia và được đơn vị tổ
                        chức xác nhận hoàn thành. Hệ thống không cộng điểm khi
                        sinh viên chỉ đăng ký hoặc được duyệt đăng ký.
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
                            <p>Quản lý danh sách sinh viên đăng ký tham gia.</p>
                        </div>
                    </div>

                    <div className="activity-process-step">
                        <span className="process-step-number">02</span>
                        <div>
                            <strong>Điểm danh bằng QR</strong>
                            <p>Đơn vị tổ chức quét mã QR cá nhân của sinh viên.</p>
                        </div>
                    </div>

                    <div className="activity-process-step">
                        <span className="process-step-number">03</span>
                        <div>
                            <strong>Tổng hợp minh chứng</strong>
                            <p>Kiểm tra danh sách sinh viên đã điểm danh và lập file Word.</p>
                        </div>
                    </div>

                    <div className="activity-process-step">
                        <span className="process-step-number">04</span>
                        <div>
                            <strong>Hoàn tất hoạt động</strong>
                            <p>Lưu minh chứng và tổng hợp kết quả tham gia.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );

    // ==================================================
    // 12. TAB ĐĂNG KÝ
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
                    {registrationTotal} sinh viên
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
                                <td
                                    colSpan="10"
                                    className="activity-table-empty"
                                >
                                    <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                                    Đang tải danh sách đăng ký...
                                </td>
                            </tr>
                        ) : filteredRegistrations.length === 0 ? (
                            <tr>
                                <td
                                    colSpan="10"
                                    className="activity-table-empty"
                                >
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
                                    item.registration_status ||
                                    item.status;

                                const registrationId =
                                    item.registration_id;

                                return (
                                    <tr key={registrationId || index}>
                                        <td>{index + 1}</td>

                                        <td>
                                            {item.student_code || "--"}
                                        </td>

                                        <td>
                                            {item.full_name || "--"}
                                        </td>

                                        <td>
                                            {item.class_name || "--"}
                                        </td>

                                        <td>
                                            {item.email || "--"}
                                        </td>

                                        <td>
                                            {item.phone || "--"}
                                        </td>

                                        <td>
                                            {formatDate(item.registered_at)}
                                        </td>

                                        <td>
                                            <span
                                                className={`activity-detail-status ${String(status || "").toLowerCase()}`}
                                            >
                                                {getRegistrationStatusLabel(status)}
                                            </span>
                                        </td>

                                        <td>
                                            {item.approval_note || "--"}
                                        </td>

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
                                                        {processingRegistrationId === registrationId
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
    // 13. TAB ĐIỂM DANH
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
                            Đơn vị tổ chức sử dụng thiết bị để quét mã QR cá nhân
                            do sinh viên cung cấp khi tham gia hoạt động.
                        </p>
                    </div>

                    <span className="attendance-qr-icon">
                        <i className="bi bi-qr-code-scan"></i>
                    </span>
                </div>

                <div className="attendance-instruction">
                    <div>
                        <i className="bi bi-person-vcard"></i>
                        <strong>Thông tin trong mã QR sinh viên</strong>
                        <p>Họ tên, MSSV, lớp và số điện thoại.</p>
                    </div>

                    <div>
                        <i className="bi bi-camera"></i>
                        <strong>Thao tác của đơn vị tổ chức</strong>
                        <p>Quét mã QR để xác nhận sinh viên có mặt.</p>
                    </div>

                    <div>
                        <i className="bi bi-clipboard-check"></i>
                        <strong>Lưu kết quả điểm danh</strong>
                        <p>Sinh viên đã điểm danh sẽ được ghi nhận vào danh sách.</p>
                    </div>
                </div>

                <div className="attendance-scanner-placeholder">
                    <i className="bi bi-camera-video"></i>

                    <h3>Khu vực quét mã QR</h3>

                    <p>
                        Camera quét QR sẽ được tích hợp tại đây. Hiện tại giao diện
                        chưa kích hoạt camera hoặc ghi nhận điểm danh.
                    </p>

                    <button type="button" disabled>
                        <i className="bi bi-qr-code-scan"></i>
                        Bắt đầu quét QR
                    </button>

                    <span>Chức năng đang chờ tích hợp xử lý QR</span>
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
                            Danh sách này sẽ là cơ sở để tổng hợp minh chứng tham gia.
                        </p>
                    </div>

                    <span className="attendance-total">
                        {attendanceCount} sinh viên
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
                            placeholder="Tìm theo họ tên hoặc MSSV..."
                        />
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
                                <th>Số điện thoại</th>
                                <th>Thời gian điểm danh</th>
                                <th>Trạng thái</th>
                            </tr>
                        </thead>

                        <tbody>
                            <tr>
                                <td colSpan="7" className="activity-table-empty">
                                    <i className="bi bi-person-x"></i>

                                    <strong>Chưa có dữ liệu điểm danh</strong>

                                    <span>
                                        Sinh viên được quét QR thành công sẽ xuất hiện tại đây.
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );

    // ==================================================
    // 14. TAB MINH CHỨNG
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
                            Minh chứng được lập dựa trên danh sách sinh viên đã
                            điểm danh thực tế tại hoạt động.
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
                        <p>Đối chiếu họ tên, MSSV và lớp.</p>
                    </div>

                    <div className="evidence-process-item">
                        <span>3</span>
                        <strong>Tổng hợp file Word</strong>
                        <p>Lập danh sách sinh viên tham gia.</p>
                    </div>

                    <div className="evidence-process-item">
                        <span>4</span>
                        <strong>Tải minh chứng</strong>
                        <p>Lưu hồ sơ minh chứng của hoạt động.</p>
                    </div>
                </div>
            </section>

            <section className="activity-detail-panel">
                <div className="activity-panel-heading">
                    <div>
                        <span className="activity-panel-eyebrow">
                            TỆP MINH CHỨNG
                        </span>

                        <h2>Tải lên file minh chứng</h2>
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
                        onClick={() =>
                            setNotice(
                                "Chức năng tải file lên máy chủ chưa được tích hợp. File hiện vẫn chỉ được chọn trên thiết bị."
                            )
                        }
                    >
                        <i className="bi bi-upload"></i>
                        Tải minh chứng lên
                    </button>

                    <span className="evidence-upload-note">
                        Hiện tại mới hỗ trợ chọn file trên giao diện, chưa tải lên máy chủ.
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
                        Sau khi tải lên thành công, các file minh chứng sẽ được
                        hiển thị và quản lý tại khu vực này.
                    </p>
                </div>
            </section>
        </div>
    );

    // ==================================================
    // 15. TAB KẾT QUẢ
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
                        Tổng hợp số lượng sinh viên đăng ký, điểm danh và minh chứng.
                    </p>
                </div>
            </div>

            <div className="activity-result-grid">
                <div className="activity-result-card">
                    <i className="bi bi-people"></i>
                    <span>Tổng sinh viên đăng ký</span>
                    <strong>{registrationTotal}</strong>
                </div>

                <div className="activity-result-card">
                    <i className="bi bi-person-check"></i>
                    <span>Đã điểm danh</span>
                    <strong>--</strong>
                </div>

                <div className="activity-result-card">
                    <i className="bi bi-person-x"></i>
                    <span>Vắng mặt</span>
                    <strong>--</strong>
                </div>

                <div className="activity-result-card">
                    <i className="bi bi-file-earmark-check"></i>
                    <span>Minh chứng</span>
                    <strong>--</strong>
                </div>
            </div>

            <div className="activity-feature-placeholder">
                <i className="bi bi-bar-chart-line"></i>

                <h3>Chưa có dữ liệu tổng kết</h3>

                <p>
                    Kết quả sẽ được tổng hợp sau khi hoàn thành đăng ký,
                    điểm danh và xác nhận minh chứng.
                </p>
            </div>
        </section>
    );

    // ==================================================
    // 16. HIỂN THỊ TAB
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
    // 17. GIAO DIỆN CHÍNH
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

                                <span className={`activity-detail-status ${activityStatus.toLowerCase()}`}>
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
