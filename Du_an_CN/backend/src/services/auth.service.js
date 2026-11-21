
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs/promises');
const path = require('path');

const userRepository = require('../repositories/user.repository');

const avatarDirectory = path.resolve(
    __dirname,
    '..',
    'uploads',
    'avatars'
);

function createError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

/**
 * Xóa file ảnh vừa upload khi quá trình cập nhật thất bại.
 */
async function removeNewAvatar(file) {
    if (!file?.path) return;

    try {
        await fs.unlink(file.path);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.error('Không thể xóa ảnh upload lỗi:', error);
        }
    }
}

/**
 * Xóa ảnh đại diện cũ.
 *
 * Chỉ cho phép xóa file nằm trực tiếp trong
 * backend/uploads/avatars.
 */
async function removeOldAvatar(avatarUrl) {
    if (
        typeof avatarUrl !== 'string' ||
        !avatarUrl.trim()
    ) {
        return;
    }

    try {
        const pathname = avatarUrl.split('?')[0];
        const prefix = '/uploads/avatars/';

        // Không xóa URL bên ngoài hoặc đường dẫn không thuộc thư mục ảnh.
        if (!pathname.startsWith(prefix)) {
            return;
        }

        const filename = pathname.slice(prefix.length);

        // Chặn đường dẫn có thể chứa ../ hoặc thư mục con.
        if (
            !filename ||
            filename !== path.basename(filename)
        ) {
            return;
        }

        const oldFilePath = path.resolve(
            avatarDirectory,
            filename
        );

        // Đảm bảo file nằm trực tiếp trong thư mục avatar.
        if (path.dirname(oldFilePath) !== avatarDirectory) {
            return;
        }

        await fs.unlink(oldFilePath);

    } catch (error) {
        // Ảnh cũ không tồn tại thì không cần xử lý thêm.
        if (error.code !== 'ENOENT') {
            // Không làm hỏng kết quả upload mới chỉ vì xóa ảnh cũ lỗi.
            console.error('Không thể xóa ảnh đại diện cũ:', error);
        }
    }
}

/**
 * Chuẩn hóa thông tin người dùng trả về frontend.
 */
function formatUser(
    user,
    role,
    roles,
    permissions,
    organizations = []
) {
    return {
        userId: user.user_id,
        username: user.username,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone || null,
        dateOfBirth: user.date_of_birth || null,
        gender: user.gender || null,
        address: user.address || null,
        avatarUrl: user.avatar_url || null,
        createdAt: user.created_at || null,
        status: user.status,
        role,
        roles,
        permissions,

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

        organizations
    };
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

    const user = await userRepository.findByEmail(
        normalizedEmail
    );

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

    const roles = await userRepository.getUserRoles(
        user.user_id
    );

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
            phone: user.phone,
            avatarUrl: user.avatar_url || null,
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

    const hasRequestedRole = roles.some(
        item => item.role_code === role
    );

    if (!hasRequestedRole) {
        throw createError(
            'Vai trò tài khoản không hợp lệ.',
            403
        );
    }

    const permissions = await userRepository.getUserPermissions(
        userId
    );

    const organizations = role === 'ORGANIZER'
        ? await userRepository.getUserOrganizations(userId)
        : [];

    return formatUser(
        user,
        role,
        roles,
        permissions,
        organizations
    );
}

/**
 * Cập nhật thông tin cá nhân của sinh viên.
 */
async function updateProfile(userId, role, data) {
    if (role !== 'STUDENT') {
        throw createError(
            'Bạn không có quyền cập nhật hồ sơ sinh viên.',
            403
        );
    }

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

    const phone = data.phone === undefined
        ? null
        : String(data.phone).trim() || null;

    const dateOfBirth = data.dateOfBirth || null;
    const gender = data.gender || null;

    const address = data.address === undefined
        ? null
        : String(data.address).trim() || null;

    if (
        phone &&
        !/^(0|\+84)[0-9]{9,10}$/.test(phone)
    ) {
        throw createError(
            'Số điện thoại không hợp lệ.',
            400
        );
    }

    if (dateOfBirth !== null) {
        if (
            typeof dateOfBirth !== 'string' ||
            !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)
        ) {
            throw createError(
                'Ngày sinh không đúng định dạng.',
                400
            );
        }

        const [year, month, day] = dateOfBirth
            .split('-')
            .map(Number);

        const parsedDate = new Date(year, month - 1, day);

        const isValidDate =
            parsedDate.getFullYear() === year &&
            parsedDate.getMonth() === month - 1 &&
            parsedDate.getDate() === day;

        const now = new Date();

        const today =
            `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        if (!isValidDate || dateOfBirth > today) {
            throw createError(
                'Ngày sinh không hợp lệ.',
                400
            );
        }
    }

    if (
        gender !== null &&
        !['MALE', 'FEMALE', 'OTHER'].includes(gender)
    ) {
        throw createError(
            'Giới tính không hợp lệ.',
            400
        );
    }

    if (address && address.length > 255) {
        throw createError(
            'Địa chỉ không được vượt quá 255 ký tự.',
            400
        );
    }

    const updated = await userRepository.updateProfile(
        userId,
        {
            phone,
            dateOfBirth,
            gender,
            address
        }
    );

    if (!updated) {
        throw createError(
            'Không thể cập nhật thông tin tài khoản.',
            400
        );
    }

    return await getCurrentUser(userId, role);
}

/**
 * Cập nhật ảnh đại diện sinh viên.
 *
 * Quy trình:
 * 1. Kiểm tra tài khoản.
 * 2. Lưu đường dẫn ảnh mới vào SQL Server.
 * 3. Nếu cập nhật SQL thất bại: xóa ảnh mới.
 * 4. Nếu cập nhật SQL thành công: xóa ảnh cũ.
 */

async function updateAvatar(userId, role, file) {
    let databaseUpdated = false;

    if (role !== 'STUDENT') {
        await removeNewAvatar(file);

        throw createError(
            'Chỉ sinh viên mới được cập nhật ảnh đại diện.',
            403
        );
    }

    if (!file) {
        throw createError(
            'Vui lòng chọn ảnh đại diện.',
            400
        );
    }

    try {
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

        const avatarUrl = `/uploads/avatars/${file.filename}`;

        const updated = await userRepository.updateAvatar(
            userId,
            avatarUrl
        );

        if (!updated) {
            throw createError(
                'Không thể cập nhật ảnh đại diện.',
                400
            );
        }

        databaseUpdated = true;

        // Chỉ xóa ảnh cũ sau khi SQL Server cập nhật thành công.
        if (
            user.avatar_url &&
            user.avatar_url !== avatarUrl
        ) {
            await removeOldAvatar(user.avatar_url);
        }

        return await getCurrentUser(userId, role);

    } catch (error) {
        // Chỉ xóa ảnh mới nếu SQL Server chưa cập nhật thành công.
        if (!databaseUpdated) {
            await removeNewAvatar(file);
        }

        throw error;
    }
}

module.exports = {
    login,
    getCurrentUser,
    updateProfile,
    updateAvatar
};
