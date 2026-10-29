
const express = require('express');
const router = express.Router();

const notificationController = require('../controllers/notification.controller');

const {
    authenticateToken
} = require('../middlewares/auth.middleware');

const {
    authorizePermission
} = require('../middlewares/authorize.middleware');

router.use(authenticateToken);

// GET /api/notifications/me
// Xem thông báo của tài khoản hiện tại.
router.get(
    '/me',
    notificationController.getMyNotifications
);

// PATCH /api/notifications/:notificationId/read
// Đánh dấu thông báo của chính người dùng đã đọc.
router.patch(
    '/:notificationId/read',
    notificationController.markAsRead
);

// POST /api/notifications
// Gửi thông báo.
router.post(
    '/',
    authorizePermission('SEND_NOTIFICATION'),
    notificationController.sendNotification
);

module.exports = router;
