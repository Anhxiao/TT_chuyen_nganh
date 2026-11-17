// generate-demo-accounts.js
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const accounts = [
    // STUDENT
    // Kỹ thuật & Công nghệ
    {
        username: 'sv.ktcn',
        email: 'sv.ktcn@st.tvu.edu.vn',
        fullName: 'Sinh viên kiểm thử Kỹ thuật và Công nghệ',
        password: 'Student@123',
        role: 'STUDENT',
        studentCode: 'SVTEST001',
        faculty: 'Trường Kỹ thuật và Công nghệ'
    },
    {
        username: 'sv.ktcn01',
        email: 'sv.ktcn01@st.tvu.edu.vn',
        fullName: 'Sinh viên kiểm thử Kỹ thuật và Công nghệ 01',
        password: 'Student@123',
        role: 'STUDENT',
        faculty: 'Trường Kỹ thuật và Công nghệ'
    },
    {
        username: 'sv.ktcn02',
        email: 'sv.ktcn02@st.tvu.edu.vn',
        fullName: 'Sinh viên kiểm thử Kỹ thuật và Công nghệ 02',
        password: 'Student@123',
        role: 'STUDENT',
        faculty: 'Trường Kỹ thuật và Công nghệ'
    },
    // Kinh tế luật
    {
        username: 'sv.ktl',
        email: 'sv.ktl@st.tvu.edu.vn',
        fullName: 'Sinh viên kiểm thử Kinh tế và Luật',
        password: 'Student@123',
        role: 'STUDENT',
        studentCode: 'SVTEST002',
        faculty: 'Trường Kinh tế và Luật'
    },
    {
        username: 'sv.ktl01',
        email: 'sv.ktl01@st.tvu.edu.vn',
        fullName: 'Sinh viên kiểm thử Kinh tế và Luật 01',
        password: 'Student@123',
        role: 'STUDENT',
        faculty: 'Trường Kinh tế và Luật'
    },
    {
        username: 'sv.ktl02',
        email: 'sv.ktl02@st.tvu.edu.vn',
        fullName: 'Sinh viên kiểm thử Kinh tế và Luật 02',
        password: 'Student@123',
        role: 'STUDENT',
        faculty: 'Trường Kinh tế và Luật'
    },
    // Y dược
    {
        username: 'sv.yd',
        email: 'sv.yd@st.tvu.edu.vn',
        fullName: 'Sinh viên kiểm thử Y Dược',
        password: 'Student@123',
        role: 'STUDENT',
        studentCode: 'SVTEST003',
        faculty: 'Trường Y Dược'
    },
    {
        username: 'sv.yd01',
        email: 'sv.yd01@st.tvu.edu.vn',
        fullName: 'Sinh viên kiểm thử Y Dược 01',
        password: 'Student@123',
        role: 'STUDENT',
        faculty: 'Trường Y Dược'
    },
    {
        username: 'sv.yd02',
        email: 'sv.yd02@st.tvu.edu.vn',
        fullName: 'Sinh viên kiểm thử Y Dược 02',
        password: 'Student@123',
        role: 'STUDENT',
        faculty: 'Trường Y Dược'
    },
    // ORGANIZER - ĐOÀN TRƯỜNG
    {
        username: 'doanktcn',
        email: 'doanktcn@organizer.local',
        fullName: 'Tài khoản Đoàn Trường Kỹ thuật và Công nghệ',
        password: 'Organizer@123',
        role: 'ORGANIZER',
        organization: 'TECH_UNION'
    },
    {
        username: 'doanktl',
        email: 'doanktl@organizer.local',
        fullName: 'Tài khoản Đoàn Trường Kinh tế và Luật',
        password: 'Organizer@123',
        role: 'ORGANIZER',
        organization: 'LAW_UNION'
    },
    {
        username: 'doanyd',
        email: 'doanyd@organizer.local',
        fullName: 'Tài khoản Đoàn Trường Y Dược',
        password: 'Organizer@123',
        role: 'ORGANIZER',
        organization: 'MED_UNION'
    },

    // ORGANIZER - CÂU LẠC BỘ
    {
        username: 'clbkynang',
        email: 'clbkynang@organizer.local',
        fullName: 'Tài khoản CLB Kỹ năng sống',
        password: 'Organizer@123',
        role: 'ORGANIZER',
        organization: 'LIFE_SKILL_CLUB'
    },
    {
        username: 'clbtruyenthong',
        email: 'clbtruyenthong@organizer.local',
        fullName: 'Tài khoản CLB Truyền thông TVU',
        password: 'Organizer@123',
        role: 'ORGANIZER',
        organization: 'MEDIA_CLUB'
    },
    {
        username: 'clbvanhoa',
        email: 'clbvanhoa@organizer.local',
        fullName: 'Tài khoản CLB Văn hóa Nghệ thuật TVU',
        password: 'Organizer@123',
        role: 'ORGANIZER',
        organization: 'ART_CLUB'
    }
];

function sqlString(value) {
    if (value === null || value === undefined) return 'NULL';
    return `N'${String(value).replace(/'/g, "''")}'`;
}

async function main() {
    const studentHash = await bcrypt.hash('Student@123', 10);
    const organizerHash = await bcrypt.hash('Organizer@123', 10);

    const rows = accounts.map(account => {
        const passwordHash =
            account.role === 'STUDENT' ? studentHash : organizerHash;

        return `(
            ${sqlString(account.username)},
            ${sqlString(account.email)},
            ${sqlString(passwordHash)},
            ${sqlString(account.fullName)},
            ${sqlString(account.role)},
            ${sqlString(account.studentCode || null)},
            ${sqlString(account.faculty || null)},
            ${sqlString(account.organization || null)}
        )`;
    }).join(',\n');

    const sql = `
/* =========================================================
DemoAccounts.sql
Database: StudentActivityDB
3 STUDENT + 6 ORGANIZER
Passwords are bcrypt hashed.
========================================================= */

USE StudentActivityDB;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @Accounts TABLE (
    username VARCHAR(50),
    email VARCHAR(255),
    password_hash VARCHAR(255),
    full_name NVARCHAR(255),
    role_code VARCHAR(30),
    student_code VARCHAR(20) NULL,
    faculty_name NVARCHAR(255) NULL,
    organization_code VARCHAR(50) NULL
);

INSERT INTO @Accounts (
    username, email, password_hash, full_name,
    role_code, student_code, faculty_name, organization_code
)
VALUES
${rows};

BEGIN TRY
    BEGIN TRANSACTION;

    -- 1. Kiểm tra vai trò
    IF EXISTS (
        SELECT 1
        FROM @Accounts a
        LEFT JOIN Roles r ON r.role_code = a.role_code
        WHERE r.role_id IS NULL
    )
        THROW 50001, N'Thiếu vai trò STUDENT hoặc ORGANIZER trong Roles.', 1;

    -- 2. Kiểm tra khoa/trường của sinh viên
    IF EXISTS (
        SELECT 1
        FROM @Accounts a
        LEFT JOIN Faculties f ON f.faculty_name = a.faculty_name
        WHERE a.role_code = 'STUDENT'
        AND f.faculty_id IS NULL
    )
        THROW 50002, N'Không tìm thấy Faculty tương ứng với sinh viên.', 1;

    -- 3. Kiểm tra đơn vị tổ chức
    IF EXISTS (
        SELECT 1
        FROM @Accounts a
        LEFT JOIN Organizations o
            ON o.organization_code = a.organization_code
        WHERE a.role_code = 'ORGANIZER'
        AND (
            o.organization_id IS NULL
            OR o.status <> 'ACTIVE'
        )
    )
        THROW 50003, N'Thiếu hoặc đơn vị tổ chức không hoạt động.', 1;

    -- 4. Chỉ cho phép tài khoản kiểm thử khớp cả username và email.
    -- Tránh cập nhật nhầm tài khoản có sẵn.
    IF EXISTS (
        SELECT 1
        FROM @Accounts a
        WHERE EXISTS (
            SELECT 1 FROM Users u
            WHERE u.username = a.username
            AND u.email <> a.email
        )
        OR EXISTS (
            SELECT 1 FROM Users u
            WHERE u.email = a.email
            AND u.username <> a.username
        )
    )
        THROW 50004, N'Username hoặc email đã thuộc tài khoản khác.', 1;

    -- 5. Kiểm tra mã sinh viên không bị tài khoản khác sử dụng
    IF EXISTS (
        SELECT 1
        FROM @Accounts a
        INNER JOIN Students s
            ON s.student_code = a.student_code
        INNER JOIN Users u
            ON u.user_id = s.user_id
        WHERE a.role_code = 'STUDENT'
        AND u.username <> a.username
    )
        THROW 50005, N'Mã sinh viên đã được sử dụng bởi tài khoản khác.', 1;

    -- 6. Tạo tài khoản mới
    INSERT INTO Users (
        username, password_hash, full_name, email, status
    )
    SELECT
        a.username,
        a.password_hash,
        a.full_name,
        a.email,
        'ACTIVE'
    FROM @Accounts a
    WHERE NOT EXISTS (
        SELECT 1
        FROM Users u
        WHERE u.username = a.username
        OR u.email = a.email
    );

    -- 7. Cập nhật mật khẩu và thông tin cho tài khoản kiểm thử đã tồn tại
    UPDATE u
    SET
        u.password_hash = a.password_hash,
        u.full_name = a.full_name,
        u.status = 'ACTIVE'
    FROM Users u
    INNER JOIN @Accounts a
        ON a.username = u.username
    AND a.email = u.email;

    -- 8. Đồng bộ đúng một vai trò cho từng tài khoản kiểm thử
    DELETE ur
    FROM UserRoles ur
    INNER JOIN Users u ON u.user_id = ur.user_id
    INNER JOIN @Accounts a ON a.username = u.username;

    INSERT INTO UserRoles (user_id, role_id)
    SELECT u.user_id, r.role_id
    FROM @Accounts a
    INNER JOIN Users u
        ON u.username = a.username
    AND u.email = a.email
    INNER JOIN Roles r
        ON r.role_code = a.role_code;

    -- 9. Tạo hồ sơ sinh viên
    INSERT INTO Students (
        user_id, student_code, faculty_id, class_name
    )
    SELECT
        u.user_id,
        a.student_code,
        f.faculty_id,
        N'Lớp kiểm thử'
    FROM @Accounts a
    INNER JOIN Users u
        ON u.username = a.username
    AND u.email = a.email
    INNER JOIN Faculties f
        ON f.faculty_name = a.faculty_name
    WHERE a.role_code = 'STUDENT'
    AND NOT EXISTS (
        SELECT 1
        FROM Students s
        WHERE s.user_id = u.user_id
    );

    -- 10. Đồng bộ khoa/trường của hồ sơ sinh viên
    UPDATE s
    SET
        s.student_code = a.student_code,
        s.faculty_id = f.faculty_id
    FROM Students s
    INNER JOIN Users u ON u.user_id = s.user_id
    INNER JOIN @Accounts a ON a.username = u.username
    INNER JOIN Faculties f ON f.faculty_name = a.faculty_name
    WHERE a.role_code = 'STUDENT';

    -- 11. Mỗi tài khoản ORGANIZER chỉ liên kết đơn vị được chỉ định
    DELETE ou
    FROM OrganizationUsers ou
    INNER JOIN Users u ON u.user_id = ou.user_id
    INNER JOIN @Accounts a ON a.username = u.username
    WHERE a.role_code = 'ORGANIZER';

    INSERT INTO OrganizationUsers (organization_id, user_id)
    SELECT o.organization_id, u.user_id
    FROM @Accounts a
    INNER JOIN Users u
        ON u.username = a.username
    AND u.email = a.email
    INNER JOIN Organizations o
        ON o.organization_code = a.organization_code
    WHERE a.role_code = 'ORGANIZER';

    COMMIT TRANSACTION;

    PRINT N'Tạo và cập nhật 9 tài khoản kiểm thử thành công.';

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    THROW;
END CATCH;
GO

-- 12. Kiểm tra danh sách tài khoản
SELECT
    u.user_id,
    u.username,
    u.email,
    u.full_name,
    u.status,
    r.role_code,
    s.student_code,
    f.faculty_name,
    o.organization_code,
    o.organization_name
FROM Users u
INNER JOIN UserRoles ur ON ur.user_id = u.user_id
INNER JOIN Roles r ON r.role_id = ur.role_id
LEFT JOIN Students s ON s.user_id = u.user_id
LEFT JOIN Faculties f ON f.faculty_id = s.faculty_id
LEFT JOIN OrganizationUsers ou ON ou.user_id = u.user_id
LEFT JOIN Organizations o ON o.organization_id = ou.organization_id
WHERE u.username IN (
    ${accounts.map(a => sqlString(a.username)).join(',\n    ')}
)
ORDER BY r.role_code, u.username;
GO
`;

    const projectRoot = path.resolve(__dirname, '../..');
    const databaseFolder = path.join(projectRoot, 'database');

    fs.mkdirSync(databaseFolder, { recursive: true });

    const outputPath = path.join(databaseFolder, 'DemoAccounts.sql');
    fs.writeFileSync(outputPath, sql, 'utf8');

    console.log('Đã tạo file:', outputPath);
    console.log('Tổng số tài khoản:', accounts.length);
    console.log('Sinh viên: 3 | Đơn vị tổ chức: 6');
}

main().catch(error => {
    console.error('Không thể tạo DemoAccounts.sql:', error);
    process.exit(1);
});
