const notificationRepository = require('../repositories/notification.repository');

function createError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

async function getMyNotifications({
    userId,
    unreadOnly = false,
    page = 1,
    limit = 20
}) {
    page = Number(page);
    limit = Number(limit);

    if (!Number.isInteger(page) || page < 1 ||
        !Number.isInteger(limit) || limit < 1 || limit > 100) {
        throw createError('Thông tin phân trang không hợp lệ.');
    }

    const normalizedUnreadOnly =
        unreadOnly === true ||
        unreadOnly === 'true' ||
        unreadOnly === '1';

    return notificationRepository.getMyNotifications({
        userId,
        unreadOnly: normalizedUnreadOnly,
        page,
        limit
    });
}

async function markAsRead({ notificationId, userId }) {
    if (!Number.isInteger(Number(notificationId)) ||
        Number(notificationId) <= 0) {
        throw createError('Mã thông báo không hợp lệ.');
    }

    const updated = await notificationRepository.markAsRead({
        notificationId,
        userId
    });

    if (!updated) {
        throw createError(
            'Không tìm thấy thông báo hoặc bạn không có quyền cập nhật.',
            404
        );
    }

    return {
        notificationId: Number(notificationId),
        isRead: true
    };
}

async function sendNotification({
    senderId,
    title,
    content,
    recipientUserIds
}) {
    if (!title || !String(title).trim()) {
        throw createError('Tiêu đề thông báo không được để trống.');
    }

    if (!content || !String(content).trim()) {
        throw createError('Nội dung thông báo không được để trống.');
    }

    if (!Array.isArray(recipientUserIds) ||
        recipientUserIds.length === 0) {
        throw createError('Vui lòng chọn ít nhất một người nhận.');
    }

    const normalizedIds = [
        ...new Set(
            recipientUserIds.map(id => {
                const parsedId = Number(id);

                if (!Number.isSafeInteger(parsedId) || parsedId <= 0) {
                    throw createError('Danh sách người nhận chứa mã tài khoản không hợp lệ.');
                }

                return parsedId;
            })
        )
    ];

    return notificationRepository.sendNotification({
        senderId,
        title: String(title).trim(),
        content: String(content).trim(),
        recipientUserIds: normalizedIds
    });
}

module.exports = {
    getMyNotifications,
    markAsRead,
    sendNotification
};