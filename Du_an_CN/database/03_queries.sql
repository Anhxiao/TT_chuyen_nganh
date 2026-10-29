/* =========================================================
    Queries.sql - SQL Server Version
   ========================================================= */

USE StudentActivityDB;
GO

/* ---------------------------------------------------------
    1. Xem hoạt động đã công bố / đang mở đăng ký
   --------------------------------------------------------- */
SELECT *
FROM Activities
WHERE status IN ('PUBLISHED', 'REGISTERING');

/* ---------------------------------------------------------
    2. Xem chi tiết một hoạt động
   --------------------------------------------------------- */
-- Thay @ActivityId bằng giá trị thực tế
DECLARE @ActivityId BIGINT = 1;

SELECT *
FROM Activities
WHERE activity_id = @ActivityId;

/* ---------------------------------------------------------
    3. Kiểm tra chế độ đăng ký của hoạt động
   --------------------------------------------------------- */
DECLARE @ActivityId2 BIGINT = 1;

SELECT activity_id, registration_mode
FROM Activities
WHERE activity_id = @ActivityId2;

/* ---------------------------------------------------------
    4. Đăng ký hoạt động - chế độ OPEN (tự động duyệt)
   --------------------------------------------------------- */
DECLARE @ActivityId_Open BIGINT = 1;
DECLARE @StudentId_Open  BIGINT = 1;

INSERT INTO Registrations
(
    activity_id,
    student_id,
    status,
    approved_at
)
VALUES
(
    @ActivityId_Open,
    @StudentId_Open,
    'APPROVED',
    GETDATE()
);

/* ---------------------------------------------------------
    5. Đăng ký hoạt động - chế độ APPROVAL (chờ duyệt)
   --------------------------------------------------------- */
DECLARE @ActivityId_Approval BIGINT = 1;
DECLARE @StudentId_Approval  BIGINT = 1;

INSERT INTO Registrations
(
    activity_id,
    student_id,
    status
)
VALUES
(
    @ActivityId_Approval,
    @StudentId_Approval,
    'PENDING'
);

/* ---------------------------------------------------------
    6. Hủy đăng ký
   --------------------------------------------------------- */
DECLARE @RegistrationId_Cancel BIGINT = 1;
DECLARE @StudentId_Cancel      BIGINT = 1;

UPDATE Registrations
SET status = 'CANCELLED'
WHERE registration_id = @RegistrationId_Cancel
AND student_id = @StudentId_Cancel;

/* ---------------------------------------------------------
    7. Duyệt đăng ký
   --------------------------------------------------------- */
DECLARE @RegistrationId_Approve BIGINT = 1;
DECLARE @ApproverId_Approve     BIGINT = 1;

UPDATE Registrations
SET status      = 'APPROVED',
    approved_by = @ApproverId_Approve,
    approved_at = GETDATE()
WHERE registration_id = @RegistrationId_Approve;

/* ---------------------------------------------------------
    8. Từ chối đăng ký
   --------------------------------------------------------- */
DECLARE @RegistrationId_Reject BIGINT = 1;
DECLARE @ApproverId_Reject     BIGINT = 1;
DECLARE @RejectNote            NVARCHAR(MAX) = N'Không đủ điều kiện';

UPDATE Registrations
SET status        = 'REJECTED',
    approval_note = @RejectNote,
    approved_by   = @ApproverId_Reject,
    approved_at   = GETDATE()
WHERE registration_id = @RegistrationId_Reject;

/* ---------------------------------------------------------
    9. Xác nhận tham gia (ATTENDED)
   --------------------------------------------------------- */
DECLARE @RegistrationId_Attend BIGINT = 1;
DECLARE @Point_Attend          INT = 10;
DECLARE @ConfirmedBy_Attend    BIGINT = 1;

INSERT INTO ActivityParticipation
(
    registration_id,
    attendance_status,
    activity_point,
    confirmed_by,
    confirmed_at
)
VALUES
(
    @RegistrationId_Attend,
    'ATTENDED',
    @Point_Attend,
    @ConfirmedBy_Attend,
    GETDATE()
);

/* ---------------------------------------------------------
    10. Xác nhận vắng mặt (ABSENT)
   --------------------------------------------------------- */
DECLARE @RegistrationId_Absent BIGINT = 1;
DECLARE @ConfirmedBy_Absent    BIGINT = 1;

INSERT INTO ActivityParticipation
(
    registration_id,
    attendance_status,
    activity_point,
    confirmed_by,
    confirmed_at
)
VALUES
(
    @RegistrationId_Absent,
    'ABSENT',
    0,
    @ConfirmedBy_Absent,
    GETDATE()
);

/* ---------------------------------------------------------
    11. Tham gia một phần (PARTIAL)
   --------------------------------------------------------- */
DECLARE @RegistrationId_Partial BIGINT = 1;
DECLARE @Point_Partial          INT = 5;
DECLARE @ConfirmedBy_Partial    BIGINT = 1;

INSERT INTO ActivityParticipation
(
    registration_id,
    attendance_status,
    activity_point,
    confirmed_by,
    confirmed_at
)
VALUES
(
    @RegistrationId_Partial,
    'PARTIAL',
    @Point_Partial,
    @ConfirmedBy_Partial,
    GETDATE()
);

/* ---------------------------------------------------------
    12. Tính tổng điểm hoạt động của sinh viên
   --------------------------------------------------------- */
DECLARE @StudentId_Point BIGINT = 1;

SELECT SUM(ap.activity_point) AS total_points
FROM ActivityParticipation ap
INNER JOIN Registrations r ON ap.registration_id = r.registration_id
WHERE r.student_id = @StudentId_Point;

/* ---------------------------------------------------------
    13. Thống kê số lượng đăng ký và tham gia theo hoạt động
   --------------------------------------------------------- */
SELECT 
    a.activity_name,
    COUNT(DISTINCT r.registration_id) AS total_registered,
    COUNT(DISTINCT ap.participation_id) AS total_participated
FROM Activities a
LEFT JOIN Registrations r ON a.activity_id = r.activity_id
LEFT JOIN ActivityParticipation ap ON r.registration_id = ap.registration_id
GROUP BY a.activity_id, a.activity_name;

/* ---------------------------------------------------------
    14. Gửi thông báo
   --------------------------------------------------------- */
DECLARE @SenderId BIGINT = 1;
DECLARE @Title    NVARCHAR(255) = N'Tiêu đề thông báo';
DECLARE @Content  NVARCHAR(MAX) = N'Nội dung thông báo';

INSERT INTO Notifications
(
    sender_id,
    title,
    content
)
VALUES
(
    @SenderId,
    @Title,
    @Content
);

/* ---------------------------------------------------------
    15. Ghi Audit Log
   --------------------------------------------------------- */
DECLARE @UserId_Log   BIGINT = 1;
DECLARE @ActionName   NVARCHAR(255) = N'UPDATE';
DECLARE @EntityName   VARCHAR(100) = 'Activities';
DECLARE @EntityId     BIGINT = 1;
DECLARE @OldData      NVARCHAR(MAX) = NULL;
DECLARE @NewData      NVARCHAR(MAX) = NULL;

INSERT INTO AuditLogs
(
    user_id,
    action_name,
    entity_name,
    entity_id,
    old_data,
    new_data
)
VALUES
(
    @UserId_Log,
    @ActionName,
    @EntityName,
    @EntityId,
    @OldData,
    @NewData
);