import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function OrganizerLogin() {
    const navigate = useNavigate();

    const [account, setAccount] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (event) => {
        event.preventDefault();

        setError('');

        // Kiểm tra thông tin đăng nhập
        if (!account.trim() || !password.trim()) {
            setError('Vui lòng nhập đầy đủ tài khoản và mật khẩu.');
            return;
        }

        // Tạm thời chuyển hướng để kiểm tra Router.
        // Chưa xác thực tài khoản với Backend.
        navigate('/organizer/dashboard');
    };

    return (
        <div className="login-page min-vh-100 d-flex align-items-center justify-content-center py-5">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-md-6 col-lg-5">
                        <div className="hero-card login-selection-card p-4 p-md-5">

                            {/* Badge */}
                            <div className="hero-badge mb-3">
                                <i className="bi bi-building-fill me-2"></i>
                                ĐĂNG NHẬP ĐƠN VỊ TỔ CHỨC
                            </div>

                            <h2 className="hero-title mb-2">
                                Chào mừng đơn vị!
                            </h2>

                            <p className="hero-desc mb-4">
                                Đăng nhập để quản lý hoạt động và xét duyệt
                                đăng ký sinh viên.
                            </p>

                            {/* Form đăng nhập */}
                            <form onSubmit={handleSubmit}>

                                {/* Email / Tên đăng nhập */}
                                <div className="mb-3">
                                    <label className="form-label text-white">
                                        Email / Tên đăng nhập
                                    </label>

                                    <div className="input-group">
                                        <span className="input-group-text bg-white bg-opacity-25 border-0 text-white">
                                            <i className="bi bi-envelope"></i>
                                        </span>

                                        <input
                                            type="text"
                                            className="form-control bg-white bg-opacity-25 border-0 text-white"
                                            placeholder="Nhập email hoặc tên đăng nhập"
                                            autoComplete="username"
                                            value={account}
                                            onChange={(event) =>
                                                setAccount(event.target.value)
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

export default OrganizerLogin;
