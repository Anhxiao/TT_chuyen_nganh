
import {
    useEffect,
    useMemo,
    useState,
    useCallback,
} from "react";

import Header from "../components/Header Student";
import Footer from "../components/Footer.jsx";
import NotificationDetailModal from "../components/NotificationDetailModal";

import notificationService from "../services/notificationService";

import {
    NOTIFICATION_CATEGORIES,
    getNotificationMeta,
    getNotificationId,
    isNotificationRead,
    formatNotificationDate,
} from "../utils/notificationUtils";

import "../styles/styles-dashboard.css";
import "../styles/styles-notifications-student.css";

function Notifications() {
    // =====================================
    // STATE
    // =====================================

    const [notifications, setNotifications] = useState([]);

    const [activeTab, setActiveTab] = useState("ALL");
    const [activeCategory, setActiveCategory] = useState("ALL");
    const [sortOrder, setSortOrder] = useState("NEWEST");

    const [selectedNotification, setSelectedNotification] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [markingAll, setMarkingAll] = useState(false);

    // =====================================
    // LẤY THÔNG BÁO TỪ BACKEND
    // =====================================

    const loadNotifications = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const result =
                await notificationService.getMyNotifications();

            const data = Array.isArray(result?.notifications)
                ? result.notifications
                : [];

            setNotifications(
                data.map((item) => ({
                    ...item,
                    notificationId: getNotificationId(item),
                    title: item.title || "Thông báo",
                    content: item.content || "",
                }))
            );
        } catch (err) {
            console.error("Lỗi lấy danh sách thông báo:", err);

            setError(
                err?.response?.data?.message ||
                err?.message ||
                "Không thể tải danh sách thông báo. Vui lòng thử lại."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    // =====================================
    // THỐNG KÊ
    // =====================================

    const unreadCount = useMemo(() => {
        return notifications.filter(
            (item) => !isNotificationRead(item)
        ).length;
    }, [notifications]);

    const readCount = notifications.length - unreadCount;

    // =====================================
    // LỌC VÀ SẮP XẾP
    // =====================================

    const filteredNotifications = useMemo(() => {
        let result = [...notifications];

        // Lọc theo loại thông báo
        if (activeCategory !== "ALL") {
            result = result.filter(
                (item) =>
                    getNotificationMeta(item).category === activeCategory
            );
        }

        // Lọc theo trạng thái
        if (activeTab === "UNREAD") {
            result = result.filter(
                (item) => !isNotificationRead(item)
            );
        }

        if (activeTab === "READ") {
            result = result.filter(
                (item) => isNotificationRead(item)
            );
        }

        // Sắp xếp theo thời gian
        result.sort((a, b) => {
            const dateA = new Date(
                a.createdAt || a.created_at
            ).getTime() || 0;

            const dateB = new Date(
                b.createdAt || b.created_at
            ).getTime() || 0;

            return sortOrder === "NEWEST"
                ? dateB - dateA
                : dateA - dateB;
        });

        return result;
    }, [
        notifications,
        activeTab,
        activeCategory,
        sortOrder,
    ]);

    // =====================================
    // ĐÁNH DẤU MỘT THÔNG BÁO ĐÃ ĐỌC
    // =====================================

    const markAsRead = async (notificationId) => {
        if (!notificationId) return;

        const currentNotification = notifications.find(
            (item) =>
                String(getNotificationId(item)) ===
                String(notificationId)
        );

        if (
            !currentNotification ||
            isNotificationRead(currentNotification)
        ) {
            return;
        }

        try {
            await notificationService.markAsRead(notificationId);

            setNotifications((previous) =>
                previous.map((item) => {
                    if (
                        String(getNotificationId(item)) !==
                        String(notificationId)
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

            // Cập nhật trạng thái trong cửa sổ chi tiết.
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
            console.error("Lỗi đánh dấu thông báo:", err);

            alert(
                err?.response?.data?.message ||
                "Không thể đánh dấu thông báo đã đọc."
            );
        }
    };

    // =====================================
    // MỞ CHI TIẾT THÔNG BÁO
    // =====================================

    const handleOpenDetail = async (item) => {
        setSelectedNotification(item);

        if (!isNotificationRead(item)) {
            await markAsRead(getNotificationId(item));
        }
    };

    // =====================================
    // ĐÁNH DẤU TẤT CẢ ĐÃ ĐỌC
    // =====================================

    const markAllAsRead = async () => {
        const unreadNotifications = notifications.filter(
            (item) => !isNotificationRead(item)
        );

        if (unreadNotifications.length === 0 || markingAll) {
            return;
        }

        try {
            setMarkingAll(true);

            const unreadIds = unreadNotifications
                .map((item) => getNotificationId(item))
                .filter(Boolean);

            await notificationService.markAllAsRead(unreadIds);

            setNotifications((previous) =>
                previous.map((item) => ({
                    ...item,
                    isRead: true,
                    is_read: true,
                    status: "READ",
                }))
            );

            setSelectedNotification((previous) => {
                if (!previous) return previous;

                return {
                    ...previous,
                    isRead: true,
                    is_read: true,
                    status: "READ",
                };
            });
        } catch (err) {
            console.error("Lỗi đánh dấu tất cả thông báo:", err);

            alert(
                err?.response?.data?.message ||
                "Không thể đánh dấu tất cả thông báo đã đọc."
            );

            await loadNotifications();
        } finally {
            setMarkingAll(false);
        }
    };

    // =====================================
    // XÓA BỘ LỌC
    // =====================================

    const resetFilters = () => {
        setActiveTab("ALL");
        setActiveCategory("ALL");
        setSortOrder("NEWEST");
    };

    // =====================================
    // GIAO DIỆN
    // =====================================

    return (
        <div className="dashboard-page">

            <Header role="STUDENT" />

            <main className="dashboard-container container-fluid">

                <div className="notifications-page">

                    {/* TIÊU ĐỀ */}
                    <div className="notifications-heading">

                        <div className="notifications-heading-left">

                            <div className="notifications-heading-icon">
                                <i className="bi bi-bell"></i>
                            </div>

                            <div>
                                <h2>Thông báo</h2>

                                <p>
                                    Theo dõi thông tin hoạt động,
                                    kết quả đăng ký và điểm phục vụ cộng đồng của bạn.
                                </p>
                            </div>

                        </div>

                        <button
                            type="button"
                            className="btn-mark-all"
                            onClick={markAllAsRead}
                            disabled={unreadCount === 0 || markingAll}
                        >
                            <i className="bi bi-check2-all"></i>

                            {markingAll
                                ? "Đang cập nhật..."
                                : "Đánh dấu tất cả đã đọc"}
                        </button>

                    </div>

                    {/* THỐNG KÊ */}
                    <div className="notification-statistics">

                        <div className="notification-stat-card">

                            <div className="notification-stat-icon total">
                                <i className="bi bi-bell"></i>
                            </div>

                            <div className="notification-stat-info">
                                <span>Tổng thông báo</span>
                                <h3>{notifications.length}</h3>
                            </div>

                            <div className="notification-stat-decoration total-decoration"></div>

                        </div>

                        <div className="notification-stat-card">

                            <div className="notification-stat-icon unread">
                                <i className="bi bi-envelope"></i>
                            </div>

                            <div className="notification-stat-info">
                                <span>Chưa đọc</span>
                                <h3>{unreadCount}</h3>
                            </div>

                            <div className="notification-stat-decoration unread-decoration"></div>

                        </div>

                        <div className="notification-stat-card">

                            <div className="notification-stat-icon read">
                                <i className="bi bi-envelope-check"></i>
                            </div>

                            <div className="notification-stat-info">
                                <span>Đã đọc</span>
                                <h3>{readCount}</h3>
                            </div>

                            <div className="notification-stat-decoration read-decoration"></div>

                        </div>

                    </div>

                    {/* DANH SÁCH THÔNG BÁO */}
                    <section className="notification-content">

                        <div className="notification-content-header">

                            <div>
                                <h5>Danh sách thông báo</h5>

                                <p>
                                    Nhấn vào từng thông báo để xem nội dung chi tiết.
                                </p>
                            </div>

                        </div>

                        {/* LỌC TRẠNG THÁI VÀ SẮP XẾP */}
                        <div className="notification-toolbar">

                            <div className="notification-tabs">

                                {[
                                    {
                                        key: "ALL",
                                        label: "Tất cả",
                                        count: notifications.length,
                                    },
                                    {
                                        key: "UNREAD",
                                        label: "Chưa đọc",
                                        count: unreadCount,
                                    },
                                    {
                                        key: "READ",
                                        label: "Đã đọc",
                                        count: readCount,
                                    },
                                ].map((tab) => (
                                    <button
                                        type="button"
                                        key={tab.key}
                                        className={`notification-tab ${
                                            activeTab === tab.key ? "active" : ""
                                        }`}
                                        onClick={() => setActiveTab(tab.key)}
                                    >
                                        {tab.label}
                                        <span>{tab.count}</span>
                                    </button>
                                ))}

                            </div>

                            <div className="notification-sort">

                                <i className="bi bi-filter-left"></i>

                                <select
                                    value={sortOrder}
                                    onChange={(e) =>
                                        setSortOrder(e.target.value)
                                    }
                                    aria-label="Sắp xếp thông báo"
                                >
                                    <option value="NEWEST">
                                        Mới nhất
                                    </option>

                                    <option value="OLDEST">
                                        Cũ nhất
                                    </option>
                                </select>

                                <i className="bi bi-chevron-down sort-arrow"></i>

                            </div>

                        </div>

                        {/* LỌC LOẠI THÔNG BÁO */}
                        <div className="notification-category-filters">

                            {NOTIFICATION_CATEGORIES.map((category) => (
                                <button
                                    type="button"
                                    key={category.key}
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

                        {/* DANH SÁCH */}
                        <div className="notification-list">

                            {loading ? (

                                <div className="notification-empty">

                                    <div className="notification-empty-icon">
                                        <i className="bi bi-arrow-repeat"></i>
                                    </div>

                                    <h5>Đang tải thông báo...</h5>

                                    <p>
                                        Vui lòng chờ trong giây lát.
                                    </p>

                                </div>

                            ) : error ? (

                                <div className="notification-empty">

                                    <div className="notification-empty-icon">
                                        <i className="bi bi-exclamation-circle"></i>
                                    </div>

                                    <h5>Không thể tải thông báo</h5>

                                    <p>{error}</p>

                                    <button
                                        type="button"
                                        className="btn btn-primary mt-3"
                                        onClick={loadNotifications}
                                    >
                                        <i className="bi bi-arrow-clockwise me-2"></i>
                                        Thử lại
                                    </button>

                                </div>

                            ) : filteredNotifications.length === 0 ? (

                                <div className="notification-empty">

                                    <div className="notification-empty-decoration decoration-one">
                                        ✦
                                    </div>

                                    <div className="notification-empty-decoration decoration-two">
                                        ×
                                    </div>

                                    <div className="notification-empty-decoration decoration-three">
                                        ✦
                                    </div>

                                    <div className="notification-empty-icon">
                                        <i className="bi bi-bell-slash"></i>
                                    </div>

                                    <h5>Không có thông báo</h5>

                                    <p>
                                        {activeTab === "UNREAD"
                                            ? "Bạn không có thông báo chưa đọc trong mục này."
                                            : activeTab === "READ"
                                                ? "Bạn chưa có thông báo đã đọc trong mục này."
                                                : activeCategory !== "ALL"
                                                    ? "Chưa có thông báo thuộc loại bạn đang chọn."
                                                    : "Các thông báo về hoạt động và tài khoản sẽ xuất hiện tại đây."}
                                    </p>

                                    {(activeTab !== "ALL" ||
                                        activeCategory !== "ALL" ||
                                        sortOrder !== "NEWEST") && (
                                        <button
                                            type="button"
                                            className="btn btn-outline-primary mt-3"
                                            onClick={resetFilters}
                                        >
                                            Xóa bộ lọc
                                        </button>
                                    )}

                                </div>

                            ) : (

                                <div className="notification-list-items">

                                    {filteredNotifications.map((item) => {
                                        const id = getNotificationId(item);
                                        const meta = getNotificationMeta(item);
                                        const isRead = isNotificationRead(item);

                                        return (
                                            <button
                                                type="button"
                                                key={id}
                                                className={`notification-item ${
                                                    !isRead ? "unread-item" : ""
                                                }`}
                                                onClick={() =>
                                                    handleOpenDetail(item)
                                                }
                                            >

                                                <div className={`notification-item-icon ${meta.color}`}>
                                                    <i className={`bi ${meta.icon}`}></i>
                                                </div>

                                                <div className="notification-item-body">

                                                    <div className="notification-item-title">

                                                        <h6>
                                                            {item.title || "Thông báo"}
                                                        </h6>

                                                        {!isRead && (
                                                            <span className="unread-dot"></span>
                                                        )}

                                                    </div>

                                                    <p>
                                                        {item.content || "Không có nội dung."}
                                                    </p>

                                                    <div className="notification-item-meta">

                                                        <span className={`notification-category-badge ${meta.color}`}>
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

                                                <i className="bi bi-chevron-right notification-item-arrow"></i>

                                            </button>
                                        );
                                    })}

                                </div>

                            )}

                        </div>

                    </section>

                </div>

            </main>

            <Footer />

            {/* CHI TIẾT THÔNG BÁO */}
            <NotificationDetailModal
                notification={selectedNotification}
                role="STUDENT"
                onClose={() => setSelectedNotification(null)}
            />

        </div>
    );
}

export default Notifications;
