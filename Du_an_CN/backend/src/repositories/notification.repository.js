
const { sql, poolPromise } = require('../config/database');

/**
 * Lấy danh sách thông báo của người dùng.
 */
async function getMyNotifications({
    userId,
    unreadOnly = false,
    page = 1,
    limit = 20
}) {
    const pool = await poolPromise;
    const offset = (page - 1) * limit;

    const request = pool.request()
        .input('userId', sql.BigInt, userId)
        .input('offset', sql.Int, offset)
        .input('limit', sql.Int, limit);

    const unreadCondition = unreadOnly
        ? 'AND nr.is_read = 0'
        : '';

    const result = await request.query(`
        SELECT
            n.notification_id AS notificationId,
            n.sender_id AS senderId,
            n.title,
            n.content,
            n.notification_type AS type,
            n.related_type AS relatedType,
            n.related_id AS relatedId,
            n.created_at AS createdAt,
            nr.is_read AS isRead,
            nr.read_at AS readAt
        FROM dbo.NotificationRecipients AS nr
        INNER JOIN dbo.Notifications AS n
            ON nr.notification_id = n.notification_id
        WHERE nr.user_id = @userId
        ${unreadCondition}
        ORDER BY n.created_at DESC, n.notification_id DESC
        OFFSET @offset ROWS
        FETCH NEXT @limit ROWS ONLY;

        SELECT COUNT_BIG(*) AS total
        FROM dbo.NotificationRecipients AS nr
        INNER JOIN dbo.Notifications AS n
            ON nr.notification_id = n.notification_id
        WHERE nr.user_id = @userId
        ${unreadCondition};

        SELECT COUNT_BIG(*) AS unreadCount
        FROM dbo.NotificationRecipients
        WHERE user_id = @userId
          AND is_read = 0;
    `);

    const total = Number(result.recordsets[1][0].total);

    return {
        notifications: result.recordsets[0],
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        },
        unreadCount: Number(result.recordsets[2][0].unreadCount)
    };
}


/**
 * Lấy chi tiết thông báo.
 *
 * Chỉ người nhận thông báo mới được xem chi tiết.
 *
 * Hỗ trợ thông báo đăng ký thành viên câu lạc bộ.
 */

async function getNotificationDetail({ notificationId, userId }) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input('notificationId', sql.BigInt, notificationId)
        .input('userId', sql.BigInt, userId)
        .query(`
            SELECT
                n.notification_id AS notificationId,
                n.sender_id AS senderId,
                n.title,
                n.content,
                n.notification_type AS type,
                n.related_type AS relatedType,
                n.related_id AS relatedId,
                n.created_at AS createdAt,

                nr.is_read AS isRead,
                nr.read_at AS readAt,

                cmr.request_id AS requestId,
                cmr.request_reason AS requestReason,
                cmr.self_introduction AS selfIntroduction,
                cmr.skills,
                cmr.status AS requestStatus,
                cmr.created_at AS requestCreatedAt,

                cmr.student_id AS studentId,
                cmr.student_code AS studentCode,
                cmr.studentName,

                cmr.organization_id AS clubId,
                cmr.organization_name AS clubName

            FROM dbo.Notifications AS n

            INNER JOIN dbo.NotificationRecipients AS nr
                ON nr.notification_id = n.notification_id

            OUTER APPLY (
                SELECT TOP 1
                    r.request_id,
                    r.request_reason,
                    r.self_introduction,
                    r.skills,
                    r.status,
                    r.created_at,

                    st.student_id,
                    st.student_code,
                    studentUser.full_name AS studentName,

                    org.organization_id,
                    org.organization_name

                FROM dbo.ClubMembershipRequests AS r

                INNER JOIN dbo.Students AS st
                    ON st.student_id = r.student_id

                INNER JOIN dbo.Users AS studentUser
                    ON studentUser.user_id = st.user_id

                INNER JOIN dbo.Organizations AS org
                    ON org.organization_id = r.club_id

                WHERE
                    n.related_type = 'CLUB_MEMBERSHIP_REQUEST'
                    AND n.related_id IS NOT NULL
                    AND r.request_id = n.related_id

                ORDER BY
                    r.created_at DESC,
                    r.request_id DESC
            ) AS cmr

            WHERE
                n.notification_id = @notificationId
                AND nr.user_id = @userId
                AND n.related_type = 'CLUB_MEMBERSHIP_REQUEST'
                AND cmr.request_id IS NOT NULL;
        `);

    if (!result.recordset || result.recordset.length === 0) {
        return null;
    }

    const row = result.recordset[0];

    return {
        notification: {
            notificationId: Number(row.notificationId),
            senderId: row.senderId == null ? null : Number(row.senderId),
            title: row.title,
            content: row.content,
            type: row.type,
            relatedType: row.relatedType,
            relatedId: row.relatedId == null ? null : Number(row.relatedId),
            createdAt: row.createdAt,
            isRead: Boolean(row.isRead),
            readAt: row.readAt
        },

        request: {
            requestId: Number(row.requestId),
            studentId: Number(row.studentId),
            studentCode: row.studentCode,
            studentName: row.studentName,
            clubId: Number(row.clubId),
            clubName: row.clubName,
            reason: row.requestReason,
            selfIntroduction: row.selfIntroduction,
            skills: row.skills,
            status: row.requestStatus,
            createdAt: row.requestCreatedAt
        }
    };
}

/**
 * Đánh dấu một thông báo đã đọc.
 *
 * Chỉ cập nhật thông báo thuộc người dùng đang đăng nhập.
 */
async function markAsRead({ notificationId, userId }) {
    const pool = await poolPromise;

    const result = await pool.request()
        .input('notificationId', sql.BigInt, notificationId)
        .input('userId', sql.BigInt, userId)
        .query(`
            UPDATE dbo.NotificationRecipients
            SET
                is_read = 1,
                read_at = GETDATE()
            WHERE notification_id = @notificationId
              AND user_id = @userId
              AND is_read = 0;

            SELECT @@ROWCOUNT AS affectedRows;
        `);

    return result.recordset[0].affectedRows > 0;
}


/**
 * Gửi thông báo đến nhiều người dùng.
 */
async function sendNotification({
    senderId,
    title,
    content,
    recipientUserIds,
    notificationType = null,
    relatedType = null,
    relatedId = null
}) {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // Tạo thông báo.
        const notificationResult = await new sql.Request(transaction)
            .input('senderId', sql.BigInt, senderId)
            .input('title', sql.NVarChar(255), title)
            .input('content', sql.NVarChar(sql.MAX), content)
            .input('notificationType', sql.VarChar(50), notificationType)
            .input('relatedType', sql.VarChar(50), relatedType)
            .input('relatedId', sql.BigInt, relatedId)
            .query(`
                INSERT INTO dbo.Notifications (
                    sender_id,
                    title,
                    content,
                    notification_type,
                    related_type,
                    related_id,
                    created_at
                )
                OUTPUT
                    INSERTED.notification_id AS notificationId
                VALUES (
                    @senderId,
                    @title,
                    @content,
                    @notificationType,
                    @relatedType,
                    @relatedId,
                    GETDATE()
                );
            `);

        const notificationId =
            notificationResult.recordset[0].notificationId;

        // Thêm người nhận.
        for (const userId of recipientUserIds) {
            await new sql.Request(transaction)
                .input('notificationId', sql.BigInt, notificationId)
                .input('userId', sql.BigInt, userId)
                .query(`
                    INSERT INTO dbo.NotificationRecipients (
                        notification_id,
                        user_id,
                        is_read,
                        read_at
                    )
                    VALUES (
                        @notificationId,
                        @userId,
                        0,
                        NULL
                    );
                `);
        }

        await transaction.commit();

        return {
            notificationId: Number(notificationId),
            recipientCount: recipientUserIds.length
        };

    } catch (error) {
        try {
            await transaction.rollback();
        } catch (rollbackError) {
            console.error(
                'Lỗi rollback thông báo:',
                rollbackError.message
            );
        }

        throw error;
    }
}


module.exports = {
    getMyNotifications,
    getNotificationDetail,
    markAsRead,
    sendNotification
};