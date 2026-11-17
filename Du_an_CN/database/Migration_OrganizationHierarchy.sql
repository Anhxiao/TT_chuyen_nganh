
/* =========================================================
Migration_ClubMembershipRequests.sql
Chức năng: Đăng ký thành viên câu lạc bộ trực tuyến
Database: StudentActivityDB

- Sinh viên gửi đơn đăng ký CLB.
- CLB xét duyệt đơn.
- Đơn được duyệt sẽ tạo thành viên trong ClubMembers.
- Sử dụng Notifications và NotificationRecipients hiện có.
========================================================= */

USE StudentActivityDB;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    /* =====================================================
    1. TẠO BẢNG ĐƠN ĐĂNG KÝ THÀNH VIÊN CLB
    ===================================================== */

    IF OBJECT_ID(
        'dbo.ClubMembershipRequests',
        'U'
    ) IS NULL
    BEGIN
        CREATE TABLE dbo.ClubMembershipRequests (
            request_id BIGINT IDENTITY(1,1) NOT NULL,

            club_id BIGINT NOT NULL,

            student_id BIGINT NOT NULL,

            request_reason NVARCHAR(1000) NOT NULL,

            self_introduction NVARCHAR(2000) NULL,

            skills NVARCHAR(1000) NULL,

            status VARCHAR(20) NOT NULL
                CONSTRAINT DF_ClubMembershipRequests_Status
                DEFAULT 'PENDING',

            reviewed_by BIGINT NULL,

            reviewed_at DATETIME NULL,

            review_note NVARCHAR(1000) NULL,

            created_at DATETIME NOT NULL
                CONSTRAINT DF_ClubMembershipRequests_CreatedAt
                DEFAULT GETDATE(),

            updated_at DATETIME NULL,

            CONSTRAINT PK_ClubMembershipRequests
                PRIMARY KEY (request_id),

            CONSTRAINT FK_ClubMembershipRequests_Organizations
                FOREIGN KEY (club_id)
                REFERENCES dbo.Organizations(organization_id),

            CONSTRAINT FK_ClubMembershipRequests_Students
                FOREIGN KEY (student_id)
                REFERENCES dbo.Students(student_id),

            CONSTRAINT FK_ClubMembershipRequests_ReviewedBy
                FOREIGN KEY (reviewed_by)
                REFERENCES dbo.Users(user_id),

            CONSTRAINT CK_ClubMembershipRequests_Status
                CHECK (
                    status IN (
                        'PENDING',
                        'APPROVED',
                        'REJECTED',
                        'CANCELLED'
                    )
                )
        );
    END;

    /* =====================================================
    2. MỖI SINH VIÊN CHỈ CÓ MỘT ĐƠN ĐANG CHỜ
        CHO MỘT CÂU LẠC BỘ
    ===================================================== */

    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = 'UX_ClubMembershipRequests_Pending'
        AND object_id = OBJECT_ID(
            'dbo.ClubMembershipRequests'
        )
    )
    BEGIN
        CREATE UNIQUE INDEX
            UX_ClubMembershipRequests_Pending
        ON dbo.ClubMembershipRequests (
            club_id,
            student_id
        )
        WHERE status = 'PENDING';
    END;

    /* =====================================================
    3. INDEX PHỤC VỤ TRUY VẤN ĐƠN THEO CLB
    ===================================================== */

    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = 'IX_ClubMembershipRequests_Club_Status'
        AND object_id = OBJECT_ID(
            'dbo.ClubMembershipRequests'
        )
    )
    BEGIN
        CREATE INDEX
            IX_ClubMembershipRequests_Club_Status
        ON dbo.ClubMembershipRequests (
            club_id,
            status,
            created_at
        );
    END;

    /* =====================================================
    4. INDEX PHỤC VỤ SINH VIÊN XEM LỊCH SỬ ĐĂNG KÝ
    ===================================================== */

    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = 'IX_ClubMembershipRequests_Student'
        AND object_id = OBJECT_ID(
            'dbo.ClubMembershipRequests'
        )
    )
    BEGIN
        CREATE INDEX
            IX_ClubMembershipRequests_Student
        ON dbo.ClubMembershipRequests (
            student_id,
            created_at DESC
        );
    END;

    COMMIT TRANSACTION;

    PRINT N'Tạo bảng đăng ký thành viên CLB thành công.';

END TRY
BEGIN CATCH

    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    THROW;

END CATCH;
GO


/* =========================================================
5. KIỂM TRA CẤU TRÚC BẢNG MỚI
========================================================= */

SELECT
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'ClubMembershipRequests'
ORDER BY ORDINAL_POSITION;
GO


/* =========================================================
6. KIỂM TRA DANH SÁCH CLB
========================================================= */

SELECT
    organization_id,
    organization_code,
    organization_name,
    organization_type,
    status
FROM dbo.Organizations
WHERE organization_type = 'CLUB'
AND status = 'ACTIVE'
ORDER BY organization_name;
GO


/* =========================================================
7. KIỂM TRA TÀI KHOẢN QUẢN TRỊ CLB
========================================================= */

SELECT
    o.organization_id,
    o.organization_name,
    u.user_id,
    u.username,
    u.full_name,
    u.email
FROM dbo.OrganizationUsers ou
INNER JOIN dbo.Organizations o
    ON o.organization_id = ou.organization_id
INNER JOIN dbo.Users u
    ON u.user_id = ou.user_id
WHERE o.organization_type = 'CLUB'
AND o.status = 'ACTIVE'
AND u.status = 'ACTIVE'
ORDER BY o.organization_name, u.username;
GO
