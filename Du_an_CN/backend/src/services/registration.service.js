const registrationRepository = require('../repositories/registration.repository');
const activityRepository = require('../repositories/activity.repository');
const userRepository = require('../repositories/user.repository');

function createError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}


async function registerForActivity({ activityId, studentUserId }) {
    const activity = await activityRepository.findById(activityId);

    if (!activity) {
        throw createError('Không tìm thấy hoạt động.', 404);
    }

    if (!['PUBLISHED', 'REGISTERING'].includes(activity.status)) {
        throw createError('Hoạt động hiện không mở đăng ký.', 409);
    }

    const student = await registrationRepository.findStudentByUserId(
        studentUserId
    );

    if (!student) {
        throw createError('Tài khoản chưa có hồ sơ sinh viên.', 403);
    }

    const registrationStatus =
        activity.registration_mode === 'APPROVAL'
            ? 'PENDING'
            : 'APPROVED';

    // Repository kiểm tra lại thời gian, sức chứa và trạng thái
    // trong transaction để tránh đăng ký đồng thời vượt giới hạn.
    return registrationRepository.createRegistration(
        activityId,
        student.student_id,
        registrationStatus
    );
}


async function cancelMyRegistration({ activityId, studentUserId }) {
    const student = await registrationRepository.findStudentByUserId(
        studentUserId
    );

    if (!student) {
        throw createError('Không tìm thấy hồ sơ sinh viên.', 404);
    }

    return registrationRepository.cancelRegistration(
        activityId,
        student.student_id
    );
}

async function getMyRegistrations({
    studentUserId,
    status,
    page = 1,
    limit = 20
}) {
    const student = await registrationRepository.findStudentByUserId(
        studentUserId
    );

    if (!student) {
        throw createError('Không tìm thấy hồ sơ sinh viên.', 404);
    }

    if (status &&
        !['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].includes(status)) {
        throw createError('Trạng thái đăng ký không hợp lệ.');
    }

    page = Number(page);
    limit = Number(limit);

    if (!Number.isInteger(page) || page < 1 ||
        !Number.isInteger(limit) || limit < 1 || limit > 100) {
        throw createError('Thông tin phân trang không hợp lệ.');
    }

    return registrationRepository.getMyRegistrations({
        studentId: student.student_id,
        status,
        page,
        limit
    });
}

async function getActivityRegistrations({
    activityId,
    actorId,
    status,
    page = 1,
    limit = 20
}) {
    const activity = await activityRepository.findById(activityId);

    if (!activity) {
        throw createError('Không tìm thấy hoạt động.', 404);
    }

    const isMember = await activityRepository.isOrganizationMember(
        actorId,
        activity.organization_id
    );

    if (!isMember) {
        throw createError('Bạn không có quyền xem danh sách đăng ký này.', 403);
    }

    if (status &&
        !['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].includes(status)) {
        throw createError('Trạng thái đăng ký không hợp lệ.');
    }

    page = Number(page);
    limit = Number(limit);

    if (!Number.isInteger(page) || page < 1 ||
        !Number.isInteger(limit) || limit < 1 || limit > 100) {
        throw createError('Thông tin phân trang không hợp lệ.');
    }

    return registrationRepository.getActivityRegistrations({
        activityId,
        status,
        page,
        limit
    });
}


async function approveRegistration({ registrationId, actorId, note }) {
    const registration = await registrationRepository.findById(registrationId);

    if (!registration) {
        throw createError('Không tìm thấy đăng ký.', 404);
    }

    if (registration.status !== 'PENDING') {
        throw createError(
            'Chỉ có thể duyệt đăng ký đang chờ xử lý.',
            409
        );
    }

    const isMember = await activityRepository.isOrganizationMember(
        actorId,
        registration.organization_id
    );

    if (!isMember) {
        throw createError(
            'Bạn không có quyền duyệt đăng ký này.',
            403
        );
    }

    return registrationRepository.updateRegistrationStatus(
        registrationId,
        'APPROVED',
        actorId,
        note || null
    );
}


async function rejectRegistration({ registrationId, actorId, note }) {
    const registration = await registrationRepository.findById(registrationId);

    if (!registration) {
        throw createError('Không tìm thấy đăng ký.', 404);
    }

    if (registration.status !== 'PENDING') {
        throw createError(
            'Chỉ có thể từ chối đăng ký đang chờ xử lý.',
            409
        );
    }

    const isMember = await activityRepository.isOrganizationMember(
        actorId,
        registration.organization_id
    );

    if (!isMember) {
        throw createError(
            'Bạn không có quyền từ chối đăng ký này.',
            403
        );
    }

    return registrationRepository.updateRegistrationStatus(
        registrationId,
        'REJECTED',
        actorId,
        note || null
    );
}

module.exports = {
    registerForActivity,
    cancelMyRegistration,
    getMyRegistrations,
    getActivityRegistrations,
    approveRegistration,
    rejectRegistration
};