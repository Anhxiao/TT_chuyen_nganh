
const { sql, poolPromise } = require('../config/database');

/**
 * Tìm tài khoản bằng email.
 */
async function findByEmail(email) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input('email', sql.VarChar(255), email)
        .query(`
            SELECT
                u.user_id,
                u.username,
                u.password_hash,
                u.full_name,
                u.email,
                u.phone,
                u.date_of_birth,
                u.gender,
                u.address,
                u.avatar_url,
                u.status,
                u.last_login_at,
                u.created_at
            FROM dbo.Users AS u
            WHERE u.email = @email;
        `);

    return result.recordset[0] || null;
}

/**
 * Tìm tài khoản theo ID.
 * Bao gồm thông tin sinh viên và thông tin cá nhân.
 */
async function findById(userId) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input('userId', sql.BigInt, userId)
        .query(`
            SELECT
                u.user_id,
                u.username,
                u.full_name,
                u.email,
                u.phone,
                u.date_of_birth,
                u.gender,
                u.address,
                u.avatar_url,
                u.status,
                u.created_at,

                s.student_id,
                s.student_code,
                s.class_name,
                s.activity_points,

                f.faculty_id,
                f.faculty_name

            FROM dbo.Users AS u

            LEFT JOIN dbo.Students AS s
                ON s.user_id = u.user_id

            LEFT JOIN dbo.Faculties AS f
                ON f.faculty_id = s.faculty_id

            WHERE u.user_id = @userId;
        `);

    return result.recordset[0] || null;
}

/**
 * Lấy danh sách vai trò.
 */
async function getUserRoles(userId) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input('userId', sql.BigInt, userId)
        .query(`
            SELECT
                r.role_code,
                r.role_name
            FROM dbo.UserRoles AS ur

            INNER JOIN dbo.Roles AS r
                ON r.role_id = ur.role_id

            WHERE ur.user_id = @userId;
        `);

    return result.recordset;
}

/**
 * Lấy danh sách quyền.
 */
async function getUserPermissions(userId) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input('userId', sql.BigInt, userId)
        .query(`
            SELECT DISTINCT
                p.permission_code

            FROM dbo.UserRoles AS ur

            INNER JOIN dbo.RolePermissions AS rp
                ON rp.role_id = ur.role_id

            INNER JOIN dbo.Permissions AS p
                ON p.permission_id = rp.permission_id

            WHERE ur.user_id = @userId;
        `);

    return result.recordset.map(
        row => row.permission_code
    );
}

/**
 * Cập nhật thời gian đăng nhập.
 */
async function updateLastLogin(userId) {
    const pool = await poolPromise;

    await pool.request()
        .input('userId', sql.BigInt, userId)
        .query(`
            UPDATE dbo.Users

            SET last_login_at = SYSDATETIME()

            WHERE user_id = @userId
                AND status = 'ACTIVE';
        `);
}

/**
 * Cập nhật thông tin cá nhân.
 *
 * Chỉ cho phép cập nhật:
 * - phone
 * - date_of_birth
 * - gender
 * - address
 *
 * Không cập nhật:
 * - full_name
 * - email
 * - student_code
 * - faculty_id
 * - class_name
 * - activity_points
 * - avatar_url
 */
async function updateProfile(userId, data) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input('userId', sql.BigInt, userId)
        .input('phone', sql.VarChar(20), data.phone)
        .input('dateOfBirth', sql.Date, data.dateOfBirth)
        .input('gender', sql.VarChar(10), data.gender)
        .input('address', sql.NVarChar(255), data.address)
        .query(`
            UPDATE dbo.Users

            SET
                phone = @phone,
                date_of_birth = @dateOfBirth,
                gender = @gender,
                address = @address

            WHERE user_id = @userId
                AND status = 'ACTIVE';

            SELECT @@ROWCOUNT AS affected_rows;
        `);

    return result.recordset[0]?.affected_rows > 0;
}

/**
 * Cập nhật đường dẫn ảnh đại diện.
 *
 * Chỉ lưu đường dẫn ảnh vào SQL Server.
 * File ảnh được lưu riêng trong backend/uploads/avatars.
 */
async function updateAvatar(userId, avatarUrl) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input('userId', sql.BigInt, userId)
        .input('avatarUrl', sql.NVarChar(500), avatarUrl)
        .query(`
            UPDATE dbo.Users

            SET avatar_url = @avatarUrl

            WHERE user_id = @userId
                AND status = 'ACTIVE';

            SELECT @@ROWCOUNT AS affected_rows;
        `);

    return result.recordset[0]?.affected_rows > 0;
}

/**
 * Lấy danh sách tài khoản.
 */
async function getUsers({
    keyword,
    status,
    page = 1,
    limit = 20
}) {
    const pool = await poolPromise;

    const safePage = Math.max(
        1,
        Number.parseInt(page, 10) || 1
    );

    const safeLimit = Math.min(
        100,
        Math.max(1, Number.parseInt(limit, 10) || 20)
    );

    const request = pool.request()
        .input('offset', sql.Int, (safePage - 1) * safeLimit)
        .input('limit', sql.Int, safeLimit);

    const conditions = [];

    if (keyword) {
        request.input(
            'keyword',
            sql.NVarChar(255),
            `%${keyword}%`
        );

        conditions.push(`
            (
                u.username LIKE @keyword
                OR u.full_name LIKE @keyword
                OR u.email LIKE @keyword
            )
        `);
    }

    if (status) {
        request.input(
            'status',
            sql.VarChar(20),
            status
        );

        conditions.push('u.status = @status');
    }

    const whereClause = conditions.length
        ? `WHERE ${conditions.join(' AND ')}`
        : '';

    const result = await request.query(`
        SELECT
            u.user_id,
            u.username,
            u.full_name,
            u.email,
            u.phone,
            u.status,
            u.created_at

        FROM dbo.Users AS u

        ${whereClause}

        ORDER BY u.user_id DESC

        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY;
    `);

    return result.recordset;
}

/**
 * Cập nhật trạng thái tài khoản.
 */
async function updateUserStatus(userId, status) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input('userId', sql.BigInt, userId)
        .input('status', sql.VarChar(20), status)
        .query(`
            UPDATE dbo.Users

            SET status = @status

            WHERE user_id = @userId;

            SELECT @@ROWCOUNT AS affected_rows;
        `);

    return result.recordset[0]?.affected_rows > 0;
}

/**
 * Lấy các đơn vị mà tài khoản ORGANIZER quản lý.
 */
async function getUserOrganizations(userId) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input('userId', sql.BigInt, userId)
        .query(`
            SELECT
                o.organization_id,
                o.organization_code,
                o.organization_name,
                o.organization_type,
                o.faculty_id,
                o.parent_organization_id

            FROM dbo.OrganizationUsers AS ou

            INNER JOIN dbo.Organizations AS o
                ON o.organization_id = ou.organization_id

            WHERE ou.user_id = @userId
                AND o.status = 'ACTIVE'

            ORDER BY o.organization_name;
        `);

    return result.recordset;
}

module.exports = {
    findByEmail,
    findById,
    getUserRoles,
    getUserPermissions,
    getUserOrganizations,
    updateLastLogin,
    updateProfile,
    updateAvatar,
    getUsers,
    updateUserStatus
};
