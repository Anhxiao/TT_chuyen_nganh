import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header Organizer';
import Footer from '../components/Footer';
import '../styles/styles-dashboard.css';
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

const OrganizerDashboard = () => {const { user } = useContext(AuthContext);
    return (
        <div className="dashboard-page">
            <Header role="ORGANIZER" />

            <main className="dashboard-container container-fluid">

                <section className="dashboard-welcome">
                    <div>
                        <span className="dashboard-eyebrow">
                            HỆ THỐNG QUẢN LÝ HOẠT ĐỘNG
                        </span>

                        <h2>
                            {user?.organizationName || 'Đơn vị tổ chức'}
                        </h2>

                        <p>
                            Tài khoản: {user?.username || ''}
                            <br />
                            Quản lý hoạt động, xử lý đăng ký và xác nhận
                            kết quả tham gia của sinh viên.
                        </p>
                    </div>

                    <Link
                        to="/organizer/activities/create"
                        className="btn btn-primary"
                    >
                        <i className="bi bi-plus-circle me-2"></i>
                        Tạo hoạt động
                    </Link>
                </section>

                {/* Thống kê */}
                <section className="dashboard-section">
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

                {/* Hoạt động của đơn vị */}
                <section className="dashboard-section">
                    <div className="dashboard-section-heading">
                        <div>
                            <h4>Hoạt động do đơn vị quản lý</h4>
                            <p>Theo dõi và quản lý các hoạt động thuộc đơn vị</p>
                        </div>

                        <Link
                            to="/organizer/activities"
                            className="dashboard-view-all"
                        >
                            Xem tất cả <i className="bi bi-arrow-right"></i>
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

                {/* Đăng ký cần xử lý */}
                <section className="dashboard-section">
                    <div className="dashboard-section-heading">
                        <div>
                            <h4>Đăng ký cần xử lý</h4>
                            <p>Danh sách đăng ký tham gia đang chờ đơn vị xét duyệt</p>
                        </div>

                        <Link
                            to="/organizer/registrations"
                            className="dashboard-view-all"
                        >
                            Quản lý đăng ký <i className="bi bi-arrow-right"></i>
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

                {/* Công việc quản lý */}
                <section className="dashboard-section">
                    <div className="dashboard-section-heading">
                        <div>
                            <h4>Công việc quản lý</h4>
                            <p>Truy cập nhanh các chức năng dành cho đơn vị tổ chức</p>
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
