
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import authService from "../services/authService";

import Header from "../components/Header Student";
import Footer from "../components/Footer.jsx";

import "../styles/styles-dashboard.css";
import "../styles/styles-student-profile.css";

// =====================================
// CẤU HÌNH ĐƯỜNG DẪN ẢNH
// =====================================

const API_ORIGIN = (
    import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/api\/?$/, "");

const getAvatarUrl = (url) => {
    if (!url) return "";

    if (/^https?:\/\//i.test(url)) {
        return url;
    }

    return `${API_ORIGIN}${url.startsWith("/") ? url : `/${url}`}`;
};

// =====================================
// COMPONENT STUDENT PROFILE
// =====================================

function StudentProfile() {
    const navigate = useNavigate();

    const { user, logout, setUser } = useAuth();

    // =====================================
    // STATE
    // =====================================

    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

    const [saved, setSaved] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const [avatar, setAvatar] = useState("");

    const [profile, setProfile] = useState({
        fullName: "",
        studentId: "",
        email: "",
        faculty: "",
        className: "",
        phone: "",
        dateOfBirth: "",
        gender: "",
        address: "",
        joinDate: "",
        status: "",
    });

    // =====================================
    // ĐỒNG BỘ DỮ LIỆU TỪ AUTH CONTEXT
    // =====================================

    useEffect(() => {
        if (!user) return;

        const student = user.student || {};

        setProfile({
            fullName: user.fullName || "",
            studentId: student.studentCode || "",
            email: user.email || "",
            faculty: student.facultyName || "",
            className: student.className || "",

            phone: user.phone || "",

            dateOfBirth: user.dateOfBirth
                ? String(user.dateOfBirth).slice(0, 10)
                : "",

            gender: user.gender || "",
            address: user.address || "",

            joinDate: user.createdAt
                ? new Date(user.createdAt).toLocaleDateString("vi-VN")
                : "",

            status: user.status || "",
        });

        // Đồng bộ ảnh đại diện từ Backend
        setAvatar(
            user.avatarUrl
                ? getAvatarUrl(user.avatarUrl)
                : ""
        );

        setIsEditing(false);
        setSaved(false);
        setErrorMessage("");

    }, [user]);

    // =====================================
    // XỬ LÝ ĐĂNG XUẤT
    // =====================================

    const handleLogout = () => {
        setShowLogoutModal(true);
    };

    const handleCancelLogout = () => {
        if (isLoggingOut) return;

        setShowLogoutModal(false);
    };

    const confirmLogout = async () => {
        if (isLoggingOut) return;

        try {
            setIsLoggingOut(true);

            await logout();

            setShowLogoutModal(false);

            navigate("/", { replace: true });

        } catch (error) {
            console.error("Lỗi đăng xuất:", error);

            setErrorMessage(
                "Không thể đăng xuất. Vui lòng thử lại."
            );

        } finally {
            setIsLoggingOut(false);
        }
    };

    // =====================================
    // BẬT CHẾ ĐỘ CHỈNH SỬA
    // =====================================

    const handleEdit = () => {
        setIsEditing(true);
        setSaved(false);
        setErrorMessage("");
    };

    // =====================================
    // HỦY CHỈNH SỬA
    // =====================================

    const handleCancelEdit = () => {
        if (!user) return;

        setProfile((previous) => ({
            ...previous,

            phone: user.phone || "",

            dateOfBirth: user.dateOfBirth
                ? String(user.dateOfBirth).slice(0, 10)
                : "",

            gender: user.gender || "",
            address: user.address || "",
        }));

        setIsEditing(false);
        setSaved(false);
        setErrorMessage("");
    };

    // =====================================
    // XỬ LÝ THAY ĐỔI THÔNG TIN
    // =====================================

    const handleChange = (e) => {
        const { name, value } = e.target;

        setProfile((previous) => ({
            ...previous,
            [name]: value,
        }));

        setSaved(false);
        setErrorMessage("");
    };

    // =====================================
    // KIỂM TRA DỮ LIỆU
    // =====================================

    const validateProfile = () => {
        const phone = profile.phone.trim();

        if (phone && !/^(0|\+84)[0-9]{9,10}$/.test(phone)) {
            return "Số điện thoại không hợp lệ.";
        }

        if (profile.dateOfBirth) {
            const date = new Date(
                `${profile.dateOfBirth}T00:00:00`
            );

            if (
                Number.isNaN(date.getTime()) ||
                date > new Date()
            ) {
                return "Ngày sinh không hợp lệ.";
            }
        }

        if (profile.address.length > 255) {
            return "Địa chỉ không được vượt quá 255 ký tự.";
        }

        if (
            profile.gender &&
            !["MALE", "FEMALE", "OTHER"].includes(profile.gender)
        ) {
            return "Giới tính không hợp lệ.";
        }

        return "";
    };

    // =====================================
    // LƯU THÔNG TIN CÁ NHÂN
    // =====================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isEditing || isSaving) return;

        const validationError = validateProfile();

        if (validationError) {
            setErrorMessage(validationError);
            return;
        }

        try {
            setIsSaving(true);
            setErrorMessage("");
            setSaved(false);

            const payload = {
                phone: profile.phone.trim(),
                dateOfBirth: profile.dateOfBirth || null,
                gender: profile.gender || null,
                address: profile.address.trim(),
            };

            // Cập nhật thông tin cá nhân
            await authService.updateProfile(payload);

            // Lấy lại thông tin mới nhất từ Backend
            const updatedUser = await authService.getCurrentUser();

            // Cập nhật AuthContext
            setUser(updatedUser);

            // Cập nhật localStorage
            localStorage.setItem(
                "currentUser",
                JSON.stringify(updatedUser)
            );

            setIsEditing(false);
            setSaved(true);

        } catch (error) {
            console.error("Lỗi cập nhật hồ sơ:", error);

            setErrorMessage(
                error.response?.data?.message ||
                error.message ||
                "Không thể cập nhật thông tin. Vui lòng thử lại."
            );

        } finally {
            setIsSaving(false);
        }
    };

    // =====================================
    // XỬ LÝ ẢNH ĐẠI DIỆN
    // =====================================

    const handleAvatarChange = async (e) => {
        const file = e.target.files?.[0];

        if (!file) return;

        // Kiểm tra định dạng ảnh
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
        ];

        if (!allowedTypes.includes(file.type)) {
            alert("Chỉ chấp nhận ảnh JPG, PNG, WEBP hoặc GIF.");

            e.target.value = "";
            return;
        }

        // Kiểm tra dung lượng ảnh
        if (file.size > 5 * 1024 * 1024) {
            alert("Ảnh đại diện không được vượt quá 5 MB.");

            e.target.value = "";
            return;
        }

        try {
            setIsUploadingAvatar(true);
            setErrorMessage("");

            // Tạo FormData
            const formData = new FormData();

            formData.append("avatar", file);

            // Gửi ảnh lên Backend
            const updatedUser = await authService.updateAvatar(formData);

            if (!updatedUser || !updatedUser.avatarUrl) {
                throw new Error(
                    "Máy chủ chưa trả về đường dẫn ảnh đại diện."
                );
            }

            // Cập nhật AuthContext
            setUser(updatedUser);

            // Cập nhật localStorage
            localStorage.setItem(
                "currentUser",
                JSON.stringify(updatedUser)
            );

            // Hiển thị ảnh đã lưu trên Backend
            setAvatar(getAvatarUrl(updatedUser.avatarUrl));

            alert("Cập nhật ảnh đại diện thành công!");

        } catch (error) {
            console.error("Lỗi cập nhật ảnh đại diện:", error);

            alert(
                error.response?.data?.message ||
                error.message ||
                "Không thể cập nhật ảnh đại diện."
            );

        } finally {
            setIsUploadingAvatar(false);

            // Cho phép chọn lại cùng một file
            e.target.value = "";
        }
    };

    // =====================================
    // HIỂN THỊ GIỚI TÍNH
    // =====================================

    const getGenderLabel = (gender) => {
        switch (gender) {
            case "MALE":
                return "Nam";

            case "FEMALE":
                return "Nữ";

            case "OTHER":
                return "Khác";

            default:
                return "";
        }
    };

    // =====================================
    // GIAO DIỆN
    // =====================================

    return (
        <div className="dashboard-page">

            <Header role="STUDENT" />

            <main className="dashboard-container container-fluid">

                <div className="student-profile-page">

                    <div className="profile-page-heading">
                        <div>
                            <h2>Thông tin cá nhân</h2>

                            <p>
                                Quản lý hồ sơ và thông tin tài khoản
                                sinh viên của bạn.
                            </p>
                        </div>

                        <div className="profile-heading-icon">
                            <i className="bi bi-person-vcard"></i>
                        </div>
                    </div>

                    <div className="profile-layout">

                        {/* CỘT TRÁI */}

                        <aside className="profile-sidebar">

                            <div className="profile-avatar-card">

                                <div className="profile-avatar">

                                    {avatar ? (
                                        <img
                                            src={avatar}
                                            alt="Ảnh đại diện sinh viên"
                                            onError={() => setAvatar("")}
                                        />
                                    ) : (
                                        <i className="bi bi-person-fill"></i>
                                    )}

                                </div>

                                <h4>
                                    {profile.fullName || "Chưa cập nhật họ tên"}
                                </h4>

                                <p className="profile-student-id">
                                    MSSV: {profile.studentId || "Chưa cập nhật"}
                                </p>

                                <label
                                    className="btn-upload-avatar"
                                    htmlFor="avatar-upload"
                                    style={{
                                        opacity: isUploadingAvatar ? 0.6 : 1,
                                        pointerEvents: isUploadingAvatar
                                            ? "none"
                                            : "auto",
                                    }}
                                >
                                    <i className="bi bi-camera"></i>

                                    {isUploadingAvatar
                                        ? "Đang tải ảnh lên..."
                                        : "Thay đổi ảnh đại diện"}
                                </label>

                                <input
                                    id="avatar-upload"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    hidden
                                    disabled={isUploadingAvatar}
                                    onChange={handleAvatarChange}
                                />

                                <small>
                                    Định dạng ảnh, tối đa 5 MB
                                </small>

                            </div>

                            <div className="profile-status-card">

                                <div className="profile-status-heading">
                                    <i className="bi bi-shield-check"></i>
                                    Trạng thái tài khoản
                                </div>

                                <div className="profile-status-value">
                                    <span className="status-dot"></span>

                                    {profile.status === "ACTIVE"
                                        ? "Đang hoạt động"
                                        : profile.status || "Chưa xác định"}
                                </div>

                                <p>
                                    Tài khoản sinh viên được sử dụng
                                    để đăng ký và theo dõi các hoạt động
                                    phục vụ cộng đồng.
                                </p>

                            </div>

                            <div className="profile-help-card">

                                <i className="bi bi-info-circle"></i>

                                <div>
                                    <strong>Lưu ý</strong>

                                    <p>
                                        MSSV, email, lớp và đơn vị đào tạo
                                        được quản lý bởi hệ thống.
                                    </p>
                                </div>

                            </div>

                        </aside>

                        {/* CỘT PHẢI */}

                        <section className="profile-main">

                            <form onSubmit={handleSubmit}>

                                {/* THÔNG TIN SINH VIÊN */}

                                <div className="profile-section">

                                    <div className="profile-section-heading">

                                        <div className="profile-section-icon blue">
                                            <i className="bi bi-mortarboard"></i>
                                        </div>

                                        <div>
                                            <h5>Thông tin sinh viên</h5>

                                            <p>
                                                Thông tin định danh và đơn vị đào tạo
                                            </p>
                                        </div>

                                    </div>

                                    <div className="profile-form-grid">

                                        <div className="profile-field">
                                            <label>Họ và tên sinh viên</label>

                                            <div className="profile-input-wrap">
                                                <i className="bi bi-person"></i>

                                                <input
                                                    value={profile.fullName}
                                                    placeholder="Chưa có dữ liệu"
                                                    readOnly
                                                />
                                            </div>
                                        </div>

                                        <div className="profile-field">
                                            <label>Mã số sinh viên (MSSV)</label>

                                            <div className="profile-input-wrap">
                                                <i className="bi bi-credit-card-2-front"></i>

                                                <input
                                                    value={profile.studentId}
                                                    placeholder="Chưa có dữ liệu"
                                                    readOnly
                                                />
                                            </div>
                                        </div>

                                        <div className="profile-field">
                                            <label>Email sinh viên</label>

                                            <div className="profile-input-wrap">
                                                <i className="bi bi-envelope"></i>

                                                <input
                                                    value={profile.email}
                                                    placeholder="Chưa có dữ liệu"
                                                    readOnly
                                                />
                                            </div>
                                        </div>

                                        <div className="profile-field">
                                            <label>Đơn vị đào tạo trực thuộc</label>

                                            <div className="profile-input-wrap">
                                                <i className="bi bi-building"></i>

                                                <input
                                                    value={profile.faculty}
                                                    placeholder="Chưa có dữ liệu"
                                                    readOnly
                                                />
                                            </div>
                                        </div>

                                        <div className="profile-field">
                                            <label>Lớp</label>

                                            <div className="profile-input-wrap">
                                                <i className="bi bi-people"></i>

                                                <input
                                                    value={profile.className}
                                                    placeholder="Chưa có dữ liệu"
                                                    readOnly
                                                />
                                            </div>
                                        </div>

                                        <div className="profile-field">
                                            <label>Ngày tham gia hệ thống</label>

                                            <div className="profile-input-wrap">
                                                <i className="bi bi-calendar-check"></i>

                                                <input
                                                    value={profile.joinDate}
                                                    placeholder="Chưa có dữ liệu"
                                                    readOnly
                                                />
                                            </div>
                                        </div>

                                    </div>
                                </div>

                                {/* THÔNG TIN CÁ NHÂN */}

                                <div className="profile-section">

                                    <div className="profile-section-heading">

                                        <div className="profile-section-icon green">
                                            <i className="bi bi-person-lines-fill"></i>
                                        </div>

                                        <div>
                                            <h5>Thông tin cá nhân</h5>

                                            <p>
                                                {isEditing
                                                    ? "Đang chỉnh sửa thông tin cá nhân"
                                                    : "Thông tin liên hệ của bạn"}
                                            </p>
                                        </div>

                                    </div>

                                    <div className="profile-form-grid">

                                        <div className="profile-field">
                                            <label>Số điện thoại</label>

                                            <div className="profile-input-wrap">
                                                <i className="bi bi-telephone"></i>

                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={profile.phone}
                                                    onChange={handleChange}
                                                    placeholder="Nhập số điện thoại"
                                                    readOnly={!isEditing}
                                                />
                                            </div>
                                        </div>

                                        <div className="profile-field">
                                            <label>Ngày sinh</label>

                                            <div className="profile-input-wrap">
                                                <i className="bi bi-calendar3"></i>

                                                {isEditing ? (
                                                    <input
                                                        type="date"
                                                        name="dateOfBirth"
                                                        value={profile.dateOfBirth}
                                                        onChange={handleChange}
                                                    />
                                                ) : (
                                                    <input
                                                        value={
                                                            profile.dateOfBirth
                                                                ? new Date(
                                                                    `${profile.dateOfBirth}T00:00:00`
                                                                ).toLocaleDateString("vi-VN")
                                                                : ""
                                                        }
                                                        placeholder="Chưa cập nhật"
                                                        readOnly
                                                    />
                                                )}

                                            </div>
                                        </div>

                                        <div className="profile-field">
                                            <label>Giới tính</label>

                                            <div className="profile-input-wrap">
                                                <i className="bi bi-gender-ambiguous"></i>

                                                {isEditing ? (
                                                    <select
                                                        name="gender"
                                                        value={profile.gender}
                                                        onChange={handleChange}
                                                    >
                                                        <option value="">
                                                            Chọn giới tính
                                                        </option>

                                                        <option value="MALE">
                                                            Nam
                                                        </option>

                                                        <option value="FEMALE">
                                                            Nữ
                                                        </option>

                                                        <option value="OTHER">
                                                            Khác
                                                        </option>
                                                    </select>
                                                ) : (
                                                    <input
                                                        value={getGenderLabel(profile.gender)}
                                                        placeholder="Chưa cập nhật"
                                                        readOnly
                                                    />
                                                )}

                                            </div>
                                        </div>

                                        <div className="profile-field full-width">
                                            <label>Địa chỉ liên hệ</label>

                                            <div className="profile-input-wrap">
                                                <i className="bi bi-geo-alt"></i>

                                                <input
                                                    type="text"
                                                    name="address"
                                                    value={profile.address}
                                                    onChange={handleChange}
                                                    placeholder="Nhập địa chỉ liên hệ"
                                                    readOnly={!isEditing}
                                                />
                                            </div>
                                        </div>

                                    </div>
                                </div>

                                {/* THÔNG BÁO */}

                                {errorMessage && (
                                    <div className="alert alert-danger mt-3">
                                        <i className="bi bi-exclamation-circle me-2"></i>
                                        {errorMessage}
                                    </div>
                                )}

                                {saved && (
                                    <div className="alert alert-success mt-3">
                                        <i className="bi bi-check-circle-fill me-2"></i>
                                        Cập nhật thông tin thành công.
                                    </div>
                                )}

                                {/* CÁC NÚT */}

                                <div className="profile-form-actions">

                                    {!isEditing ? (
                                        <button
                                            type="button"
                                            className="btn-profile-save"
                                            onClick={handleEdit}
                                        >
                                            <i className="bi bi-pencil-square"></i>
                                            Chỉnh sửa thông tin cá nhân
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                className="btn-profile-reset"
                                                onClick={handleCancelEdit}
                                                disabled={isSaving}
                                            >
                                                <i className="bi bi-x-circle"></i>
                                                Hủy chỉnh sửa
                                            </button>

                                            <button
                                                type="submit"
                                                className="btn-profile-save"
                                                disabled={isSaving}
                                            >
                                                <i className="bi bi-floppy"></i>

                                                {isSaving
                                                    ? "Đang lưu..."
                                                    : "Lưu thay đổi"}
                                            </button>
                                        </>
                                    )}

                                    <button
                                        type="button"
                                        className="btn-profile-logout"
                                        onClick={handleLogout}
                                    >
                                        <i className="bi bi-box-arrow-right"></i>
                                        Đăng xuất
                                    </button>

                                </div>

                            </form>
                        </section>

                    </div>
                </div>
            </main>

            {/* MODAL ĐĂNG XUẤT */}

            {showLogoutModal && (
                <div
                    className="logout-modal-overlay"
                    onClick={handleCancelLogout}
                >
                    <div
                        className="logout-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="logout-modal-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="logout-modal-icon">
                            <i className="bi bi-box-arrow-right"></i>
                        </div>

                        <h3 id="logout-modal-title">
                            Xác nhận đăng xuất
                        </h3>

                        <p>
                            Bạn có chắc chắn muốn đăng xuất khỏi
                            tài khoản của mình không?
                        </p>

                        <div className="logout-modal-actions">

                            <button
                                type="button"
                                className="btn-logout-cancel"
                                disabled={isLoggingOut}
                                onClick={handleCancelLogout}
                            >
                                Hủy bỏ
                            </button>

                            <button
                                type="button"
                                className="btn-logout-confirm"
                                disabled={isLoggingOut}
                                onClick={confirmLogout}
                            >
                                {isLoggingOut ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm"></span>
                                        Đang đăng xuất...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-box-arrow-right"></i>
                                        Đăng xuất
                                    </>
                                )}
                            </button>

                        </div>
                    </div>
                </div>
            )}

            <Footer />

        </div>
    );
}

export default StudentProfile;
