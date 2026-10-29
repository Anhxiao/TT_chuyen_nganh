const participationRepository = require('../repositories/participation.repository');
const registrationRepository = require('../repositories/registration.repository');
const activityRepository = require('../repositories/activity.repository');

function createError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

async function getActivityParticipation({ activityId, actorId }) {
    const activity = await activityRepository.findById(activityId);

    if (!activity) {
        throw createError('Không tìm thấy hoạt động.', 404);
    }

    const isMember = await activityRepository.isOrganizationMember(
        actorId,
        activity.organization_id
    );

    if (!isMember) {
        throw createError('Bạn không có quyền xem danh sách điểm danh.', 403);
    }

    return participationRepository.getActivityParticipation(activityId);
}

async function confirmParticipation({
    registrationId,
    attendanceStatus,
    activityPoint,
    actorId
}) {
    const allowedStatuses = ['ATTENDED', 'PARTIAL', 'ABSENT'];

    if (!allowedStatuses.includes(attendanceStatus)) {
        throw createError('Trạng thái tham gia không hợp lệ.');
    }

    const point = Number(activityPoint);

    if (!Number.isInteger(point) || point < 0) {
        throw createError('Điểm hoạt động phải là số nguyên không âm.');
    }

    if (attendanceStatus === 'ABSENT' && point !== 0) {
        throw createError('Sinh viên vắng mặt không được ghi nhận điểm.');
    }

    const registration = await registrationRepository.findById(registrationId);

    if (!registration) {
        throw createError('Không tìm thấy đăng ký.', 404);
    }

    const activity = await activityRepository.findById(
        registration.activity_id
    );

    if (!activity) {
        throw createError('Không tìm thấy hoạt động.', 404);
    }

    const isMember = await activityRepository.isOrganizationMember(
        actorId,
        activity.organization_id
    );

    if (!isMember) {
        throw createError('Bạn không có quyền xác nhận hoạt động này.', 403);
    }

    if (registration.status !== 'APPROVED') {
        throw createError(
            'Chỉ được xác nhận tham gia cho đăng ký đã được duyệt.',
            409
        );
    }

    return participationRepository.saveParticipation({
        registrationId,
        attendanceStatus,
        activityPoint: point,
        actorId
    });
}

module.exports = {
    getActivityParticipation,
    confirmParticipation
};