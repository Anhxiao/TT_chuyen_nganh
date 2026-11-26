const attendanceRepository = require("../repositories/attendance.repository");

const {
    generateSessionToken,
    hashSessionToken
} = require("../utils/attendance-token.util");

const attendanceService = {
    // Tạo phiên điểm danh, mặc định hiệu lực 8 giờ
    async createSession(activityId, organizerId) {
        const token = generateSessionToken();
        const tokenHash = hashSessionToken(token);

        const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);

        const session = await attendanceRepository.createSession(
            activityId,
            tokenHash,
            expiresAt,
            organizerId
        );

        return {
            ...session,
            session_token: token
        };
    },

    // Lấy phiên đang hoạt động và cấp lại token QR mới
    async getActiveSession(activityId) {
        const session = await attendanceRepository.getActiveSession(activityId);

        if (!session) {
            return null;
        }

        const token = generateSessionToken();
        const tokenHash = hashSessionToken(token);

        const updatedSession = await attendanceRepository.updateSessionToken(
            session.session_id,
            tokenHash
        );

        if (!updatedSession) {
            return null;
        }

        return {
            ...updatedSession,
            session_token: token
        };
    },

    async closeSession(sessionId) {
        const session = await attendanceRepository.closeSession(sessionId);

        if (!session) {
            throw new Error("Không tìm thấy phiên hoặc phiên đã đóng.");
        }

        return session;
    },

    async checkIn(sessionToken, userId) {
        if (!sessionToken || typeof sessionToken !== "string") {
            throw new Error("Mã QR không hợp lệ.");
        }

        const tokenHash = hashSessionToken(sessionToken);

        return attendanceRepository.checkIn(tokenHash, userId);
    },

    async getAttendanceList(activityId) {
        return attendanceRepository.getAttendanceList(activityId);
    }
};

module.exports = attendanceService;