
const notificationRepository = require('../repositories/notification.repository');

function createError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

// =====================================
// KIỂM TRA MÃ SỐ
// =====================================

function validatePositiveId(value, message) {
    const id = Number(value);

    if (!Number.isSafeInteger(id) || id <= 0) {
        throw createError(message);
    }

    return id;
}

// =====================================
// LẤY DANH SÁCH THÔNG BÁO
// =====================================

async function getMyNotifications({
    userId,
    unreadOnly = false,
    page = 1,
    limit = 20
}) {
    userId = validatePositiveId(
        userId,
        'Mã tài khoản không hợp lệ.'
    );

    page = Number(page);
    limit = Number(limit);

    if (!Number.isInteger(page) || page < 1) {
        throw createError('Số trang không hợp lệ.');
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        throw createError('Số lượng thông báo mỗi trang không hợp lệ.');
    }

    return notificationRepository.getMyNotifications({
        userId,
        unreadOnly: unreadOnly === true || unreadOnly === 'true',
        page,
        limit
    });
}

// =====================================
// XEM CHI TIẾT THÔNG BÁO
// =====================================

async function getNotificationDetail({
    notificationId,
    userId
}) {
    notificationId = validatePositiveId(
        notificationId,
        'Mã thông báo không hợp lệ.'
    );

    userId = validatePositiveId(
        userId,
        'Mã tài khoản không hợp lệ.'
    );

    const detail = await notificationRepository.getNotificationDetail({
        notificationId,
        userId
    });

    if (!detail) {
        throw createError(
            'Không tìm thấy thông báo hoặc bạn không có quyền xem.',
            404
        );
    }

    return detail;
}

// =====================================
// ĐÁNH DẤU THÔNG BÁO ĐÃ ĐỌC
// =====================================

async function markAsRead({
    notificationId,
    userId
}) {
    notificationId = validatePositiveId(
        notificationId,
        'Mã thông báo không hợp lệ.'
    );

    userId = validatePositiveId(
        userId,
        'Mã tài khoản không hợp lệ.'
    );

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
        notificationId,
        isRead: true
    };
}

// =====================================
// GỬI THÔNG BÁO
// =====================================

async function sendNotification({
    senderId,
    title,
    content,
    recipientUserIds,
    notificationType = null,
    relatedType = null,
    relatedId = null
}) {
    senderId = validatePositiveId(
        senderId,
        'Mã tài khoản người gửi không hợp lệ.'
    );

    if (!title || !String(title).trim()) {
        throw createError(
            'Tiêu đề thông báo không được để trống.'
        );
    }

    if (!content || !String(content).trim()) {
        throw createError(
            'Nội dung thông báo không được để trống.'
        );
    }

    if (
        !Array.isArray(recipientUserIds) ||
        recipientUserIds.length === 0
    ) {
        throw createError(
            'Vui lòng chọn ít nhất một người nhận.'
        );
    }

    const normalizedIds = [
        ...new Set(
            recipientUserIds.map(id =>
                validatePositiveId(
                    id,
                    'Danh sách người nhận chứa mã tài khoản không hợp lệ.'
                )
            )
        )
    ];

    let normalizedRelatedId = null;

    if (
        relatedId !== null &&
        relatedId !== undefined &&
        relatedId !== ''
    ) {
        normalizedRelatedId = validatePositiveId(
            relatedId,
            'Mã dữ liệu liên quan không hợp lệ.'
        );
    }

    return notificationRepository.sendNotification({
        senderId,
        title: String(title).trim(),
        content: String(content).trim(),
        recipientUserIds: normalizedIds,
        notificationType: notificationType
            ? String(notificationType).trim()
            : null,
        relatedType: relatedType
            ? String(relatedType).trim()
            : null,
        relatedId: normalizedRelatedId
    });
}

// =====================================
// EXPORT
// =====================================

module.exports = {
    getMyNotifications,
    getNotificationDetail,
    markAsRead,
    sendNotification
};
