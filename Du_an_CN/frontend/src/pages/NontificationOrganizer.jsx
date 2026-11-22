
import React, {
    useContext,
    useEffect,
    useMemo,
    useState,
    useCallback,
} from "react";

import { Link } from "react-router-dom";

import Header from "../components/Header Organizer.jsx";
import Footer from "../components/Footer.jsx";
import NotificationDetailModal from "../components/NotificationDetailModal";

import { AuthContext } from "../contexts/AuthContext";
import notificationService from "../services/notificationService";

import {
    NOTIFICATION_CATEGORIES,
    getNotificationMeta,
    getNotificationId,
    isNotificationRead,
    formatNotificationDate,
} from "../utils/notificationUtils";

import "../styles/styles-notifications-organizer.css";

const CLUB_CODES = [
    "LIFE_SKILL_CLUB",
    "MEDIA_CLUB",
    "ART_CLUB",
];

const NontificationOrganizer = () => {
    const { user } = useContext(AuthContext);

    // ================================
    // STATE
    // ================================

    const [notifications, setNotifications] = useState([]);
    const [activeFilter, setActiveFilter] = useState("ALL");
    const [activeCategory, setActiveCategory] = useState("ALL");

    const [selectedNotification, setSelectedNotification] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [markingAll, setMarkingAll] = useState(false);

    // ================================
    // XÁC ĐỊNH ĐƠN VỊ ĐĂNG NHẬP
    // ================================

    const organizationInfo =
        user?.organizations?.[0] ||
        (typeof user?.organization === "object"
            ? user.organization
            : null);

    const organizationCode =
        (typeof user?.organization === "string"
            ? user.organization
            : null) ||
        user?.organizationCode ||
        user?.organization_code ||
        organizationInfo?.organizationCode ||
        organizationInfo?.organization_code ||
        organizationInfo?.code;

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
        CLUB_CODES.includes(
            String(organizationCode || "").toUpperCase()
        ) ||
        organizationType === "CLUB";

    // ================================
    // LẤY DANH SÁCH THÔNG BÁO
    // ================================

    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const result =
                await notificationService.getMyNotifications();

            setNotifications(
                Array.isArray(result?.notifications)
                    ? result.notifications
                    : []
            );
        } catch (err) {
            console.error("Lỗi tải thông báo:", err);

            setError(
                err?.response?.data?.message ||
                err?.message ||
                "Không thể tải danh sách thông báo."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // ================================
    // LỌC THÔNG BÁO THEO ĐƠN VỊ
    // ================================

    const visibleNotifications = useMemo(() => {
        return notifications.filter((item) => {
            const meta = getNotificationMeta(item);

            // Đơn vị Đoàn không hiển thị thông báo riêng của CLB.
            if (!isClub && meta.category === "CLUB") {
                return false;
            }

            return true;
        });
    }, [notifications, isClub]);

    // ================================
    // THỐNG KÊ
    // ================================

    const unreadCount = useMemo(() => {
        return visibleNotifications.filter(
            (item) => !isNotificationRead(item)
        ).length;
    }, [visibleNotifications]);

    const readCount =
        visibleNotifications.length - unreadCount;

    // ================================
    // LỌC THEO LOẠI VÀ TRẠNG THÁI
    // ================================

    const filteredNotifications = useMemo(() => {
        let result = [...visibleNotifications];

        // Lọc theo loại thông báo
        if (activeCategory !== "ALL") {
            result = result.filter(
                (item) =>
                    getNotificationMeta(item).category === activeCategory
            );
        }

        // Lọc theo trạng thái đọc
        if (activeFilter === "UNREAD") {
            result = result.filter(
                (item) => !isNotificationRead(item)
            );
        }

        if (activeFilter === "READ") {
            result = result.filter(
                (item) => isNotificationRead(item)
            );
        }

        // Mới nhất hiển thị trước
        result.sort((a, b) => {
            const dateA = new Date(
                a.createdAt || a.created_at
            ).getTime() || 0;

            const dateB = new Date(
                b.createdAt || b.created_at
            ).getTime() || 0;

            return dateB - dateA;
        });

        return result;
    }, [
        visibleNotifications,
        activeCategory,
        activeFilter,
    ]);

    // ================================
    // ĐÁNH DẤU MỘT THÔNG BÁO ĐÃ ĐỌC
    // ================================

    const handleMarkAsRead = async (notificationId) => {
        if (!notificationId) return;

        const currentNotification = notifications.find(
            (item) =>
                String(getNotificationId(item)) ===
                String(notificationId)
        );

        if (!currentNotification || isNotificationRead(currentNotification)) {
            return;
        }

        try {
            await notificationService.markAsRead(notificationId);

            setNotifications((previous) =>
                previous.map((item) => {
                    const id = getNotificationId(item);

                    return String(id) === String(notificationId)
                        ? {
                            ...item,
                            isRead: true,
                            is_read: true,
                            status: "READ",
                        }
                        : item;
                })
            );

            // Đồng bộ trạng thái trong cửa sổ chi tiết.
            setSelectedNotification((previous) => {
                if (
                    !previous ||
                    String(getNotificationId(previous)) !==
                    String(notificationId)
                ) {
                    return previous;
                }

                return {
                    ...previous,
                    isRead: true,
                    is_read: true,
                    status: "READ",
                };
            });
        } catch (err) {
            console.error("Lỗi cập nhật thông báo:", err);

            alert(
                err?.response?.data?.message ||
                "Không thể cập nhật trạng thái thông báo."
            );
        }
    };

    // ================================
    // MỞ CHI TIẾT THÔNG BÁO
    // ================================

    const handleOpenDetail = async (item) => {
        setSelectedNotification(item);

        const id = getNotificationId(item);

        if (!isNotificationRead(item)) {
            await handleMarkAsRead(id);
        }
    };

    // ================================
    // ĐÁNH DẤU TẤT CẢ ĐÃ ĐỌC
    // ================================

    const handleMarkAllAsRead = async () => {
        if (unreadCount === 0 || markingAll) return;

        try {
            setMarkingAll(true);

            const unreadIds = visibleNotifications
                .filter((item) => !isNotificationRead(item))
                .map((item) => getNotificationId(item))
                .filter(Boolean);

            await notificationService.markAllAsRead(unreadIds);

            const visibleIds = new Set(
                visibleNotifications.map((item) =>
                    String(getNotificationId(item))
                )
            );

            setNotifications((previous) =>
                previous.map((item) => {
                    if (
                        !visibleIds.has(
                            String(getNotificationId(item))
                        )
                    ) {
                        return item;
                    }

                    return {
                        ...item,
                        isRead: true,
                        is_read: true,
                        status: "READ",
                    };
                })
            );

            setSelectedNotification((previous) => {
                if (
                    !previous ||
                    !visibleIds.has(
                        String(getNotificationId(previous))
                    )
                ) {
                    return previous;
                }

                return {
                    ...previous,
                    isRead: true,
                    is_read: true,
                    status: "READ",
                };
            });
        } catch (err) {
            console.error("Lỗi đánh dấu tất cả đã đọc:", err);

            alert(
                err?.response?.data?.message ||
                "Không thể cập nhật trạng thái thông báo."
            );

            await fetchNotifications();
        } finally {
            setMarkingAll(false);
        }
    };

    // ================================
    // RESET BỘ LỌC
    // ================================

    const handleResetFilters = () => {
        setActiveFilter("ALL");
        setActiveCategory("ALL");
    };

    // ================================
    // GIAO DIỆN
    // ================================

    return (
        <div className="organizer-notification-page">

            <Header role="ORGANIZER" />

            <main className="organizer-notification-container container">

                {/* TIÊU ĐỀ */}
                <section className="organizer-notification-banner">
                    <div>
                        <span className="organizer-notification-eyebrow">
                            <i className="bi bi-bell"></i>
                            HỆ THỐNG QUẢN LÝ HOẠT ĐỘNG TVU
                        </span>

                        <h2>Thông báo</h2>

                        <p>
                            Theo dõi thông tin hoạt động, đơn đăng ký
                            và các công việc cần xử lý của đơn vị.
                        </p>

                        <div className="organizer-notification-account">
                            <i className="bi bi-building"></i>

                            {isClub
                                ? "Thông báo dành cho câu lạc bộ"
                                : "Thông báo dành cho đơn vị Đoàn"}
                        </div>
                    </div>

                    <div className="organizer-notification-banner-icon">
                        <i className="bi bi-bell-fill"></i>
                    </div>
                </section>

                {/* THỐNG KÊ */}
                <section className="organizer-notification-summary">

                    <div className="notification-summary-card">
                        <div className="notification-summary-icon blue">
                            <i className="bi bi-bell"></i>
                        </div>

                        <div>
                            <span>Tổng thông báo</span>
                            <h3>{visibleNotifications.length}</h3>
                        </div>
                    </div>

                    <div className="notification-summary-card">
                        <div className="notification-summary-icon orange">
                            <i className="bi bi-envelope-exclamation"></i>
                        </div>

                        <div>
                            <span>Chưa đọc</span>
                            <h3>{unreadCount}</h3>
                        </div>
                    </div>

                    <div className="notification-summary-card">
                        <div className="notification-summary-icon green">
                            <i className="bi bi-envelope-check"></i>
                        </div>

                        <div>
                            <span>Đã đọc</span>
                            <h3>{readCount}</h3>
                        </div>
                    </div>

                </section>

                {/* DANH SÁCH */}
                <section className="organizer-notification-list-section">

                    <div className="organizer-notification-toolbar">
                        <div>
                            <h4>Danh sách thông báo</h4>

                            <p>
                                Nhấn vào thông báo để xem nội dung chi tiết.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="notification-read-all-button"
                            onClick={handleMarkAllAsRead}
                            disabled={unreadCount === 0 || markingAll}
                        >
                            <i className="bi bi-check2-all"></i>

                            {markingAll
                                ? "Đang cập nhật..."
                                : "Đánh dấu tất cả đã đọc"}
                        </button>
                    </div>

                    {/* LỌC TRẠNG THÁI */}
                    <div className="organizer-notification-filters">

                        <button
                            type="button"
                            className={
                                activeFilter === "ALL" ? "active" : ""
                            }
                            onClick={() => setActiveFilter("ALL")}
                        >
                            Tất cả
                            <span>{visibleNotifications.length}</span>
                        </button>

                        <button
                            type="button"
                            className={
                                activeFilter === "UNREAD" ? "active" : ""
                            }
                            onClick={() => setActiveFilter("UNREAD")}
                        >
                            Chưa đọc
                            <span>{unreadCount}</span>
                        </button>

                        <button
                            type="button"
                            className={
                                activeFilter === "READ" ? "active" : ""
                            }
                            onClick={() => setActiveFilter("READ")}
                        >
                            Đã đọc
                            <span>{readCount}</span>
                        </button>

                    </div>

                    {/* LỌC LOẠI THÔNG BÁO */}
                    <div className="notification-category-filters">

                        {NOTIFICATION_CATEGORIES
                            .filter((category) => {
                                // Đơn vị Đoàn không cần bộ lọc riêng của CLB.
                                return isClub || category.key !== "CLUB";
                            })
                            .map((category) => (
                                <button
                                    key={category.key}
                                    type="button"
                                    className={
                                        activeCategory === category.key
                                            ? "active"
                                            : ""
                                    }
                                    onClick={() =>
                                        setActiveCategory(category.key)
                                    }
                                >
                                    {category.label}
                                </button>
                            ))}

                    </div>

                    {/* NỘI DUNG */}
                    {loading ? (

                        <div className="organizer-notification-state">
                            <div className="spinner-border text-primary"></div>
                            <p>Đang tải thông báo...</p>
                        </div>

                    ) : error ? (

                        <div className="organizer-notification-state error">
                            <i className="bi bi-exclamation-circle"></i>

                            <p>{error}</p>

                            <button
                                type="button"
                                onClick={fetchNotifications}
                            >
                                <i className="bi bi-arrow-clockwise"></i>
                                Thử lại
                            </button>
                        </div>

                    ) : filteredNotifications.length === 0 ? (

                        <div className="organizer-notification-state">
                            <i className="bi bi-inbox"></i>

                            <h5>Không có thông báo</h5>

                            <p>
                                {activeFilter === "UNREAD"
                                    ? "Bạn đã xem tất cả thông báo trong mục này."
                                    : activeFilter === "READ"
                                        ? "Chưa có thông báo đã đọc trong mục này."
                                        : "Thông báo mới sẽ được hiển thị tại đây khi hệ thống có dữ liệu."}
                            </p>

                            {(activeCategory !== "ALL" ||
                                activeFilter !== "ALL") && (
                                <button
                                    type="button"
                                    onClick={handleResetFilters}
                                >
                                    Xóa bộ lọc
                                </button>
                            )}

                            <Link to="/organizer/activities">
                                Xem hoạt động của đơn vị
                            </Link>
                        </div>

                    ) : (

                        <div className="organizer-notification-list">

                            {filteredNotifications.map((item) => {
                                const id = getNotificationId(item);
                                const meta = getNotificationMeta(item);
                                const isRead = isNotificationRead(item);

                                return (
                                    <button
                                        type="button"
                                        key={id}
                                        className={`organizer-notification-card ${
                                            isRead ? "read" : "unread"
                                        }`}
                                        onClick={() => handleOpenDetail(item)}
                                    >
                                        <div
                                            className={`organizer-notification-card-icon ${meta.color}`}
                                        >
                                            <i className={`bi ${meta.icon}`}></i>
                                        </div>

                                        <div className="organizer-notification-card-content">

                                            <div className="organizer-notification-card-heading">
                                                <h6>
                                                    {item.title || "Thông báo"}
                                                </h6>

                                                {!isRead && (
                                                    <span className="organizer-notification-unread-dot"></span>
                                                )}
                                            </div>

                                            <p>
                                                {item.content || "Không có nội dung."}
                                            </p>

                                            <div className="organizer-notification-card-meta">

                                                <span
                                                    className={`notification-category-badge ${meta.color}`}
                                                >
                                                    <i className={`bi ${meta.icon}`}></i>
                                                    {meta.label}
                                                </span>

                                                <small>
                                                    <i className="bi bi-clock"></i>
                                                    {" "}
                                                    {formatNotificationDate(
                                                        item.createdAt || item.created_at
                                                    )}
                                                </small>

                                            </div>
                                        </div>

                                        <i className="bi bi-chevron-right organizer-notification-arrow"></i>
                                    </button>
                                );
                            })}

                        </div>

                    )}

                </section>

            </main>

            <Footer />

            {/* CỬA SỔ CHI TIẾT THÔNG BÁO */}
            <NotificationDetailModal
                notification={selectedNotification}
                role="ORGANIZER"
                canReviewClubRequests={isClub}
                onClose={() => setSelectedNotification(null)}
            />

        </div>
    );
};

export default NontificationOrganizer;
