
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userRepository = require('../repositories/user.repository');

function createError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

/**
 * Đăng nhập bằng email, mật khẩu và vai trò.
 */
async function login({ email, password, role }) {
    if (
        typeof email !== 'string' ||
        !email.trim() ||
        typeof password !== 'string' ||
        !password
    ) {
        throw createError(
            'Vui lòng nhập email và mật khẩu.',
            400
        );
    }

    if (!['STUDENT', 'ORGANIZER'].includes(role)) {
        throw createError(
            'Vai trò đăng nhập không hợp lệ.',
            400
        );
    }

    if (!process.env.JWT_SECRET) {
        throw createError(
            'Máy chủ chưa cấu hình JWT_SECRET.',
            500
        );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await userRepository.findByEmail(normalizedEmail);

    if (!user) {
        throw createError(
            'Email hoặc mật khẩu không chính xác.',
            401
        );
    }

    if (user.status !== 'ACTIVE') {
        throw createError(
            'Tài khoản chưa được kích hoạt hoặc đang bị khóa.',
            403
        );
    }

    const isPasswordValid = await bcrypt.compare(
        password,
        user.password_hash
    );

    if (!isPasswordValid) {
        throw createError(
            'Email hoặc mật khẩu không chính xác.',
            401
        );
    }

    // Kiểm tra vai trò thực tế trong cơ sở dữ liệu.
    const roles = await userRepository.getUserRoles(user.user_id);

    const hasRequestedRole = roles.some(
        item => item.role_code === role
    );

    if (!hasRequestedRole) {
        throw createError(
            'Tài khoản không có quyền đăng nhập với vai trò này.',
            403
        );
    }

    const permissions = await userRepository.getUserPermissions(
        user.user_id
    );

    const organizations = role === 'ORGANIZER'
        ? await userRepository.getUserOrganizations(user.user_id)
        : [];

    const expiresIn = process.env.JWT_EXPIRES_IN || '8h';

    const token = jwt.sign(
        {
            userId: user.user_id,
            username: user.username,
            role
        },
        process.env.JWT_SECRET,
        { expiresIn }
    );

    await userRepository.updateLastLogin(user.user_id);

    return {
        token,
        tokenType: 'Bearer',
        expiresIn,
        user: {
            userId: user.user_id,
            username: user.username,
            fullName: user.full_name,
            email: user.email,
            status: user.status,
            role,
            roles,
            permissions,
            organizations
        }
    };
}

/**
 * Lấy thông tin người dùng theo JWT.
 */
async function getCurrentUser(userId, role) {
    const user = await userRepository.findById(userId);

    if (!user) {
        throw createError(
            'Không tìm thấy tài khoản.',
            404
        );
    }

    if (user.status !== 'ACTIVE') {
        throw createError(
            'Tài khoản không còn hoạt động.',
            403
        );
    }

    const roles = await userRepository.getUserRoles(userId);

    // Chỉ chấp nhận vai trò có trong cơ sở dữ liệu.
    const hasRequestedRole = roles.some(
        item => item.role_code === role
    );

    if (!hasRequestedRole) {
        throw createError(
            'Vai trò tài khoản không hợp lệ.',
            403
        );
    }

    const permissions = await userRepository.getUserPermissions(userId);

    const organizations = role === 'ORGANIZER'
        ? await userRepository.getUserOrganizations(userId)
        : [];

    return {
        userId: user.user_id,
        username: user.username,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        role,
        student: user.student_id
            ? {
                studentId: user.student_id,
                studentCode: user.student_code,
                facultyId: user.faculty_id,
                facultyName: user.faculty_name,
                className: user.class_name,
                activityPoints: user.activity_points
            }
            : null,
        organizations,
        roles,
        permissions
    };
}

module.exports = {
    login,
    getCurrentUser
};
