
/* =========================================================
DemoAccounts.sql
Database: StudentActivityDB
9 STUDENT + 6 ORGANIZER
Student codes and class names are fixed.
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
    class_name NVARCHAR(50) NULL,
    faculty_name NVARCHAR(255) NULL,
    organization_code VARCHAR(50) NULL
);

INSERT INTO @Accounts (
    username,
    email,
    password_hash,
    full_name,
    role_code,
    student_code,
    class_name,
    faculty_name,
    organization_code
)
VALUES

-- =========================================================
-- STUDENT - KỸ THUẬT VÀ CÔNG NGHỆ
-- =========================================================
(
    'sv.ktcn',
    'sv.ktcn@st.tvu.edu.vn',
    '$2b$10$Wf3egPOc8.T.wKJEDVkzn.J4TKKMyvs.8BmBnCxKGOfONlac9yJ9i',
    N'Nguyễn Minh Anh',
    'STUDENT',
    '110123047',
    N'DA23TTC',
    N'Trường Kỹ thuật và Công nghệ',
    NULL
),
(
    'sv.ktcn01',
    'sv.ktcn01@st.tvu.edu.vn',
    '$2b$10$SVteB9hdNXZ/emlMHKsvQOzhCFejynCteRt/bMhgHSV93ZkkPQgk.',
    N'Trần Quốc Bảo',
    'STUDENT',
    '110123286',
    N'DA23KTP',
    N'Trường Kỹ thuật và Công nghệ',
    NULL
),
(
    'sv.ktcn02',
    'sv.ktcn02@st.tvu.edu.vn',
    '$2b$10$YYDrxg7B2Zw667jAaIVF/.m/rj/8VUHt96vQZQ53SzIv0HUBIC.uu',
    N'Lê Hoàng Phúc',
    'STUDENT',
    '110123591',
    N'DA23DDE',
    N'Trường Kỹ thuật và Công nghệ',
    NULL
),

-- =========================================================
-- STUDENT - KINH TẾ VÀ LUẬT
-- =========================================================
(
    'sv.ktl',
    'sv.ktl@st.tvu.edu.vn',
    '$2b$10$S2DwVdnwdNPFoikiRaY39uvkmodMIYFab5i3kdA9ucIvJw/i8qAcK',
    N'Phạm Ngọc Hà',
    'STUDENT',
    '110123103',
    N'DA23QTK',
    N'Trường Kinh tế và Luật',
    NULL
),
(
    'sv.ktl01',
    'sv.ktl01@st.tvu.edu.vn',
    '$2b$10$wqIi7ZvwYw6oyXGpf4GQxuQea5IRYAPvUWUXkpRHiqYpmyf54P.RG',
    N'Võ Thành Đạt',
    'STUDENT',
    '110123824',
    N'DA23KTO',
    N'Trường Kinh tế và Luật',
    NULL
),
(
    'sv.ktl02',
    'sv.ktl02@st.tvu.edu.vn',
    '$2b$10$PUOw4sufVCPIVJpKXryLFuplsRui0VzNUqKO/Bi5n29CSg3JaDTpe',
    N'Nguyễn Thảo Vy',
    'STUDENT',
    '110123365',
    N'DA23LKT',
    N'Trường Kinh tế và Luật',
    NULL
),

-- =========================================================
-- STUDENT - Y DƯỢC
-- =========================================================
(
    'sv.yd',
    'sv.yd@st.tvu.edu.vn',
    '$2b$10$AeDl453yciimQMIfy3.Ux.IqZHHLY2hJqJEEfnL3n7APeQueU8Cji',
    N'Trần Minh Khang',
    'STUDENT',
    '110123719',
    N'DA23YDK',
    N'Trường Y Dược',
    NULL
),
(
    'sv.yd01',
    'sv.yd01@st.tvu.edu.vn',
    '$2b$10$7M09L9QPDXiw5b73I96KvOr69ncr.TJEIhYrgCTEQv/ckruTbnwB.',
    N'Lê Ngọc Trâm',
    'STUDENT',
    '110123052',
    N'DA23DDU',
    N'Trường Y Dược',
    NULL
),
(
    'sv.yd02',
    'sv.yd02@st.tvu.edu.vn',
    '$2b$10$NhGxYUXdWry1NUy4tRSCteYijksMvRpqmtDEIj7uJKObYAmcjeyUe',
    N'Phạm Gia Huy',
    'STUDENT',
    '110123438',
    N'DA23XNY',
    N'Trường Y Dược',
    NULL
),

-- =========================================================
-- ORGANIZER - ĐOÀN TRƯỜNG
-- =========================================================
(
    'doanktcn',
    'doanktcn@organizer.local',
    '$2b$10$JgPYYSKAEguAYOTDBdQSj.1CV2MQvoCPmqiYgU6vd5z9SPa7Utqku',
    N'Tài khoản Đoàn Trường Kỹ thuật và Công nghệ',
    'ORGANIZER',
    NULL,
    NULL,
    NULL,
    'TECH_UNION'
),
(
    'doanktl',
    'doanktl@organizer.local',
    '$2b$10$45OkV4g3rAd8FYogGvmmVuBj.92vndm8W74gN/Knme3C7jyBWazlm',
    N'Tài khoản Đoàn Trường Kinh tế và Luật',
    'ORGANIZER',
    NULL,
    NULL,
    NULL,
    'LAW_UNION'
),
(
    'doanyd',
    'doanyd@organizer.local',
    '$2b$10$XPuywl0OdyBWMKVPO1Mp8OZeV38DKkUXcN1.uIXGDwyWeS3DvpBuq',
    N'Tài khoản Đoàn Trường Y Dược',
    'ORGANIZER',
    NULL,
    NULL,
    NULL,
    'MED_UNION'
),

-- =========================================================
-- ORGANIZER - CÂU LẠC BỘ
-- =========================================================
(
    'clbkynang',
    'clbkynang@organizer.local',
    '$2b$10$GS1Odyn0yfO6/HSUErtcneElEICZFm7NuDtY/j.j/rJPfFRmZTV8q',
    N'Tài khoản CLB Kỹ năng sống',
    'ORGANIZER',
    NULL,
    NULL,
    NULL,
    'LIFE_SKILL_CLUB'
),
(
    'clbtruyenthong',
    'clbtruyenthong@organizer.local',
    '$2b$10$9bP/uOPBwFItYMnd0OuS/uXkoD7r/aTOTMi9pfCFqNKvxZE2Dh8na',
    N'Tài khoản CLB Truyền thông TVU',
    'ORGANIZER',
    NULL,
    NULL,
    NULL,
    'MEDIA_CLUB'
),
(
    'clbvanhoa',
    'clbvanhoa@organizer.local',
    '$2b$10$fjRYpserZ1QGJ5I8/sCEK.tBpzhuL.LDG.X35//ABejg3pz6ofrJm',
    N'Tài khoản CLB Văn hóa Nghệ thuật TVU',
    'ORGANIZER',
    NULL,
    NULL,
    NULL,
    'ART_CLUB'
);

BEGIN TRY
    BEGIN TRANSACTION;

    -- 1. Kiểm tra vai trò
    IF EXISTS (
        SELECT 1
        FROM @Accounts a
        LEFT JOIN Roles r ON r.role_code = a.role_code
        WHERE r.role_id IS NULL
    )
    BEGIN
        ;THROW 50001, N'Thiếu vai trò STUDENT hoặc ORGANIZER trong Roles.', 1;
    END;

    -- 2. Kiểm tra mã sinh viên
    IF EXISTS (
        SELECT 1
        FROM @Accounts a
        WHERE a.role_code = 'STUDENT'
          AND (
              a.student_code IS NULL
              OR LEN(a.student_code) <> 9
              OR a.student_code NOT LIKE '110123[0-9][0-9][0-9]'
          )
    )
    BEGIN
        ;THROW 50002, N'Mã sinh viên phải có 9 chữ số và bắt đầu bằng 110123.', 1;
    END;

    -- 3. Kiểm tra mã sinh viên trùng trong danh sách demo
    IF EXISTS (
        SELECT student_code
        FROM @Accounts
        WHERE role_code = 'STUDENT'
        GROUP BY student_code
        HAVING COUNT(*) > 1
    )
    BEGIN
        ;THROW 50003, N'Mã sinh viên bị trùng trong danh sách tài khoản demo.', 1;
    END;

    -- 4. Kiểm tra mã lớp
    IF EXISTS (
        SELECT 1
        FROM @Accounts a
        WHERE a.role_code = 'STUDENT'
          AND (
              a.class_name IS NULL
              OR LEN(a.class_name) <> 7
              OR a.class_name NOT LIKE 'DA23[A-Z][A-Z][A-Z]'
          )
    )
    BEGIN
        ;THROW 50008, N'Mã lớp phải có dạng DA23 và theo sau bởi 3 chữ cái in hoa.', 1;
    END;

    -- 5. Kiểm tra mã lớp không trùng trong danh sách demo
    IF EXISTS (
        SELECT class_name
        FROM @Accounts
        WHERE role_code = 'STUDENT'
        GROUP BY class_name
        HAVING COUNT(*) > 1
    )
    BEGIN
        ;THROW 50009, N'Mã lớp bị trùng trong danh sách tài khoản demo.', 1;
    END;

    -- 6. Kiểm tra trường đào tạo
    IF EXISTS (
        SELECT 1
        FROM @Accounts a
        LEFT JOIN Faculties f ON f.faculty_name = a.faculty_name
        WHERE a.role_code = 'STUDENT'
          AND f.faculty_id IS NULL
    )
    BEGIN
        ;THROW 50004, N'Không tìm thấy trường đào tạo tương ứng trong Faculties.', 1;
    END;

    -- 7. Kiểm tra đơn vị tổ chức
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
    BEGIN
        ;THROW 50005, N'Thiếu hoặc đơn vị tổ chức không hoạt động.', 1;
    END;

    -- 8. Kiểm tra username và email
    IF EXISTS (
        SELECT 1
        FROM @Accounts a
        WHERE EXISTS (
            SELECT 1
            FROM Users u
            WHERE u.username = a.username
              AND u.email <> a.email
        )
        OR EXISTS (
            SELECT 1
            FROM Users u
            WHERE u.email = a.email
              AND u.username <> a.username
        )
    )
    BEGIN
        ;THROW 50006, N'Username hoặc email đã thuộc tài khoản khác.', 1;
    END;

    -- 9. Kiểm tra mã sinh viên đã thuộc tài khoản khác
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
    BEGIN
        ;THROW 50007, N'Mã sinh viên đã được sử dụng bởi tài khoản khác.', 1;
    END;

    -- 10. Tạo tài khoản mới
    INSERT INTO Users (
        username,
        password_hash,
        full_name,
        email,
        status
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

    -- 11. Cập nhật tài khoản đã tồn tại
    UPDATE u
    SET
        u.password_hash = a.password_hash,
        u.full_name = a.full_name,
        u.status = 'ACTIVE'
    FROM Users u
    INNER JOIN @Accounts a
        ON a.username = u.username
       AND a.email = u.email;

    -- 12. Đồng bộ vai trò
    DELETE ur
    FROM UserRoles ur
    INNER JOIN Users u ON u.user_id = ur.user_id
    INNER JOIN @Accounts a ON a.username = u.username;

    INSERT INTO UserRoles (user_id, role_id)
    SELECT
        u.user_id,
        r.role_id
    FROM @Accounts a
    INNER JOIN Users u
        ON u.username = a.username
       AND u.email = a.email
    INNER JOIN Roles r
        ON r.role_code = a.role_code;

    -- 13. Tạo hồ sơ sinh viên nếu chưa tồn tại
    INSERT INTO Students (
        user_id,
        student_code,
        faculty_id,
        class_name
    )
    SELECT
        u.user_id,
        a.student_code,
        f.faculty_id,
        a.class_name
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

    -- 14. Cập nhật hồ sơ sinh viên đã tồn tại
    UPDATE s
    SET
        s.student_code = a.student_code,
        s.class_name = a.class_name,
        s.faculty_id = f.faculty_id
    FROM Students s
    INNER JOIN Users u
        ON u.user_id = s.user_id
    INNER JOIN @Accounts a
        ON a.username = u.username
       AND a.email = u.email
    INNER JOIN Faculties f
        ON f.faculty_name = a.faculty_name
    WHERE a.role_code = 'STUDENT';

    -- 15. Liên kết đơn vị tổ chức
    DELETE ou
    FROM OrganizationUsers ou
    INNER JOIN Users u ON u.user_id = ou.user_id
    INNER JOIN @Accounts a ON a.username = u.username
    WHERE a.role_code = 'ORGANIZER';

    INSERT INTO OrganizationUsers (
        organization_id,
        user_id
    )
    SELECT
        o.organization_id,
        u.user_id
    FROM @Accounts a
    INNER JOIN Users u
        ON u.username = a.username
       AND u.email = a.email
    INNER JOIN Organizations o
        ON o.organization_code = a.organization_code
    WHERE a.role_code = 'ORGANIZER';

    COMMIT TRANSACTION;

    PRINT N'Tạo và cập nhật 15 tài khoản kiểm thử thành công.';

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    THROW;
END CATCH;
GO

-- =========================================================
-- 16. KIỂM TRA DANH SÁCH TÀI KHOẢN SAU KHI ĐỒNG BỘ
-- =========================================================

SELECT
    u.user_id,
    u.username,
    u.email,
    u.full_name,
    u.status,
    r.role_code,
    s.student_code,
    s.class_name,
    f.faculty_name AS school_name,
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
    'sv.ktcn',
    'sv.ktcn01',
    'sv.ktcn02',
    'sv.ktl',
    'sv.ktl01',
    'sv.ktl02',
    'sv.yd',
    'sv.yd01',
    'sv.yd02',
    'doanktcn',
    'doanktl',
    'doanyd',
    'clbkynang',
    'clbtruyenthong',
    'clbvanhoa'
)
ORDER BY r.role_code, u.username;
GO
