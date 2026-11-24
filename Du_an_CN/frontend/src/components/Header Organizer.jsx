
import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

import "../styles/components/header.css";
import notificationService from "../services/notificationService";

function Header() {
    const [unreadCount, setUnreadCount] = useState(0);

    const location = useLocation();

    // Kiểm tra đường dẫn hiện tại có thuộc một nhóm trang hay không
    const isActivePath = useCallback((paths) => {
        return paths.some(path =>
            location.pathname === path ||
            location.pathname.startsWith(`${path}/`)
        );
    }, [location.pathname]);

    // Tải số lượng thông báo chưa đọc
    const loadUnreadCount = useCallback(async () => {
        try {
            const result = await notificationService.getMyNotifications();

            const count = Number(result?.unreadCount);

            setUnreadCount(
                Number.isFinite(count) && count > 0 ? count : 0
            );
        } catch (error) {
            console.error(
                "Không thể lấy số thông báo chưa đọc:",
                error
            );
        }
    }, []);

    // Tải thông báo khi mở trang và cập nhật định kỳ
    useEffect(() => {
        let isMounted = true;

        const loadNotifications = async () => {
            try {
                const result = await notificationService.getMyNotifications();

                if (!isMounted) return;

                const count = Number(result?.unreadCount);

                setUnreadCount(
                    Number.isFinite(count) && count > 0 ? count : 0
                );
            } catch (error) {
                if (isMounted) {
                    console.error(
                        "Không thể lấy số thông báo chưa đọc:",
                        error
                    );
                }
            }
        };

        loadNotifications();

        const interval = setInterval(loadNotifications, 15000);

        const handleFocus = () => {
            loadNotifications();
        };

        window.addEventListener("focus", handleFocus);

        return () => {
            isMounted = false;
            clearInterval(interval);
            window.removeEventListener("focus", handleFocus);
        };
    }, []);

    // Tạo class active cho menu
    const getNavClass = ({ isActive }) =>
        `nav-item ${isActive ? "active" : ""}`;

    const activityActive = isActivePath([
        "/organizer/activities"
    ]);

    const historyActive = isActivePath([
        "/organizer/history"
    ]);

    const organizationActive = isActivePath([
        "/organizer/organization"
    ]);

    return (
        <header className="top-header organizer-header">
            <div className="container-fluid px-4">
                <div className="header-inner">

                    {/* LOGO */}
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

                    {/* MENU ĐƠN VỊ TỔ CHỨC */}
                    <nav aria-label="Menu đơn vị tổ chức">
                        <ul className="nav-menu">

                            {/* TRANG CHỦ */}
                            <li>
                                <NavLink
                                    to="/organizer/dashboard"
                                    end
                                    className={getNavClass}
                                >
                                    <i className="bi bi-house"></i>
                                    <span>Trang chủ</span>
                                </NavLink>
                            </li>

                            {/* THÔNG BÁO */}
                            <li>
                                <NavLink
                                    to="/organizer/notifications"
                                    className={getNavClass}
                                >
                                    <span className="notification-nav-icon">
                                        <i className="bi bi-bell"></i>

                                        {unreadCount > 0 && (
                                            <span className="notification-red-dot"></span>
                                        )}
                                    </span>

                                    <span>Thông báo</span>
                                </NavLink>
                            </li>

                            {/* HOẠT ĐỘNG */}
                            <li>
                                <NavLink
                                    to="/organizer/activities/create"
                                    className={() =>
                                        `nav-item ${
                                            activityActive ? "active" : ""
                                        }`
                                    }
                                >
                                    <i className="bi bi-people"></i>
                                    <span>Hoạt động</span>
                                </NavLink>
                            </li>

                            {/* LỊCH SỬ */}
                            <li>
                                <NavLink
                                    to="/organizer/history"
                                    className={() =>
                                        `nav-item ${
                                            historyActive ? "active" : ""
                                        }`
                                    }
                                >
                                    <i className="bi bi-clock-fill"></i>
                                    <span>Lịch sử</span>
                                </NavLink>
                            </li>

                            {/* THÔNG TIN ĐƠN VỊ */}
                            <li>
                                <NavLink
                                    to="/organizer/introduction"
                                    className={() =>
                                        `nav-item ${
                                            organizationActive ? "active" : ""
                                        }`
                                    }
                                >
                                    <i className="bi bi-building"></i>
                                    <span>Thông tin đơn vị</span>
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
