
const { sql, poolPromise } = require('../config/database');

// ======================================================
// 1. LẤY DANH SÁCH HOẠT ĐỘNG
// ======================================================

async function getActivities({
    keyword,
    status,
    organizationId,
    page = 1,
    limit = 20
}) {
    const pool = await poolPromise;

    const safePage = Math.max(
        1,
        Number.parseInt(page, 10) || 1
    );

    const safeLimit = Math.min(
        100,
        Math.max(1, Number.parseInt(limit, 10) || 20)
    );

    const request = pool.request()
        .input(
            'offset',
            sql.Int,
            (safePage - 1) * safeLimit
        )
        .input('limit', sql.Int, safeLimit);

    const conditions = [];

    if (keyword && String(keyword).trim()) {
        request.input(
            'keyword',
            sql.NVarChar(255),
            `%${String(keyword).trim()}%`
        );

        conditions.push(`(
            a.activity_name LIKE @keyword
            OR a.activity_code LIKE @keyword
            OR o.organization_name LIKE @keyword
        )`);
    }

    if (status) {
        request.input(
            'status',
            sql.VarChar(20),
            status
        );

        conditions.push('a.status = @status');
    }

    if (
        organizationId !== undefined &&
        organizationId !== null &&
        String(organizationId).trim() !== ''
    ) {
        const organizationValue = String(
            organizationId
        ).trim();

        if (/^\d+$/.test(organizationValue)) {
            request.input(
                'organizationId',
                sql.BigInt,
                organizationValue
            );

            conditions.push(
                'a.organization_id = @organizationId'
            );
        } else {
            request.input(
                'organizationCode',
                sql.VarChar(50),
                organizationValue
            );

            conditions.push(
                'o.organization_code = @organizationCode'
            );
        }
    }

    const whereClause = conditions.length
        ? `WHERE ${conditions.join(' AND ')}`
        : '';

    const result = await request.query(`
        SELECT
            a.activity_id,
            a.activity_code,
            a.activity_name,
            a.description,
            a.expected_points,
            a.location,
            a.registration_start,
            a.registration_end,
            a.activity_start,
            a.activity_end,
            a.max_participants,
            a.current_participants,
            a.registration_mode,
            a.status,
            a.organization_id,
            o.organization_name,
            a.created_at
        FROM dbo.Activities AS a
        INNER JOIN dbo.Organizations AS o
            ON o.organization_id = a.organization_id
        ${whereClause}
        ORDER BY
            a.created_at DESC,
            a.activity_id DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY;
    `);

    return result.recordset;
}

// ======================================================
// 2. LẤY CHI TIẾT HOẠT ĐỘNG
// ======================================================

async function findById(activityId) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input(
            'activityId',
            sql.BigInt,
            activityId
        )
        .query(`
            SELECT
                a.*,
                o.organization_name,
                o.organization_type,
                o.faculty_id AS organization_faculty_id
            FROM dbo.Activities AS a
            INNER JOIN dbo.Organizations AS o
                ON o.organization_id = a.organization_id
            WHERE a.activity_id = @activityId;
        `);

    return result.recordset[0] || null;
}

// ======================================================
// 3. KIỂM TRA THÀNH VIÊN ĐƠN VỊ
// ======================================================

async function isOrganizationMember(
    userId,
    organizationId
) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input('userId', sql.BigInt, userId)
        .input(
            'organizationId',
            sql.BigInt,
            organizationId
        )
        .query(`
            SELECT TOP 1
                1 AS is_member
            FROM dbo.OrganizationUsers
            WHERE user_id = @userId
            AND organization_id = @organizationId;
        `);

    return result.recordset.length > 0;
}

// ======================================================
// 4. TẠO HOẠT ĐỘNG
// ======================================================

async function createActivity(data) {
    const pool = await poolPromise;

    const expectedPoints =
        data.expectedPoints ?? 0;

    const result = await pool.request()
        .input(
            'activityCode',
            sql.VarChar(50),
            data.activityCode
        )
        .input(
            'organizationId',
            sql.BigInt,
            data.organizationId
        )
        .input(
            'activityName',
            sql.NVarChar(255),
            data.activityName
        )
        .input(
            'description',
            sql.NVarChar(sql.MAX),
            data.description
        )
        .input(
            'location',
            sql.NVarChar(255),
            data.location
        )
        .input(
            'registrationStart',
            sql.DateTime,
            data.registrationStart
        )
        .input(
            'registrationEnd',
            sql.DateTime,
            data.registrationEnd
        )
        .input(
            'activityStart',
            sql.DateTime,
            data.activityStart
        )
        .input(
            'activityEnd',
            sql.DateTime,
            data.activityEnd
        )
        .input(
            'maxParticipants',
            sql.Int,
            data.maxParticipants
        )
        .input(
            'expectedPoints',
            sql.Int,
            expectedPoints
        )
        .input(
            'registrationMode',
            sql.VarChar(20),
            data.registrationMode
        )
        .input(
            'createdBy',
            sql.BigInt,
            data.createdBy
        )
        .query(`
            INSERT INTO dbo.Activities (
                activity_code,
                organization_id,
                activity_name,
                description,
                location,
                registration_start,
                registration_end,
                activity_start,
                activity_end,
                max_participants,
                expected_points,
                current_participants,
                registration_mode,
                status,
                created_by,
                created_at,
                updated_at
            )
            OUTPUT
                INSERTED.activity_id,
                INSERTED.activity_code,
                INSERTED.activity_name,
                INSERTED.organization_id,
                INSERTED.max_participants,
                INSERTED.expected_points,
                INSERTED.current_participants,
                INSERTED.registration_mode,
                INSERTED.status,
                INSERTED.created_at
            VALUES (
                @activityCode,
                @organizationId,
                @activityName,
                @description,
                @location,
                @registrationStart,
                @registrationEnd,
                @activityStart,
                @activityEnd,
                @maxParticipants,
                @expectedPoints,
                0,
                @registrationMode,
                'DRAFT',
                @createdBy,
                GETDATE(),
                GETDATE()
            );
        `);

    return result.recordset[0];
}

// ======================================================
// 5. CẬP NHẬT HOẠT ĐỘNG
// ======================================================

async function updateActivity(
    activityId,
    data
) {
    const pool = await poolPromise;

    const request = pool.request()
        .input(
            'activityId',
            sql.BigInt,
            activityId
        )
        .input(
            'activityName',
            sql.NVarChar(255),
            data.activityName ?? null
        )
        .input(
            'description',
            sql.NVarChar(sql.MAX),
            data.description ?? null
        )
        .input(
            'location',
            sql.NVarChar(255),
            data.location ?? null
        )
        .input(
            'registrationStart',
            sql.DateTime,
            data.registrationStart ?? null
        )
        .input(
            'registrationEnd',
            sql.DateTime,
            data.registrationEnd ?? null
        )
        .input(
            'activityStart',
            sql.DateTime,
            data.activityStart ?? null
        )
        .input(
            'activityEnd',
            sql.DateTime,
            data.activityEnd ?? null
        )
        .input(
            'maxParticipants',
            sql.Int,
            data.maxParticipants ?? null
        )
        .input(
            'expectedPoints',
            sql.Int,
            data.expectedPoints ?? null
        )
        .input(
            'registrationMode',
            sql.VarChar(20),
            data.registrationMode ?? null
        );

    const result = await request.query(`
        UPDATE dbo.Activities
        SET
            activity_name = COALESCE(
                @activityName,
                activity_name
            ),

            description = COALESCE(
                @description,
                description
            ),

            location = COALESCE(
                @location,
                location
            ),

            registration_start = COALESCE(
                @registrationStart,
                registration_start
            ),

            registration_end = COALESCE(
                @registrationEnd,
                registration_end
            ),

            activity_start = COALESCE(
                @activityStart,
                activity_start
            ),

            activity_end = COALESCE(
                @activityEnd,
                activity_end
            ),

            max_participants = COALESCE(
                @maxParticipants,
                max_participants
            ),

            expected_points = COALESCE(
                @expectedPoints,
                expected_points
            ),

            registration_mode = COALESCE(
                @registrationMode,
                registration_mode
            ),

            updated_at = GETDATE()

        WHERE activity_id = @activityId
        AND status = 'DRAFT';

        SELECT @@ROWCOUNT AS affected_rows;
    `);

    return result.recordset[0].affected_rows > 0;
}

// ======================================================
// 6. CÔNG BỐ HOẠT ĐỘNG
// ======================================================

async function publishActivity(activityId) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input(
            'activityId',
            sql.BigInt,
            activityId
        )
        .query(`
            UPDATE dbo.Activities
            SET
                status = 'PUBLISHED',
                updated_at = SYSDATETIME()
            WHERE activity_id = @activityId
            AND status = 'DRAFT';

            SELECT @@ROWCOUNT AS affected_rows;
        `);

    return result.recordset[0].affected_rows > 0;
}

// ======================================================
// 7. EXPORT
// ======================================================

module.exports = {
    getActivities,
    findById,
    isOrganizationMember,
    createActivity,
    updateActivity,
    publishActivity
};
