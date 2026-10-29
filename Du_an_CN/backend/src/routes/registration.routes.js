
const express = require('express');
const router = express.Router();

const registrationController = require('../controllers/registration.controller');

const {
    authenticateToken
} = require('../middlewares/auth.middleware');

const {
    authorizePermission
} = require('../middlewares/authorize.middleware');

// Các API trong file này đều yêu cầu đăng nhập.
router.use(authenticateToken);

// POST /api/registrations/activities/:activityId
// Sinh viên gửi đăng ký tham gia.
router.post(
    '/activities/:activityId',
    authorizePermission('REGISTER_ACTIVITY'),
    registrationController.registerForActivity
);

// DELETE /api/registrations/activities/:activityId/me
// Sinh viên hủy đăng ký của chính mình.
router.delete(
    '/activities/:activityId/me',
    authorizePermission('CANCEL_REGISTRATION'),
    registrationController.cancelMyRegistration
);

// GET /api/registrations/me
// Xem lịch sử đăng ký của chính sinh viên.
router.get(
    '/me',
    authorizePermission('VIEW_OWN_HISTORY'),
    registrationController.getMyRegistrations
);

// GET /api/registrations/activities/:activityId
// Xem danh sách đăng ký của một hoạt động.
router.get(
    '/activities/:activityId',
    authorizePermission('APPROVE_REGISTRATION'),
    registrationController.getActivityRegistrations
);

// PATCH /api/registrations/:registrationId/approve
// Duyệt đăng ký.
router.patch(
    '/:registrationId/approve',
    authorizePermission('APPROVE_REGISTRATION'),
    registrationController.approveRegistration
);

// PATCH /api/registrations/:registrationId/reject
// Từ chối đăng ký.
router.patch(
    '/:registrationId/reject',
    authorizePermission('REJECT_REGISTRATION'),
    registrationController.rejectRegistration
);

module.exports = router;
