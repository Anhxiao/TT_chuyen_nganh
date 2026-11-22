
import api from "./api";

const notificationService = {
    // Lấy thông báo của tài khoản đang đăng nhập
    getMyNotifications: async () => {
        const response = await api.get("/notifications/me");

        const body = response?.data ?? response;
        const payload = body?.data ?? body;

        const notifications = Array.isArray(payload)
            ? payload
            : Array.isArray(payload?.notifications)
                ? payload.notifications
                : [];

        return {
            notifications,
            pagination: payload?.pagination || {},
            unreadCount: payload?.unreadCount || 0,
        };
    },

    // Lấy chi tiết một thông báo
    getNotificationDetail: async (notificationId) => {
        if (!notificationId) {
            throw new Error("Thiếu mã thông báo.");
        }

        const response = await api.get(
            `/notifications/${notificationId}/detail`
        );

        const body = response?.data ?? response;

        return body?.data ?? body;
    },

    // Đánh dấu một thông báo đã đọc
    markAsRead: async (notificationId) => {
        return api.patch(`/notifications/${notificationId}/read`);
    },

    // Đánh dấu nhiều thông báo đã đọc
    markAllAsRead: async (notificationIds = []) => {
        return Promise.all(
            notificationIds.map((id) =>
                api.patch(`/notifications/${id}/read`)
            )
        );
    },
    // Duyệt hoặc từ chối đơn đăng ký thành viên câu lạc bộ
    reviewClubMembershipRequest: async (
        requestId,
        decision,
        reviewNote = ""
    ) => {
        if (!requestId) {
            throw new Error("Thiếu mã đơn đăng ký thành viên.");
        }

        const normalizedDecision = String(decision || "").toUpperCase();
        const normalizedNote = String(reviewNote || "").trim();

        if (!["APPROVED", "REJECTED"].includes(normalizedDecision)) {
            throw new Error("Quyết định xét duyệt không hợp lệ.");
        }

        if (normalizedDecision === "REJECTED" && !normalizedNote) {
            throw new Error("Vui lòng nhập lý do từ chối đơn đăng ký.");
        }

        if (normalizedNote.length > 1000) {
            throw new Error("Lý do từ chối không được vượt quá 1000 ký tự.");
        }

        const response = await api.patch(
            `/clubs/membership-requests/${requestId}/review`,
            {
                decision: normalizedDecision,
                reviewNote: normalizedNote || null,
            }
        );

        return response?.data?.data ?? response?.data ?? response;
    },

    // Gửi thông báo
    sendNotification: async ({
        title,
        content,
        recipientUserIds,
        notificationType = null,
        relatedType = null,
        relatedId = null,
    }) => {
        return api.post("/notifications", {
            title,
            content,
            recipientUserIds,
            notificationType,
            relatedType,
            relatedId,
        });
    },
};

export default notificationService;
