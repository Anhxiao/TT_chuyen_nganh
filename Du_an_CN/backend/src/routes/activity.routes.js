
const express = require('express');
const router = express.Router();

const activityController = require('../controllers/activity.controller');

const {
    authenticateToken
} = require('../middlewares/auth.middleware');

const {
    authorizePermission
} = require('../middlewares/authorize.middleware');

const {
    validateActivity
} = require('../validators/activity.validator');

// GET /api/activities
// Xem danh sách hoạt động.
// Controller/Service cần lọc trạng thái theo quyền xem.
router.get('/', activityController.getActivities);

// GET /api/activities/:activityId
// Xem chi tiết hoạt động.
router.get('/:activityId', activityController.getActivityById);

// POST /api/activities
// Yêu cầu quyền tạo hoạt động.
router.post(
    '/',
    authenticateToken,
    authorizePermission('CREATE_ACTIVITY'),
    validateActivity,
    activityController.createActivity
);


// PUT /api/activities/:activityId
// Yêu cầu quyền cập nhật hoạt động.
router.put(
    '/:activityId',
    authenticateToken,
    authorizePermission('UPDATE_ACTIVITY'),
    validateActivity,
    activityController.updateActivity
);

// PATCH /api/activities/:activityId/publish
// Yêu cầu quyền công bố hoạt động.
router.patch(
    '/:activityId/publish',
    authenticateToken,
    authorizePermission('PUBLISH_ACTIVITY'),
    activityController.publishActivity
);

module.exports = router;
