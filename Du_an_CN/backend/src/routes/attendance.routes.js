
const express = require("express");
const router = express.Router();

const attendanceController = require("../controllers/attendance.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");

// Tạo phiên và mã QR
router.post(
    "/activities/:activityId/sessions",
    authenticateToken,
    attendanceController.createSession
);

// Lấy phiên đang hoạt động
router.get(
    "/activities/:activityId/sessions/active",
    authenticateToken,
    attendanceController.getActiveSession
);

// Sinh viên quét QR để điểm danh
router.post(
    "/check-in",
    authenticateToken,
    attendanceController.checkIn
);

// Danh sách điểm danh
router.get(
    "/activities/:activityId",
    authenticateToken,
    attendanceController.getAttendanceList
);

// Đóng phiên
router.patch(
    "/sessions/:sessionId/close",
    authenticateToken,
    attendanceController.closeSession
);

// Chốt phiên
router.patch(
    "/sessions/:sessionId/finalize",
    authenticateToken,
    attendanceController.finalizeSession
);

module.exports = router;
