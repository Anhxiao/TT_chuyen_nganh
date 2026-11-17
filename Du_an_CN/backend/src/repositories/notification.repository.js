
const { sql, poolPromise } = require('../config/database');

/**
 * Lấy danh sách thông báo của người dùng.
 * Hỗ trợ lọc chưa đọc và phân trang.
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

    let unreadCondition = '';

    if (unreadOnly) {
        unreadCondition = 'AND nr.is_read = 0';
    }

    const result = await request.query(`
        SELECT
            n.notification_id AS notificationId,
            n.sender_id AS senderId,
            n.title,
            n.content,
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

    return {
        notifications: result.recordsets[0],
        pagination: {
            page,
            limit,
            total: Number(result.recordsets[1][0].total),
            totalPages: Math.ceil(
                Number(result.recordsets[1][0].total) / limit
            )
        },
        unreadCount: Number(result.recordsets[2][0].unreadCount)
    };
}

/**
 * Đánh dấu thông báo đã đọc.
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
 * Tạo thông báo và danh sách người nhận trong cùng transaction.
 */
async function sendNotification({
    senderId,
    title,
    content,
    recipientUserIds
}) {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // Tạo thông báo
        const notificationResult = await new sql.Request(transaction)
            .input('senderId', sql.BigInt, senderId)
            .input('title', sql.NVarChar(255), title)
            .input('content', sql.NVarChar(sql.MAX), content)
            .query(`
                INSERT INTO dbo.Notifications (
                    sender_id,
                    title,
                    content,
                    created_at
                )
                OUTPUT INSERTED.notification_id AS notificationId
                VALUES (
                    @senderId,
                    @title,
                    @content,
                    GETDATE()
                );
            `);

        const notificationId =
            notificationResult.recordset[0].notificationId;

        // Thêm danh sách người nhận
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
        await transaction.rollback();
        throw error;
    }
}

module.exports = {
    getMyNotifications,
    markAsRead,
    sendNotification
};
