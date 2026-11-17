
import { useMemo, useState } from "react";

import Header from "../components/Header Student Nontifications.jsx";
import Footer from "../components/Footer.jsx";

import "../styles/styles-dashboard.css";
import "../styles/styles-notifications-student.css";

function Notifications() {
    const [activeTab, setActiveTab] = useState("ALL");
    const [sortOrder, setSortOrder] = useState("NEWEST");
    const [notifications, setNotifications] = useState([]);

    const unreadCount = notifications.filter(
        (item) => !item.isRead
    ).length;

    const readCount = notifications.length - unreadCount;

    const filteredNotifications = useMemo(() => {
        let result = [...notifications];

        if (activeTab === "UNREAD") {
            result = result.filter((item) => !item.isRead);
        }

        if (activeTab === "READ") {
            result = result.filter((item) => item.isRead);
        }

        result.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();

            return sortOrder === "NEWEST"
                ? dateB - dateA
                : dateA - dateB;
        });

        return result;
    }, [notifications, activeTab, sortOrder]);

    const markAllAsRead = () => {
        setNotifications((previous) =>
            previous.map((item) => ({
                ...item,
                isRead: true,
            }))
        );
    };

    const markAsRead = (id) => {
        setNotifications((previous) =>
            previous.map((item) =>
                item.notificationId === id
                    ? { ...item, isRead: true }
                    : item
            )
        );
    };

    return (
        <div className="dashboard-page">
            <Header role="STUDENT" />

            <main className="dashboard-container container-fluid">
                <div className="notifications-page">

                    {/* Tiêu đề trang */}
                    <div className="notifications-heading">
                        <div className="notifications-heading-left">
                            <div className="notifications-heading-icon">
                                <i className="bi bi-bell"></i>
                            </div>

                            <div>
                                <h2>Thông báo</h2>
                                <p>
                                    Theo dõi các thông tin và cập nhật hoạt động của bạn.
                                </p>
                            </div>
                        </div>

                        <button
                            className="btn-mark-all"
                            onClick={markAllAsRead}
                            disabled={unreadCount === 0}
                        >
                            <i className="bi bi-check2-all"></i>
                            Đánh dấu tất cả đã đọc
                        </button>
                    </div>

                    {/* Thống kê */}
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

                    {/* Danh sách thông báo */}
                    <section className="notification-content">

                        <div className="notification-content-header">
                            <div>
                                <h5>Danh sách thông báo</h5>
                                <p>
                                    Các thông báo mới nhất được hiển thị ở đây.
                                </p>
                            </div>
                        </div>

                        {/* Bộ lọc */}
                        <div className="notification-toolbar">

                            <div className="notification-tabs">
                                {[
                                    {
                                        key: "ALL",
                                        label: "Tất cả",
                                        count: notifications.length
                                    },
                                    {
                                        key: "UNREAD",
                                        label: "Chưa đọc",
                                        count: unreadCount
                                    },
                                    {
                                        key: "READ",
                                        label: "Đã đọc",
                                        count: readCount
                                    }
                                ].map((tab) => (
                                    <button
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
                                    onChange={(e) => setSortOrder(e.target.value)}
                                    aria-label="Sắp xếp thông báo"
                                >
                                    <option value="NEWEST">Mới nhất</option>
                                    <option value="OLDEST">Cũ nhất</option>
                                </select>

                                <i className="bi bi-chevron-down sort-arrow"></i>
                            </div>

                        </div>

                        {/* Nội dung */}
                        <div className="notification-list">

                            {filteredNotifications.length === 0 ? (
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
                                            ? "Bạn không có thông báo chưa đọc."
                                            : activeTab === "READ"
                                                ? "Bạn chưa có thông báo đã đọc."
                                                : "Các thông báo về hoạt động và tài khoản sẽ xuất hiện tại đây."
                                        }
                                    </p>

                                </div>
                            ) : (
                                filteredNotifications.map((item) => (
                                    <div
                                        key={item.notificationId}
                                        className={`notification-item ${
                                            !item.isRead ? "unread-item" : ""
                                        }`}
                                        onClick={() =>
                                            markAsRead(item.notificationId)
                                        }
                                    >
                                        <div className="notification-item-icon">
                                            <i className={`bi ${item.icon || "bi-bell"}`}></i>
                                        </div>

                                        <div className="notification-item-body">

                                            <div className="notification-item-title">
                                                <h6>{item.title}</h6>

                                                {!item.isRead && (
                                                    <span className="unread-dot"></span>
                                                )}
                                            </div>

                                            <p>{item.message}</p>

                                            <small>
                                                <i className="bi bi-clock"></i>
                                                {item.createdAt}
                                            </small>

                                        </div>
                                    </div>
                                ))
                            )}

                        </div>

                    </section>

                </div>
            </main>

            <Footer />
        </div>
    );
}

export default Notifications;
