
const { sql, poolPromise } = require('../config/database');

async function findByUsername(username) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input('username', sql.NVarChar(100), username)
        .query(`
            SELECT
                u.user_id,
                u.username,
                u.password_hash,
                u.full_name,
                u.email,
                u.phone,
                u.status,
                u.last_login_at,
                u.created_at
            FROM dbo.Users AS u
            WHERE u.username = @username;
        `);

    return result.recordset[0] || null;
}

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

async function getUserRoles(userId) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input('userId', sql.BigInt, userId)
        .query(`
            SELECT r.role_code, r.role_name
            FROM dbo.UserRoles AS ur
            INNER JOIN dbo.Roles AS r
                ON r.role_id = ur.role_id
            WHERE ur.user_id = @userId;
        `);

    return result.recordset;
}

async function getUserPermissions(userId) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input('userId', sql.BigInt, userId)
        .query(`
            SELECT DISTINCT p.permission_code
            FROM dbo.UserRoles AS ur
            INNER JOIN dbo.RolePermissions AS rp
                ON rp.role_id = ur.role_id
            INNER JOIN dbo.Permissions AS p
                ON p.permission_id = rp.permission_id
            WHERE ur.user_id = @userId;
        `);

    return result.recordset.map(row => row.permission_code);
}

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

async function updateProfile(userId, data) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input('userId', sql.BigInt, userId)
        .input('fullName', sql.NVarChar(255), data.full_name)
        .input('email', sql.NVarChar(255), data.email)
        .input('phone', sql.NVarChar(30), data.phone)
        .query(`
            UPDATE dbo.Users
            SET
                full_name = COALESCE(@fullName, full_name),
                email = COALESCE(@email, email),
                phone = COALESCE(@phone, phone)
            WHERE user_id = @userId
              AND status = 'ACTIVE';

            SELECT @@ROWCOUNT AS affected_rows;
        `);

    return result.recordset[0].affected_rows > 0;
}

async function getUsers({ keyword, status, page = 1, limit = 20 }) {
    const pool = await poolPromise;

    const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
    const safeLimit = Math.min(
        100,
        Math.max(1, Number.parseInt(limit, 10) || 20)
    );

    const request = pool.request()
        .input('offset', sql.Int, (safePage - 1) * safeLimit)
        .input('limit', sql.Int, safeLimit);

    let conditions = [];

    if (keyword) {
        request.input('keyword', sql.NVarChar(255), `%${keyword}%`);
        conditions.push(`(
            u.username LIKE @keyword
            OR u.full_name LIKE @keyword
            OR u.email LIKE @keyword
        )`);
    }

    if (status) {
        request.input('status', sql.VarChar(20), status);
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

    return result.recordset[0].affected_rows > 0;
}

module.exports = {
    findByUsername,
    findById,
    getUserRoles,
    getUserPermissions,
    updateLastLogin,
    updateProfile,
    getUsers,
    updateUserStatus
};
