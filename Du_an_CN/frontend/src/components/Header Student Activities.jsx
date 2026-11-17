
import "../styles/components/header.css";
import { Link } from "react-router-dom";

function Header() {
    return (
        <header className="top-header">
            <div className="container-fluid px-4">
                <div className="header-inner">

                    {/* Logo */}
                    <div className="logo-section">
                        <div className="logo-img">
                            <img
                                src="/assets/Logo-DH-Tra-Vinh-TVU.webp"
                                alt="TVU Logo"
                            />
                        </div>
                    </div>

                    {/* Menu */}
                    <nav>
                        <ul className="nav-menu">

                            {/* Trang chủ */}
                            <li>
                                <Link to="/student/dashboard" className="nav-item">
                                    <i className="bi bi-house"></i>
                                    Trang chủ
                                </Link>
                            </li>

                            {/* Thông báo */}
                            <li>
                                <Link to="/student/notifications" className="nav-item">
                                    <i className="bi bi-bell"></i>
                                    Thông báo
                                </Link>
                            </li>

                            {/* Hoạt động */}
                            <li>
                                <Link to="/activities" className="nav-item home-active">
                                    <i className="bi bi-people"></i>
                                    Hoạt động
                                </Link>
                            </li>

                            {/* Giới thiệu */}
                            <li className="dropdown">
                                <a
                                    href="#"
                                    className="nav-item dropdown-toggle"
                                    data-bs-toggle="dropdown"
                                >
                                    <i className="bi bi-info-circle"></i>
                                    Giới thiệu
                                </a>

                                <ul className="dropdown-menu">
                                    <li>
                                        <a className="dropdown-item" href="/student/introduction/cntt">
                                            <i className="bi bi-mortarboard me-2"></i>
                                            Đoàn trường Kỹ thuật và Công nghệ
                                        </a>
                                    </li>

                                    <li>
                                        <a className="dropdown-item" href="/student/introduction/kt">
                                            <i className="bi bi-person-badge me-2"></i>
                                            Đoàn trường Kinh tế luật
                                        </a>
                                    </li>

                                    <li>
                                        <a className="dropdown-item" href="/student/introduction/yd">
                                            <i className="bi bi-shield-lock me-2"></i>
                                            Đoàn trường Y Dược
                                        </a>
                                    </li>
                                </ul>
                            </li>

                            {/* Lịch sử */}
                            <li className="dropdown">
                                <a
                                    href="#"
                                    className="nav-item dropdown-toggle"
                                    data-bs-toggle="dropdown"
                                >
                                    <i className="bi bi-clock-fill"></i>
                                    Lịch sử
                                </a>

                                <ul className="dropdown-menu">
                                    <li>
                                        <a className="dropdown-item" href="/student/history/activities">
                                            <i className="bi bi-file-earmark-text me-2"></i>
                                            Các hoạt động đã tham gia
                                        </a>
                                    </li>

                                    <li>
                                        <a className="dropdown-item" href="/student/history/evidence">
                                            <i className="bi bi-file-earmark-text me-2"></i>
                                            Minh chứng
                                        </a>
                                    </li>
                                </ul>
                            </li>

                            {/* Thông tin cá nhân - ACTIVE */}
                            <li>
                                <Link
                                    to="/student/profile"
                                    className="nav-item"
                                >
                                    <i className="bi bi-person-circle"></i>
                                    Thông tin cá nhân
                                </Link>
                            </li>

                        </ul>
                    </nav>

                </div>
            </div>
        </header>
    );
}

export default Header;
