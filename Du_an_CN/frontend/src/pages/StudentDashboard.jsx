import { Link } from 'react-router-dom';
import Header from '../components/Header Student';
import Footer from '../components/Footer';
import '../styles/styles-dashboard.css';
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

const StudentDashboard = () => { const { user } = useContext(AuthContext);
    return (
        <div className="dashboard-page">
            {/* Header đã chứa menu: Trang chủ | Thông báo | Hoạt động | Giới thiệu | Lịch sử */}
            <Header role="STUDENT" />

            <main className="dashboard-container container-fluid">

                {/* Welcome ngắn gọn */}
                <section className="dashboard-welcome">
                    <div>
                        <span className="dashboard-eyebrow">
                            SINH VIÊN - ĐẠI HỌC TRÀ VINH
                        </span>

                        <h2>
                            Xin chào, {user?.fullName || 'Sinh viên'}!
                        </h2>

                        <p>
                            Mã sinh viên: {user?.studentCode || 'Chưa cập nhật'}
                            <br />
                            Đơn vị đào tạo: {user?.facultyName || 'Chưa cập nhật'}
                        </p>
                    </div>

                    <Link to="/activities" className="btn btn-primary">
                        <i className="bi bi-search me-2"></i>
                        Tìm hoạt động
                    </Link>
                </section>

                {/* Thống kê 4 ô */}
                <section className="dashboard-section">
                    <div className="row g-3">
                        <div className="col-6 col-xl-3">
                            <div className="dashboard-stat-card">
                                <div className="stat-icon blue">
                                    <i className="bi bi-award"></i>
                                </div>
                                <div>
                                    <p>Điểm hoạt động</p>
                                    <h3>—</h3>
                                </div>
                            </div>
                        </div>
                        <div className="col-6 col-xl-3">
                            <div className="dashboard-stat-card">
                                <div className="stat-icon cyan">
                                    <i className="bi bi-calendar-check"></i>
                                </div>
                                <div>
                                    <p>Đã đăng ký</p>
                                    <h3>—</h3>
                                </div>
                            </div>
                        </div>
                        <div className="col-6 col-xl-3">
                            <div className="dashboard-stat-card">
                                <div className="stat-icon green">
                                    <i className="bi bi-check-circle"></i>
                                </div>
                                <div>
                                    <p>Hoàn thành</p>
                                    <h3>—</h3>
                                </div>
                            </div>
                        </div>
                        <div className="col-6 col-xl-3">
                            <div className="dashboard-stat-card">
                                <div className="stat-icon orange">
                                    <i className="bi bi-hourglass-split"></i>
                                </div>
                                <div>
                                    <p>Chờ duyệt</p>
                                    <h3>—</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Hai cột chính */}
                <section className="dashboard-section">
                    <div className="row g-4">

                        {/* Cột trái: Hoạt động phù hợp */}
                        <div className="col-lg-7">
                            <div className="dashboard-section-heading">
                                <div>
                                    <h4>Hoạt động phù hợp</h4>
                                    <p>Đủ điều kiện & còn suất đăng ký</p>
                                </div>
                                <Link to="/activities" className="dashboard-view-all">
                                    Xem tất cả <i className="bi bi-arrow-right"></i>
                                </Link>
                            </div>

                            <div className="dashboard-content-card empty-state">
                                <i className="bi bi-calendar2-x"></i>
                                <h5>Chưa có hoạt động</h5>
                                <p>Hệ thống sẽ hiển thị hoạt động phù hợp sau khi kiểm tra điều kiện.</p>
                            </div>
                        </div>

                        {/* Cột phải: Trạng thái đăng ký gần đây */}
                        <div className="col-lg-5">
                            <div className="dashboard-section-heading">
                                <div>
                                    <h4>Đăng ký gần đây</h4>
                                    <p>Theo dõi trạng thái</p>
                                </div>
                                <Link to="/my-registrations" className="dashboard-view-all">
                                    Xem tất cả <i className="bi bi-arrow-right"></i>
                                </Link>
                            </div>

                            <div className="dashboard-content-card">
                                <div className="text-center py-4">
                                    <i className="bi bi-inbox empty-table-icon"></i>
                                    <p className="mb-0 mt-2 text-muted">Chưa có đăng ký nào</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </section>

            </main>

            <Footer />
        </div>
    );
};

export default StudentDashboard;