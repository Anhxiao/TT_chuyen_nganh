USE StudentActivityDB;

-- ROLES
INSERT INTO Roles(role_code, role_name)
VALUES
('STUDENT','Sinh viên'),
('ORGANIZER','Đơn vị tổ chức'),
('ADMIN','Quản trị viên');

-- PERMISSIONS
INSERT INTO Permissions
(
    permission_code,
    description
)
VALUES

('LOGIN','Đăng nhập'),

('VIEW_ACTIVITY','Xem hoạt động'),
('REGISTER_ACTIVITY','Đăng ký hoạt động'),
('CANCEL_REGISTRATION','Hủy đăng ký hoạt động'),
('VIEW_OWN_HISTORY','Xem lịch sử cá nhân'),
('UPDATE_OWN_PROFILE','Cập nhật hồ sơ cá nhân'),

('CREATE_ACTIVITY','Tạo hoạt động'),
('UPDATE_ACTIVITY','Cập nhật hoạt động'),
('PUBLISH_ACTIVITY','Công bố hoạt động'),

('APPROVE_REGISTRATION','Duyệt đăng ký'),
('REJECT_REGISTRATION','Từ chối đăng ký'),

('CONFIRM_PARTICIPATION','Xác nhận tham gia'),
('ASSIGN_POINTS','Ghi nhận điểm hoạt động'),

('SEND_NOTIFICATION','Gửi thông báo'),

('MANAGE_USERS','Quản lý tài khoản'),
('MANAGE_ROLES','Quản lý phân quyền'),
('MANAGE_ORGANIZATIONS','Quản lý đơn vị tổ chức'),
('MANAGE_SYSTEM_CONFIG','Cấu hình hệ thống'),
('VIEW_AUDIT_LOG','Xem nhật ký hệ thống');

-- STUDENT PERMISSIONS
INSERT INTO RolePermissions
(
    role_id,
    permission_id
)
SELECT
    r.role_id,
    p.permission_id
FROM Roles r
JOIN Permissions p
ON 1 = 1
WHERE r.role_code = 'STUDENT'
AND p.permission_code IN
(
    'LOGIN',
    'VIEW_ACTIVITY',
    'REGISTER_ACTIVITY',
    'CANCEL_REGISTRATION',
    'VIEW_OWN_HISTORY',
    'UPDATE_OWN_PROFILE'
);

-- ORGANIZER PERMISSIONS
INSERT INTO RolePermissions
(
    role_id,
    permission_id
)
SELECT
    r.role_id,
    p.permission_id
FROM Roles r
JOIN Permissions p
ON 1 = 1
WHERE r.role_code = 'ORGANIZER'
AND p.permission_code IN
(
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

-- ADMIN PERMISSIONS
INSERT INTO RolePermissions
(
    role_id,
    permission_id
)
SELECT
    r.role_id,
    p.permission_id
FROM Roles r
JOIN Permissions p
ON 1 = 1
WHERE r.role_code = 'ADMIN'
AND p.permission_code IN
(
    'LOGIN',

    'MANAGE_USERS',
    'MANAGE_ROLES',
    'MANAGE_ORGANIZATIONS',
    'MANAGE_SYSTEM_CONFIG',

    'VIEW_AUDIT_LOG'
);

-- FACULTIES
INSERT INTO Faculties
(
    faculty_name
)
VALUES
('Trường Kỹ thuật và Công nghệ'),
('Trường Kinh tế và Luật'),
('Trường Y Dược');

-- ORGANIZATIONS
-- ĐOÀN THANH NIÊN TVU

INSERT INTO Organizations
(
    organization_code,
    organization_name,
    organization_type
)
VALUES
(
    'TVU_UNION',
    'Đoàn Thanh niên Đại học Trà Vinh',
    'SCHOOL_UNION'
);

-- HỘI SINH VIÊN TVU
INSERT INTO Organizations
(
    organization_code,
    organization_name,
    organization_type
)
VALUES
(
    'TVU_STUDENT_ASSOC',
    'Hội Sinh viên Đại học Trà Vinh',
    'STUDENT_ASSOCIATION'
);

-- TRƯỜNG KỸ THUẬT VÀ CÔNG NGHỆ
INSERT INTO Organizations
(
    organization_code,
    organization_name,
    organization_type,
    faculty_id
)
VALUES
(
    'TECH_UNION',
    'Đoàn Trường Kỹ thuật và Công nghệ',
    'FACULTY_UNION',
    1
);

-- TRƯỜNG KINH TẾ VÀ LUẬT
INSERT INTO Organizations
(
    organization_code,
    organization_name,
    organization_type,
    faculty_id
)
VALUES
(
    'LAW_UNION',
    'Đoàn Trường Kinh tế và Luật',
    'FACULTY_UNION',
    2
);

-- TRƯỜNG Y DƯỢC
INSERT INTO Organizations
(
    organization_code,
    organization_name,
    organization_type,
    faculty_id
)
VALUES
(
    'MED_UNION',
    'Đoàn Trường Y Dược',
    'FACULTY_UNION',
    3
);

-- CLB KỸ NĂNG SỐNG
INSERT INTO Organizations
(
    organization_code,
    organization_name,
    organization_type
)
VALUES
(
    'LIFE_SKILL_CLUB',
    'Câu lạc bộ Kỹ năng sống',
    'CLUB'
);

-- CLB TRUYỀN THÔNG
INSERT INTO Organizations
(
    organization_code,
    organization_name,
    organization_type
)
VALUES
(
    'MEDIA_CLUB',
    'Câu lạc bộ Truyền thông TVU',
    'CLUB'
);

-- CLB VĂN HÓA NGHỆ THUẬT
INSERT INTO Organizations
(
    organization_code,
    organization_name,
    organization_type
)
VALUES
(
    'ART_CLUB',
    'Câu lạc bộ Văn hóa Nghệ thuật TVU',
    'CLUB'
);

-- SYSTEM CONFIGURATION
INSERT INTO SystemConfigs
(
    config_key,
    config_value
)
VALUES
(
    'MAX_CANCEL_HOURS',
    '24'
);

INSERT INTO SystemConfigs
(
    config_key,
    config_value
)
VALUES
(
    'ALLOW_SELF_REGISTER',
    'TRUE'
);

INSERT INTO SystemConfigs
(
    config_key,
    config_value
)
VALUES
(
    'ACTIVITY_POINT_ENABLED',
    'TRUE'
);

INSERT INTO SystemConfigs
(
    config_key,
    config_value
)
VALUES
(
    'DEFAULT_REGISTRATION_MODE',
    'OPEN'
);