/* =========================================================
    Schema.sql - SQL Server Version
    Database: StudentActivityDB
   ========================================================= */

-- Tạo database nếu chưa tồn tại
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'StudentActivityDB')
BEGIN
    CREATE DATABASE StudentActivityDB;
END
GO

USE StudentActivityDB;
GO

/* =========================================================
    ROLES
   ========================================================= */
IF OBJECT_ID('dbo.Roles', 'U') IS NOT NULL DROP TABLE dbo.Roles;
GO

CREATE TABLE Roles (
    role_id          INT IDENTITY(1,1) PRIMARY KEY,
    role_code        VARCHAR(50)  NOT NULL UNIQUE,
    role_name        NVARCHAR(100) NOT NULL
);
GO

/* =========================================================
    PERMISSIONS
   ========================================================= */
IF OBJECT_ID('dbo.Permissions', 'U') IS NOT NULL DROP TABLE dbo.Permissions;
GO

CREATE TABLE Permissions (
    permission_id    INT IDENTITY(1,1) PRIMARY KEY,
    permission_code  VARCHAR(100) NOT NULL UNIQUE,
    description      NVARCHAR(255) NULL
);
GO

/* =========================================================
    ROLE PERMISSIONS
   ========================================================= */
IF OBJECT_ID('dbo.RolePermissions', 'U') IS NOT NULL DROP TABLE dbo.RolePermissions;
GO

CREATE TABLE RolePermissions (
    role_id          INT NOT NULL,
    permission_id    INT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES Roles(role_id),
    FOREIGN KEY (permission_id) REFERENCES Permissions(permission_id)
);
GO

/* =========================================================
    USERS
   ========================================================= */
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL DROP TABLE dbo.Users;
GO

CREATE TABLE Users (
    user_id          BIGINT IDENTITY(1,1) PRIMARY KEY,
    username         VARCHAR(50)  NOT NULL UNIQUE,
    password_hash    VARCHAR(255) NOT NULL,
    full_name        NVARCHAR(255) NOT NULL,
    email            VARCHAR(255) NULL UNIQUE,
    phone            VARCHAR(20)  NULL,
    status           VARCHAR(20)  NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'ACTIVE', 'LOCKED')),
    last_login_at    DATETIME     NULL,
    created_at       DATETIME     NOT NULL DEFAULT GETDATE()
);
GO

/* =========================================================
    USER ROLES
   ========================================================= */
IF OBJECT_ID('dbo.UserRoles', 'U') IS NOT NULL DROP TABLE dbo.UserRoles;
GO

CREATE TABLE UserRoles (
    user_id          BIGINT NOT NULL,
    role_id          INT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (role_id) REFERENCES Roles(role_id)
);
GO

/* =========================================================
    FACULTIES
   ========================================================= */
IF OBJECT_ID('dbo.Faculties', 'U') IS NOT NULL DROP TABLE dbo.Faculties;
GO

CREATE TABLE Faculties (
    faculty_id       INT IDENTITY(1,1) PRIMARY KEY,
    faculty_name     NVARCHAR(255) NOT NULL
);
GO

/* =========================================================
    STUDENTS
   ========================================================= */
IF OBJECT_ID('dbo.Students', 'U') IS NOT NULL DROP TABLE dbo.Students;
GO

CREATE TABLE Students (
    student_id       BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id          BIGINT NOT NULL UNIQUE,
    student_code     VARCHAR(20) NOT NULL UNIQUE,
    faculty_id       INT NOT NULL,
    class_name       VARCHAR(50) NULL,
    activity_points  INT NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (faculty_id) REFERENCES Faculties(faculty_id)
);
GO

/* =========================================================
    ORGANIZATIONS
   ========================================================= */
IF OBJECT_ID('dbo.Organizations', 'U') IS NOT NULL DROP TABLE dbo.Organizations;
GO

CREATE TABLE Organizations (
    organization_id   BIGINT IDENTITY(1,1) PRIMARY KEY,
    organization_code VARCHAR(50) NOT NULL UNIQUE,
    organization_name NVARCHAR(255) NOT NULL,
    organization_type VARCHAR(30) NOT NULL
    CHECK (organization_type IN (
    'SCHOOL_UNION',
    'STUDENT_ASSOCIATION',
    'FACULTY_UNION',
    'CLUB'
    )),
    faculty_id        INT NULL,
    status            VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'INACTIVE')),
    FOREIGN KEY (faculty_id) REFERENCES Faculties(faculty_id)
);
GO

/* =========================================================
    ORGANIZATION USERS
   ========================================================= */
IF OBJECT_ID('dbo.OrganizationUsers', 'U') IS NOT NULL DROP TABLE dbo.OrganizationUsers;
GO

CREATE TABLE OrganizationUsers (
    organization_id  BIGINT NOT NULL,
    user_id          BIGINT NOT NULL,
    PRIMARY KEY (organization_id, user_id),
    FOREIGN KEY (organization_id) REFERENCES Organizations(organization_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);
GO

/* =========================================================
    CLUB MEMBERS
   ========================================================= */
IF OBJECT_ID('dbo.ClubMembers', 'U') IS NOT NULL DROP TABLE dbo.ClubMembers;
GO

CREATE TABLE ClubMembers (
    club_id          BIGINT NOT NULL,
    student_id       BIGINT NOT NULL,
    join_date        DATE NULL,
    status           VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'INACTIVE')),
    PRIMARY KEY (club_id, student_id),
    FOREIGN KEY (club_id) REFERENCES Organizations(organization_id),
    FOREIGN KEY (student_id) REFERENCES Students(student_id)
);
GO

/* =========================================================
    ACTIVITIES
   ========================================================= */
IF OBJECT_ID('dbo.Activities', 'U') IS NOT NULL DROP TABLE dbo.Activities;
GO

CREATE TABLE Activities (
    activity_id           BIGINT IDENTITY(1,1) PRIMARY KEY,
    activity_code         VARCHAR(50) NOT NULL UNIQUE,
    organization_id       BIGINT NOT NULL,
    activity_name         NVARCHAR(255) NOT NULL,
    description           NVARCHAR(MAX) NULL,
    location              NVARCHAR(255) NULL,
    registration_start    DATETIME NULL,
    registration_end      DATETIME NULL,
    activity_start        DATETIME NULL,
    activity_end          DATETIME NULL,
    max_participants      INT NULL,
    current_participants  INT NOT NULL DEFAULT 0,
    registration_mode     VARCHAR(20) NOT NULL DEFAULT 'OPEN'
    CHECK (registration_mode IN ('OPEN', 'APPROVAL')),
    status                VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN (
    'DRAFT', 'PUBLISHED', 'REGISTERING',
    'ONGOING', 'COMPLETED', 'CANCELLED'
    )),
    created_by            BIGINT NOT NULL,
    created_at            DATETIME NOT NULL DEFAULT GETDATE(),
    updated_at            DATETIME NULL,
    FOREIGN KEY (organization_id) REFERENCES Organizations(organization_id),
    FOREIGN KEY (created_by) REFERENCES Users(user_id)
);
GO

/* =========================================================
    ACTIVITY CONDITIONS
   ========================================================= */
IF OBJECT_ID('dbo.ActivityConditions', 'U') IS NOT NULL DROP TABLE dbo.ActivityConditions;
GO

CREATE TABLE ActivityConditions (
    condition_id     BIGINT IDENTITY(1,1) PRIMARY KEY,
    activity_id      BIGINT NOT NULL,
    condition_key    VARCHAR(100) NULL,
    operator_type    VARCHAR(5) NULL
    CHECK (operator_type IN ('=', '>', '<', '>=', '<=')),
    condition_value  VARCHAR(255) NULL,
    FOREIGN KEY (activity_id) REFERENCES Activities(activity_id)
);
GO

/* =========================================================
    ACTIVITY APPROVALS
   ========================================================= */
IF OBJECT_ID('dbo.ActivityApprovals', 'U') IS NOT NULL DROP TABLE dbo.ActivityApprovals;
GO

CREATE TABLE ActivityApprovals (
    approval_id      BIGINT IDENTITY(1,1) PRIMARY KEY,
    activity_id      BIGINT NOT NULL,
    approver_id      BIGINT NOT NULL,
    status           VARCHAR(20) NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    note             NVARCHAR(MAX) NULL,
    approved_at      DATETIME NULL,
    FOREIGN KEY (activity_id) REFERENCES Activities(activity_id),
    FOREIGN KEY (approver_id) REFERENCES Users(user_id)
);
GO

/* =========================================================
    REGISTRATIONS
   ========================================================= */
IF OBJECT_ID('dbo.Registrations', 'U') IS NOT NULL DROP TABLE dbo.Registrations;
GO

CREATE TABLE Registrations (
    registration_id  BIGINT IDENTITY(1,1) PRIMARY KEY,
    activity_id      BIGINT NOT NULL,
    student_id       BIGINT NOT NULL,
    registered_at    DATETIME NOT NULL DEFAULT GETDATE(),
    status           VARCHAR(20) NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
    approval_note    NVARCHAR(MAX) NULL,
    approved_by      BIGINT NULL,
    approved_at      DATETIME NULL,
    FOREIGN KEY (activity_id) REFERENCES Activities(activity_id),
    FOREIGN KEY (student_id) REFERENCES Students(student_id),
    FOREIGN KEY (approved_by) REFERENCES Users(user_id),
    CONSTRAINT UQ_Registrations_Activity_Student UNIQUE (activity_id, student_id)
);
GO

/* =========================================================
    ACTIVITY PARTICIPATION
   ========================================================= */
IF OBJECT_ID('dbo.ActivityParticipation', 'U') IS NOT NULL DROP TABLE dbo.ActivityParticipation;
GO

CREATE TABLE ActivityParticipation (
    participation_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    registration_id  BIGINT NOT NULL UNIQUE,
    attendance_status VARCHAR(20) NULL
    CHECK (attendance_status IN ('ATTENDED', 'PARTIAL', 'ABSENT')),
    activity_point   INT NOT NULL DEFAULT 0,
    confirmed_by     BIGINT NULL,
    confirmed_at     DATETIME NULL,
    FOREIGN KEY (registration_id) REFERENCES Registrations(registration_id),
    FOREIGN KEY (confirmed_by) REFERENCES Users(user_id)
);
GO

/* =========================================================
    NOTIFICATIONS
   ========================================================= */
IF OBJECT_ID('dbo.Notifications', 'U') IS NOT NULL DROP TABLE dbo.Notifications;
GO

CREATE TABLE Notifications (
    notification_id  BIGINT IDENTITY(1,1) PRIMARY KEY,
    sender_id        BIGINT NOT NULL,
    title            NVARCHAR(255) NOT NULL,
    content          NVARCHAR(MAX) NOT NULL,
    created_at       DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (sender_id) REFERENCES Users(user_id)
);
GO

/* =========================================================
    NOTIFICATION RECIPIENTS
   ========================================================= */
IF OBJECT_ID('dbo.NotificationRecipients', 'U') IS NOT NULL DROP TABLE dbo.NotificationRecipients;
GO

CREATE TABLE NotificationRecipients (
    notification_id  BIGINT NOT NULL,
    user_id          BIGINT NOT NULL,
    is_read          BIT NOT NULL DEFAULT 0,
    read_at          DATETIME NULL,
    PRIMARY KEY (notification_id, user_id),
    FOREIGN KEY (notification_id) REFERENCES Notifications(notification_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);
GO

/* =========================================================
    SYSTEM CONFIGS
   ========================================================= */
IF OBJECT_ID('dbo.SystemConfigs', 'U') IS NOT NULL DROP TABLE dbo.SystemConfigs;
GO

CREATE TABLE SystemConfigs (
    config_key       VARCHAR(100) PRIMARY KEY,
    config_value     NVARCHAR(MAX) NOT NULL
);
GO

/* =========================================================
    AUDIT LOGS
   ========================================================= */
IF OBJECT_ID('dbo.AuditLogs', 'U') IS NOT NULL DROP TABLE dbo.AuditLogs;
GO

CREATE TABLE AuditLogs (
    log_id           BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id          BIGINT NULL,
    action_name      NVARCHAR(255) NULL,
    entity_name      VARCHAR(100) NULL,
    entity_id        BIGINT NULL,
    old_data         NVARCHAR(MAX) NULL,   -- Lưu JSON dạng text
    new_data         NVARCHAR(MAX) NULL,   -- Lưu JSON dạng text
    created_at       DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);
GO