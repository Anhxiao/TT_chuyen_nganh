
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/Header Organizer";
import Footer from "../components/Footer";
import "../styles/styles-edit-activity-organizer.css";

const API_BASE_URL = (
    import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

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

// ======================================================
// 1. CHUYỂN NGÀY TỪ API SANG DATETIME-LOCAL
// ======================================================

function formatDateTimeLocal(value) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    const pad = (number) => String(number).padStart(2, "0");

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
        date.getDate()
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// ======================================================
// 2. COMPONENT CHỈNH SỬA HOẠT ĐỘNG
// ======================================================

function EditActivityOrganizer() {
    const navigate = useNavigate();
    const { activityId } = useParams();
    const { isLoading } = useAuth();

    const notificationRef = useRef(null);

    const [form, setForm] = useState(initialForm);

    const [loadingActivity, setLoadingActivity] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitType, setSubmitType] = useState("");

    const [errors, setErrors] = useState({});
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // ==================================================
    // 3. TỰ ĐỘNG CUỘN ĐẾN KHU VỰC THÔNG BÁO
    // ==================================================

    useEffect(() => {
        if (!successMessage && !errorMessage) return;

        const frame = window.requestAnimationFrame(() => {
            notificationRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        });

        return () => {
            window.cancelAnimationFrame(frame);
        };
    }, [successMessage, errorMessage]);

    // ==================================================
    // 4. GỬI YÊU CẦU ĐẾN BACKEND
    // ==================================================

    const sendRequest = async (url, method = "GET", body = null) => {
        const accessToken = sessionStorage.getItem("accessToken");

        const response = await fetch(`${API_BASE_URL}${url}`, {
            method,
            headers: {
                "Content-Type": "application/json",
                ...(accessToken
                    ? { Authorization: `Bearer ${accessToken}` }
                    : {})
            },
            ...(body !== null
                ? { body: JSON.stringify(body) }
                : {})
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok || result.success === false) {
            throw new Error(
                result.message || "Không thể thực hiện yêu cầu."
            );
        }

        return result.data ?? result;
    };

    // ==================================================
    // 5. TẢI THÔNG TIN BẢN NHÁP
    // ==================================================

    useEffect(() => {
        if (isLoading) return;

        let isMounted = true;

        const loadActivity = async () => {
            try {
                setLoadingActivity(true);
                setErrorMessage("");
                setSuccessMessage("");

                if (!sessionStorage.getItem("accessToken")) {
                    throw new Error(
                        "Vui lòng đăng nhập để tiếp tục."
                    );
                }

                const activity = await sendRequest(
                    `/activities/${activityId}/edit`
                );

                if (activity.status !== "DRAFT") {
                    throw new Error(
                        "Chỉ được chỉnh sửa hoạt động ở trạng thái bản nháp."
                    );
                }

                if (!isMounted) return;

                setForm({
                    activityName: activity.activity_name ?? "",
                    description: activity.description ?? "",
                    location: activity.location ?? "",

                    registrationStart: formatDateTimeLocal(
                        activity.registration_start
                    ),

                    registrationEnd: formatDateTimeLocal(
                        activity.registration_end
                    ),

                    activityStart: formatDateTimeLocal(
                        activity.activity_start
                    ),

                    activityEnd: formatDateTimeLocal(
                        activity.activity_end
                    ),

                    maxParticipants:
                        activity.max_participants ?? "",

                    expectedPoints: String(
                        activity.expected_points ?? 0
                    ),

                    registrationMode:
                        activity.registration_mode ?? "OPEN"
                });

            } catch (error) {
                if (isMounted) {
                    setErrorMessage(error.message);
                }

            } finally {
                if (isMounted) {
                    setLoadingActivity(false);
                }
            }
        };

        loadActivity();

        return () => {
            isMounted = false;
        };
    }, [isLoading, activityId]);

    // ==================================================
    // 6. CẬP NHẬT DỮ LIỆU BIỂU MẪU
    // ==================================================

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

    // ==================================================
    // 7. KIỂM TRA DỮ LIỆU
    // ==================================================

    const validateForm = () => {
        const newErrors = {};

        if (!form.activityName.trim()) {
            newErrors.activityName =
                "Vui lòng nhập tên hoạt động.";
        }

        if (!form.location.trim()) {
            newErrors.location =
                "Vui lòng nhập địa điểm tổ chức.";
        }

        if (!form.registrationStart) {
            newErrors.registrationStart =
                "Vui lòng chọn thời gian bắt đầu đăng ký.";
        }

        if (!form.registrationEnd) {
            newErrors.registrationEnd =
                "Vui lòng chọn thời gian kết thúc đăng ký.";
        }

        if (!form.activityStart) {
            newErrors.activityStart =
                "Vui lòng chọn thời gian bắt đầu hoạt động.";
        }

        if (!form.activityEnd) {
            newErrors.activityEnd =
                "Vui lòng chọn thời gian kết thúc hoạt động.";
        }

        // Kiểm tra thời gian đăng ký

        if (
            form.registrationStart &&
            form.registrationEnd &&
            new Date(form.registrationStart) >=
                new Date(form.registrationEnd)
        ) {
            newErrors.registrationEnd =
                "Thời gian kết thúc đăng ký phải sau thời gian bắt đầu.";
        }

        // Kiểm tra thời gian đăng ký và hoạt động

        if (
            form.registrationEnd &&
            form.activityStart &&
            new Date(form.registrationEnd) >
                new Date(form.activityStart)
        ) {
            newErrors.activityStart =
                "Hoạt động phải bắt đầu sau khi kết thúc đăng ký.";
        }

        // Kiểm tra thời gian diễn ra hoạt động

        if (
            form.activityStart &&
            form.activityEnd &&
            new Date(form.activityStart) >=
                new Date(form.activityEnd)
        ) {
            newErrors.activityEnd =
                "Thời gian kết thúc hoạt động phải sau thời gian bắt đầu.";
        }

        // Kiểm tra số lượng người tham gia

        if (
            form.maxParticipants !== "" &&
            (
                !Number.isInteger(Number(form.maxParticipants)) ||
                Number(form.maxParticipants) <= 0
            )
        ) {
            newErrors.maxParticipants =
                "Số lượng tham gia phải là số nguyên lớn hơn 0.";
        }

        // Kiểm tra điểm dự kiến

        if (
            !Number.isInteger(Number(form.expectedPoints)) ||
            Number(form.expectedPoints) < 0
        ) {
            newErrors.expectedPoints =
                "Điểm dự kiến phải là số nguyên không âm.";
        }

        // Kiểm tra hình thức đăng ký

        if (
            !["OPEN", "APPROVAL"].includes(form.registrationMode)
        ) {
            newErrors.registrationMode =
                "Hình thức đăng ký không hợp lệ.";
        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    // ==================================================
    // 8. LƯU BẢN NHÁP HOẶC LƯU VÀ CÔNG BỐ
    // ==================================================

    const handleSubmit = async (event, type) => {
        event.preventDefault();

        if (submitting || loadingActivity) return;

        setErrorMessage("");
        setSuccessMessage("");

        // Kiểm tra dữ liệu trước khi lưu

        if (!validateForm()) {
            setErrorMessage(
                "Vui lòng kiểm tra lại thông tin đã nhập."
            );

            return;
        }

        setSubmitting(true);
        setSubmitType(type);

        try {
            const payload = {
                activityName: form.activityName.trim(),

                description:
                    form.description.trim() || null,

                location: form.location.trim(),

                registrationStart: form.registrationStart,
                registrationEnd: form.registrationEnd,

                activityStart: form.activityStart,
                activityEnd: form.activityEnd,

                maxParticipants:
                    form.maxParticipants === ""
                        ? null
                        : Number(form.maxParticipants),

                expectedPoints: Number(form.expectedPoints),

                registrationMode: form.registrationMode
            };

            // ------------------------------------------
            // BƯỚC 1: CẬP NHẬT NỘI DUNG BẢN NHÁP
            // ------------------------------------------

            await sendRequest(
                `/activities/${activityId}`,
                "PUT",
                payload
            );

            // ------------------------------------------
            // BƯỚC 2: CHỈ LƯU BẢN NHÁP
            // ------------------------------------------

            if (type === "draft") {
                setSuccessMessage(
                    "Cập nhật bản nháp thành công. Hoạt động vẫn chưa được công bố."
                );

                return;
            }

            // ------------------------------------------
            // BƯỚC 3: CÔNG BỐ HOẠT ĐỘNG
            // ------------------------------------------

            await sendRequest(
                `/activities/${activityId}/publish`,
                "PATCH"
            );

            navigate("/organizer/history", {
                state: {
                    successMessage:
                        "Cập nhật và công bố hoạt động thành công."
                }
            });

        } catch (error) {
            setErrorMessage(
                error.message || "Không thể cập nhật hoạt động."
            );

        } finally {
            setSubmitting(false);
            setSubmitType("");
        }
    };

    // ==================================================
    // 9. GIAO DIỆN ĐANG TẢI
    // ==================================================

    if (isLoading || loadingActivity) {
        return (
            <div className="edit-activity-page">
                <Header />

                <div className="edit-activity-loading">
                    <div
                        className="spinner-border text-primary"
                        role="status"
                    />

                    <p>Đang tải thông tin bản nháp...</p>
                </div>

                <Footer />
            </div>
        );
    }

    // ==================================================
    // 10. GIAO DIỆN KHI CÓ LỖI TẢI DỮ LIỆU
    // ==================================================

    if (errorMessage && !form.activityName) {
        return (
            <div className="edit-activity-page">
                <Header />

                <main className="edit-activity-container">

                    <div className="edit-activity-top-actions">
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() =>
                                navigate("/organizer/history")
                            }
                        >
                            <i className="bi bi-arrow-left me-2" />
                            Quay lại danh sách hoạt động
                        </button>
                    </div>

                    <div
                        ref={notificationRef}
                        className="alert alert-danger"
                        role="alert"
                    >
                        <i className="bi bi-exclamation-circle me-2" />
                        {errorMessage}
                    </div>

                </main>

                <Footer />
            </div>
        );
    }

    // ==================================================
    // 11. GIAO DIỆN CHÍNH
    // ==================================================

    return (
        <div className="edit-activity-page">
            <Header />

            <main className="edit-activity-container">

                {/* NÚT QUAY LẠI Ở ĐẦU TRANG */}

                <div className="edit-activity-top-actions">
                    <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() =>
                            navigate("/organizer/history")
                        }
                        disabled={submitting}
                    >
                        <i className="bi bi-arrow-left me-2" />
                        Quay lại danh sách hoạt động
                    </button>
                </div>

                {/* TIÊU ĐỀ */}

                <div className="edit-activity-heading">
                    <div>
                        <span className="edit-activity-subtitle">
                            QUẢN LÝ HOẠT ĐỘNG
                        </span>

                        <h2>Chỉnh sửa bản nháp</h2>

                        <p>
                            Cập nhật thông tin hoạt động trước khi công bố
                            cho sinh viên.
                        </p>
                    </div>

                    <span className="badge bg-warning text-dark">
                        <i className="bi bi-file-earmark me-1" />
                        Bản nháp
                    </span>
                </div>

                {/* KHU VỰC THÔNG BÁO */}

                <div
                    ref={notificationRef}
                    className="edit-activity-notifications"
                    aria-live="polite"
                >
                    {errorMessage && (
                        <div
                            className="alert alert-danger"
                            role="alert"
                        >
                            <i className="bi bi-exclamation-circle me-2" />
                            {errorMessage}
                        </div>
                    )}

                    {successMessage && (
                        <div
                            className="alert alert-success"
                            role="status"
                        >
                            <i className="bi bi-check-circle me-2" />
                            {successMessage}
                        </div>
                    )}
                </div>

                {/* BIỂU MẪU CHỈNH SỬA */}

                <form
                    className="edit-activity-form"
                    onSubmit={(event) =>
                        handleSubmit(event, "draft")
                    }
                >

                    {/* THÔNG TIN CHUNG */}

                    <section className="edit-activity-section">
                        <div className="edit-section-heading">
                            <i className="bi bi-info-circle" />
                            <h5>Thông tin chung</h5>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">
                                Tên hoạt động <span>*</span>
                            </label>

                            <input
                                type="text"
                                name="activityName"
                                className={`form-control ${
                                    errors.activityName
                                        ? "is-invalid"
                                        : ""
                                }`}
                                value={form.activityName}
                                onChange={handleChange}
                                placeholder="Nhập tên hoạt động"
                            />

                            {errors.activityName && (
                                <div className="invalid-feedback">
                                    {errors.activityName}
                                </div>
                            )}
                        </div>

                        <div className="mb-3">
                            <label className="form-label">
                                Địa điểm tổ chức <span>*</span>
                            </label>

                            <input
                                type="text"
                                name="location"
                                className={`form-control ${
                                    errors.location
                                        ? "is-invalid"
                                        : ""
                                }`}
                                value={form.location}
                                onChange={handleChange}
                                placeholder="Nhập địa điểm tổ chức"
                            />

                            {errors.location && (
                                <div className="invalid-feedback">
                                    {errors.location}
                                </div>
                            )}
                        </div>

                        <div className="mb-3">
                            <label className="form-label">
                                Mô tả hoạt động
                            </label>

                            <textarea
                                name="description"
                                className="form-control"
                                rows="5"
                                value={form.description}
                                onChange={handleChange}
                                placeholder="Nhập nội dung và mục tiêu hoạt động..."
                            />
                        </div>
                    </section>

                    {/* THỜI GIAN */}

                    <section className="edit-activity-section">
                        <div className="edit-section-heading">
                            <i className="bi bi-calendar-event" />
                            <h5>Thời gian tổ chức và đăng ký</h5>
                        </div>

                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">
                                    Bắt đầu đăng ký <span>*</span>
                                </label>

                                <input
                                    type="datetime-local"
                                    name="registrationStart"
                                    className={`form-control ${
                                        errors.registrationStart
                                            ? "is-invalid"
                                            : ""
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

                            <div className="col-md-6 mb-3">
                                <label className="form-label">
                                    Kết thúc đăng ký <span>*</span>
                                </label>

                                <input
                                    type="datetime-local"
                                    name="registrationEnd"
                                    className={`form-control ${
                                        errors.registrationEnd
                                            ? "is-invalid"
                                            : ""
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

                            <div className="col-md-6 mb-3">
                                <label className="form-label">
                                    Bắt đầu hoạt động <span>*</span>
                                </label>

                                <input
                                    type="datetime-local"
                                    name="activityStart"
                                    className={`form-control ${
                                        errors.activityStart
                                            ? "is-invalid"
                                            : ""
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

                            <div className="col-md-6 mb-3">
                                <label className="form-label">
                                    Kết thúc hoạt động <span>*</span>
                                </label>

                                <input
                                    type="datetime-local"
                                    name="activityEnd"
                                    className={`form-control ${
                                        errors.activityEnd
                                            ? "is-invalid"
                                            : ""
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

                    {/* SỐ LƯỢNG VÀ ĐIỂM */}

                    <section className="edit-activity-section">
                        <div className="edit-section-heading">
                            <i className="bi bi-people" />
                            <h5>Thông tin tham gia</h5>
                        </div>

                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">
                                    Số lượng người tham gia tối đa
                                </label>

                                <input
                                    type="number"
                                    name="maxParticipants"
                                    min="1"
                                    className={`form-control ${
                                        errors.maxParticipants
                                            ? "is-invalid"
                                            : ""
                                    }`}
                                    value={form.maxParticipants}
                                    onChange={handleChange}
                                    placeholder="Để trống nếu không giới hạn"
                                />

                                {errors.maxParticipants && (
                                    <div className="invalid-feedback">
                                        {errors.maxParticipants}
                                    </div>
                                )}
                            </div>

                            <div className="col-md-6 mb-3">
                                <label className="form-label">
                                    Điểm phục vụ cộng đồng dự kiến
                                </label>

                                <input
                                    type="number"
                                    name="expectedPoints"
                                    min="0"
                                    step="1"
                                    className={`form-control ${
                                        errors.expectedPoints
                                            ? "is-invalid"
                                            : ""
                                    }`}
                                    value={form.expectedPoints}
                                    onChange={handleChange}
                                />

                                {errors.expectedPoints && (
                                    <div className="invalid-feedback">
                                        {errors.expectedPoints}
                                    </div>
                                )}
                            </div>

                            <div className="col-md-6 mb-3">
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
                                        Đăng ký trực tiếp
                                    </option>

                                    <option value="APPROVAL">
                                        Đăng ký chờ phê duyệt
                                    </option>
                                </select>

                                {errors.registrationMode && (
                                    <div className="text-danger small mt-1">
                                        {errors.registrationMode}
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* CÁC NÚT THAO TÁC Ở GÓC DƯỚI BÊN PHẢI */}

                    <div
                        className="edit-activity-actions"
                        style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            alignItems: "center",
                            width: "100%",
                            marginTop: "24px",
                            paddingTop: "20px",
                            gap: "12px"
                        }}
                    >
                        <div
                            className="edit-activity-action-group"
                            style={{
                                display: "flex",
                                justifyContent: "flex-end",
                                alignItems: "center",
                                flexWrap: "wrap",
                                gap: "12px"
                            }}
                        >
                            {/* LƯU BẢN NHÁP */}

                            <button
                                type="submit"
                                className="btn btn-outline-primary"
                                disabled={submitting}
                            >
                                {submitting && submitType === "draft" ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" />
                                        Đang lưu...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-save me-2" />
                                        Lưu bản nháp
                                    </>
                                )}
                            </button>

                            {/* LƯU VÀ CÔNG BỐ */}

                            <button
                                type="button"
                                className="btn btn-primary"
                                disabled={submitting}
                                onClick={(event) =>
                                    handleSubmit(event, "publish")
                                }
                            >
                                {submitting && submitType === "publish" ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" />
                                        Đang công bố...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-cloud-upload me-2" />
                                        Lưu và công bố
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                </form>
            </main>

            <Footer />
        </div>
    );
}

export default EditActivityOrganizer;
    