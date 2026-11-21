
const express = require('express');
const router = express.Router();

const { validateLogin } = require('../validators/auth.validator');
const authController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const uploadAvatar = require('../middlewares/avatar-upload.middleware');

// Đăng nhập
router.post(
    '/login',
    validateLogin,
    authController.login
);

// Đăng xuất
router.post(
    '/logout',
    authenticateToken,
    authController.logout
);

// Lấy thông tin tài khoản hiện tại
router.get(
    '/me',
    authenticateToken,
    authController.getCurrentUser
);

// Cập nhật thông tin cá nhân
router.put(
    '/profile',
    authenticateToken,
    authController.updateProfile
);

// Cập nhật ảnh đại diện
router.put(
    '/avatar',
    authenticateToken,
    uploadAvatar.single('avatar'),
    authController.updateAvatar
);

module.exports = router;
