
const jwt = require('jsonwebtoken');

/**
 * Giải mã và xác thực JWT.
 * Trả về thông tin người dùng nếu token hợp lệ.
 */
function verifyAccessToken(token, callback) {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        return callback(
            new Error('Chưa cấu hình JWT_SECRET trong biến môi trường.')
        );
    }

    jwt.verify(token, secret, (error, decoded) => {
        if (error) {
            return callback(error);
        }

        if (
            !decoded ||
            decoded.userId === undefined ||
            decoded.userId === null
        ) {
            return callback(
                new Error('Token không chứa định danh người dùng hợp lệ.')
            );
        }

        return callback(null, {
            userId: decoded.userId,
            username: decoded.username,
            role: decoded.role
        });
    });
}

/**
 * Xác thực JWT bắt buộc.
 *
 * Header:
 * Authorization: Bearer <token>
 */
function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Bạn cần đăng nhập để sử dụng chức năng này.'
        });
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Token xác thực không hợp lệ.'
        });
    }

    verifyAccessToken(token, (error, user) => {
        if (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Phiên đăng nhập đã hết hạn.'
                });
            }

            if (
                error.message ===
                'Chưa cấu hình JWT_SECRET trong biến môi trường.'
            ) {
                return next(error);
            }

            return res.status(401).json({
                success: false,
                message: error.message ||
                    'Token không hợp lệ.'
            });
        }

        req.user = user;
        return next();
    });
}

/**
 * Xác thực JWT tùy chọn.
 *
 * - Không có token: tiếp tục với req.user = null.
 * - Có token hợp lệ: gắn thông tin người dùng vào req.user.
 * - Có token không hợp lệ: trả về 401.
 */
function optionalAuthenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        req.user = null;
        return next();
    }

    if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Định dạng token xác thực không hợp lệ.'
        });
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Token xác thực không hợp lệ.'
        });
    }

    verifyAccessToken(token, (error, user) => {
        if (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Phiên đăng nhập đã hết hạn.'
                });
            }

            if (
                error.message ===
                'Chưa cấu hình JWT_SECRET trong biến môi trường.'
            ) {
                return next(error);
            }

            return res.status(401).json({
                success: false,
                message: error.message ||
                    'Token không hợp lệ.'
            });
        }

        req.user = user;
        return next();
    });
}

module.exports = {
    authenticateToken,
    optionalAuthenticateToken
};
