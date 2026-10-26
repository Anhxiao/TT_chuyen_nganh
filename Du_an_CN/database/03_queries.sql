USE StudentActivityDB;

-- Xem hoạt động công bố
SELECT *
FROM Activities
WHERE status IN ('PUBLISHED','REGISTERING');

-- Xem chi tiết hoạt động
SELECT *
FROM Activities
WHERE activity_id = ?;

-- Kiểm tra chế độ đăng ký
SELECT
activity_id,
registration_mode
FROM Activities
WHERE activity_id = ?;

-- Hoạt động OPEN
INSERT INTO Registrations
(
activity_id,
student_id,
status,
approved_at
)
VALUES
(
?,
?,
'APPROVED',
NOW()
);

-- Hoạt động APPROVAL
INSERT INTO Registrations
(
activity_id,
student_id,
status
)
VALUES
(
?,
?,
'PENDING'
);

-- Hủy đăng ký
UPDATE Registrations
SET status='CANCELLED'
WHERE registration_id=?
AND student_id=?;

-- Duyệt
UPDATE Registrations
SET
status='APPROVED',
approved_by=?,
approved_at=NOW()
WHERE registration_id=?;

-- Từ chối
UPDATE Registrations
SET
status='REJECTED',
approval_note=?,
approved_by=?,
approved_at=NOW()
WHERE registration_id=?;

-- Xác nhận tham gia
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
?,
'ATTENDED',
?,
?,
NOW()
);

-- Vắng mặt
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
?,
'ABSENT',
0,
?,
NOW()
);

-- Tham gia một phần
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
?,
'PARTIAL',
?,
?,
NOW()
);

-- Điểm hoạt động
SELECT
SUM(ap.activity_point) AS total_points
FROM ActivityParticipation ap
JOIN Registrations r
ON ap.registration_id=r.registration_id
WHERE r.student_id=?;

-- Thống kê
SELECT
a.activity_name,
COUNT(DISTINCT r.registration_id) total_registered,
COUNT(DISTINCT ap.participation_id) total_participated
FROM Activities a
LEFT JOIN Registrations r
ON a.activity_id=r.activity_id
LEFT JOIN ActivityParticipation ap
ON r.registration_id=ap.registration_id
GROUP BY a.activity_id,a.activity_name;

-- Thông báo
INSERT INTO Notifications
(
sender_id,
title,
content
)
VALUES
(
?,
?,
?
);

-- Audit Log
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
?,
?,
?,
?,
?,
?
);