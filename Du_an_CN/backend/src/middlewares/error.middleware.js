
/**
 * Middleware xử lý lỗi tập trung.
 *
 * Đặt middleware này sau tất cả Routes trong app.js.
 */
function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    const statusCode = Number(err.statusCode || err.status) || 500;

    // Không gửi thông tin nội bộ của máy chủ cho người dùng.
    const safeStatusCode =
        statusCode >= 400 && statusCode < 600
            ? statusCode
            : 500;

    const isProduction = process.env.NODE_ENV === 'production';

    if (safeStatusCode >= 500) {
        console.error('Lỗi máy chủ:', {
            method: req.method,
            path: req.originalUrl,
            message: err.message,
            stack: isProduction ? undefined : err.stack
        });
    }

    return res.status(safeStatusCode).json({
        success: false,
        message:
            safeStatusCode >= 500 && isProduction
                ? 'Đã xảy ra lỗi máy chủ. Vui lòng thử lại sau.'
                : err.message || 'Đã xảy ra lỗi khi xử lý yêu cầu.',
        ...(isProduction ? {} : { stack: err.stack })
    });
}

module.exports = {
    errorHandler
};
