
import "../styles/components/header.css";
import { NavLink } from "react-router-dom";

function Header() {
    return (
        <header className="top-header">
            <div className="container-fluid px-4">
                <div className="header-inner">

                    {/* Logo */}
                    <div className="logo-section">
                        <div className="logo-img">
                            <NavLink to="/student/dashboard">
                                <img
                                    src="/assets/Logo-DH-Tra-Vinh-TVU.webp"
                                    alt="TVU Logo"
                                />
                            </NavLink>
                        </div>
                    </div>

                    {/* Menu */}
                    <nav>
                        <ul className="nav-menu">

                            {/* Trang chủ */}
                            <li>
                                <NavLink
                                    to="/student/dashboard"
                                    className={({ isActive }) =>
                                        `nav-item ${isActive ? "home-active" : ""}`
                                    }
                                >
                                    <i className="bi bi-house"></i>
                                    Trang chủ
                                </NavLink>
                            </li>

                            {/* Thông báo */}
                            <li>
                                <NavLink
                                    to="/student/notifications"
                                    className={({ isActive }) =>
                                        `nav-item ${isActive ? "active" : ""}`
                                    }
                                >
                                    <i className="bi bi-bell"></i>
                                    Thông báo
                                </NavLink>
                            </li>

                            {/* Hoạt động */}
                            <li>
                                <NavLink
                                    to="/activities"
                                    className={({ isActive }) =>
                                        `nav-item ${isActive ? "active" : ""}`
                                    }
                                >
                                    <i className="bi bi-people"></i>
                                    Hoạt động
                                </NavLink>
                            </li>

                            {/* Giới thiệu */}
                            <li className="dropdown">
                                <a
                                    href="#"
                                    className="nav-item dropdown-toggle"
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                    onClick={(e) => e.preventDefault()}
                                >
                                    <i className="bi bi-info-circle"></i>
                                    Giới thiệu
                                </a>

                                <ul className="dropdown-menu">
                                    <li>
                                        <NavLink
                                            to="/student/introduction/cntt"
                                            className="dropdown-item"
                                        >
                                            <i className="bi bi-mortarboard me-2"></i>
                                            Đoàn trường Kỹ thuật và Công nghệ
                                        </NavLink>
                                    </li>

                                    <li>
                                        <NavLink
                                            to="/student/introduction/kt"
                                            className="dropdown-item"
                                        >
                                            <i className="bi bi-person-badge me-2"></i>
                                            Đoàn trường Kinh tế và Luật
                                        </NavLink>
                                    </li>

                                    <li>
                                        <NavLink
                                            to="/student/introduction/yd"
                                            className="dropdown-item"
                                        >
                                            <i className="bi bi-shield-lock me-2"></i>
                                            Đoàn trường Y Dược
                                        </NavLink>
                                    </li>
                                </ul>
                            </li>

                            {/* Lịch sử */}
                            <li className="dropdown">
                                <a
                                    href="#"
                                    className="nav-item dropdown-toggle"
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                    onClick={(e) => e.preventDefault()}
                                >
                                    <i className="bi bi-clock-fill"></i>
                                    Lịch sử
                                </a>

                                <ul className="dropdown-menu">
                                    <li>
                                        <NavLink
                                            to="/student/history/activities"
                                            className="dropdown-item"
                                        >
                                            <i className="bi bi-file-earmark-text me-2"></i>
                                            Các hoạt động đã tham gia
                                        </NavLink>
                                    </li>

                                    <li>
                                        <NavLink
                                            to="/student/history/evidence"
                                            className="dropdown-item"
                                        >
                                            <i className="bi bi-file-earmark-text me-2"></i>
                                            Minh chứng
                                        </NavLink>
                                    </li>
                                </ul>
                            </li>

                            {/* Thông tin cá nhân */}
                            <li>
                                <NavLink
                                    to="/student/profile"
                                    className={({ isActive }) =>
                                        `nav-item ${isActive ? "active" : ""}`
                                    }
                                >
                                    <i className="bi bi-person-circle"></i>
                                    Thông tin cá nhân
                                </NavLink>
                            </li>

                        </ul>
                    </nav>
                </div>
            </div>
        </header>
    );
}

export default Header;
