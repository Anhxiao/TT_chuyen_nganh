
const { sql, poolPromise } = require('../config/database');

function createError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

// =========================================================
// STUDENT
// =========================================================

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

// =========================================================
// REGISTRATION LOOKUP
// =========================================================

async function findRegistration(activityId, studentId) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input('activityId', sql.BigInt, activityId)
        .input('studentId', sql.BigInt, studentId)
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

// =========================================================
// CREATE OR REACTIVATE REGISTRATION
// current_participants chỉ đếm APPROVED
// =========================================================

async function createRegistration(activityId, studentId, status) {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

        const activityResult = await new sql.Request(transaction)
            .input('activityId', sql.BigInt, activityId)
            .query(`
                SELECT
                    activity_id,
                    status,
                    registration_start,
                    registration_end,
                    registration_mode,
                    max_participants,
                    current_participants
                FROM dbo.Activities WITH (UPDLOCK, HOLDLOCK)
                WHERE activity_id = @activityId;
            `);

        const activity = activityResult.recordset[0];

        if (!activity) {
            throw createError('Không tìm thấy hoạt động.', 404);
        }

        if (!['PUBLISHED', 'REGISTERING'].includes(activity.status)) {
            throw createError('Hoạt động hiện không mở đăng ký.', 409);
        }

        if (
            !activity.registration_start ||
            !activity.registration_end ||
            new Date() < new Date(activity.registration_start) ||
            new Date() > new Date(activity.registration_end)
        ) {
            throw createError(
                'Hoạt động chưa mở hoặc đã đóng đăng ký.',
                409
            );
        }

        const expectedStatus =
            activity.registration_mode === 'APPROVAL'
                ? 'PENDING'
                : 'APPROVED';

        if (status !== expectedStatus) {
            throw createError('Trạng thái đăng ký không hợp lệ.', 400);
        }

        const existingResult = await new sql.Request(transaction)
            .input('activityId', sql.BigInt, activityId)
            .input('studentId', sql.BigInt, studentId)
            .query(`
                SELECT registration_id, status
                FROM dbo.Registrations WITH (UPDLOCK, HOLDLOCK)
                WHERE activity_id = @activityId
                  AND student_id = @studentId;
            `);

        const existing = existingResult.recordset[0];

        if (existing && existing.status !== 'CANCELLED') {
            throw createError('Bạn đã đăng ký hoạt động này.', 409);
        }

        // Chỉ kiểm tra sức chứa khi đăng ký được duyệt ngay.
        if (
            status === 'APPROVED' &&
            activity.max_participants !== null &&
            activity.current_participants >= activity.max_participants
        ) {
            throw createError('Hoạt động đã đủ số lượng đăng ký.', 409);
        }

        let result;

        if (existing) {
            // Đăng ký lại: cập nhật bản ghi cũ vì có UNIQUE constraint.
            result = await new sql.Request(transaction)
                .input('registrationId', sql.BigInt, existing.registration_id)
                .input('status', sql.VarChar(20), status)
                .query(`
                    UPDATE dbo.Registrations
                    SET
                        status = @status,
                        registered_at = GETDATE(),
                        approval_note = NULL,
                        approved_by = NULL,
                        approved_at = NULL
                    OUTPUT
                        INSERTED.registration_id,
                        INSERTED.status,
                        INSERTED.registered_at
                    WHERE registration_id = @registrationId;
                `);
        } else {
            result = await new sql.Request(transaction)
                .input('activityId', sql.BigInt, activityId)
                .input('studentId', sql.BigInt, studentId)
                .input('status', sql.VarChar(20), status)
                .query(`
                    INSERT INTO dbo.Registrations (
                        activity_id,
                        student_id,
                        registered_at,
                        status
                    )
                    OUTPUT
                        INSERTED.registration_id,
                        INSERTED.status,
                        INSERTED.registered_at
                    VALUES (
                        @activityId,
                        @studentId,
                        GETDATE(),
                        @status
                    );
                `);
        }

        if (status === 'APPROVED') {
            await new sql.Request(transaction)
                .input('activityId', sql.BigInt, activityId)
                .query(`
                    UPDATE dbo.Activities
                    SET
                        current_participants = current_participants + 1,
                        updated_at = GETDATE()
                    WHERE activity_id = @activityId;
                `);
        }

        await transaction.commit();
        return result.recordset[0];
    } catch (error) {
        try {
            await transaction.rollback();
        } catch (_) {
            // Transaction có thể đã rollback hoặc kết thúc.
        }

        throw error;
    }
}

// =========================================================
// CANCEL REGISTRATION
// =========================================================

async function cancelRegistration(activityId, studentId) {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

        const activityResult = await new sql.Request(transaction)
            .input('activityId', sql.BigInt, activityId)
            .query(`
                SELECT activity_id, activity_start
                FROM dbo.Activities WITH (UPDLOCK, HOLDLOCK)
                WHERE activity_id = @activityId;
            `);

        const activity = activityResult.recordset[0];

        if (!activity) {
            throw createError('Không tìm thấy hoạt động.', 404);
        }

        if (
            activity.activity_start &&
            new Date() >= new Date(activity.activity_start)
        ) {
            throw createError(
                'Không thể hủy đăng ký sau khi hoạt động đã bắt đầu.',
                409
            );
        }

        const registrationResult = await new sql.Request(transaction)
            .input('activityId', sql.BigInt, activityId)
            .input('studentId', sql.BigInt, studentId)
            .query(`
                SELECT registration_id, status
                FROM dbo.Registrations WITH (UPDLOCK, HOLDLOCK)
                WHERE activity_id = @activityId
                  AND student_id = @studentId;
            `);

        const registration = registrationResult.recordset[0];

        if (!registration) {
            throw createError('Bạn chưa đăng ký hoạt động này.', 404);
        }

        if (!['PENDING', 'APPROVED'].includes(registration.status)) {
            throw createError(
                'Trạng thái đăng ký hiện tại không thể hủy.',
                409
            );
        }

        await new sql.Request(transaction)
            .input('registrationId', sql.BigInt, registration.registration_id)
            .query(`
                UPDATE dbo.Registrations
                SET status = 'CANCELLED'
                WHERE registration_id = @registrationId;
            `);

        if (registration.status === 'APPROVED') {
            await new sql.Request(transaction)
                .input('activityId', sql.BigInt, activityId)
                .query(`
                    UPDATE dbo.Activities
                    SET
                        current_participants =
                            CASE
                                WHEN current_participants > 0
                                THEN current_participants - 1
                                ELSE 0
                            END,
                        updated_at = GETDATE()
                    WHERE activity_id = @activityId;
                `);
        }

        await transaction.commit();
        return true;
    } catch (error) {
        try {
            await transaction.rollback();
        } catch (_) {}

        throw error;
    }
}

// =========================================================
// STUDENT REGISTRATION HISTORY
// =========================================================

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
        .input('studentId', sql.BigInt, studentId)
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
            a.current_participants,
            a.max_participants,
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

// =========================================================
// ORGANIZER REGISTRATION LIST
// =========================================================

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
        .input('activityId', sql.BigInt, activityId)
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

// =========================================================
// REGISTRATION DETAIL
// =========================================================

async function findById(registrationId) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input('registrationId', sql.BigInt, registrationId)
        .query(`
            SELECT
                r.*,
                a.activity_name,
                a.organization_id,
                a.status AS activity_status,
                a.activity_start,
                a.activity_end,
                a.max_participants,
                a.current_participants,
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

// =========================================================
// APPROVE / REJECT REGISTRATION
// =========================================================

async function updateRegistrationStatus(
    registrationId,
    status,
    actorId,
    note = null
) {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

        const registrationResult = await new sql.Request(transaction)
            .input('registrationId', sql.BigInt, registrationId)
            .query(`
                SELECT
                    r.registration_id,
                    r.activity_id,
                    r.status
                FROM dbo.Registrations AS r
                WHERE r.registration_id = @registrationId;
            `);

        const registration = registrationResult.recordset[0];

        if (!registration) {
            throw createError('Không tìm thấy đăng ký.', 404);
        }

        const activityResult = await new sql.Request(transaction)
            .input('activityId', sql.BigInt, registration.activity_id)
            .query(`
                SELECT
                    activity_id,
                    max_participants,
                    current_participants
                FROM dbo.Activities WITH (UPDLOCK, HOLDLOCK)
                WHERE activity_id = @activityId;
            `);

        const activity = activityResult.recordset[0];

        if (!activity) {
            throw createError('Không tìm thấy hoạt động.', 404);
        }

        const currentResult = await new sql.Request(transaction)
            .input('registrationId', sql.BigInt, registrationId)
            .query(`
                SELECT status
                FROM dbo.Registrations WITH (UPDLOCK, HOLDLOCK)
                WHERE registration_id = @registrationId;
            `);

        const current = currentResult.recordset[0];

        if (!current || current.status !== 'PENDING') {
            throw createError(
                'Chỉ có thể xử lý đăng ký đang chờ duyệt.',
                409
            );
        }

        if (status === 'APPROVED') {
            if (
                activity.max_participants !== null &&
                activity.current_participants >= activity.max_participants
            ) {
                throw createError(
                    'Hoạt động đã đủ số lượng người tham gia.',
                    409
                );
            }
        } else if (status !== 'REJECTED') {
            throw createError('Trạng thái xử lý không hợp lệ.', 400);
        }

        const result = await new sql.Request(transaction)
            .input('registrationId', sql.BigInt, registrationId)
            .input('status', sql.VarChar(20), status)
            .input('actorId', sql.BigInt, actorId)
            .input('note', sql.NVarChar(sql.MAX), note)
            .query(`
                UPDATE dbo.Registrations
                SET
                    status = @status,
                    approved_by = @actorId,
                    approved_at = GETDATE(),
                    approval_note = @note
                OUTPUT
                    INSERTED.registration_id,
                    INSERTED.status,
                    INSERTED.approved_by,
                    INSERTED.approved_at
                WHERE registration_id = @registrationId
                  AND status = 'PENDING';
            `);

        if (result.recordset.length === 0) {
            throw createError(
                'Đăng ký đã được xử lý bởi một yêu cầu khác.',
                409
            );
        }

        if (status === 'APPROVED') {
            await new sql.Request(transaction)
                .input('activityId', sql.BigInt, registration.activity_id)
                .query(`
                    UPDATE dbo.Activities
                    SET
                        current_participants = current_participants + 1,
                        updated_at = GETDATE()
                    WHERE activity_id = @activityId;
                `);
        }

        await transaction.commit();
        return result.recordset[0];
    } catch (error) {
        try {
            await transaction.rollback();
        } catch (_) {}

        throw error;
    }
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
