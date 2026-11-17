
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

import Header from "../components/Header Student Profile.jsx";
import Footer from "../components/Footer.jsx";

import "../styles/styles-dashboard.css";
import "../styles/styles-student-profile.css";

function StudentProfile() {
    const navigate = useNavigate();
    const { logout } = useAuth();

    // =====================================
    // STATE
    // =====================================

    // Trạng thái hộp thoại đăng xuất
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    // Trạng thái đang đăng xuất
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // Ảnh đại diện
    const [avatar, setAvatar] = useState("");

    // Trạng thái lưu thông tin
    const [saved, setSaved] = useState(false);

    // Thông tin hồ sơ sinh viên
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
    });

    // =====================================
    // XỬ LÝ ĐĂNG XUẤT
    // =====================================

    // Chỉ mở hộp thoại, chưa đăng xuất
    const handleLogout = () => {
        setShowLogoutModal(true);
    };

    // Đóng hộp thoại
    const handleCancelLogout = () => {
        if (isLoggingOut) return;

        setShowLogoutModal(false);
    };

    // Xác nhận đăng xuất
    const confirmLogout = async () => {
        if (isLoggingOut) return;

        try {
            setIsLoggingOut(true);

            await logout();

            setShowLogoutModal(false);

            // Chuyển về trang chủ
            navigate("/", { replace: true });

        } catch (error) {
            console.error("Lỗi đăng xuất:", error);

        } finally {
            setIsLoggingOut(false);
        }
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
    };

    // =====================================
    // XỬ LÝ ẢNH ĐẠI DIỆN
    // =====================================

    const handleAvatarChange = (e) => {
        const file = e.target.files?.[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Vui lòng chọn tệp hình ảnh.");
            e.target.value = "";
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert("Ảnh đại diện không được vượt quá 5 MB.");
            e.target.value = "";
            return;
        }

        const imageUrl = URL.createObjectURL(file);

        setAvatar((previous) => {
            if (previous) {
                URL.revokeObjectURL(previous);
            }

            return imageUrl;
        });
    };

    // =====================================
    // XỬ LÝ LƯU THÔNG TIN
    // =====================================

    const handleSubmit = (e) => {
        e.preventDefault();

        // Hiện tại chỉ cập nhật giao diện Frontend.
        // Sau này sẽ kết nối API cập nhật hồ sơ sinh viên.
        setSaved(true);
    };

    // =====================================
    // XÓA THÔNG TIN CÁ NHÂN ĐÃ NHẬP
    // =====================================

    const handleReset = () => {
        setProfile((previous) => ({
            ...previous,
            phone: "",
            dateOfBirth: "",
            gender: "",
            address: "",
        }));

        setSaved(false);
    };

    // =====================================
    // GIAO DIỆN
    // =====================================

    return (
        <div className="dashboard-page">

            <Header role="STUDENT" />

            <main className="dashboard-container container-fluid">

                <div className="student-profile-page">

                    {/* =====================================
                        TIÊU ĐỀ
                    ===================================== */}

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

                    {/* =====================================
                        KHU VỰC HỒ SƠ
                    ===================================== */}

                    <div className="profile-layout">

                        {/* =====================================
                            CỘT TRÁI: ẢNH VÀ THÔNG TIN CƠ BẢN
                        ===================================== */}

                        <aside className="profile-sidebar">

                            {/* Thẻ ảnh đại diện */}

                            <div className="profile-avatar-card">

                                <div className="profile-avatar">

                                    {avatar ? (
                                        <img
                                            src={avatar}
                                            alt="Ảnh đại diện sinh viên"
                                        />
                                    ) : (
                                        <i className="bi bi-person-fill"></i>
                                    )}

                                </div>

                                <h4>
                                    {profile.fullName ||
                                        "Chưa cập nhật họ tên"}
                                </h4>

                                <p className="profile-student-id">
                                    {profile.studentId ||
                                        "MSSV: Chưa cập nhật"}
                                </p>

                                <label
                                    className="btn-upload-avatar"
                                    htmlFor="avatar-upload"
                                >
                                    <i className="bi bi-camera"></i>
                                    Thay đổi ảnh đại diện
                                </label>

                                <input
                                    id="avatar-upload"
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    onChange={handleAvatarChange}
                                />

                                <small>
                                    Định dạng ảnh, tối đa 5 MB
                                </small>

                            </div>

                            {/* Trạng thái tài khoản */}

                            <div className="profile-status-card">

                                <div className="profile-status-heading">
                                    <i className="bi bi-shield-check"></i>
                                    Trạng thái tài khoản
                                </div>

                                <div className="profile-status-value">
                                    <span className="status-dot"></span>
                                    Đang hoạt động
                                </div>

                                <p>
                                    Tài khoản sinh viên được sử dụng
                                    để đăng ký và theo dõi các hoạt động
                                    phục vụ cộng đồng.
                                </p>

                            </div>

                            {/* Lưu ý */}

                            <div className="profile-help-card">

                                <i className="bi bi-info-circle"></i>

                                <div>
                                    <strong>Lưu ý</strong>

                                    <p>
                                        MSSV, email sinh viên và đơn vị
                                        đào tạo được quản lý bởi hệ thống.
                                    </p>
                                </div>

                            </div>

                        </aside>

                        {/* =====================================
                            CỘT PHẢI: THÔNG TIN
                        ===================================== */}

                        <section className="profile-main">

                            <form onSubmit={handleSubmit}>

                                {/* =====================================
                                    THÔNG TIN SINH VIÊN
                                ===================================== */}

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

                                        {/* Họ và tên */}

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

                                        {/* MSSV */}

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

                                        {/* Email */}

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

                                        {/* Đơn vị đào tạo */}

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

                                        {/* Lớp */}

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

                                        {/* Ngày tham gia */}

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

                                {/* =====================================
                                    THÔNG TIN CÁ NHÂN
                                ===================================== */}

                                <div className="profile-section">

                                    <div className="profile-section-heading">

                                        <div className="profile-section-icon green">
                                            <i className="bi bi-person-lines-fill"></i>
                                        </div>

                                        <div>
                                            <h5>Thông tin cá nhân</h5>

                                            <p>
                                                Cập nhật thông tin liên hệ của bạn
                                            </p>
                                        </div>

                                    </div>

                                    <div className="profile-form-grid">

                                        {/* Số điện thoại */}

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
                                                />
                                            </div>

                                        </div>

                                        {/* Ngày sinh */}

                                        <div className="profile-field">

                                            <label>Ngày sinh</label>

                                            <div className="profile-input-wrap">
                                                <i className="bi bi-calendar3"></i>

                                                <input
                                                    type="date"
                                                    name="dateOfBirth"
                                                    value={profile.dateOfBirth}
                                                    onChange={handleChange}
                                                />
                                            </div>

                                        </div>

                                        {/* Giới tính */}

                                        <div className="profile-field">

                                            <label>Giới tính</label>

                                            <div className="profile-input-wrap">
                                                <i className="bi bi-gender-ambiguous"></i>

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
                                            </div>

                                        </div>

                                        {/* Địa chỉ */}

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
                                                />
                                            </div>

                                        </div>

                                    </div>

                                </div>

                                {/* =====================================
                                    NÚT THAO TÁC
                                ===================================== */}

                                <div className="profile-form-actions">

                                    {saved && (
                                        <span className="profile-save-message">
                                            <i className="bi bi-check-circle-fill"></i>
                                            Đã cập nhật trên giao diện.
                                        </span>
                                    )}

                                    {/* Nút đăng xuất */}

                                    <button
                                        type="button"
                                        className="btn-profile-logout"
                                        onClick={handleLogout}
                                    >
                                        <i className="bi bi-box-arrow-right"></i>
                                        Đăng xuất
                                    </button>

                                    {/* Nút xóa thông tin */}

                                    <button
                                        type="button"
                                        className="btn-profile-reset"
                                        onClick={handleReset}
                                    >
                                        <i className="bi bi-arrow-counterclockwise"></i>
                                        Xóa thông tin nhập
                                    </button>

                                    {/* Nút lưu */}

                                    <button
                                        type="submit"
                                        className="btn-profile-save"
                                    >
                                        <i className="bi bi-floppy"></i>
                                        Lưu thay đổi
                                    </button>

                                </div>

                            </form>

                        </section>

                    </div>

                </div>

            </main>

            {/* =====================================
                HỘP THOẠI XÁC NHẬN ĐĂNG XUẤT
                Ban đầu ẩn, chỉ hiện khi nhấn Đăng xuất
            ===================================== */}

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

                        {/* Icon */}

                        <div className="logout-modal-icon">
                            <i className="bi bi-box-arrow-right"></i>
                        </div>

                        {/* Tiêu đề */}

                        <h3 id="logout-modal-title">
                            Xác nhận đăng xuất
                        </h3>

                        {/* Nội dung */}

                        <p>
                            Bạn có chắc chắn muốn đăng xuất khỏi
                            tài khoản của mình không?
                        </p>

                        {/* Nút thao tác */}

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
