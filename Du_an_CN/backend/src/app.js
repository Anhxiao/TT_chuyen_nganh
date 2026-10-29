
const express = require('express');
const cors = require('cors');

// Routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const activityRoutes = require('./routes/activity.routes');
const registrationRoutes = require('./routes/registration.routes');
const participationRoutes = require('./routes/participation.routes');
const notificationRoutes = require('./routes/notification.routes');

// Middleware xử lý lỗi
const { errorHandler } = require('./middlewares/error.middleware');

const app = express();

// ==========================================
// 1. Cấu hình middleware chung
// ==========================================

// Cho phép Frontend gửi yêu cầu đến Backend.
// Khi triển khai thực tế, nên giới hạn origin theo địa chỉ Frontend.
app.use(cors());

// Phân tích dữ liệu JSON từ request body.
app.use(express.json({ limit: '1mb' }));

// Phân tích dữ liệu form URL-encoded.
app.use(express.urlencoded({ extended: true }));

// ==========================================
// 2. API kiểm tra trạng thái Backend
// ==========================================

app.get('/api/health', (req, res) => {
    return res.status(200).json({
        success: true,
        message: 'Backend đang hoạt động.',
        data: {
            service: 'StudentActivityAPI',
            status: 'OK'
        }
    });
});

// ==========================================
// 3. Khai báo các tuyến API
// ==========================================

// Xác thực: đăng nhập, đăng xuất, thông tin tài khoản hiện tại.
app.use('/api/auth', authRoutes);

// Hồ sơ cá nhân và quản lý tài khoản.
app.use('/api/users', userRoutes);

// Danh sách, chi tiết và quản lý hoạt động.
app.use('/api/activities', activityRoutes);

// Đăng ký, hủy đăng ký và duyệt đăng ký hoạt động.
app.use('/api/registrations', registrationRoutes);

// Điểm danh và ghi nhận điểm hoạt động.
app.use('/api/participation', participationRoutes);

// Thông báo và trạng thái đã đọc.
app.use('/api/notifications', notificationRoutes);

// ==========================================
// 4. Xử lý API không tồn tại
// ==========================================

app.use((req, res, next) => {
    const error = new Error(
        `Không tìm thấy API: ${req.method} ${req.originalUrl}`
    );

    error.statusCode = 404;

    next(error);
});

// ==========================================
// 5. Middleware xử lý lỗi tập trung
// Phải đặt cuối cùng
// ==========================================

app.use(errorHandler);

module.exports = app;
