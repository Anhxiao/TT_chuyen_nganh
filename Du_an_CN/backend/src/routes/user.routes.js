
const express = require('express');
const router = express.Router();

const userController = require('../controllers/user.controller');

const {
    authenticateToken
} = require('../middlewares/auth.middleware');

const {
    authorizeRoles
} = require('../middlewares/authorize.middleware');

router.use(authenticateToken);

// GET /api/users/me
// Xem hồ sơ của chính mình.
router.get('/me', userController.getMyProfile);

// PUT /api/users/me
// Cập nhật hồ sơ của chính mình.
router.put('/me', userController.updateMyProfile);

// GET /api/users
// Chỉ quản trị viên được xem danh sách tài khoản.
router.get(
    '/',
    authorizeRoles('ADMIN'),
    userController.getUsers
);

// PATCH /api/users/:userId/status
// Chỉ quản trị viên được đổi trạng thái tài khoản.
router.patch(
    '/:userId/status',
    authorizeRoles('ADMIN'),
    userController.updateUserStatus
);

module.exports = router;
