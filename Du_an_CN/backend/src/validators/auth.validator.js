
function validateLogin(req, res, next) {
    const { username, password } = req.body || {};
    const errors = {};

    if (typeof username !== 'string' || !username.trim()) {
        errors.username = 'Tên đăng nhập không được để trống.';
    } else if (username.trim().length > 100) {
        errors.username = 'Tên đăng nhập không được vượt quá 100 ký tự.';
    }

    if (typeof password !== 'string' || !password) {
        errors.password = 'Mật khẩu không được để trống.';
    } else if (password.length > 128) {
        errors.password = 'Mật khẩu không được vượt quá 128 ký tự.';
    }

    if (Object.keys(errors).length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Dữ liệu đăng nhập không hợp lệ.',
            errors
        });
    }

    req.body.username = username.trim();
    next();
}

module.exports = {
    validateLogin
};
