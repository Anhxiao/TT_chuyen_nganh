
const participationService = require('../services/participation.service');

/**
 * GET /api/activities/:activityId/participation
 * Xem danh sách kết quả điểm danh của hoạt động.
 */
async function getActivityParticipation(req, res, next) {
    try {
        const { activityId } = req.params;

        const result = await participationService.getActivityParticipation({
            activityId,
            actorId: req.user.userId
        });

        return res.status(200).json({
            success: true,
            message: 'Lấy danh sách điểm danh thành công.',
            data: result
        });
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/registrations/:registrationId/participation
 * Xác nhận tình trạng tham gia và ghi nhận điểm.
 *
 * Body dự kiến:
 * {
 *   "attendanceStatus": "ATTENDED",
 *   "activityPoint": 5
 * }
 */
async function confirmParticipation(req, res, next) {
    try {
        const { registrationId } = req.params;
        const actorId = req.user.userId;

        const {
            attendanceStatus,
            activityPoint
        } = req.body;

        const result = await participationService.confirmParticipation({
            registrationId,
            attendanceStatus,
            activityPoint,
            actorId
        });

        return res.status(200).json({
            success: true,
            message: 'Xác nhận tham gia thành công.',
            data: result
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getActivityParticipation,
    confirmParticipation
};
