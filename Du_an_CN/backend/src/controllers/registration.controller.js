
const registrationService = require('../services/registration.service');

/**
 * POST /api/activities/:activityId/registrations
 * Sinh viên đăng ký tham gia hoạt động.
 */
async function registerForActivity(req, res, next) {
    try {
        const { activityId } = req.params;
        const studentUserId = req.user.userId;

        const result = await registrationService.registerForActivity({
            activityId,
            studentUserId
        });

        return res.status(201).json({
            success: true,
            message: 'Gửi đăng ký tham gia thành công.',
            data: result
        });
    } catch (error) {
        next(error);
    }
}

/**
 * DELETE /api/activities/:activityId/registrations/me
 * Sinh viên hủy đăng ký của chính mình.
 */
async function cancelMyRegistration(req, res, next) {
    try {
        const { activityId } = req.params;
        const studentUserId = req.user.userId;

        const result = await registrationService.cancelMyRegistration({
            activityId,
            studentUserId
        });

        return res.status(200).json({
            success: true,
            message: 'Hủy đăng ký thành công.',
            data: result
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/registrations/me
 * Xem lịch sử đăng ký của chính sinh viên.
 */
async function getMyRegistrations(req, res, next) {
    try {
        const studentUserId = req.user.userId;

        const result = await registrationService.getMyRegistrations({
            studentUserId,
            status: req.query.status,
            page: req.query.page,
            limit: req.query.limit
        });

        return res.status(200).json({
            success: true,
            message: 'Lấy lịch sử đăng ký thành công.',
            data: result
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/activities/:activityId/registrations
 * Đơn vị tổ chức xem danh sách đăng ký của hoạt động.
 */
async function getActivityRegistrations(req, res, next) {
    try {
        const { activityId } = req.params;

        const result = await registrationService.getActivityRegistrations({
            activityId,
            actorId: req.user.userId,
            status: req.query.status,
            page: req.query.page,
            limit: req.query.limit
        });

        return res.status(200).json({
            success: true,
            message: 'Lấy danh sách đăng ký thành công.',
            data: result
        });
    } catch (error) {
        next(error);
    }
}

/**
 * PATCH /api/registrations/:registrationId/approve
 * Duyệt một đăng ký.
 */
async function approveRegistration(req, res, next) {
    try {
        const { registrationId } = req.params;
        const actorId = req.user.userId;
        const { note } = req.body;

        const result = await registrationService.approveRegistration({
            registrationId,
            actorId,
            note
        });

        return res.status(200).json({
            success: true,
            message: 'Duyệt đăng ký thành công.',
            data: result
        });
    } catch (error) {
        next(error);
    }
}

/**
 * PATCH /api/registrations/:registrationId/reject
 * Từ chối một đăng ký.
 */
async function rejectRegistration(req, res, next) {
    try {
        const { registrationId } = req.params;
        const actorId = req.user.userId;
        const { note } = req.body;

        const result = await registrationService.rejectRegistration({
            registrationId,
            actorId,
            note
        });

        return res.status(200).json({
            success: true,
            message: 'Từ chối đăng ký thành công.',
            data: result
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    registerForActivity,
    cancelMyRegistration,
    getMyRegistrations,
    getActivityRegistrations,
    approveRegistration,
    rejectRegistration
};
