
import React from "react";
import { Link } from "react-router-dom";

const NOTIFICATION_ICONS = {
    ACTIVITY_EXPIRING: "bi-hourglass-split",
    ACTIVITY_STARTING: "bi-calendar-check",
    ACTIVITY_ENDING: "bi-calendar-x",
    ACTIVITY_CREATED: "bi-calendar-plus",
    CLUB_MEMBER_REQUEST: "bi-person-plus",
    CLUB_ACTIVITY_REGISTRATION: "bi-people",
    DEFAULT: "bi-bell"
};

const Notification = ({ notification, onRead }) => {
    // Chuẩn hóa ID
    const notificationId =
        notification.notificationId ??
        notification.notification_id ??
        notification.id;

    // Loại thông báo
    const type = String(
        notification.type || "DEFAULT"
    ).toUpperCase();

    const icon =
        NOTIFICATION_ICONS[type] ||
        NOTIFICATION_ICONS.DEFAULT;

    // Trạng thái đã đọc
    const readValue =
        notification.isRead ??
        notification.is_read ??
        notification.is_read === 1 ??
        notification.status === "READ";

    const isRead =
        readValue === true ||
        readValue === 1 ||
        readValue === "1" ||
        String(readValue).toUpperCase() === "READ";

    // Nội dung
    const title =
        notification.title ||
        "Thông báo mới";

    const content =
        notification.content ||
        notification.message ||
        "Bạn có một thông báo mới.";

    // Thời gian
    const createdAt =
        notification.createdAt ||
        notification.created_at ||
        notification.createdDate;

    const parsedDate = createdAt
        ? new Date(createdAt)
        : null;

    const formattedDate =
        parsedDate && !Number.isNaN(parsedDate.getTime())
            ? parsedDate.toLocaleString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            })
            : "Chưa xác định thời gian";

    const targetUrl =
        notification.actionUrl ||
        notification.action_url ||
        notification.link ||
        "/organizer/activities";

    const handleRead = () => {
        if (!isRead && notificationId) {
            onRead?.(notificationId);
        }
    };

    return (
        <article
            className={`organizer-notification-item ${
                !isRead ? "unread" : ""
            }`}
        >
            <div className="organizer-notification-icon">
                <i className={`bi ${icon}`}></i>
            </div>

            <div className="organizer-notification-content">
                <div className="organizer-notification-heading">
                    <h6>{title}</h6>

                    {!isRead && (
                        <span className="notification-unread-label">
                            Chưa đọc
                        </span>
                    )}
                </div>

                <p>{content}</p>

                <span className="organizer-notification-time">
                    <i className="bi bi-clock"></i>
                    {" "}
                    {formattedDate}
                </span>

                <div className="organizer-notification-actions">
                    <Link
                        to={targetUrl}
                        className="notification-action-link"
                        onClick={handleRead}
                    >
                        Xem chi tiết
                        <i className="bi bi-arrow-right"></i>
                    </Link>

                    {!isRead && (
                        <button
                            type="button"
                            className="notification-mark-read"
                            onClick={handleRead}
                        >
                            Đánh dấu đã đọc
                        </button>
                    )}
                </div>
            </div>
        </article>
    );
};

export default Notification;
