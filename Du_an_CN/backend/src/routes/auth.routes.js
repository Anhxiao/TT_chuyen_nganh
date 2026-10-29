
const express = require('express');
const router = express.Router();
const { validateLogin } = require('../validators/auth.validator');
const authController = require('../controllers/auth.controller');
const {
    authenticateToken
} = require('../middlewares/auth.middleware');

// POST /api/auth/login
// Đăng nhập, không yêu cầu JWT.
router.post('/login', authController.login);

// POST /api/auth/logout
// Yêu cầu đăng nhập.
router.post('/login', validateLogin, authController.login);

// GET /api/auth/me
// Lấy thông tin tài khoản hiện tại.
router.get(
    '/me',
    authenticateToken,
    authController.getCurrentUser
);

module.exports = router;
