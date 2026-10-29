
const express = require('express');
const router = express.Router();

const participationController = require('../controllers/participation.controller');

const {
    authenticateToken
} = require('../middlewares/auth.middleware');

const {
    authorizePermission
} = require('../middlewares/authorize.middleware');

router.use(authenticateToken);

// GET /api/participation/activities/:activityId
// Xem danh sách điểm danh.
router.get(
    '/activities/:activityId',
    authorizePermission('ASSIGN_POINTS'),
    participationController.getActivityParticipation
);

// PUT /api/participation/registrations/:registrationId
// Xác nhận tham gia và ghi nhận điểm.
router.put(
    '/registrations/:registrationId',
    authorizePermission('ASSIGN_POINTS'),
    participationController.confirmParticipation
);

module.exports = router;
