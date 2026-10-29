
const userService = require('../services/user.service');

/**
 * GET /api/users/me
 * Xem hồ sơ của chính người dùng đang đăng nhập.
 */
async function getMyProfile(req, res, next) {
    try {
        const userId = req.user.userId;

        const result = await userService.getMyProfile(userId);

        return res.status(200).json({
            success: true,
            message: 'Lấy hồ sơ thành công.',
            data: result
        });
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/users/me
 * Cập nhật hồ sơ của chính người dùng.
 */
async function updateMyProfile(req, res, next) {
    try {
        const userId = req.user.userId;
        const profileData = req.body;

        const result = await userService.updateMyProfile(
            userId,
            profileData
        );

        return res.status(200).json({
            success: true,
            message: 'Cập nhật hồ sơ thành công.',
            data: result
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/users
 * Quản trị viên xem danh sách tài khoản.
 */
async function getUsers(req, res, next) {
    try {
        const result = await userService.getUsers({
            keyword: req.query.keyword,
            status: req.query.status,
            page: req.query.page,
            limit: req.query.limit
        });

        return res.status(200).json({
            success: true,
            message: 'Lấy danh sách tài khoản thành công.',
            data: result
        });
    } catch (error) {
        next(error);
    }
}

/**
 * PATCH /api/users/:userId/status
 * Quản trị viên thay đổi trạng thái tài khoản.
 */
async function updateUserStatus(req, res, next) {
    try {
        const { userId } = req.params;
        const { status } = req.body;
        const actorId = req.user.userId;

        const result = await userService.updateUserStatus({
            userId,
            status,
            actorId
        });

        return res.status(200).json({
            success: true,
            message: 'Cập nhật trạng thái tài khoản thành công.',
            data: result
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getMyProfile,
    updateMyProfile,
    getUsers,
    updateUserStatus
};
