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

    const now = new Date();
    const start = new Date(activity.registration_start);
    const end = new Date(activity.registration_end);

    if (now < start || now > end) {
        throw createError('Hoạt động chưa mở hoặc đã đóng đăng ký.', 409);
    }

    const student = await registrationRepository.findStudentByUserId(
        studentUserId
    );

    if (!student) {
        throw createError('Tài khoản chưa có hồ sơ sinh viên.', 403);
    }

    if (activity.max_participants !== null &&
        activity.current_participants >= activity.max_participants) {
        throw createError('Hoạt động đã đủ số lượng đăng ký.', 409);
    }

    const existing = await registrationRepository.findRegistration(
        activityId,
        student.student_id
    );

    if (existing && existing.status !== 'CANCELLED') {
        throw createError('Bạn đã đăng ký hoạt động này.', 409);
    }

    const registrationStatus =
        activity.registration_mode === 'APPROVAL' ? 'PENDING' : 'APPROVED';

    /*
     * LƯU Ý:
     * Nếu existing.status === 'CANCELLED', Repository cần có phương thức
     * cập nhật lại bản ghi cũ. Không INSERT bản ghi mới vì bảng Registrations
     * có UNIQUE(activity_id, student_id).
     *
     * Phần xử lý cập nhật lại và cập nhật current_participants cần được
     * thực hiện trong transaction ở Repository.
     */
    if (existing && existing.status === 'CANCELLED') {
        if (typeof registrationRepository.reactivateRegistration !== 'function') {
            throw createError(
                'Repository chưa hỗ trợ đăng ký lại sau khi hủy.',
                501
            );
        }

        return registrationRepository.reactivateRegistration({
            registrationId: existing.registration_id,
            status: registrationStatus,
            activityId
        });
    }

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

    const activity = await activityRepository.findById(activityId);

    if (!activity) {
        throw createError('Không tìm thấy hoạt động.', 404);
    }

    const configResult = await activityRepository.findById(activityId);

    if (configResult.activity_start &&
        new Date() >= new Date(configResult.activity_start)) {
        throw createError('Không thể hủy đăng ký sau khi hoạt động đã bắt đầu.', 409);
    }

    const registration = await registrationRepository.findRegistration(
        activityId,
        student.student_id
    );

    if (!registration) {
        throw createError('Bạn chưa đăng ký hoạt động này.', 404);
    }

    if (!['PENDING', 'APPROVED'].includes(registration.status)) {
        throw createError('Trạng thái đăng ký hiện tại không thể hủy.', 409);
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
        throw createError('Chỉ có thể duyệt đăng ký đang chờ xử lý.', 409);
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
        throw createError('Bạn không có quyền duyệt đăng ký này.', 403);
    }

    if (activity.max_participants !== null &&
        activity.current_participants >= activity.max_participants) {
        throw createError('Hoạt động đã đủ số lượng người tham gia.', 409);
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
        throw createError('Chỉ có thể từ chối đăng ký đang chờ xử lý.', 409);
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
        throw createError('Bạn không có quyền từ chối đăng ký này.', 403);
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