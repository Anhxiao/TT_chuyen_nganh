
const jwt = require('jsonwebtoken');

/**
 * Xác thực JWT.
 *
 * Header:
 * Authorization: Bearer <token>
 *
 * Quy ước payload token:
 * {
 *   userId: 1,
 *   username: "student01"
 * }
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

    const secret = process.env.JWT_SECRET;

    if (!secret) {
        return next(
            new Error('Chưa cấu hình JWT_SECRET trong biến môi trường.')
        );
    }

    jwt.verify(token, secret, (error, decoded) => {
        if (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Phiên đăng nhập đã hết hạn.'
                });
            }

            return res.status(401).json({
                success: false,
                message: 'Token không hợp lệ.'
            });
        }

        if (!decoded || decoded.userId === undefined || decoded.userId === null) {
            return res.status(401).json({
                success: false,
                message: 'Token không chứa định danh người dùng hợp lệ.'
            });
        }

        req.user = {
            userId: decoded.userId,
            username: decoded.username
        };

        return next();
    });
}

module.exports = {
    authenticateToken
};
