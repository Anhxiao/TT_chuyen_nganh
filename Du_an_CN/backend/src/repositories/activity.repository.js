
const { sql, poolPromise } = require('../config/database');

async function getActivities({
    keyword,
    status,
    organizationId,
    page = 1,
    limit = 20
}) {
    const pool = await poolPromise;

    const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
    const safeLimit = Math.min(
        100,
        Math.max(1, Number.parseInt(limit, 10) || 20)
    );

    const request = pool.request()
        .input('offset', sql.Int, (safePage - 1) * safeLimit)
        .input('limit', sql.Int, safeLimit);

    const conditions = [];

    if (keyword) {
        request.input('keyword', sql.NVarChar(255), `%${keyword}%`);
        conditions.push(`(
            a.activity_name LIKE @keyword
            OR a.activity_code LIKE @keyword
            OR o.organization_name LIKE @keyword
        )`);
    }

    if (status) {
        request.input('status', sql.VarChar(20), status);
        conditions.push('a.status = @status');
    }

    if (organizationId !== undefined && organizationId !== '') {
        request.input(
            'organizationId',
            sql.Int,
            Number(organizationId)
        );
        conditions.push('a.organization_id = @organizationId');
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
        ORDER BY a.created_at DESC, a.activity_id DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY;
    `);

    return result.recordset;
}

async function findById(activityId) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input('activityId', sql.Int, activityId)
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

async function isOrganizationMember(userId, organizationId) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input('userId', sql.BigInt, userId)
        .input('organizationId', sql.Int, organizationId)
        .query(`
            SELECT TOP 1 1 AS is_member
            FROM dbo.OrganizationUsers
            WHERE user_id = @userId
            AND organization_id = @organizationId;
        `);

    return result.recordset.length > 0;
}

async function createActivity(data, actorId) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input('activityCode', sql.NVarChar(50), data.activity_code)
        .input('organizationId', sql.Int, data.organization_id)
        .input('activityName', sql.NVarChar(255), data.activity_name)
        .input('description', sql.NVarChar(sql.MAX), data.description ?? null)
        .input('location', sql.NVarChar(255), data.location ?? null)
        .input('registrationStart', sql.DateTime2, data.registration_start)
        .input('registrationEnd', sql.DateTime2, data.registration_end)
        .input('activityStart', sql.DateTime2, data.activity_start)
        .input('activityEnd', sql.DateTime2, data.activity_end)
        .input('maxParticipants', sql.Int, data.max_participants ?? null)
        .input(
            'registrationMode',
            sql.VarChar(20),
            data.registration_mode || 'OPEN'
        )
        .input('actorId', sql.BigInt, actorId)
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
                registration_mode,
                status,
                created_by,
                created_at,
                updated_at
            )
            OUTPUT INSERTED.activity_id
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
                @registrationMode,
                'DRAFT',
                @actorId,
                SYSDATETIME(),
                SYSDATETIME()
            );
        `);

    return result.recordset[0];
}

async function updateActivity(activityId, data) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input('activityId', sql.Int, activityId)
        .input('activityName', sql.NVarChar(255), data.activity_name)
        .input('description', sql.NVarChar(sql.MAX), data.description)
        .input('location', sql.NVarChar(255), data.location)
        .input('registrationStart', sql.DateTime2, data.registration_start)
        .input('registrationEnd', sql.DateTime2, data.registration_end)
        .input('activityStart', sql.DateTime2, data.activity_start)
        .input('activityEnd', sql.DateTime2, data.activity_end)
        .input('maxParticipants', sql.Int, data.max_participants)
        .input(
            'registrationMode',
            sql.VarChar(20),
            data.registration_mode
        )
        .query(`
            UPDATE dbo.Activities
            SET
                activity_name = COALESCE(@activityName, activity_name),
                description = COALESCE(@description, description),
                location = COALESCE(@location, location),
                registration_start = COALESCE(
                    @registrationStart, registration_start
                ),
                registration_end = COALESCE(
                    @registrationEnd, registration_end
                ),
                activity_start = COALESCE(@activityStart, activity_start),
                activity_end = COALESCE(@activityEnd, activity_end),
                max_participants = COALESCE(
                    @maxParticipants, max_participants
                ),
                registration_mode = COALESCE(
                    @registrationMode, registration_mode
                ),
                updated_at = SYSDATETIME()
            WHERE activity_id = @activityId
            AND status IN ('DRAFT', 'PUBLISHED', 'REGISTERING');

            SELECT @@ROWCOUNT AS affected_rows;
        `);

    return result.recordset[0].affected_rows > 0;
}

async function publishActivity(activityId) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input('activityId', sql.Int, activityId)
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

module.exports = {
    getActivities,
    findById,
    isOrganizationMember,
    createActivity,
    updateActivity,
    publishActivity
};
