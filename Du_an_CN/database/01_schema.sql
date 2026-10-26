
CREATE DATABASE StudentActivityDB
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE StudentActivityDB;

-- ROLES
CREATE TABLE Roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_code VARCHAR(50) UNIQUE NOT NULL,
    role_name VARCHAR(100) NOT NULL
);

-- PERMISSIONS
CREATE TABLE Permissions (
    permission_id INT AUTO_INCREMENT PRIMARY KEY,
    permission_code VARCHAR(100) UNIQUE NOT NULL,
    description VARCHAR(255)
);

CREATE TABLE RolePermissions (
    role_id INT,
    permission_id INT,

    PRIMARY KEY(role_id, permission_id),

    FOREIGN KEY(role_id)
        REFERENCES Roles(role_id),

    FOREIGN KEY(permission_id)
        REFERENCES Permissions(permission_id)
);

-- USERS
CREATE TABLE Users (
    user_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,

    full_name VARCHAR(255) NOT NULL,

    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),

    status ENUM(
        'PENDING',
        'ACTIVE',
        'LOCKED'
    ) DEFAULT 'PENDING',

    last_login_at DATETIME,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE UserRoles (
    user_id BIGINT,
    role_id INT,

    PRIMARY KEY(user_id, role_id),

    FOREIGN KEY(user_id)
        REFERENCES Users(user_id),

    FOREIGN KEY(role_id)
        REFERENCES Roles(role_id)
);

-- FACULTIES
CREATE TABLE Faculties (
    faculty_id INT AUTO_INCREMENT PRIMARY KEY,
    faculty_name VARCHAR(255) NOT NULL
);

-- STUDENTS
CREATE TABLE Students (
    student_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNIQUE NOT NULL,

    student_code VARCHAR(20) UNIQUE NOT NULL,

    faculty_id INT NOT NULL,

    class_name VARCHAR(50),

    activity_points INT DEFAULT 0,

    FOREIGN KEY(user_id)
        REFERENCES Users(user_id),

    FOREIGN KEY(faculty_id)
        REFERENCES Faculties(faculty_id)
);

-- ORGANIZATIONS
CREATE TABLE Organizations (
    organization_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    organization_code VARCHAR(50) UNIQUE NOT NULL,

    organization_name VARCHAR(255) NOT NULL,

    organization_type ENUM(
        'SCHOOL_UNION',
        'STUDENT_ASSOCIATION',
        'FACULTY_UNION',
        'CLUB'
    ) NOT NULL,

    faculty_id INT,

    status ENUM(
        'ACTIVE',
        'INACTIVE'
    ) DEFAULT 'ACTIVE',

    FOREIGN KEY(faculty_id)
        REFERENCES Faculties(faculty_id)
);

CREATE TABLE OrganizationUsers (
    organization_id BIGINT,
    user_id BIGINT,

    PRIMARY KEY(organization_id, user_id),

    FOREIGN KEY(organization_id)
        REFERENCES Organizations(organization_id),

    FOREIGN KEY(user_id)
        REFERENCES Users(user_id)
);

-- CLUB MEMBERS
CREATE TABLE ClubMembers (
    club_id BIGINT,
    student_id BIGINT,

    join_date DATE,

    status ENUM(
        'ACTIVE',
        'INACTIVE'
    ) DEFAULT 'ACTIVE',

    PRIMARY KEY(club_id, student_id),

    FOREIGN KEY(club_id)
        REFERENCES Organizations(organization_id),

    FOREIGN KEY(student_id)
        REFERENCES Students(student_id)
);

-- ACTIVITIES
CREATE TABLE Activities (
    activity_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    activity_code VARCHAR(50) UNIQUE NOT NULL,

    organization_id BIGINT NOT NULL,

    activity_name VARCHAR(255) NOT NULL,

    description TEXT,

    location VARCHAR(255),

    registration_start DATETIME,
    registration_end DATETIME,

    activity_start DATETIME,
    activity_end DATETIME,

    max_participants INT,

    current_participants INT DEFAULT 0,

    registration_mode ENUM(
        'OPEN',
        'APPROVAL'
    ) DEFAULT 'OPEN',

    status ENUM(
        'DRAFT',
        'PUBLISHED',
        'REGISTERING',
        'ONGOING',
        'COMPLETED',
        'CANCELLED'
    ) DEFAULT 'DRAFT',

    created_by BIGINT NOT NULL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME,

    FOREIGN KEY(organization_id)
        REFERENCES Organizations(organization_id),

    FOREIGN KEY(created_by)
        REFERENCES Users(user_id)
);

-- ACTIVITY CONDITIONS
CREATE TABLE ActivityConditions (
    condition_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    activity_id BIGINT NOT NULL,

    condition_key VARCHAR(100),

    operator_type ENUM(
        '=',
        '>',
        '<',
        '>=',
        '<='
    ),

    condition_value VARCHAR(255),

    FOREIGN KEY(activity_id)
        REFERENCES Activities(activity_id)
);

-- ACTIVITY APPROVALS
CREATE TABLE ActivityApprovals (
    approval_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    activity_id BIGINT NOT NULL,

    approver_id BIGINT NOT NULL,

    status ENUM(
        'PENDING',
        'APPROVED',
        'REJECTED'
    ) DEFAULT 'PENDING',

    note TEXT,

    approved_at DATETIME,

    FOREIGN KEY(activity_id)
        REFERENCES Activities(activity_id),

    FOREIGN KEY(approver_id)
        REFERENCES Users(user_id)
);

-- REGISTRATIONS
CREATE TABLE Registrations (
    registration_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    activity_id BIGINT NOT NULL,

    student_id BIGINT NOT NULL,

    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    status ENUM(
        'PENDING',
        'APPROVED',
        'REJECTED',
        'CANCELLED'
    ) DEFAULT 'PENDING',

    approval_note TEXT,

    approved_by BIGINT,

    approved_at DATETIME,

    FOREIGN KEY(activity_id)
        REFERENCES Activities(activity_id),

    FOREIGN KEY(student_id)
        REFERENCES Students(student_id),

    FOREIGN KEY(approved_by)
        REFERENCES Users(user_id),

    UNIQUE(activity_id, student_id)
);

-- PARTICIPATION
CREATE TABLE ActivityParticipation (
    participation_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    registration_id BIGINT UNIQUE NOT NULL,

    attendance_status ENUM(
        'ATTENDED',
        'PARTIAL',
        'ABSENT'
    ),

    activity_point INT DEFAULT 0,

    confirmed_by BIGINT,

    confirmed_at DATETIME,

    FOREIGN KEY(registration_id)
        REFERENCES Registrations(registration_id),

    FOREIGN KEY(confirmed_by)
        REFERENCES Users(user_id)
);

-- NOTIFICATIONS
CREATE TABLE Notifications (
    notification_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    sender_id BIGINT NOT NULL,

    title VARCHAR(255) NOT NULL,

    content TEXT NOT NULL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(sender_id)
        REFERENCES Users(user_id)
);

CREATE TABLE NotificationRecipients (
    notification_id BIGINT,
    user_id BIGINT,

    is_read BOOLEAN DEFAULT FALSE,

    read_at DATETIME,

    PRIMARY KEY(notification_id,user_id),

    FOREIGN KEY(notification_id)
        REFERENCES Notifications(notification_id),

    FOREIGN KEY(user_id)
        REFERENCES Users(user_id)
);

-- SYSTEM CONFIG
CREATE TABLE SystemConfigs (
    config_key VARCHAR(100) PRIMARY KEY,
    config_value TEXT NOT NULL
);

-- AUDIT LOG
CREATE TABLE AuditLogs (
    log_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT,

    action_name VARCHAR(255),

    entity_name VARCHAR(100),

    entity_id BIGINT,

    old_data JSON,
    new_data JSON,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(user_id)
        REFERENCES Users(user_id)
);