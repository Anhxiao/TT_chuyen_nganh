
const { sql, poolPromise } = require('../config/database');

const clubRepository = {
    async getActiveClubs(userId) {
        const pool = await poolPromise;

        const result = await pool.request()
            .input('userId', sql.BigInt, userId)
            .query(`
                SELECT
                    o.organization_id AS club_id,
                    o.organization_code,
                    o.organization_name,
                    CASE WHEN cm.student_id IS NOT NULL
                        THEN 'ACTIVE' ELSE NULL END AS membership_status,
                    pending.request_id,
                    pending.status AS request_status
                FROM dbo.Organizations o
                OUTER APPLY (
                    SELECT TOP 1 cm.student_id
                    FROM dbo.ClubMembers cm
                    INNER JOIN dbo.Students s
                        ON s.student_id = cm.student_id
                    WHERE cm.club_id = o.organization_id
                      AND s.user_id = @userId
                      AND cm.status = 'ACTIVE'
                ) cm
                OUTER APPLY (
                    SELECT TOP 1 cr.request_id, cr.status
                    FROM dbo.ClubMembershipRequests cr
                    INNER JOIN dbo.Students s
                        ON s.student_id = cr.student_id
                    WHERE cr.club_id = o.organization_id
                      AND s.user_id = @userId
                      AND cr.status = 'PENDING'
                    ORDER BY cr.created_at DESC
                ) pending
                WHERE o.organization_type = 'CLUB'
                  AND o.status = 'ACTIVE'
                ORDER BY o.organization_name;
            `);

        return result.recordset;
    },

    async createMembershipRequest(userId, data) {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);

        await transaction.begin();

        try {
            const request = new sql.Request(transaction);

            request.input('userId', sql.BigInt, userId);
            request.input('clubId', sql.BigInt, data.clubId);
            request.input('reason', sql.NVarChar(1000), data.reason);
            request.input('introduction', sql.NVarChar(2000), data.introduction || null);
            request.input('skills', sql.NVarChar(1000), data.skills || null);

            const studentResult = await request.query(`
                SELECT TOP 1
                    s.student_id,
                    s.student_code,
                    s.user_id,
                    u.full_name
                FROM dbo.Students s
                INNER JOIN dbo.Users u ON u.user_id = s.user_id
                WHERE s.user_id = @userId
                  AND u.status = 'ACTIVE';
            `);

            if (!studentResult.recordset.length) {
                throw Object.assign(
                    new Error('Không tìm thấy hồ sơ sinh viên hợp lệ.'),
                    { statusCode: 404 }
                );
            }

            const student = studentResult.recordset[0];

            const clubResult = await request.query(`
                SELECT organization_id, organization_name
                FROM dbo.Organizations
                WHERE organization_id = @clubId
                  AND organization_type = 'CLUB'
                  AND status = 'ACTIVE';
            `);

            if (!clubResult.recordset.length) {
                throw Object.assign(
                    new Error('Câu lạc bộ không tồn tại hoặc đã ngừng hoạt động.'),
                    { statusCode: 404 }
                );
            }

            const club = clubResult.recordset[0];

            request.input('studentId', sql.BigInt, student.student_id);

            const memberResult = await request.query(`
                SELECT TOP 1 1 AS is_member
                FROM dbo.ClubMembers
                WHERE club_id = @clubId
                  AND student_id = @studentId
                  AND status = 'ACTIVE';
            `);

            if (memberResult.recordset.length) {
                throw Object.assign(
                    new Error('Bạn đã là thành viên của câu lạc bộ này.'),
                    { statusCode: 409 }
                );
            }

            const pendingResult = await request.query(`
                SELECT TOP 1 request_id
                FROM dbo.ClubMembershipRequests
                WHERE club_id = @clubId
                  AND student_id = @studentId
                  AND status = 'PENDING';
            `);

            if (pendingResult.recordset.length) {
                throw Object.assign(
                    new Error('Bạn đã gửi đơn và đang chờ câu lạc bộ xét duyệt.'),
                    { statusCode: 409 }
                );
            }

            const insertResult = await request.query(`
                INSERT INTO dbo.ClubMembershipRequests (
                    club_id, student_id, request_reason,
                    self_introduction, skills, status, created_at
                )
                OUTPUT INSERTED.request_id
                VALUES (
                    @clubId, @studentId, @reason,
                    @introduction, @skills, 'PENDING', GETDATE()
                );
            `);

            const requestId = insertResult.recordset[0].request_id;

            request.input(
                'notificationTitle',
                sql.NVarChar(255),
                'Có đơn đăng ký thành viên mới'
            );

            request.input(
                'notificationContent',
                sql.NVarChar(sql.MAX),
                `${student.full_name} (${student.student_code}) đã gửi đơn đăng ký tham gia ${club.organization_name}.`
            );

            const notificationResult = await request.query(`
                INSERT INTO dbo.Notifications (
                    sender_id, title, content, created_at
                )
                OUTPUT INSERTED.notification_id
                VALUES (
                    @userId, @notificationTitle,
                    @notificationContent, GETDATE()
                );
            `);

            const notificationId =
                notificationResult.recordset[0].notification_id;

            request.input('notificationId', sql.BigInt, notificationId);

            await request.query(`
                INSERT INTO dbo.NotificationRecipients (
                    notification_id, user_id, is_read
                )
                SELECT
                    @notificationId, ou.user_id, 0
                FROM dbo.OrganizationUsers ou
                INNER JOIN dbo.Users u ON u.user_id = ou.user_id
                INNER JOIN dbo.UserRoles ur ON ur.user_id = u.user_id
                INNER JOIN dbo.Roles r ON r.role_id = ur.role_id
                WHERE ou.organization_id = @clubId
                  AND u.status = 'ACTIVE'
                  AND r.role_code = 'ORGANIZER';
            `);

            await transaction.commit();

            return {
                requestId,
                clubName: club.organization_name
            };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    },

    async getMyRequests(userId) {
        const pool = await poolPromise;

        const result = await pool.request()
            .input('userId', sql.BigInt, userId)
            .query(`
                SELECT
                    cr.request_id,
                    cr.club_id,
                    o.organization_name AS club_name,
                    cr.request_reason,
                    cr.self_introduction,
                    cr.skills,
                    cr.status,
                    cr.review_note,
                    cr.created_at,
                    cr.reviewed_at
                FROM dbo.ClubMembershipRequests cr
                INNER JOIN dbo.Students s ON s.student_id = cr.student_id
                INNER JOIN dbo.Organizations o ON o.organization_id = cr.club_id
                WHERE s.user_id = @userId
                ORDER BY cr.created_at DESC;
            `);

        return result.recordset;
    },

    async getClubRequests(userId, status) {
        const pool = await poolPromise;
        const request = pool.request();

        request.input('userId', sql.BigInt, userId);

        let statusCondition = '';

        if (status) {
            request.input('status', sql.VarChar(20), status);
            statusCondition = 'AND cr.status = @status';
        }

        const result = await request.query(`
            SELECT
                cr.request_id,
                cr.club_id,
                o.organization_name AS club_name,
                cr.student_id,
                s.student_code,
                s.class_name,
                f.faculty_name,
                u.full_name,
                u.email,
                cr.request_reason,
                cr.self_introduction,
                cr.skills,
                cr.status,
                cr.review_note,
                cr.created_at,
                cr.reviewed_at
            FROM dbo.ClubMembershipRequests cr
            INNER JOIN dbo.Organizations o
                ON o.organization_id = cr.club_id
            INNER JOIN dbo.OrganizationUsers ou
                ON ou.organization_id = cr.club_id
            INNER JOIN dbo.Students s
                ON s.student_id = cr.student_id
            INNER JOIN dbo.Users u
                ON u.user_id = s.user_id
            INNER JOIN dbo.Faculties f
                ON f.faculty_id = s.faculty_id
            WHERE ou.user_id = @userId
              AND u.status = 'ACTIVE'
              ${statusCondition}
            ORDER BY cr.created_at DESC;
        `);

        return result.recordset;
    },

    async reviewRequest(userId, requestId, decision, reviewNote) {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);

        await transaction.begin();

        try {
            const request = new sql.Request(transaction);

            request.input('userId', sql.BigInt, userId);
            request.input('requestId', sql.BigInt, requestId);
            request.input('decision', sql.VarChar(20), decision);
            request.input('reviewNote', sql.NVarChar(1000), reviewNote || null);

            const requestResult = await request.query(`
                SELECT
                    cr.request_id,
                    cr.club_id,
                    cr.student_id,
                    cr.status,
                    s.user_id AS student_user_id,
                    o.organization_name
                FROM dbo.ClubMembershipRequests cr
                    WITH (UPDLOCK, HOLDLOCK)
                INNER JOIN dbo.Students s
                    ON s.student_id = cr.student_id
                INNER JOIN dbo.Organizations o
                    ON o.organization_id = cr.club_id
                INNER JOIN dbo.OrganizationUsers ou
                    ON ou.organization_id = cr.club_id
                WHERE cr.request_id = @requestId
                  AND ou.user_id = @userId
                  AND o.organization_type = 'CLUB'
                  AND o.status = 'ACTIVE';
            `);

            if (!requestResult.recordset.length) {
                throw Object.assign(
                    new Error('Không tìm thấy đơn hoặc bạn không quản lý câu lạc bộ này.'),
                    { statusCode: 404 }
                );
            }

            const item = requestResult.recordset[0];

            if (item.status !== 'PENDING') {
                throw Object.assign(
                    new Error('Đơn đăng ký này đã được xử lý trước đó.'),
                    { statusCode: 409 }
                );
            }

            await request.query(`
                UPDATE dbo.ClubMembershipRequests
                SET
                    status = @decision,
                    reviewed_by = @userId,
                    reviewed_at = GETDATE(),
                    review_note = @reviewNote,
                    updated_at = GETDATE()
                WHERE request_id = @requestId
                  AND status = 'PENDING';
            `);

            if (decision === 'APPROVED') {
                await request.input('clubId', sql.BigInt, item.club_id)
                    .input('studentId', sql.BigInt, item.student_id)
                    .query(`
                        IF EXISTS (
                            SELECT 1
                            FROM dbo.ClubMembers
                            WHERE club_id = @clubId
                              AND student_id = @studentId
                        )
                        BEGIN
                            UPDATE dbo.ClubMembers
                            SET status = 'ACTIVE',
                                join_date = CAST(GETDATE() AS DATE)
                            WHERE club_id = @clubId
                              AND student_id = @studentId;
                        END
                        ELSE
                        BEGIN
                            INSERT INTO dbo.ClubMembers (
                                club_id, student_id, join_date, status
                            )
                            VALUES (
                                @clubId, @studentId,
                                CAST(GETDATE() AS DATE), 'ACTIVE'
                            );
                        END;
                    `);
            }

            const title = decision === 'APPROVED'
                ? 'Đơn đăng ký câu lạc bộ đã được chấp nhận'
                : 'Đơn đăng ký câu lạc bộ đã bị từ chối';

            const content = decision === 'APPROVED'
                ? `Đơn đăng ký tham gia ${item.organization_name} của bạn đã được chấp nhận.`
                : `Đơn đăng ký tham gia ${item.organization_name} đã bị từ chối. Lý do: ${reviewNote || 'Chưa cung cấp lý do.'}`;

            request.input('notificationTitle', sql.NVarChar(255), title);
            request.input('notificationContent', sql.NVarChar(sql.MAX), content);
            request.input('studentUserId', sql.BigInt, item.student_user_id);

            const notificationResult = await request.query(`
                INSERT INTO dbo.Notifications (
                    sender_id, title, content, created_at
                )
                OUTPUT INSERTED.notification_id
                VALUES (
                    @userId, @notificationTitle,
                    @notificationContent, GETDATE()
                );
            `);

            const notificationId =
                notificationResult.recordset[0].notification_id;

            request.input('notificationId', sql.BigInt, notificationId);

            await request.query(`
                INSERT INTO dbo.NotificationRecipients (
                    notification_id, user_id, is_read
                )
                VALUES (
                    @notificationId, @studentUserId, 0
                );
            `);

            await transaction.commit();

            return {
                requestId,
                status: decision
            };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
};

module.exports = clubRepository;
