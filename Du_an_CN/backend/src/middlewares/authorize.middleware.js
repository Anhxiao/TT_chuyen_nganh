
const {
    sql,
    poolPromise
} = require('../config/database');

/**
 * Chỉ cho phép các vai trò được chỉ định truy cập.
 *
 * Ví dụ:
 * authorizeRoles('ADMIN')
 * authorizeRoles('ORGANIZER', 'ADMIN')
 *
 * Các vai trò được kiểm tra trực tiếp từ SQL Server.
 */
function authorizeRoles(...allowedRoles) {
    return async function (req, res, next) {
        try {
            if (!req.user || req.user.userId === undefined) {
                return res.status(401).json({
                    success: false,
                    message: 'Bạn cần đăng nhập.'
                });
            }

            if (allowedRoles.length === 0) {
                return res.status(500).json({
                    success: false,
                    message: 'Middleware chưa được cấu hình vai trò.'
                });
            }

            const pool = await poolPromise;
            const request = pool.request();

            request.input('userId', sql.BigInt, req.user.userId);

            const roleParams = allowedRoles.map((role, index) => {
                const paramName = `role${index}`;
                request.input(paramName, sql.VarChar(50), role);
                return `@${paramName}`;
            });

            const query = `
                SELECT TOP 1 r.role_code
                FROM dbo.Users AS u
                INNER JOIN dbo.UserRoles AS ur
                    ON ur.user_id = u.user_id
                INNER JOIN dbo.Roles AS r
                    ON r.role_id = ur.role_id
                WHERE u.user_id = @userId
                AND u.status = 'ACTIVE'
                AND r.role_code IN (${roleParams.join(', ')});
            `;

            const result = await request.query(query);

            if (result.recordset.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có vai trò được phép thực hiện chức năng này.'
                });
            }

            return next();
        } catch (error) {
            return next(error);
        }
    };
}

/**
 * Kiểm tra người dùng có quyền cụ thể hay không.
 *
 * Ví dụ:
 * authorizePermission('REGISTER_ACTIVITY')
 * authorizePermission('ASSIGN_POINTS')
 */
function authorizePermission(permissionCode) {
    return async function (req, res, next) {
        try {
            if (!req.user || req.user.userId === undefined) {
                return res.status(401).json({
                    success: false,
                    message: 'Bạn cần đăng nhập.'
                });
            }

            if (
                typeof permissionCode !== 'string' ||
                permissionCode.trim() === ''
            ) {
                return res.status(500).json({
                    success: false,
                    message: 'Mã quyền chưa được cấu hình hợp lệ.'
                });
            }

            const pool = await poolPromise;

            const result = await pool.request()
                .input('userId', sql.BigInt, req.user.userId)
                .input(
                    'permissionCode',
                    sql.VarChar(100),
                    permissionCode
                )
                .query(`
                    SELECT TOP 1 p.permission_code
                    FROM dbo.Users AS u
                    INNER JOIN dbo.UserRoles AS ur
                        ON ur.user_id = u.user_id
                    INNER JOIN dbo.RolePermissions AS rp
                        ON rp.role_id = ur.role_id
                    INNER JOIN dbo.Permissions AS p
                        ON p.permission_id = rp.permission_id
                    WHERE u.user_id = @userId
                    AND u.status = 'ACTIVE'
                    AND p.permission_code = @permissionCode;
                `);

            if (result.recordset.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Bạn không có quyền thực hiện chức năng này.'
                });
            }

            return next();
        } catch (error) {
            return next(error);
        }
    };
}

module.exports = {
    authorizeRoles,
    authorizePermission
};
