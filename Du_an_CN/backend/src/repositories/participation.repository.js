
const { sql, poolPromise } = require('../config/database');

/**
 * Lấy danh sách điểm danh của một hoạt động.
 */
async function getActivityParticipation(activityId) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input('activityId', sql.Int, activityId)
        .query(`
            SELECT
                r.registration_id,
                r.status AS registration_status,
                s.student_id,
                s.student_code,
                s.class_name,
                u.full_name,
                ap.participation_id,
                ap.attendance_status,
                ap.activity_point,
                ap.confirmed_by,
                ap.confirmed_at
            FROM dbo.Registrations AS r
            INNER JOIN dbo.Students AS s
                ON s.student_id = r.student_id
            INNER JOIN dbo.Users AS u
                ON u.user_id = s.user_id
            LEFT JOIN dbo.ActivityParticipation AS ap
                ON ap.registration_id = r.registration_id
            WHERE r.activity_id = @activityId
            ORDER BY u.full_name ASC;
        `);

    return result.recordset;
}

/**
 * Tìm bản ghi điểm danh theo registration_id.
 */
async function findByRegistrationId(registrationId) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input('registrationId', sql.Int, registrationId)
        .query(`
            SELECT
                ap.*,
                r.student_id,
                s.user_id,
                r.activity_id
            FROM dbo.Registrations AS r
            INNER JOIN dbo.Students AS s
                ON s.student_id = r.student_id
            LEFT JOIN dbo.ActivityParticipation AS ap
                ON ap.registration_id = r.registration_id
            WHERE r.registration_id = @registrationId;
        `);

    return result.recordset[0] || null;
}

/**
 * Ghi nhận hoặc điều chỉnh kết quả tham gia.
 *
 * Chạy transaction để cập nhật điểm danh và tổng điểm sinh viên
 * trong cùng một giao dịch.
 */
async function saveParticipation({
    registrationId,
    attendanceStatus,
    activityPoint,
    actorId
}) {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        const request = new sql.Request(transaction);

        request.input('registrationId', sql.Int, registrationId);

        const registrationResult = await request.query(`
            SELECT
                r.registration_id,
                r.student_id,
                r.status AS registration_status
            FROM dbo.Registrations AS r WITH (UPDLOCK, HOLDLOCK)
            WHERE r.registration_id = @registrationId;
        `);

        const registration = registrationResult.recordset[0];

        if (!registration) {
            const error = new Error('Không tìm thấy đăng ký tham gia.');
            error.statusCode = 404;
            throw error;
        }

        if (
            !['APPROVED'].includes(registration.registration_status)
        ) {
            const error = new Error(
                'Chỉ có thể xác nhận tham gia đối với đăng ký đã được duyệt.'
            );
            error.statusCode = 400;
            throw error;
        }

        const studentResult = await new sql.Request(transaction)
            .input('studentId', sql.Int, registration.student_id)
            .query(`
                SELECT student_id, activity_points
                FROM dbo.Students WITH (UPDLOCK, HOLDLOCK)
                WHERE student_id = @studentId;
            `);

        const student = studentResult.recordset[0];

        if (!student) {
            const error = new Error('Không tìm thấy hồ sơ sinh viên.');
            error.statusCode = 404;
            throw error;
        }

        const oldResult = await new sql.Request(transaction)
            .input('registrationId', sql.Int, registrationId)
            .query(`
                SELECT participation_id, activity_point
                FROM dbo.ActivityParticipation
                WHERE registration_id = @registrationId;
            `);

        const oldParticipation = oldResult.recordset[0] || null;
        const oldPoints = oldParticipation
            ? Number(oldParticipation.activity_point)
            : 0;

        const pointDelta = Number(activityPoint) - oldPoints;

        if (oldParticipation) {
            await new sql.Request(transaction)
                .input('registrationId', sql.Int, registrationId)
                .input(
                    'attendanceStatus',
                    sql.VarChar(20),
                    attendanceStatus
                )
                .input('activityPoint', sql.Int, activityPoint)
                .input('actorId', sql.BigInt, actorId)
                .query(`
                    UPDATE dbo.ActivityParticipation
                    SET
                        attendance_status = @attendanceStatus,
                        activity_point = @activityPoint,
                        confirmed_by = @actorId,
                        confirmed_at = SYSDATETIME()
                    WHERE registration_id = @registrationId;
                `);
        } else {
            await new sql.Request(transaction)
                .input('registrationId', sql.Int, registrationId)
                .input(
                    'attendanceStatus',
                    sql.VarChar(20),
                    attendanceStatus
                )
                .input('activityPoint', sql.Int, activityPoint)
                .input('actorId', sql.BigInt, actorId)
                .query(`
                    INSERT INTO dbo.ActivityParticipation (
                        registration_id,
                        attendance_status,
                        activity_point,
                        confirmed_by,
                        confirmed_at
                    )
                    VALUES (
                        @registrationId,
                        @attendanceStatus,
                        @activityPoint,
                        @actorId,
                        SYSDATETIME()
                    );
                `);
        }

        await new sql.Request(transaction)
            .input('studentId', sql.Int, registration.student_id)
            .input('pointDelta', sql.Int, pointDelta)
            .query(`
                UPDATE dbo.Students
                SET activity_points =
                    COALESCE(activity_points, 0) + @pointDelta
                WHERE student_id = @studentId;
            `);

        await transaction.commit();

        return {
            registration_id: registrationId,
            attendance_status: attendanceStatus,
            activity_point: activityPoint
        };
    } catch (error) {
        try {
            await transaction.rollback();
        } catch (rollbackError) {
            console.error(
                'Không thể rollback transaction:',
                rollbackError.message
            );
        }

        throw error;
    }
}

module.exports = {
    getActivityParticipation,
    findByRegistrationId,
    saveParticipation
};
