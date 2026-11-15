import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function StudentLogin() {
const navigate = useNavigate();

const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [error, setError] = useState('');

const handleSubmit = (event) => {
    event.preventDefault();

    setError('');

    // Kiểm tra dữ liệu nhập
    if (!email.trim() || !password.trim()) {
        setError('Vui lòng nhập đầy đủ email và mật khẩu.');
        return;
    }

    // Tạm thời chuyển hướng để kiểm tra Router.
    // Chưa thực hiện xác thực tài khoản với Backend.
    navigate('/student/dashboard');
};

return (
    <div className="login-page min-vh-100 d-flex align-items-center justify-content-center py-5">
        <div className="container">
            <div className="row justify-content-center">
                <div className="col-md-6 col-lg-5">
                    <div className="hero-card login-selection-card p-4 p-md-5">

                        {/* Badge */}
                        <div className="hero-badge mb-3">
                            <i className="bi bi-mortarboard-fill me-2"></i>
                            ĐĂNG NHẬP SINH VIÊN
                        </div>

                        <h2 className="hero-title mb-2">
                            Chào mừng sinh viên!
                        </h2>

                        <p className="hero-desc mb-4">
                            Vui lòng đăng nhập bằng tài khoản email để
                            tham gia các hoạt động phục vụ cộng đồng.
                        </p>

                        {/* Form đăng nhập */}
                        <form onSubmit={handleSubmit}>

                            {/* Email */}
                            <div className="mb-3">
                                <label className="form-label text-white">
                                    Tài khoản email
                                </label>

                                <div className="input-group">
                                    <span className="input-group-text bg-white bg-opacity-25 border-0 text-white">
                                        <i className="bi bi-envelope"></i>
                                    </span>

                                    <input
                                        type="email"
                                        className="form-control bg-white bg-opacity-25 border-0 text-white placeholder-white"
                                        placeholder="Nhập địa chỉ email sinh viên"
                                        autoComplete="username"
                                        value={email}
                                        onChange={(event) =>
                                            setEmail(event.target.value)
                                        }
                                        required
                                    />
                                </div>
                            </div>

                            {/* Mật khẩu */}
                            <div className="mb-4">
                                <label className="form-label text-white">
                                    Mật khẩu
                                </label>

                                <div className="input-group">
                                    <span className="input-group-text bg-white bg-opacity-25 border-0 text-white">
                                        <i className="bi bi-lock"></i>
                                    </span>

                                    <input
                                        type="password"
                                        className="form-control bg-white bg-opacity-25 border-0 text-white"
                                        placeholder="Nhập mật khẩu"
                                        autoComplete="current-password"
                                        value={password}
                                        onChange={(event) =>
                                            setPassword(event.target.value)
                                        }
                                        required
                                    />
                                </div>
                            </div>

                            {/* Thông báo lỗi */}
                            {error && (
                                <div className="alert alert-danger py-2">
                                    {error}
                                </div>
                            )}

                            {/* Nút đăng nhập */}
                            <div className="d-grid mb-3">
                                <button
                                    type="submit"
                                    className="btn btn-light btn-lg fw-semibold"
                                >
                                    <i className="bi bi-box-arrow-in-right me-2"></i>
                                    Đăng nhập
                                </button>
                            </div>

                            {/* Quay lại trang chủ */}
                            <div className="text-center">
                                <Link
                                    to="/"
                                    className="text-white-50 text-decoration-none small"
                                >
                                    <i className="bi bi-arrow-left me-1"></i>
                                    Quay lại trang chủ
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
);
}

export default StudentLogin;