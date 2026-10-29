const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userRepository = require('../repositories/user.repository');

function createError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

async function login({ username, password }) {
    if (!username || !password) {
        throw createError('Vui lòng nhập tên đăng nhập và mật khẩu.', 400);
    }

    if (!process.env.JWT_SECRET) {
        throw createError('Máy chủ chưa cấu hình JWT_SECRET.', 500);
    }

    const user = await userRepository.findByUsername(username.trim());

    if (!user) {
        throw createError('Tên đăng nhập hoặc mật khẩu không chính xác.', 401);
    }

    if (user.status !== 'ACTIVE') {
        throw createError('Tài khoản chưa được kích hoạt hoặc đang bị khóa.', 403);
    }

    const isPasswordValid = await bcrypt.compare(
        password,
        user.password_hash
    );

    if (!isPasswordValid) {
        throw createError('Tên đăng nhập hoặc mật khẩu không chính xác.', 401);
    }

    const roles = await userRepository.getUserRoles(user.user_id);
    const permissions = await userRepository.getUserPermissions(user.user_id);

    const token = jwt.sign(
        {
            userId: user.user_id,
            username: user.username
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    await userRepository.updateLastLogin(user.user_id);

    return {
        token,
        tokenType: 'Bearer',
        expiresIn: process.env.JWT_EXPIRES_IN || '8h',
        user: {
            userId: user.user_id,
            username: user.username,
            fullName: user.full_name,
            email: user.email,
            status: user.status,
            roles,
            permissions
        }
    };
}

async function getCurrentUser(userId) {
    const user = await userRepository.findById(userId);

    if (!user) {
        throw createError('Không tìm thấy tài khoản.', 404);
    }

    if (user.status !== 'ACTIVE') {
        throw createError('Tài khoản không còn hoạt động.', 403);
    }

    const roles = await userRepository.getUserRoles(userId);
    const permissions = await userRepository.getUserPermissions(userId);

    return {
        userId: user.user_id,
        username: user.username,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        status: user.status,
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
        roles,
        permissions
    };
}

module.exports = {
    login,
    getCurrentUser
};