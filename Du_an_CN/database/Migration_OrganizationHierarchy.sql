
/* =========================================================
Migration_OrganizationHierarchy.sql
Cập nhật mô hình tổ chức StudentActivityDB
========================================================= */

USE StudentActivityDB;
GO

BEGIN TRY
    BEGIN TRANSACTION;

    /* =========================================
    1. BỔ SUNG CẤP QUẢN LÝ CHO ORGANIZATIONS
    ========================================= */

    IF COL_LENGTH(
        'dbo.Organizations',
        'parent_organization_id'
    ) IS NULL
    BEGIN
        ALTER TABLE dbo.Organizations
        ADD parent_organization_id BIGINT NULL;
    END;


    IF NOT EXISTS (
        SELECT 1
        FROM sys.foreign_keys
        WHERE name = 'FK_Organizations_ParentOrganization'
    )
    BEGIN
        ALTER TABLE dbo.Organizations
        ADD CONSTRAINT FK_Organizations_ParentOrganization
        FOREIGN KEY (parent_organization_id)
        REFERENCES dbo.Organizations(organization_id);
    END;


    /* =========================================
    2. BỔ SUNG ĐƠN VỊ ĐỨNG TÊN HOẠT ĐỘNG
    ========================================= */

    IF COL_LENGTH(
        'dbo.Activities',
        'represented_by_organization_id'
    ) IS NULL
    BEGIN
        ALTER TABLE dbo.Activities
        ADD represented_by_organization_id BIGINT NULL;
    END;


    IF NOT EXISTS (
        SELECT 1
        FROM sys.foreign_keys
        WHERE name = 'FK_Activities_RepresentedByOrganization'
    )
    BEGIN
        ALTER TABLE dbo.Activities
        ADD CONSTRAINT FK_Activities_RepresentedByOrganization
        FOREIGN KEY (represented_by_organization_id)
        REFERENCES dbo.Organizations(organization_id);
    END;


    /* =========================================
    3. ĐOÀN TRƯỜNG TRỰC THUỘC ĐOÀN THANH NIÊN
    ========================================= */

    UPDATE child
    SET child.parent_organization_id = parent.organization_id
    FROM Organizations child
    INNER JOIN Organizations parent
        ON parent.organization_code = 'TVU_UNION'
    WHERE child.organization_code IN (
        'TECH_UNION',
        'LAW_UNION',
        'MED_UNION'
    );


    /* =========================================
    4. CLB TRỰC THUỘC HỘI SINH VIÊN
    ========================================= */

    UPDATE child
    SET child.parent_organization_id = parent.organization_id
    FROM Organizations child
    INNER JOIN Organizations parent
        ON parent.organization_code = 'TVU_STUDENT_ASSOC'
    WHERE child.organization_code IN (
        'LIFE_SKILL_CLUB',
        'MEDIA_CLUB',
        'ART_CLUB'
    );


    /* =========================================
    5. TẠO INDEX PHỤC VỤ TRUY VẤN
    ========================================= */

    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = 'IX_Organizations_Parent'
        AND object_id = OBJECT_ID('dbo.Organizations')
    )
    BEGIN
        CREATE INDEX IX_Organizations_Parent
        ON Organizations(parent_organization_id);
    END;


    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = 'IX_Activities_RepresentedBy'
        AND object_id = OBJECT_ID('dbo.Activities')
    )
    BEGIN
        CREATE INDEX IX_Activities_RepresentedBy
        ON Activities(represented_by_organization_id);
    END;


    COMMIT TRANSACTION;

    PRINT N'Cập nhật mô hình tổ chức thành công.';

END TRY
BEGIN CATCH

    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    THROW;

END CATCH;
GO


/* =========================================
6. KIỂM TRA KẾT QUẢ
========================================= */

SELECT
    child.organization_code,
    child.organization_name,
    child.organization_type,
    parent.organization_code AS parent_code,
    parent.organization_name AS parent_name
FROM Organizations child
LEFT JOIN Organizations parent
    ON child.parent_organization_id = parent.organization_id
ORDER BY
    CASE
        WHEN child.parent_organization_id IS NULL THEN 1
        ELSE 2
    END,
    parent.organization_code,
    child.organization_code;x
GO
