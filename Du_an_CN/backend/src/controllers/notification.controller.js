
const notificationService = require('../services/notification.service');

/**
 * GET /api/notifications/me
 * Xem thông báo của người đang đăng nhập.
 */
async function getMyNotifications(req, res, next) {
    try {
        const userId = req.user.userId;

        const result = await notificationService.getMyNotifications({
            userId,
            unreadOnly: req.query.unreadOnly,
            page: req.query.page,
            limit: req.query.limit
        });

        return res.status(200).json({
            success: true,
            message: 'Lấy danh sách thông báo thành công.',
            data: result
        });
    } catch (error) {
        next(error);
    }
}

/**
 * PATCH /api/notifications/:notificationId/read
 * Đánh dấu thông báo của chính người dùng là đã đọc.
 */
async function markAsRead(req, res, next) {
    try {
        const { notificationId } = req.params;
        const userId = req.user.userId;

        const result = await notificationService.markAsRead({
            notificationId,
            userId
        });

        return res.status(200).json({
            success: true,
            message: 'Đánh dấu thông báo đã đọc thành công.',
            data: result
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/notifications
 * Gửi thông báo theo quyền và phạm vi cho phép.
 *
 * Body dự kiến:
 * {
 *   "title": "Thông báo hoạt động",
 *   "content": "Nội dung thông báo",
 *   "recipientUserIds": ["12", "15"]
 * }
 */
async function sendNotification(req, res, next) {
    try {
        const senderId = req.user.userId;

        const {
            title,
            content,
            recipientUserIds
        } = req.body;

        const result = await notificationService.sendNotification({
            senderId,
            title,
            content,
            recipientUserIds
        });

        return res.status(201).json({
            success: true,
            message: 'Gửi thông báo thành công.',
            data: result
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getMyNotifications,
    markAsRead,
    sendNotification
};
