const { sql, poolPromise } = require("../config/database");

const attendanceRepository = {
    // Tạo phiên điểm danh
    async createSession(activityId, tokenHash, expiresAt, organizerId) {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);

        await transaction.begin();

        try {
            const request = new sql.Request(transaction);

            const activityResult = await request
                .input("activityId", sql.BigInt, activityId)
                .query(`
                    SELECT activity_id, status
                    FROM dbo.Activities
                    WHERE activity_id = @activityId
                `);

            if (!activityResult.recordset.length) {
                throw new Error("Không tìm thấy hoạt động.");
            }

            const activity = activityResult.recordset[0];

            // Cho phép tạo QR ngay sau khi công bố hoạt động
            if (!["PUBLISHED", "REGISTERING", "ONGOING"].includes(activity.status)) {
                throw new Error(
                    "Chỉ hoạt động đã công bố mới được tạo phiên điểm danh."
                );
            }

            // Đóng các phiên đang mở trước đó của hoạt động
            await new sql.Request(transaction)
                .input("activityId", sql.BigInt, activityId)
                .query(`
                    UPDATE dbo.ActivityAttendanceSessions
                    SET status = 'CLOSED',
                        closed_at = SYSDATETIME()
                    WHERE activity_id = @activityId
                    AND status = 'OPEN'
                `);

            const insertResult = await new sql.Request(transaction)
                .input("activityId", sql.BigInt, activityId)
                .input("tokenHash", sql.VarChar(32), tokenHash)
                .input("expiresAt", sql.DateTime2, expiresAt)
                .input("organizerId", sql.BigInt, organizerId)
                .query(`
                    INSERT INTO dbo.ActivityAttendanceSessions (
                        activity_id,
                        token_hash,
                        status,
                        expires_at,
                        created_by
                    )
                    OUTPUT
                        INSERTED.session_id,
                        INSERTED.activity_id,
                        INSERTED.status,
                        INSERTED.expires_at,
                        INSERTED.created_at
                    VALUES (
                        @activityId,
                        @tokenHash,
                        'OPEN',
                        @expiresAt,
                        @organizerId
                    )
                `);

            await transaction.commit();

            return insertResult.recordset[0];
        } catch (error) {
            console.error("Lỗi SQL khi tạo phiên điểm danh:", {
                message: error.message,
                code: error.code,
                number: error.number,
                state: error.state,
                class: error.class,
                lineNumber: error.lineNumber
            });

            try {
                if (transaction._aborted !== true) {
                    await transaction.rollback();
                }
            } catch (rollbackError) {
                console.error(
                    "Lỗi rollback transaction:",
                    rollbackError.message
                );
            }

            throw error;
        }
    },

    // Lấy phiên đang hoạt động
    async getActiveSession(activityId) {
        const pool = await poolPromise;

        const result = await pool.request()
            .input("activityId", sql.BigInt, activityId)
            .query(`
                SELECT TOP 1
                    session_id,
                    activity_id,
                    status,
                    expires_at,
                    created_at
                FROM dbo.ActivityAttendanceSessions
                WHERE activity_id = @activityId
                AND status = 'OPEN'
                AND expires_at > SYSDATETIME()
                ORDER BY created_at DESC
            `);

        return result.recordset[0] || null;
    },

    // Cập nhật token khi cần cấp lại QR cho phiên đang mở
    async updateSessionToken(sessionId, tokenHash) {
        const pool = await poolPromise;

        const result = await pool.request()
            .input("sessionId", sql.BigInt, sessionId)
            .input("tokenHash", sql.VarChar(64), tokenHash)
            .query(`
                UPDATE dbo.ActivityAttendanceSessions
                SET token_hash = @tokenHash
                OUTPUT
                    INSERTED.session_id,
                    INSERTED.activity_id,
                    INSERTED.status,
                    INSERTED.expires_at,
                    INSERTED.created_at
                WHERE session_id = @sessionId
                AND status = 'OPEN'
                AND expires_at > SYSDATETIME()
            `);

        return result.recordset[0] || null;
    },

    // Đóng phiên điểm danh
    async closeSession(sessionId) {
        const pool = await poolPromise;

        const result = await pool.request()
            .input("sessionId", sql.BigInt, sessionId)
            .query(`
                UPDATE dbo.ActivityAttendanceSessions
                SET status = 'CLOSED',
                    closed_at = SYSDATETIME()
                OUTPUT INSERTED.session_id, INSERTED.status
                WHERE session_id = @sessionId
                AND status = 'OPEN'
            `);

        return result.recordset[0] || null;
    },

    // Sinh viên điểm danh bằng token QR
    async checkIn(tokenHash, userId) {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);

        await transaction.begin();

        try {
            const sessionResult = await new sql.Request(transaction)
                .input("tokenHash", sql.VarChar(64), tokenHash)
                .query(`
                    SELECT TOP 1
                        session_id,
                        activity_id,
                        status,
                        expires_at
                    FROM dbo.ActivityAttendanceSessions
                    WHERE token_hash = @tokenHash
                `);

            if (!sessionResult.recordset.length) {
                throw new Error("Mã QR không hợp lệ.");
            }

            const session = sessionResult.recordset[0];

            if (session.status !== "OPEN" || new Date(session.expires_at) <= new Date()) {
                throw new Error("Phiên điểm danh đã đóng hoặc hết hạn.");
            }

            const registrationResult = await new sql.Request(transaction)
                .input("activityId", sql.BigInt, session.activity_id)
                .input("userId", sql.BigInt, userId)
                .query(`
                    SELECT
                        r.registration_id,
                        s.student_id,
                        u.full_name,
                        s.student_code,
                        s.class_name
                    FROM dbo.Registrations r
                    INNER JOIN dbo.Students s
                        ON s.student_id = r.student_id
                    INNER JOIN dbo.Users u
                        ON u.user_id = s.user_id
                    WHERE r.activity_id = @activityId
                    AND s.user_id = @userId
                    AND r.status = 'APPROVED'
                `);

            if (!registrationResult.recordset.length) {
                throw new Error(
                    "Bạn chưa được duyệt đăng ký hoạt động này."
                );
            }

            const student = registrationResult.recordset[0];

            await new sql.Request(transaction)
                .input("registrationId", sql.BigInt, student.registration_id)
                .query(`
                    IF EXISTS (
                        SELECT 1
                        FROM dbo.ActivityParticipation
                        WHERE registration_id = @registrationId
                    )
                    BEGIN
                        UPDATE dbo.ActivityParticipation
                        SET attendance_status = 'ATTENDED'
                        WHERE registration_id = @registrationId
                        AND (
                            attendance_status IS NULL
                            OR attendance_status <> 'ATTENDED'
                        )
                    END
                    ELSE
                    BEGIN
                        INSERT INTO dbo.ActivityParticipation (
                            registration_id,
                            attendance_status,
                            activity_point
                        )
                        VALUES (
                            @registrationId,
                            'ATTENDED',
                            0
                        )
                    END
                `);

            await transaction.commit();

            return {
                student_id: student.student_id,
                student_code: student.student_code,
                full_name: student.full_name,
                class_name: student.class_name,
                activity_id: session.activity_id,
                attendance_status: "ATTENDED"
            };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    },

    // Danh sách điểm danh của hoạt động
    async getAttendanceList(activityId) {
        const pool = await poolPromise;

        const result = await pool.request()
            .input("activityId", sql.BigInt, activityId)
            .query(`
                SELECT
                    s.student_id,
                    s.student_code,
                    u.full_name,
                    s.class_name,
                    r.status AS registration_status,
                    ap.attendance_status,
                    ap.activity_point,
                    ap.confirmed_at
                FROM dbo.Registrations r
                INNER JOIN dbo.Students s
                    ON s.student_id = r.student_id
                INNER JOIN dbo.Users u
                    ON u.user_id = s.user_id
                LEFT JOIN dbo.ActivityParticipation ap
                    ON ap.registration_id = r.registration_id
                WHERE r.activity_id = @activityId
                ORDER BY u.full_name
            `);

        return result.recordset;
    }
};

module.exports = attendanceRepository;