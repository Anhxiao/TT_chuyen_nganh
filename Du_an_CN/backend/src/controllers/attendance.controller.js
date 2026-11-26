const attendanceService = require("../services/attendance.service");


function getUserId(req) {
    return (
        req.user?.userId ??
        req.user?.user_id ??
        req.user?.id ??
        null
    );
}

function getRole(req) {
    return String(
        req.user?.role ??
        req.user?.role_code ??
        req.user?.roleCode ??
        ""
    ).toUpperCase();
}

function sendError(res, error) {
    const message = error.message || "Đã xảy ra lỗi máy chủ.";

    let statusCode = 500;

    if (
        message.includes("Không tìm thấy") ||
        message.includes("không tồn tại")
    ) {
        statusCode = 404;
    } else if (
        message.includes("Chỉ hoạt động") ||
        message.includes("không hợp lệ") ||
        message.includes("đã đóng") ||
        message.includes("hết hạn") ||
        message.includes("chưa được duyệt")
    ) {
        statusCode = 400;
    }

    return res.status(statusCode).json({
        success: false,
        message
    });
}

const attendanceController = {
    // POST /activities/:activityId/sessions
    async createSession(req, res) {
        try {
            const userId = getUserId(req);
            const role = getRole(req);
            const activityId = Number(req.params.activityId);

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Bạn cần đăng nhập."
                });
            }

            if (!["ORGANIZER", "ADMIN"].includes(role)) {
                return res.status(403).json({
                    success: false,
                    message: "Bạn không có quyền tạo phiên điểm danh."
                });
            }

            if (!Number.isSafeInteger(activityId) || activityId <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Mã hoạt động không hợp lệ."
                });
            }

            const session = await attendanceService.createSession(
                activityId,
                userId
            );

            return res.status(201).json({
                success: true,
                message: "Tạo phiên điểm danh thành công.",
                data: session
            });
        } catch (error) {
            console.error("Lỗi tạo phiên điểm danh:", error);
            return sendError(res, error);
        }
    },

    // GET /activities/:activityId/sessions/active
    async getActiveSession(req, res) {
        try {
            const userId = getUserId(req);
            const role = getRole(req);
            const activityId = Number(req.params.activityId);

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Bạn cần đăng nhập."
                });
            }

            if (!["ORGANIZER", "ADMIN"].includes(role)) {
                return res.status(403).json({
                    success: false,
                    message: "Bạn không có quyền xem phiên điểm danh."
                });
            }

            const session = await attendanceService.getActiveSession(activityId);

            return res.json({
                success: true,
                data: session
            });
        } catch (error) {
            console.error("Lỗi lấy phiên điểm danh:", error);
            return sendError(res, error);
        }
    },

    // POST /check-in
    async checkIn(req, res) {
        try {
            const userId = getUserId(req);
            const role = getRole(req);
            const { sessionToken } = req.body || {};

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Bạn cần đăng nhập."
                });
            }

            if (role !== "STUDENT") {
                return res.status(403).json({
                    success: false,
                    message: "Chỉ sinh viên mới được điểm danh."
                });
            }

            const result = await attendanceService.checkIn(
                sessionToken,
                userId
            );

            return res.json({
                success: true,
                message: "Điểm danh thành công.",
                data: result
            });
        } catch (error) {
            console.error("Lỗi sinh viên điểm danh:", error);
            return sendError(res, error);
        }
    },

    // GET /activities/:activityId
    async getAttendanceList(req, res) {
        try {
            const userId = getUserId(req);
            const role = getRole(req);
            const activityId = Number(req.params.activityId);

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Bạn cần đăng nhập."
                });
            }

            if (!["ORGANIZER", "ADMIN"].includes(role)) {
                return res.status(403).json({
                    success: false,
                    message: "Bạn không có quyền xem danh sách điểm danh."
                });
            }

            const list = await attendanceService.getAttendanceList(activityId);

            return res.json({
                success: true,
                data: list
            });
        } catch (error) {
            console.error("Lỗi lấy danh sách điểm danh:", error);
            return sendError(res, error);
        }
    },

    // PATCH /sessions/:sessionId/close
    async closeSession(req, res) {
        try {
            const userId = getUserId(req);
            const role = getRole(req);
            const sessionId = Number(req.params.sessionId);

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Bạn cần đăng nhập."
                });
            }

            if (!["ORGANIZER", "ADMIN"].includes(role)) {
                return res.status(403).json({
                    success: false,
                    message: "Bạn không có quyền đóng phiên điểm danh."
                });
            }

            const result = await attendanceService.closeSession(sessionId);

            return res.json({
                success: true,
                message: "Đã đóng phiên điểm danh.",
                data: result
            });
        } catch (error) {
            console.error("Lỗi đóng phiên điểm danh:", error);
            return sendError(res, error);
        }
    },

    // PATCH /sessions/:sessionId/finalize
    async finalizeSession(req, res) {
        try {
            const userId = getUserId(req);
            const role = getRole(req);
            const sessionId = Number(req.params.sessionId);

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Bạn cần đăng nhập."
                });
            }

            if (!["ORGANIZER", "ADMIN"].includes(role)) {
                return res.status(403).json({
                    success: false,
                    message: "Bạn không có quyền chốt phiên điểm danh."
                });
            }

            // Đóng phiên là bước chốt phiên.
            const result = await attendanceService.closeSession(sessionId);

            return res.json({
                success: true,
                message: "Đã chốt phiên điểm danh.",
                data: result
            });
        } catch (error) {
            console.error("Lỗi chốt phiên điểm danh:", error);
            return sendError(res, error);
        }
    }
};

module.exports = attendanceController;