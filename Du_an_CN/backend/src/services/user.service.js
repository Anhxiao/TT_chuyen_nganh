const userRepository = require('../repositories/user.repository');

function createError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

async function getMyProfile(userId) {
    const user = await userRepository.findById(userId);

    if (!user) {
        throw createError('Không tìm thấy tài khoản.', 404);
    }

    const roles = await userRepository.getUserRoles(userId);

    return {
        userId: user.user_id,
        username: user.username,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        roles,
        student: user.student_id
            ? {
                studentId: user.student_id,
                studentCode: user.student_code,
                facultyId: user.faculty_id,
                facultyName: user.faculty_name,
                className: user.class_name,
                activityPoints: user.activity_points
            }
            : null
    };
}

async function updateMyProfile(userId, data) {
    const user = await userRepository.findById(userId);

    if (!user) {
        throw createError('Không tìm thấy tài khoản.', 404);
    }

    const fullName = data.fullName === undefined
        ? user.full_name
        : String(data.fullName).trim();

    const email = data.email === undefined
        ? user.email
        : String(data.email).trim();

    const phone = data.phone === undefined
        ? user.phone
        : String(data.phone).trim();

    if (!fullName) {
        throw createError('Họ và tên không được để trống.');
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw createError('Địa chỉ email không hợp lệ.');
    }

    if (phone && !/^[0-9+\s().-]{8,20}$/.test(phone)) {
        throw createError('Số điện thoại không hợp lệ.');
    }

    await userRepository.updateProfile(userId, {
        fullName,
        email: email || null,
        phone: phone || null
    });

    return getMyProfile(userId);
}

async function getUsers({ keyword, status, page = 1, limit = 20 }) {
    const allowedStatuses = ['PENDING', 'ACTIVE', 'LOCKED'];

    if (status && !allowedStatuses.includes(status)) {
        throw createError('Trạng thái tài khoản không hợp lệ.');
    }

    page = Number(page);
    limit = Number(limit);

    if (!Number.isInteger(page) || page < 1) {
        throw createError('Số trang phải là số nguyên lớn hơn 0.');
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        throw createError('Số bản ghi mỗi trang phải từ 1 đến 100.');
    }

    return userRepository.getUsers({
        keyword: keyword ? String(keyword).trim() : undefined,
        status,
        page,
        limit
    });
}

async function updateUserStatus({ userId, status, actorId }) {
    const allowedStatuses = ['PENDING', 'ACTIVE', 'LOCKED'];

    if (!Number.isInteger(Number(userId)) || Number(userId) <= 0) {
        throw createError('Mã tài khoản không hợp lệ.');
    }

    if (!allowedStatuses.includes(status)) {
        throw createError('Trạng thái tài khoản không hợp lệ.');
    }

    if (String(userId) === String(actorId)) {
        throw createError('Không thể tự thay đổi trạng thái tài khoản của mình.');
    }

    const user = await userRepository.findById(userId);

    if (!user) {
        throw createError('Không tìm thấy tài khoản.', 404);
    }

    await userRepository.updateUserStatus(userId, status);

    return {
        userId: Number(userId),
        status
    };
}

module.exports = {
    getMyProfile,
    updateMyProfile,
    getUsers,
    updateUserStatus
};