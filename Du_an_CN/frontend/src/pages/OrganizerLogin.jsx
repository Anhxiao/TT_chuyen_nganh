
import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

function OrganizerLogin() {
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError('');

        if (!email.trim() || !password) {
            setError('Vui lòng nhập đầy đủ email và mật khẩu.');
            return;
        }

        try {
            setLoading(true);

            const result = await login(
                email,
                password,
                'ORGANIZER'
            );

            if (!result.success) {
                setError(result.message);
                return;
            }

            navigate('/organizer/dashboard', {
                replace: true
            });
        } catch (error) {
            setError('Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page min-vh-100 d-flex align-items-center justify-content-center py-5">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-md-6 col-lg-5">
                        <div className="hero-card login-selection-card p-4 p-md-5">

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

                            <form onSubmit={handleSubmit}>

                                {/* Email */}
                                <div className="mb-3">
                                    <label className="form-label text-white">
                                        Địa chỉ email
                                    </label>

                                    <div className="input-group">
                                        <span className="input-group-text bg-white bg-opacity-25 border-0 text-white">
                                            <i className="bi bi-envelope"></i>
                                        </span>

                                        <input
                                            type="email"
                                            className="form-control bg-white bg-opacity-25 border-0 text-white"
                                            placeholder="Nhập địa chỉ email đơn vị"
                                            autoComplete="email"
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

                                {/* Đăng nhập */}
                                <div className="d-grid mb-3">
                                    <button
                                        type="submit"
                                        className="btn btn-light btn-lg fw-semibold"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                Đang đăng nhập...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-box-arrow-in-right me-2"></i>
                                                Đăng nhập
                                            </>
                                        )}
                                    </button>
                                </div>

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
