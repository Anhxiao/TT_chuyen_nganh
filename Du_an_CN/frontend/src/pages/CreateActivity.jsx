
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/Header Organizer";
import Footer from "../components/Footer";
import "../styles/styles-create-activity.css";

const API_BASE_URL = (
    import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

// Lấy thông tin đơn vị từ tài khoản đăng nhập.
function getOrganizationInfo(user) {
    if (!user) {
        return {
            id: null,
            name: ""
        };
    }

    const organization =
        user.organization ||
        (Array.isArray(user.organizations) &&
        user.organizations.length === 1
            ? user.organizations[0]
            : null);

    const id =
        user.organizationId ??
        user.organization_id ??
        organization?.organizationId ??
        organization?.organization_id ??
        organization?.id ??
        null;

    const name =
        user.organizationName ||
        user.organization_name ||
        organization?.organizationName ||
        organization?.organization_name ||
        organization?.name ||
        "";

    return {
        id: id ? Number(id) : null,
        name
    };
}

const initialForm = {
    activityName: "",
    description: "",
    location: "",
    registrationStart: "",
    registrationEnd: "",
    activityStart: "",
    activityEnd: "",
    maxParticipants: "",
    expectedPoints: "0",
    registrationMode: "OPEN"
};

function CreateActivity() {
    const { user, isLoading } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState(initialForm);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [submitType, setSubmitType] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const organization = useMemo(
        () => getOrganizationInfo(user),
        [user]
    );

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value
        }));

        setErrors((previous) => ({
            ...previous,
            [name]: ""
        }));

        setErrorMessage("");
        setSuccessMessage("");
    };

    const validateForm = () => {
        const newErrors = {};

        // Kiểm tra tên hoạt động.
        if (!form.activityName.trim()) {
            newErrors.activityName = "Vui lòng nhập tên hoạt động.";
        } else if (form.activityName.trim().length > 255) {
            newErrors.activityName =
                "Tên hoạt động không được vượt quá 255 ký tự.";
        }

        // Kiểm tra địa điểm.
        if (!form.location.trim()) {
            newErrors.location = "Vui lòng nhập địa điểm tổ chức.";
        }

        // Kiểm tra các mốc thời gian.
        const dateFields = [
            "registrationStart",
            "registrationEnd",
            "activityStart",
            "activityEnd"
        ];

        dateFields.forEach((field) => {
            if (!form[field]) {
                newErrors[field] = "Vui lòng chọn thời gian.";
            } else if (Number.isNaN(Date.parse(form[field]))) {
                newErrors[field] = "Thời gian không hợp lệ.";
            }
        });

        if (
            form.registrationStart &&
            form.registrationEnd &&
            new Date(form.registrationStart) >=
                new Date(form.registrationEnd)
        ) {
            newErrors.registrationEnd =
                "Thời gian kết thúc đăng ký phải sau thời gian bắt đầu.";
        }

        if (
            form.activityStart &&
            form.activityEnd &&
            new Date(form.activityStart) >=
                new Date(form.activityEnd)
        ) {
            newErrors.activityEnd =
                "Thời gian kết thúc hoạt động phải sau thời gian bắt đầu.";
        }

        if (
            form.registrationEnd &&
            form.activityStart &&
            new Date(form.registrationEnd) >
                new Date(form.activityStart)
        ) {
            newErrors.registrationEnd =
                "Thời hạn đăng ký không được sau thời điểm bắt đầu hoạt động.";
        }

        // Kiểm tra số lượng người tham gia.
        if (
            form.maxParticipants !== "" &&
            (
                !Number.isInteger(Number(form.maxParticipants)) ||
                Number(form.maxParticipants) < 1
            )
        ) {
            newErrors.maxParticipants =
                "Số lượng phải là số nguyên lớn hơn 0.";
        }

        // Kiểm tra điểm hoạt động.
        if (
            form.expectedPoints === "" ||
            !Number.isInteger(Number(form.expectedPoints)) ||
            Number(form.expectedPoints) < 0
        ) {
            newErrors.expectedPoints =
                "Điểm hoạt động phải là số nguyên lớn hơn hoặc bằng 0.";
        }

        // Kiểm tra đơn vị tổ chức.
        if (
            !organization.id ||
            !Number.isInteger(organization.id)
        ) {
            newErrors.organizationId =
                "Không xác định được đơn vị tổ chức của tài khoản.";
        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    const getResponseData = async (response) => {
        let result;

        try {
            result = await response.json();
        } catch {
            throw new Error("Máy chủ trả về dữ liệu không hợp lệ.");
        }

        if (!response.ok || result.success === false) {
            throw new Error(
                result.message || "Không thể thực hiện yêu cầu."
            );
        }

        return result.data ?? result;
    };

    const sendRequest = async (url, method, body) => {
        const token = sessionStorage.getItem("accessToken");

        if (!token) {
            throw new Error(
                "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
            );
        }

        const response = await fetch(`${API_BASE_URL}${url}`, {
            method,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            ...(body ? { body: JSON.stringify(body) } : {})
        });

        return getResponseData(response);
    };

    const handleSubmit = async (event, type) => {
        event.preventDefault();

        if (submitting) {
            return;
        }

        setSuccessMessage("");
        setErrorMessage("");

        if (!validateForm()) {
            setErrorMessage(
                "Vui lòng kiểm tra lại thông tin hoạt động."
            );

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

            return;
        }

        setSubmitting(true);
        setSubmitType(type);

        try {
            const payload = {
                activityName: form.activityName.trim(),
                organizationId: organization.id,
                description: form.description.trim() || null,
                location: form.location.trim(),

                registrationStart: form.registrationStart,
                registrationEnd: form.registrationEnd,
                activityStart: form.activityStart,
                activityEnd: form.activityEnd,

                maxParticipants:
                    form.maxParticipants === ""
                        ? null
                        : Number(form.maxParticipants),

                // Số điểm sinh viên nhận khi hoàn thành hoạt động.
                expectedPoints: Number(form.expectedPoints),

                registrationMode: form.registrationMode
            };

            // Bước 1: Tạo hoạt động ở trạng thái DRAFT.
            const createdActivity = await sendRequest(
                "/activities",
                "POST",
                payload
            );

            if (type === "draft") {
                setSuccessMessage(
                    "Đã lưu hoạt động dưới dạng bản nháp thành công."
                );

                setForm(initialForm);
                setErrors({});

                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

                return;
            }

            // Bước 2: Công bố hoạt động vừa tạo.
            const activityId =
                createdActivity.activity_id ??
                createdActivity.activityId ??
                createdActivity.id;

            if (!activityId) {
                throw new Error(
                    "Hoạt động đã được tạo nhưng máy chủ không trả về mã hoạt động. Vui lòng kiểm tra danh sách hoạt động trước khi tạo lại."
                );
            }

            await sendRequest(
                `/activities/${activityId}/publish`,
                "PATCH"
            );

            setSuccessMessage(
                "Công bố hoạt động thành công. Sinh viên có thể xem hoạt động sau khi tải lại danh sách."
            );

            setForm(initialForm);
            setErrors({});

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        } catch (error) {
            console.error("Lỗi tạo hoạt động:", error);

            setErrorMessage(
                error.message ||
                "Không thể tạo hoạt động. Vui lòng thử lại."
            );

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        } finally {
            setSubmitting(false);
            setSubmitType("");
        }
    };

    if (isLoading) {
        return (
            <div className="create-activity-loading">
                <div className="spinner-border text-primary"></div>
                <p>Đang tải thông tin tài khoản...</p>
            </div>
        );
    }

    const previewPoints =
        form.expectedPoints !== "" &&
        Number.isInteger(Number(form.expectedPoints)) &&
        Number(form.expectedPoints) >= 0
            ? Number(form.expectedPoints)
            : 0;

    return (
        <div className="create-activity-page">
            <Header role="ORGANIZER" />

            <main className="create-activity-container container">
                {/* Tiêu đề */}
                <div className="create-activity-heading">
                    <div>
                        <span className="create-activity-eyebrow">
                            QUẢN LÝ HOẠT ĐỘNG
                        </span>

                        <h2>Tạo hoạt động mới</h2>

                        <p>
                            Đăng tải hoạt động phục vụ cộng đồng dành cho sinh viên.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => navigate("/organizer/dashboard")}
                    >
                        <i className="bi bi-arrow-left me-2"></i>
                        Quay lại
                    </button>
                </div>

                {/* Thông báo */}
                {successMessage && (
                    <div className="alert alert-success create-activity-alert">
                        <i className="bi bi-check-circle-fill me-2"></i>
                        {successMessage}
                    </div>
                )}

                {errorMessage && (
                    <div className="alert alert-danger create-activity-alert">
                        <i className="bi bi-exclamation-circle-fill me-2"></i>
                        {errorMessage}
                    </div>
                )}

                <form onSubmit={(event) => handleSubmit(event, "publish")}>
                    {/* Thông tin chung */}
                    <section className="create-activity-card">
                        <div className="create-card-heading">
                            <div className="create-card-icon">
                                <i className="bi bi-info-circle"></i>
                            </div>

                            <div>
                                <h4>Thông tin chung</h4>
                                <p>Thông tin cơ bản của hoạt động.</p>
                            </div>
                        </div>

                        <div className="row g-4">
                            <div className="col-12">
                                <label className="form-label">
                                    Tên hoạt động <span className="required">*</span>
                                </label>

                                <input
                                    type="text"
                                    name="activityName"
                                    className={`form-control ${
                                        errors.activityName ? "is-invalid" : ""
                                    }`}
                                    placeholder="Ví dụ: Chiến dịch Mùa hè xanh 2026"
                                    value={form.activityName}
                                    onChange={handleChange}
                                    maxLength={255}
                                />

                                {errors.activityName && (
                                    <div className="invalid-feedback">
                                        {errors.activityName}
                                    </div>
                                )}
                            </div>

                            <div className="col-12">
                                <label className="form-label">
                                    Đơn vị tổ chức
                                </label>

                                <div className="organization-readonly">
                                    <i className="bi bi-building"></i>

                                    <div>
                                        <strong>
                                            {organization.name ||
                                                "Chưa xác định đơn vị"}
                                        </strong>

                                        <small>
                                            Đơn vị được xác định theo tài khoản đăng nhập.
                                        </small>
                                    </div>

                                    <i className="bi bi-lock-fill ms-auto"></i>
                                </div>

                                {errors.organizationId && (
                                    <div className="text-danger small mt-2">
                                        {errors.organizationId}
                                    </div>
                                )}
                            </div>

                            <div className="col-12">
                                <label className="form-label">
                                    Địa điểm tổ chức <span className="required">*</span>
                                </label>

                                <input
                                    type="text"
                                    name="location"
                                    className={`form-control ${
                                        errors.location ? "is-invalid" : ""
                                    }`}
                                    placeholder="Nhập địa điểm diễn ra hoạt động"
                                    value={form.location}
                                    onChange={handleChange}
                                />

                                {errors.location && (
                                    <div className="invalid-feedback">
                                        {errors.location}
                                    </div>
                                )}
                            </div>

                            <div className="col-12">
                                <label className="form-label">
                                    Mô tả chi tiết và điều kiện tham gia
                                </label>

                                <textarea
                                    name="description"
                                    className="form-control create-activity-textarea"
                                    rows="6"
                                    placeholder={
                                        "Giới thiệu nội dung, mục tiêu hoạt động...\n\n" +
                                        "Điều kiện tham gia:\n" +
                                        "- Đối tượng được tham gia\n" +
                                        "- Yêu cầu đối với sinh viên\n" +
                                        "- Trang phục hoặc vật dụng cần chuẩn bị\n" +
                                        "- Các lưu ý khác"
                                    }
                                    value={form.description}
                                    onChange={handleChange}
                                ></textarea>

                                <small className="form-text">
                                    Bạn có thể ghi rõ đối tượng, yêu cầu và các lưu ý
                                    dành cho sinh viên tại đây.
                                </small>
                            </div>
                        </div>
                    </section>

                    {/* Thời gian */}
                    <section className="create-activity-card">
                        <div className="create-card-heading">
                            <div className="create-card-icon">
                                <i className="bi bi-calendar-event"></i>
                            </div>

                            <div>
                                <h4>Thời gian hoạt động</h4>
                                <p>
                                    Thiết lập thời gian đăng ký và thời gian tổ chức.
                                </p>
                            </div>
                        </div>

                        <div className="row g-4">
                            <div className="col-md-6">
                                <label className="form-label">
                                    Bắt đầu đăng ký <span className="required">*</span>
                                </label>

                                <input
                                    type="datetime-local"
                                    name="registrationStart"
                                    className={`form-control ${
                                        errors.registrationStart ? "is-invalid" : ""
                                    }`}
                                    value={form.registrationStart}
                                    onChange={handleChange}
                                />

                                {errors.registrationStart && (
                                    <div className="invalid-feedback">
                                        {errors.registrationStart}
                                    </div>
                                )}
                            </div>

                            <div className="col-md-6">
                                <label className="form-label">
                                    Kết thúc đăng ký <span className="required">*</span>
                                </label>

                                <input
                                    type="datetime-local"
                                    name="registrationEnd"
                                    className={`form-control ${
                                        errors.registrationEnd ? "is-invalid" : ""
                                    }`}
                                    value={form.registrationEnd}
                                    onChange={handleChange}
                                />

                                {errors.registrationEnd && (
                                    <div className="invalid-feedback">
                                        {errors.registrationEnd}
                                    </div>
                                )}
                            </div>

                            <div className="col-md-6">
                                <label className="form-label">
                                    Bắt đầu hoạt động <span className="required">*</span>
                                </label>

                                <input
                                    type="datetime-local"
                                    name="activityStart"
                                    className={`form-control ${
                                        errors.activityStart ? "is-invalid" : ""
                                    }`}
                                    value={form.activityStart}
                                    onChange={handleChange}
                                />

                                {errors.activityStart && (
                                    <div className="invalid-feedback">
                                        {errors.activityStart}
                                    </div>
                                )}
                            </div>

                            <div className="col-md-6">
                                <label className="form-label">
                                    Kết thúc hoạt động <span className="required">*</span>
                                </label>

                                <input
                                    type="datetime-local"
                                    name="activityEnd"
                                    className={`form-control ${
                                        errors.activityEnd ? "is-invalid" : ""
                                    }`}
                                    value={form.activityEnd}
                                    onChange={handleChange}
                                />

                                {errors.activityEnd && (
                                    <div className="invalid-feedback">
                                        {errors.activityEnd}
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Số lượng và hình thức đăng ký */}
                    <section className="create-activity-card">
                        <div className="create-card-heading">
                            <div className="create-card-icon">
                                <i className="bi bi-people"></i>
                            </div>

                            <div>
                                <h4>Thông tin đăng ký</h4>
                                <p>Quy định số lượng và cách thức đăng ký.</p>
                            </div>
                        </div>

                        <div className="row g-4">
                            <div className="col-md-6">
                                <label className="form-label">
                                    Số lượng người tham gia tối đa
                                </label>

                                <input
                                    type="number"
                                    name="maxParticipants"
                                    min="1"
                                    step="1"
                                    className={`form-control ${
                                        errors.maxParticipants ? "is-invalid" : ""
                                    }`}
                                    placeholder="Để trống nếu không giới hạn"
                                    value={form.maxParticipants}
                                    onChange={handleChange}
                                />

                                {errors.maxParticipants && (
                                    <div className="invalid-feedback">
                                        {errors.maxParticipants}
                                    </div>
                                )}

                                <small className="form-text">
                                    Không bắt buộc. Để trống nếu không giới hạn số lượng.
                                </small>
                            </div>

                            <div className="col-md-6">
                                <label className="form-label">
                                    Hình thức đăng ký
                                </label>

                                <select
                                    name="registrationMode"
                                    className="form-select"
                                    value={form.registrationMode}
                                    onChange={handleChange}
                                >
                                    <option value="OPEN">
                                        Đăng ký tự động
                                    </option>

                                    <option value="APPROVAL">
                                        Đăng ký chờ đơn vị duyệt
                                    </option>
                                </select>

                                <small className="form-text">
                                    Với hình thức chờ duyệt, đơn vị tổ chức sẽ xem xét
                                    từng đơn đăng ký.
                                </small>
                            </div>
                        </div>

                        <div className="registration-mode-note">
                            <i className="bi bi-lightbulb-fill"></i>

                            <div>
                                <strong>Lưu ý</strong>
                                <p>
                                    Hoạt động sẽ được tạo ở trạng thái bản nháp trước.
                                    Khi chọn công bố, hoạt động mới được chuyển sang
                                    trạng thái PUBLISHED.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Điểm phục vụ cộng đồng */}
                    <section className="create-activity-card">
                        <div className="create-card-heading">
                            <div className="create-card-icon">
                                <i className="bi bi-award"></i>
                            </div>

                            <div>
                                <h4>Điểm phục vụ cộng đồng</h4>
                                <p>
                                    Thiết lập số điểm sinh viên nhận được khi hoàn thành
                                    hoạt động.
                                </p>
                            </div>
                        </div>

                        <div className="row g-4 align-items-center">
                            <div className="col-md-6">
                                <label className="form-label">
                                    Điểm nhận khi hoàn thành
                                    <span className="required">*</span>
                                </label>

                                <div className="input-group">
                                    <span className="input-group-text">
                                        <i className="bi bi-star-fill"></i>
                                    </span>

                                    <input
                                        type="number"
                                        name="expectedPoints"
                                        min="0"
                                        step="1"
                                        className={`form-control ${
                                            errors.expectedPoints ? "is-invalid" : ""
                                        }`}
                                        placeholder="Nhập số điểm"
                                        value={form.expectedPoints}
                                        onChange={handleChange}
                                    />

                                    <span className="input-group-text">
                                        điểm
                                    </span>
                                </div>

                                {errors.expectedPoints && (
                                    <div className="text-danger small mt-1">
                                        {errors.expectedPoints}
                                    </div>
                                )}

                                <small className="form-text">
                                    Nhập số nguyên không âm. Ví dụ: 2, 3, 5 hoặc 10 điểm.
                                </small>
                            </div>

                            <div className="col-md-6">
                                <div className="expected-points-preview">
                                    <div className="expected-points-icon">
                                        <i className="bi bi-award-fill"></i>
                                    </div>

                                    <div>
                                        <span>
                                            Sinh viên nhận khi hoàn thành
                                        </span>

                                        <strong>
                                            {previewPoints}
                                            <small> điểm</small>
                                        </strong>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="registration-mode-note">
                            <i className="bi bi-info-circle-fill"></i>

                            <div>
                                <strong>Quy định cộng điểm</strong>

                                <p>
                                    Sinh viên chỉ được ghi nhận số điểm này sau khi
                                    tham gia và được đơn vị tổ chức xác nhận hoàn thành
                                    hoạt động. Sinh viên chỉ đăng ký, chưa tham gia,
                                    vắng mặt hoặc không hoàn thành sẽ không được cộng
                                    điểm. Hệ thống không cộng điểm ngay tại thời điểm
                                    đăng ký hoặc được duyệt đăng ký.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Nút thao tác */}
                    <div className="create-activity-actions">
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            disabled={submitting}
                            onClick={() => navigate("/organizer/dashboard")}
                        >
                            Hủy
                        </button>

                        <button
                            type="button"
                            className="btn btn-outline-primary"
                            disabled={submitting}
                            onClick={(event) => handleSubmit(event, "draft")}
                        >
                            {submitting && submitType === "draft" ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                    Đang lưu...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-save me-2"></i>
                                    Lưu bản nháp
                                </>
                            )}
                        </button>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={submitting}
                        >
                            {submitting && submitType === "publish" ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                    Đang công bố...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-cloud-upload me-2"></i>
                                    Công bố hoạt động
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </main>

            <Footer />
        </div>
    );
}

export default CreateActivity;
