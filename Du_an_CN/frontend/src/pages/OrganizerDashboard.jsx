
import React, { useContext } from "react";
import { Link } from "react-router-dom";

import Header from "../components/Header Organizer.jsx";
import Footer from "../components/Footer.jsx";
import { AuthContext } from "../contexts/AuthContext";

import "../styles/styles-dashboard.css";

const OrganizerDashboard = () => {
    const { user } = useContext(AuthContext);

// Danh sách tên đơn vị tương ứng với mã tổ chức
    const ORGANIZATION_NAMES = {
        TECH_UNION: "Đoàn Trường Kỹ thuật và Công nghệ",
        LAW_UNION: "Đoàn Trường Kinh tế và Luật",
        MED_UNION: "Đoàn Trường Y Dược",
        LIFE_SKILL_CLUB: "Câu lạc bộ Kỹ năng sống",
        MEDIA_CLUB: "Câu lạc bộ Truyền thông TVU",
        ART_CLUB: "Câu lạc bộ Văn hóa Nghệ thuật TVU"
    };

    // Lấy thông tin tổ chức từ tài khoản đang đăng nhập
    const organizationInfo =
        user?.organizations?.[0] ||
        (typeof user?.organization === "object" ? user.organization : null);

    const organizationCode =
        (typeof user?.organization === "string" ? user.organization : null) ||
        user?.organizationCode ||
        user?.organization_code ||
        organizationInfo?.organizationCode ||
        organizationInfo?.organization_code ||
        organizationInfo?.code;

    // Chỉ câu lạc bộ mới cần duyệt hồ sơ đăng ký thành viên.
    // Các đơn vị Đoàn trường/Đoàn khoa không cần duyệt tư cách đăng ký.
    const CLUB_CODES = [
        "LIFE_SKILL_CLUB",
        "MEDIA_CLUB",
        "ART_CLUB"
    ];

    const organizationType = String(
        organizationInfo?.organizationType ||
        organizationInfo?.organization_type ||
        organizationInfo?.type ||
        organizationInfo?.category ||
        user?.organizationType ||
        user?.organization_type ||
        ""
    ).toUpperCase();

    const isClub =
        CLUB_CODES.includes(String(organizationCode || "").toUpperCase()) ||
        organizationType === "CLUB";

    // Xác định tên đơn vị đang đăng nhập
    const organizationName =
        user?.organizationName ||
        user?.organization_name ||
        user?.organization?.name ||
        user?.organizations?.[0]?.organizationName ||
        user?.organizations?.[0]?.organization_name ||
        ORGANIZATION_NAMES[organizationCode] ||
        user?.fullName?.replace(/^Tài khoản\s+/i, "") ||
        "Chưa xác định đơn vị";

    return (
        <div className="dashboard-page">
            <Header role="ORGANIZER" />

            <main className="dashboard-container container-fluid">

                {/* THÔNG TIN ĐƠN VỊ ĐANG ĐĂNG NHẬP */}
                
                {/* CHÀO MỪNG ĐƠN VỊ TỔ CHỨC ĐANG ĐĂNG NHẬP */}
                <section className="organizer-welcome">

                    <div className="organizer-welcome-content">

                        <div className="organizer-welcome-label">
                            <i className="bi bi-building-check"></i>
                            HỆ THỐNG QUẢN LÝ HOẠT ĐỘNG TVU
                        </div>

                        <h2>
                            Xin chào,
                            <br />
                            <span>{organizationName}</span>
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
                            Chào mừng <strong>{organizationName}</strong> đến với
                            Hệ thống quản lý hoạt động phục vụ cộng đồng của sinh viên
                            Trường Đại học Trà Vinh.
                            Tại đây, đơn vị có thể tạo và quản lý hoạt động,
                            {isClub
                                ? " xét duyệt đăng ký thành viên câu lạc bộ, "
                                : " "}
                            xác nhận kết quả tham gia và ghi nhận điểm phục vụ
                            cộng đồng cho sinh viên.
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
                                Thống kê tình hình quản lý của đơn vị
                            </p>
                        </div>
                    </div>

                    <div className="row g-3">

                        <div className={`col-12 col-sm-6 ${isClub ? "col-xl-3" : "col-xl-4"}`}>
                            <div className="dashboard-stat-card">
                                <div className="stat-icon blue">
                                    <i className="bi bi-calendar-event"></i>
                                </div>
                                <div>
                                    <p>Tổng hoạt động quản lý</p>
                                    <h3>—</h3>
                                </div>
                            </div>
                        </div>

                        <div className={`col-12 col-sm-6 ${isClub ? "col-xl-3" : "col-xl-4"}`}>
                            <div className="dashboard-stat-card">
                                <div className="stat-icon cyan">
                                    <i className="bi bi-megaphone"></i>
                                </div>
                                <div>
                                    <p>Hoạt động đang mở đăng ký</p>
                                    <h3>—</h3>
                                </div>
                            </div>
                        </div>

                        {isClub && (
                            <div className="col-12 col-sm-6 col-xl-3">
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

                        <div className={`col-12 col-sm-6 ${isClub ? "col-xl-3" : "col-xl-4"}`}>
                            <div className="dashboard-stat-card">
                                <div className="stat-icon green">
                                    <i className="bi bi-clipboard-check"></i>
                                </div>
                                <div>
                                    <p>Chờ xác nhận tham gia</p>
                                    <h3>—</h3>
                                </div>
                            </div>
                        </div>

                    </div>
                </section>

                {/* HOẠT ĐỘNG CỦA ĐƠN VỊ */}
                <section className="dashboard-section">
                    <div className="dashboard-section-heading">
                        <div>
                            <h4>Hoạt động do đơn vị quản lý</h4>
                            <p>
                                Theo dõi và quản lý các hoạt động thuộc đơn vị
                                đang đăng nhập
                            </p>
                        </div>

                        <Link
                            to="/organizer/activities"
                            className="dashboard-view-all"
                        >
                            Xem tất cả
                            <i className="bi bi-arrow-right"></i>
                        </Link>
                    </div>

                    <div className="dashboard-content-card empty-state">
                        <i className="bi bi-calendar2-x"></i>
                        <h5>Chưa có dữ liệu hoạt động</h5>
                        <p>
                            Các hoạt động do đơn vị quản lý sẽ được hiển thị
                            tại đây khi có dữ liệu từ máy chủ.
                        </p>
                    </div>
                </section>

                {/* CHỈ CÂU LẠC BỘ MỚI CẦN DUYỆT ĐĂNG KÝ THÀNH VIÊN */}
                {isClub && (
                <section className="dashboard-section">
                    <div className="dashboard-section-heading">
                        <div>
                            <h4>Đăng ký thành viên cần xử lý</h4>
                            <p>
                                Danh sách sinh viên gửi yêu cầu tham gia câu lạc bộ
                                đang chờ xét duyệt
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
                                to="/organizer/activities"
                                className="quick-link-card"
                            >
                                <i className="bi bi-calendar2-plus"></i>
                                <div>
                                    <h6>Quản lý hoạt động</h6>
                                    <p>Tạo và cập nhật hoạt động</p>
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
                                        <p>Chấp nhận hoặc từ chối sinh viên đăng ký vào câu lạc bộ</p>
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
};

export default OrganizerDashboard;
