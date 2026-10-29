
const activityService = require('../services/activity.service');

/**
 * GET /api/activities
 * Xem danh sách hoạt động được phép hiển thị.
 */
async function getActivities(req, res, next) {
    try {
        const result = await activityService.getActivities({
            keyword: req.query.keyword,
            status: req.query.status,
            organizationId: req.query.organizationId,
            page: req.query.page,
            limit: req.query.limit,
            currentUser: req.user || null
        });

        return res.status(200).json({
            success: true,
            message: 'Lấy danh sách hoạt động thành công.',
            data: result
        });
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/activities/:activityId
 * Xem chi tiết một hoạt động.
 */
async function getActivityById(req, res, next) {
    try {
        const { activityId } = req.params;

        const result = await activityService.getActivityById({
            activityId,
            currentUser: req.user || null
        });

        return res.status(200).json({
            success: true,
            message: 'Lấy chi tiết hoạt động thành công.',
            data: result
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/activities
 * Đơn vị tổ chức tạo hoạt động.
 */
async function createActivity(req, res, next) {
    try {
        const actorId = req.user.userId;

        const result = await activityService.createActivity({
            data: req.body,
            actorId
        });

        return res.status(201).json({
            success: true,
            message: 'Tạo hoạt động thành công.',
            data: result
        });
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/activities/:activityId
 * Cập nhật hoạt động.
 */
async function updateActivity(req, res, next) {
    try {
        const { activityId } = req.params;
        const actorId = req.user.userId;

        const result = await activityService.updateActivity({
            activityId,
            data: req.body,
            actorId
        });

        return res.status(200).json({
            success: true,
            message: 'Cập nhật hoạt động thành công.',
            data: result
        });
    } catch (error) {
        next(error);
    }
}

/**
 * PATCH /api/activities/:activityId/publish
 * Công bố hoạt động.
 */
async function publishActivity(req, res, next) {
    try {
        const { activityId } = req.params;
        const actorId = req.user.userId;

        const result = await activityService.publishActivity({
            activityId,
            actorId
        });

        return res.status(200).json({
            success: true,
            message: 'Công bố hoạt động thành công.',
            data: result
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getActivities,
    getActivityById,
    createActivity,
    updateActivity,
    publishActivity
};
