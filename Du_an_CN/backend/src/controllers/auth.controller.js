
const authService = require('../services/auth.service');

async function login(req, res, next) {
    try {
        const { email, password, role } = req.body;

        const result = await authService.login({
            email,
            password,
            role
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

async function getCurrentUser(req, res, next) {
    try {
        const userId = req.user.userId;
        const role = req.user.role;

        const result = await authService.getCurrentUser(
            userId,
            role
        );

        return res.status(200).json({
            success: true,
            message: 'Lấy thông tin tài khoản thành công.',
            data: result
        });

    } catch (error) {
        next(error);
    }
}

/**
 * Cập nhật hồ sơ cá nhân.
 */
async function updateProfile(req, res, next) {
    try {
        const userId = req.user.userId;
        const role = req.user.role;

        const result = await authService.updateProfile(
            userId,
            role,
            req.body
        );

        return res.status(200).json({
            success: true,
            message: 'Cập nhật thông tin cá nhân thành công.',
            data: result
        });

    } catch (error) {
        next(error);
    }
}

/**
 * Upload và cập nhật ảnh đại diện.
 */
async function updateAvatar(req, res, next) {
    try {
        const userId = req.user.userId;
        const role = req.user.role;

        const result = await authService.updateAvatar(
            userId,
            role,
            req.file
        );

        return res.status(200).json({
            success: true,
            message: 'Cập nhật ảnh đại diện thành công.',
            data: result
        });

    } catch (error) {
        next(error);
    }
}

module.exports = {
    login,
    logout,
    getCurrentUser,
    updateProfile,
    updateAvatar
};
