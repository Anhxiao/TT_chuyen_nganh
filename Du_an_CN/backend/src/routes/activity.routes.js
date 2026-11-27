
const express = require('express');
const router = express.Router();

const activityController = require('../controllers/activity.controller');

const {
    authenticateToken,
    optionalAuthenticateToken
} = require('../middlewares/auth.middleware');

const {
    authorizePermission
} = require('../middlewares/authorize.middleware');

const {
    validateActivity
} = require('../validators/activity.validator');

// ======================================================
// 1. LẤY DANH SÁCH HOẠT ĐỘNG
// GET /api/activities
// ======================================================

router.get(
    '/',
    optionalAuthenticateToken,
    activityController.getActivities
);

// ======================================================
// 2. LẤY THÔNG TIN BẢN NHÁP ĐỂ CHỈNH SỬA
// GET /api/activities/:activityId/edit
// ======================================================

router.get(
    '/:activityId/edit',
    authenticateToken,
    authorizePermission('UPDATE_ACTIVITY'),
    activityController.getActivityForEdit
);

// ======================================================
// 3. LẤY CHI TIẾT HOẠT ĐỘNG
// GET /api/activities/:activityId
// ======================================================

router.get(
    '/:activityId',
    optionalAuthenticateToken,
    activityController.getActivityById
);

// ======================================================
// 4. TẠO HOẠT ĐỘNG
// POST /api/activities
// ======================================================

router.post(
    '/',
    authenticateToken,
    authorizePermission('CREATE_ACTIVITY'),
    validateActivity,
    activityController.createActivity
);

// ======================================================
// 5. CẬP NHẬT HOẠT ĐỘNG
// PUT /api/activities/:activityId
// ======================================================

router.put(
    '/:activityId',
    authenticateToken,
    authorizePermission('UPDATE_ACTIVITY'),
    validateActivity,
    activityController.updateActivity
);

// ======================================================
// 6. CÔNG BỐ HOẠT ĐỘNG
// PATCH /api/activities/:activityId/publish
// ======================================================

router.patch(
    '/:activityId/publish',
    authenticateToken,
    authorizePermission('PUBLISH_ACTIVITY'),
    activityController.publishActivity
);

module.exports = router;
