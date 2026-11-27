
const activityService = require('../services/activity.service');

// ======================================================
// 1. LẤY DANH SÁCH HOẠT ĐỘNG
// GET /api/activities
// ======================================================

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

// ======================================================
// 2. LẤY CHI TIẾT HOẠT ĐỘNG
// GET /api/activities/:activityId
// ======================================================

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

// ======================================================
// 3. LẤY THÔNG TIN BẢN NHÁP ĐỂ CHỈNH SỬA
// GET /api/activities/:activityId/edit
// ======================================================

async function getActivityForEdit(req, res, next) {
    try {
        const { activityId } = req.params;
        const actorId = req.user.userId;

        const result = await activityService.getActivityForEdit({
            activityId,
            actorId
        });

        return res.status(200).json({
            success: true,
            message: 'Lấy thông tin bản nháp thành công.',
            data: result
        });
    } catch (error) {
        next(error);
    }
}

// ======================================================
// 4. TẠO HOẠT ĐỘNG
// POST /api/activities
// ======================================================

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

// ======================================================
// 5. CẬP NHẬT HOẠT ĐỘNG
// PUT /api/activities/:activityId
// ======================================================

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

// ======================================================
// 6. CÔNG BỐ HOẠT ĐỘNG
// PATCH /api/activities/:activityId/publish
// ======================================================

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

// ======================================================
// 7. EXPORT
// ======================================================

module.exports = {
    getActivities,
    getActivityById,
    getActivityForEdit,
    createActivity,
    updateActivity,
    publishActivity
};
