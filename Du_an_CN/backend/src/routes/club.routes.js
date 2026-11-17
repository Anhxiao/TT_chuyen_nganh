
const express = require('express');

const router = express.Router();

const clubController = require('../controllers/club.controller');

const {
    authenticateToken
} = require('../middlewares/auth.middleware');

const {
    authorizeRoles
} = require('../middlewares/authorize.middleware');

// Tất cả API trong file này đều yêu cầu đăng nhập.
router.use(authenticateToken);

// ==========================================
// SINH VIÊN
// ==========================================

// Xem danh sách CLB.
router.get(
    '/',
    authorizeRoles('STUDENT'),
    clubController.getClubs
);

// Gửi đơn đăng ký thành viên.
router.post(
    '/:clubId/apply',
    authorizeRoles('STUDENT'),
    clubController.apply
);

// Xem lịch sử đăng ký của bản thân.
router.get(
    '/my-requests',
    authorizeRoles('STUDENT'),
    clubController.getMyRequests
);

// ==========================================
// QUẢN TRỊ CÂU LẠC BỘ
// ==========================================

// Xem đơn đăng ký thuộc CLB mình quản lý.
router.get(
    '/membership-requests',
    authorizeRoles('ORGANIZER'),
    clubController.getClubRequests
);

// Chấp nhận hoặc từ chối đơn.
router.patch(
    '/membership-requests/:requestId/review',
    authorizeRoles('ORGANIZER'),
    clubController.review
);

module.exports = router;
