import { Link } from 'react-router-dom';

function StudentLogin() {
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="hero-card login-selection-card p-4 p-md-5">
              
              {/* Badge */}
              <div className="hero-badge mb-3">
                <i className="bi bi-mortarboard-fill me-2"></i>
                ĐĂNG NHẬP SINH VIÊN
              </div>

              <h2 className="hero-title mb-2">Chào mừng sinh viên!</h2>
              <p className="hero-desc mb-4">
                Vui lòng đăng nhập để tham gia các hoạt động phục vụ cộng đồng.
              </p>

              {/* Form */}
              <form>
                <div className="mb-3">
                  <label className="form-label text-white">Mã số sinh viên</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white bg-opacity-25 border-0 text-white">
                      <i className="bi bi-person-badge"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control bg-white bg-opacity-25 border-0 text-white placeholder-white"
                      placeholder="Nhập mã số sinh viên"
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label text-white">Mật khẩu</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white bg-opacity-25 border-0 text-white">
                      <i className="bi bi-lock"></i>
                    </span>
                    <input
                      type="password"
                      className="form-control bg-white bg-opacity-25 border-0 text-white"
                      placeholder="Nhập mật khẩu"
                      required
                    />
                  </div>
                </div>

                <div className="d-grid mb-3">
                  <button type="submit" className="btn btn-light btn-lg fw-semibold">
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    Đăng nhập
                  </button>
                </div>

                <div className="text-center">
                  <Link to="/" className="text-white-50 text-decoration-none small">
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