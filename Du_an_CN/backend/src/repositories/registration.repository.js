
const { sql, poolPromise } = require('../config/database');

async function findStudentByUserId(userId) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input('userId', sql.BigInt, userId)
        .query(`
            SELECT student_id, user_id, student_code, faculty_id
            FROM dbo.Students
            WHERE user_id = @userId;
        `);

    return result.recordset[0] || null;
}

async function findRegistration(activityId, studentId) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input('activityId', sql.Int, activityId)
        .input('studentId', sql.Int, studentId)
        .query(`
            SELECT
                r.*,
                a.activity_name,
                a.status AS activity_status,
                a.registration_start,
                a.registration_end,
                a.registration_mode,
                a.max_participants,
                a.current_participants
            FROM dbo.Registrations AS r
            INNER JOIN dbo.Activities AS a
                ON a.activity_id = r.activity_id
            WHERE r.activity_id = @activityId
            AND r.student_id = @studentId;
        `);

    return result.recordset[0] || null;
}

async function createRegistration(activityId, studentId, status) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input('activityId', sql.Int, activityId)
        .input('studentId', sql.Int, studentId)
        .input('status', sql.VarChar(20), status)
        .query(`
            INSERT INTO dbo.Registrations (
                activity_id,
                student_id,
                registered_at,
                status
            )
            OUTPUT INSERTED.registration_id, INSERTED.status,
                INSERTED.registered_at
            VALUES (
                @activityId,
                @studentId,
                SYSDATETIME(),
                @status
            );
        `);

    return result.recordset[0];
}

async function cancelRegistration(activityId, studentId) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input('activityId', sql.Int, activityId)
        .input('studentId', sql.Int, studentId)
        .query(`
            UPDATE dbo.Registrations
            SET status = 'CANCELLED'
            WHERE activity_id = @activityId
            AND student_id = @studentId
            AND status IN ('PENDING', 'APPROVED');

            SELECT @@ROWCOUNT AS affected_rows;
        `);

    return result.recordset[0].affected_rows > 0;
}

async function getMyRegistrations({
    studentId,
    status,
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
        .input('studentId', sql.Int, studentId)
        .input('offset', sql.Int, (safePage - 1) * safeLimit)
        .input('limit', sql.Int, safeLimit);

    let statusCondition = '';

    if (status) {
        request.input('status', sql.VarChar(20), status);
        statusCondition = 'AND r.status = @status';
    }

    const result = await request.query(`
        SELECT
            r.registration_id,
            r.registered_at,
            r.status AS registration_status,
            r.approval_note,
            a.activity_id,
            a.activity_code,
            a.activity_name,
            a.location,
            a.activity_start,
            a.activity_end,
            o.organization_name,
            ap.attendance_status,
            ap.activity_point
        FROM dbo.Registrations AS r
        INNER JOIN dbo.Activities AS a
            ON a.activity_id = r.activity_id
        INNER JOIN dbo.Organizations AS o
            ON o.organization_id = a.organization_id
        LEFT JOIN dbo.ActivityParticipation AS ap
            ON ap.registration_id = r.registration_id
        WHERE r.student_id = @studentId
        ${statusCondition}
        ORDER BY r.registered_at DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY;
    `);

    return result.recordset;
}

async function getActivityRegistrations({
    activityId,
    status,
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
        .input('activityId', sql.Int, activityId)
        .input('offset', sql.Int, (safePage - 1) * safeLimit)
        .input('limit', sql.Int, safeLimit);

    let statusCondition = '';

    if (status) {
        request.input('status', sql.VarChar(20), status);
        statusCondition = 'AND r.status = @status';
    }

    const result = await request.query(`
        SELECT
            r.registration_id,
            r.registered_at,
            r.status AS registration_status,
            r.approval_note,
            s.student_id,
            s.student_code,
            s.class_name,
            u.full_name,
            u.email,
            u.phone
        FROM dbo.Registrations AS r
        INNER JOIN dbo.Students AS s
            ON s.student_id = r.student_id
        INNER JOIN dbo.Users AS u
            ON u.user_id = s.user_id
        WHERE r.activity_id = @activityId
        ${statusCondition}
        ORDER BY r.registered_at ASC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY;
    `);

    return result.recordset;
}

async function findById(registrationId) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input('registrationId', sql.Int, registrationId)
        .query(`
            SELECT
                r.*,
                a.activity_name,
                a.organization_id,
                a.status AS activity_status,
                a.activity_start,
                a.activity_end,
                s.user_id
            FROM dbo.Registrations AS r
            INNER JOIN dbo.Activities AS a
                ON a.activity_id = r.activity_id
            INNER JOIN dbo.Students AS s
                ON s.student_id = r.student_id
            WHERE r.registration_id = @registrationId;
        `);

    return result.recordset[0] || null;
}

async function updateRegistrationStatus(
    registrationId,
    status,
    actorId,
    note = null
) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input('registrationId', sql.Int, registrationId)
        .input('status', sql.VarChar(20), status)
        .input('actorId', sql.BigInt, actorId)
        .input('note', sql.NVarChar(1000), note)
        .query(`
            UPDATE dbo.Registrations
            SET
                status = @status,
                approved_by = @actorId,
                approved_at = SYSDATETIME(),
                approval_note = @note
            WHERE registration_id = @registrationId
            AND status = 'PENDING';

            SELECT @@ROWCOUNT AS affected_rows;
        `);

    return result.recordset[0].affected_rows > 0;
}

module.exports = {
    findStudentByUserId,
    findRegistration,
    createRegistration,
    cancelRegistration,
    getMyRegistrations,
    getActivityRegistrations,
    findById,
    updateRegistrationStatus
};
