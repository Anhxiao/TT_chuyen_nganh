
import React, { useContext } from "react";
import { Link } from "react-router-dom";

import Header from "../components/Header Organizer";
import Footer from "../components/Footer";
import { AuthContext } from "../contexts/AuthContext";

import "../styles/styles-dashboard.css";

const OrganizerDashboard = () => {
    const { user } = useContext(AuthContext);

// Lấy tên đơn vị từ dữ liệu tài khoản
    const organizationName =
        user?.organizationName ||
        user?.organization_name ||
        user?.organization?.name ||
        user?.unitName ||
        user?.username?.replace(/^Tài khoản\s+/i, "") ||
        "Chưa xác định đơn vị";

    return (
        <div className="dashboard-page">
            <Header role="ORGANIZER" />

            <main className="dashboard-container container-fluid">

                {/* THÔNG TIN ĐƠN VỊ ĐANG ĐĂNG NHẬP */}
                <section className="organizer-welcome">

                    <div className="organizer-welcome-content">

                        <div className="organizer-welcome-label">
                            <i className="bi bi-building-check"></i>
                            ĐƠN VỊ ĐANG ĐĂNG NHẬP
                        </div>

                        <h2>{organizationName}</h2>

                        <div className="organizer-account-info">
                            <span className="organizer-role">
                                <i className="bi bi-shield-check"></i>
                                Tài khoản đơn vị tổ chức
                            </span>
                        </div>

                        <p>
                            Chào mừng đơn vị đến với hệ thống quản lý hoạt động
                            phục vụ cộng đồng của sinh viên. Tại đây, đơn vị có thể
                            quản lý hoạt động, xét duyệt đăng ký và xác nhận kết quả
                            tham gia của sinh viên.
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

                        <div className="col-12 col-sm-6 col-xl-3">
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

                        <div className="col-12 col-sm-6 col-xl-3">
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

                        <div className="col-12 col-sm-6 col-xl-3">
                            <div className="dashboard-stat-card">
                                <div className="stat-icon orange">
                                    <i className="bi bi-person-check"></i>
                                </div>
                                <div>
                                    <p>Đăng ký chờ xử lý</p>
                                    <h3>—</h3>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 col-sm-6 col-xl-3">
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

                {/* ĐĂNG KÝ CẦN XỬ LÝ */}
                <section className="dashboard-section">
                    <div className="dashboard-section-heading">
                        <div>
                            <h4>Đăng ký cần xử lý</h4>
                            <p>
                                Danh sách đăng ký tham gia đang chờ đơn vị xét duyệt
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

                        <div className="col-12 col-md-4">
                            <Link
                                to="/organizer/registrations"
                                className="quick-link-card"
                            >
                                <i className="bi bi-people"></i>
                                <div>
                                    <h6>Quản lý đăng ký</h6>
                                    <p>Xét duyệt đăng ký sinh viên</p>
                                </div>
                                <i className="bi bi-arrow-right"></i>
                            </Link>
                        </div>

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
