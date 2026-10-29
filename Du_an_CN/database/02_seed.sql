/* =========================================================
    Seed.sql - SQL Server Version
    Dữ liệu mẫu cho StudentActivityDB
   ========================================================= */

USE StudentActivityDB;
GO

/* =========================================================
    1. ROLES
   ========================================================= */
INSERT INTO Roles (role_code, role_name)
VALUES
    ('STUDENT',   N'Sinh viên'),
    ('ORGANIZER', N'Đơn vị tổ chức'),
    ('ADMIN',     N'Quản trị viên');
GO

/* =========================================================
    2. PERMISSIONS
   ========================================================= */
INSERT INTO Permissions (permission_code, description)
VALUES
    ('LOGIN',                  N'Đăng nhập'),
    ('VIEW_ACTIVITY',          N'Xem hoạt động'),
    ('REGISTER_ACTIVITY',      N'Đăng ký hoạt động'),
    ('CANCEL_REGISTRATION',    N'Hủy đăng ký hoạt động'),
    ('VIEW_OWN_HISTORY',       N'Xem lịch sử cá nhân'),
    ('UPDATE_OWN_PROFILE',     N'Cập nhật hồ sơ cá nhân'),
    ('CREATE_ACTIVITY',        N'Tạo hoạt động'),
    ('UPDATE_ACTIVITY',        N'Cập nhật hoạt động'),
    ('PUBLISH_ACTIVITY',       N'Công bố hoạt động'),
    ('APPROVE_REGISTRATION',   N'Duyệt đăng ký'),
    ('REJECT_REGISTRATION',    N'Từ chối đăng ký'),
    ('CONFIRM_PARTICIPATION',  N'Xác nhận tham gia'),
    ('ASSIGN_POINTS',          N'Ghi nhận điểm hoạt động'),
    ('SEND_NOTIFICATION',      N'Gửi thông báo'),
    ('MANAGE_USERS',           N'Quản lý tài khoản'),
    ('MANAGE_ROLES',           N'Quản lý phân quyền'),
    ('MANAGE_ORGANIZATIONS',   N'Quản lý đơn vị tổ chức'),
    ('MANAGE_SYSTEM_CONFIG',   N'Cấu hình hệ thống'),
    ('VIEW_AUDIT_LOG',         N'Xem nhật ký hệ thống');
GO

/* =========================================================
    3. ROLE PERMISSIONS - STUDENT
   ========================================================= */
INSERT INTO RolePermissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM Roles r
CROSS JOIN Permissions p
WHERE r.role_code = 'STUDENT'
    AND p.permission_code IN (
        'LOGIN',
        'VIEW_ACTIVITY',
        'REGISTER_ACTIVITY',
        'CANCEL_REGISTRATION',
        'VIEW_OWN_HISTORY',
        'UPDATE_OWN_PROFILE'
    );
GO

/* =========================================================
    4. ROLE PERMISSIONS - ORGANIZER
   ========================================================= */
INSERT INTO RolePermissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM Roles r
CROSS JOIN Permissions p
WHERE r.role_code = 'ORGANIZER'
    AND p.permission_code IN (
        'LOGIN',
        'VIEW_ACTIVITY',
        'CREATE_ACTIVITY',
        'UPDATE_ACTIVITY',
        'PUBLISH_ACTIVITY',
        'APPROVE_REGISTRATION',
        'REJECT_REGISTRATION',
        'CONFIRM_PARTICIPATION',
        'ASSIGN_POINTS',
        'SEND_NOTIFICATION'
    );
GO

/* =========================================================
    5. ROLE PERMISSIONS - ADMIN
   ========================================================= */
INSERT INTO RolePermissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM Roles r
CROSS JOIN Permissions p
WHERE r.role_code = 'ADMIN'
    AND p.permission_code IN (
        'LOGIN',
        'MANAGE_USERS',
        'MANAGE_ROLES',
        'MANAGE_ORGANIZATIONS',
        'MANAGE_SYSTEM_CONFIG',
        'VIEW_AUDIT_LOG'
    );
GO

/* =========================================================
    6. FACULTIES
   ========================================================= */
INSERT INTO Faculties (faculty_name)
VALUES
    (N'Trường Kỹ thuật và Công nghệ'),
    (N'Trường Kinh tế và Luật'),
    (N'Trường Y Dược');
GO

/* =========================================================
    7. ORGANIZATIONS
   ========================================================= */

-- Đoàn Thanh niên TVU
INSERT INTO Organizations (organization_code, organization_name, organization_type)
VALUES ('TVU_UNION', N'Đoàn Thanh niên Đại học Trà Vinh', 'SCHOOL_UNION');
GO

-- Hội Sinh viên TVU
INSERT INTO Organizations (organization_code, organization_name, organization_type)
VALUES ('TVU_STUDENT_ASSOC', N'Hội Sinh viên Đại học Trà Vinh', 'STUDENT_ASSOCIATION');
GO

-- Đoàn Trường Kỹ thuật và Công nghệ
INSERT INTO Organizations (organization_code, organization_name, organization_type, faculty_id)
VALUES ('TECH_UNION', N'Đoàn Trường Kỹ thuật và Công nghệ', 'FACULTY_UNION', 1);
GO

-- Đoàn Trường Kinh tế và Luật
INSERT INTO Organizations (organization_code, organization_name, organization_type, faculty_id)
VALUES ('LAW_UNION', N'Đoàn Trường Kinh tế và Luật', 'FACULTY_UNION', 2);
GO

-- Đoàn Trường Y Dược
INSERT INTO Organizations (organization_code, organization_name, organization_type, faculty_id)
VALUES ('MED_UNION', N'Đoàn Trường Y Dược', 'FACULTY_UNION', 3);
GO

-- CLB Kỹ năng sống
INSERT INTO Organizations (organization_code, organization_name, organization_type)
VALUES ('LIFE_SKILL_CLUB', N'Câu lạc bộ Kỹ năng sống', 'CLUB');
GO

-- CLB Truyền thông
INSERT INTO Organizations (organization_code, organization_name, organization_type)
VALUES ('MEDIA_CLUB', N'Câu lạc bộ Truyền thông TVU', 'CLUB');
GO

-- CLB Văn hóa Nghệ thuật
INSERT INTO Organizations (organization_code, organization_name, organization_type)
VALUES ('ART_CLUB', N'Câu lạc bộ Văn hóa Nghệ thuật TVU', 'CLUB');
GO

/* =========================================================
    8. SYSTEM CONFIGS
   ========================================================= */
INSERT INTO SystemConfigs (config_key, config_value)
VALUES
    ('MAX_CANCEL_HOURS',          '24'),
    ('ALLOW_SELF_REGISTER',       'TRUE'),
    ('ACTIVITY_POINT_ENABLED',    'TRUE'),
    ('DEFAULT_REGISTRATION_MODE', 'OPEN');
GO