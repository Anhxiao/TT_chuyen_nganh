
import { Link, NavLink, useLocation } from 'react-router-dom';
import '../styles/components/header.css';
import { useEffect, useState } from "react";
import notificationService from "../services/notificationService";

function Header() {
    const [unreadCount, setUnreadCount] = useState(0);

        useEffect(() => {
            let isMounted = true;

            const loadUnreadCount = async () => {
                try {
                    const result = await notificationService.getMyNotifications();

                    if (isMounted) {
                        setUnreadCount(Number(result.unreadCount) || 0);
                    }
                } catch (error) {
                    console.error(
                        "Không thể lấy số thông báo chưa đọc:",
                        error
                    );
                }
            };

            loadUnreadCount();

            const interval = setInterval(loadUnreadCount, 15000);

            const handleFocus = () => loadUnreadCount();

            window.addEventListener("focus", handleFocus);

            return () => {
                isMounted = false;
                clearInterval(interval);
                window.removeEventListener("focus", handleFocus);
            };
        }, []);

    const location = useLocation();

    // Kiểm tra trang hiện tại có thuộc nhóm đường dẫn hay không
    const isActivePath = (paths) => {
        return paths.some(path =>
            location.pathname === path ||
            location.pathname.startsWith(`${path}/`)
        );
    };

    return (
        <header className="top-header organizer-header">
            <div className="container-fluid px-4">
                <div className="header-inner">

                    {/* Logo */}
                    <div className="logo-section">
                        <div className="logo-img">
                            <Link to="/organizer/dashboard">
                                <img
                                    src="/assets/Logo-DH-Tra-Vinh-TVU.webp"
                                    alt="TVU Logo"
                                />
                            </Link>
                        </div>
                    </div>

                    {/* Menu */}
                    <nav>
                        <ul className="nav-menu">

                            {/* Trang chủ */}
                            <li>
                                <NavLink
                                    to="/organizer/dashboard"
                                    className={({ isActive }) =>
                                        `nav-item ${isActive ? 'home-active active' : ''}`
                                    }
                                >
                                    <i className="bi bi-house"></i>
                                    Trang chủ
                                </NavLink>
                            </li>

                            {/* Thông báo */}
                            <li>
                                <NavLink
                                    to="/organizer/notifications"
                                    className={({ isActive }) =>
                                        `nav-item ${isActive ? 'active' : ''}`
                                    }
                                >
                                    <span className="notification-nav-icon">
                                        <i className="bi bi-bell"></i>

                                        {unreadCount > 0 && (
                                            <span className="notification-red-dot"></span>
                                        )}
                                    </span>

                                    Thông báo
                                </NavLink>
                            </li>

                            {/* Hoạt động */}
                            <li>
                                <NavLink
                                    to="/organizer/activities"
                                    className={({ isActive }) =>
                                        `nav-item ${isActive || isActivePath([
                                            '/organizer/activities'
                                        ]) ? 'active' : ''}`
                                    }
                                >
                                    <i className="bi bi-people"></i>
                                    Hoạt động
                                </NavLink>
                            </li>

                            {/* Lịch sử */}
                            <li className="dropdown">
                                <a
                                    href="#"
                                    className={`nav-item dropdown-toggle ${
                                        isActivePath([
                                            '/organizer/history',
                                            '/organizer/evidence'
                                        ]) ? 'active' : ''
                                    }`}
                                    data-bs-toggle="dropdown"
                                    onClick={(e) => e.preventDefault()}
                                >
                                    <i className="bi bi-clock-fill"></i>
                                    Lịch sử
                                </a>

                                <ul className="dropdown-menu">
                                    <li>
                                        <Link
                                            className="dropdown-item"
                                            to="/organizer/history"
                                        >
                                            <i className="bi bi-file-earmark-text me-2"></i>
                                            Các hoạt động đã tạo
                                        </Link>
                                    </li>

                                    <li>
                                        <Link
                                            className="dropdown-item"
                                            to="/organizer/evidence"
                                        >
                                            <i className="bi bi-file-earmark-text me-2"></i>
                                            Minh chứng
                                        </Link>
                                    </li>
                                </ul>
                            </li>

                            {/* Thông tin đơn vị */}
                            <li>
                                <NavLink
                                    to="/organizer/organization"
                                    className={({ isActive }) =>
                                        `nav-item ${isActive ? 'active' : ''}`
                                    }
                                >
                                    <i className="bi bi-building"></i>
                                    Thông tin đơn vị
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
