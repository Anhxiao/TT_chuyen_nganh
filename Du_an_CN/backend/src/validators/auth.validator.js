
function validateLogin(req, res, next) {
    const { email, password, role } = req.body || {};
    const errors = {};

    if (typeof email !== 'string' || !email.trim()) {
        errors.email = 'Email không được để trống.';
    } else if (email.trim().length > 255) {
        errors.email = 'Email không được vượt quá 255 ký tự.';
    } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email.trim())) {
            errors.email = 'Địa chỉ email không hợp lệ.';
        }
    }

    if (typeof password !== 'string' || !password) {
        errors.password = 'Mật khẩu không được để trống.';
    } else if (password.length > 128) {
        errors.password = 'Mật khẩu không được vượt quá 128 ký tự.';
    }

    if (!['STUDENT', 'ORGANIZER'].includes(role)) {
        errors.role = 'Vai trò đăng nhập không hợp lệ.';
    }

    if (Object.keys(errors).length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Dữ liệu đăng nhập không hợp lệ.',
            errors
        });
    }

    req.body.email = email.trim().toLowerCase();

    next();
}

module.exports = {
    validateLogin
};
