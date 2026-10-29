
const authService = require('../services/auth.service');

/**
 * POST /api/auth/login
 * Đăng nhập bằng tài khoản và mật khẩu.
 */
async function login(req, res, next) {
    try {
        const { username, password } = req.body;

        const result = await authService.login({
            username,
            password
        });

        return res.status(200).json({
            success: true,
            message: 'Đăng nhập thành công.',
            data: result
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/auth/logout
 * Với JWT không lưu phiên phía máy chủ, logout thường do
 * Frontend xóa token. Endpoint này không tự thu hồi JWT.
 */
async function logout(req, res, next) {
    try {
        return res.status(200).json({
            success: true,
            message: 'Đăng xuất thành công.',
            data: null
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/auth/me
 * Lấy thông tin tài khoản đang đăng nhập.
 */
async function getCurrentUser(req, res, next) {
    try {
        const userId = req.user.userId;

        const result = await authService.getCurrentUser(userId);

        return res.status(200).json({
            success: true,
            message: 'Lấy thông tin tài khoản thành công.',
            data: result
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    login,
    logout,
    getCurrentUser
};
