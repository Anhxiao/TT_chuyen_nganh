function App() {
return (
    <>
    {/* ================= HEADER ================= */}
    <header className="top-header">
        <div className="container-fluid px-4">
        <div className="header-inner">
            {/* Logo */}
            <div className="logo-section">
            <div className="logo-img">
                <img
                src="\public\assets\Logo-DH-Tra-Vinh-TVU.webp"
                alt="TVU Logo"
                />
            </div>
            </div>

            {/* Menu */}
            <nav>
            <ul className="nav-menu">
                <li>
                <a href="#" className="nav-item home-active">
                    <i className="bi bi-house"></i>
                    Trang chủ
                </a>
                </li>

                <li className="dropdown">
                <a
                    href="#"
                    className="nav-item dropdown-toggle"
                    data-bs-toggle="dropdown"
                >
                    <i className="bi bi-bell"></i>
                    Thông báo
                </a>
                <ul className="dropdown-menu">
                    <li>
                    <a className="dropdown-item" href="#">
                        <i className="bi bi-bell me-2"></i>
                        Thông báo hoạt động
                    </a>
                    </li>
                </ul>
                </li>

                <li className="dropdown">
                <a
                    href="#"
                    className="nav-item dropdown-toggle"
                    data-bs-toggle="dropdown"
                >
                    <i className="bi bi-search"></i>
                    Hoạt động
                </a>
                <ul className="dropdown-menu">
                    <li>
                    <a className="dropdown-item" href="#">
                        <i className="bi bi-person-badge me-2"></i>
                        Trường Kỹ thuật và Công nghệ
                    </a>
                    </li>
                    <li>
                    <a className="dropdown-item" href="#">
                        <i className="bi bi-journal-text me-2"></i>
                        Trường Kinh tế luật
                    </a>
                    </li>
                    <li>
                    <a className="dropdown-item" href="#">
                        <i className="bi bi-file-earmark-text me-2"></i>
                        Trường y dược
                    </a>
                    </li>
                </ul>
                </li>

                <li className="dropdown">
                <a
                    href="#"
                    className="nav-item dropdown-toggle"
                    data-bs-toggle="dropdown"
                >
                    <i className="bi bi-info-circle"></i>
                    Giới thiệu
                </a>
                <ul className="dropdown-menu">
                    <li>
                    <a className="dropdown-item" href="#">
                        <i className="bi bi-mortarboard me-2"></i>
                        Đoàn trường Kỹ thuật và Công nghệ
                    </a>
                    </li>
                    <li>
                    <a className="dropdown-item" href="#">
                        <i className="bi bi-person-badge me-2"></i>
                        Đoàn trường Kinh tế luật
                    </a>
                    </li>
                    <li>
                    <a className="dropdown-item" href="#">
                        <i className="bi bi-shield-lock me-2"></i>
                        Đoàn trường y dược
                    </a>
                    </li>
                </ul>
                </li>

                <li className="dropdown">
                <a
                    href="#"
                    className="nav-item dropdown-toggle"
                    data-bs-toggle="dropdown"
                >
                    <i className="bi bi-people"></i>
                    Lịch sử
                </a>
                <ul className="dropdown-menu">
                    <li>
                    <a className="dropdown-item" href="#">
                        <i className="bi bi-file-earmark-text me-2"></i>
                        Các Hoạt động đã tham gia
                    </a>
                    </li>
                    <li>
                    <a className="dropdown-item" href="#">
                        <i className="bi bi-file-earmark-text me-2"></i>
                        Minh chứng
                    </a>
                    </li>
                </ul>
                </li>
            </ul>
            </nav>
        </div>
        </div>
    </header>

    {/* ================= HERO SECTION ================= */}
    <section className="hero-section">
        <div className="container">
        <div className="row align-items-stretch g-4">
            {/* Cột trái */}
            <div className="col-lg-7">
            <div className="hero-card">
                <div className="hero-badge">
                <i className="bi bi-mortarboard-fill me-2"></i>
                TRA VINH UNIVERSITY
                </div>

                <h1 className="hero-title">
                Hệ thống quản lý hoạt động phục vụ cộng đồng
                </h1>

                <p className="hero-desc">
                Nền tảng hỗ trợ sinh viên tra cứu, đăng ký và theo dõi các
                hoạt động tình nguyện, hiến máu và phục vụ cộng đồng.
                </p>

                <p className="hero-desc mb-0">
                Đồng thời, hệ thống giúp các đơn vị tổ chức quản lý hoạt
                động, xét duyệt đăng ký, xác nhận tham gia và ghi nhận điểm
                phục vụ cộng đồng, góp phần nâng cao hiệu quả quản lý và
                khuyến khích sinh viên tích cực tham gia các hoạt động xã
                hội.
                </p>
            </div>
            </div>

            {/* Cột phải - Đăng nhập */}
            <div className="col-lg-5">
            <div className="hero-card login-selection-card">
                <div className="hero-badge">
                <i className="bi bi-person-lock me-2"></i>
                ĐĂNG NHẬP HỆ THỐNG
                </div>

                <h2 className="hero-title">Chào mừng bạn!</h2>

                <p className="hero-desc">
                Vui lòng lựa chọn loại tài khoản để tiếp tục sử dụng hệ
                thống.
                </p>

                <div className="d-grid gap-3 mt-4">
                <a
                    href="/student-login"
                    className="btn btn-light login-choice-btn student-login-btn"
                >
                    <i className="bi bi-mortarboard-fill"></i>
                    <span>
                    <strong>Tài khoản sinh viên</strong>
                    <small>Đăng nhập dành cho sinh viên</small>
                    </span>
                    <i className="bi bi-arrow-right ms-auto"></i>
                </a>

                <a
                    href="/organizer-login"
                    className="btn btn-light login-choice-btn organizer-login-btn"
                >
                    <i className="bi bi-building-fill"></i>
                    <span>
                    <strong>Tài khoản đơn vị tổ chức</strong>
                    <small>Đăng nhập dành cho đơn vị quản lý</small>
                    </span>
                    <i className="bi bi-arrow-right ms-auto"></i>
                </a>
                </div>

                <p className="text-center text-white-50 mt-4 mb-0">
                <i className="bi bi-shield-check me-1"></i>
                Hệ thống quản lý hoạt động phục vụ cộng đồng
                </p>
            </div>
            </div>
        </div>
        </div>
    </section>

    {/* ================= ĐỐI TƯỢNG ================= */}
    <section className="py-5 section-doi-tuong">
        <div className="container">
        <h2 className="text-center fw-bold mb-4 mb-lg-5 display-6">
            Dành cho mọi đối tượng
        </h2>

        <div className="row g-4 g-lg-5">
            {/* Sinh viên */}
            <div className="col-md-4">
            <div className="card border-primary rounded-4 h-100 bg-white bg-opacity-80 shadow-sm card-doi-tuong">
                <div className="card-body p-4 p-lg-5">
                <div className="icon-doi-tuong bg-primary bg-opacity-10 text-primary mb-3">
                    <i className="bi bi-mortarboard"></i>
                </div>
                <h4 className="card-title text-primary fw-bold mb-3">
                    Sinh viên
                </h4>
                <ul className="list-unstyled mb-0 fs-5">
                    <li className="mb-3">
                    <i className="bi bi-check2-circle text-success me-2"></i>
                    Đăng ký / hủy hoạt động
                    </li>
                    <li className="mb-3">
                    <i className="bi bi-check2-circle text-success me-2"></i>
                    Theo dõi trạng thái
                    </li>
                    <li className="mb-3">
                    <i className="bi bi-check2-circle text-success me-2"></i>
                    Xem lịch sử & điểm
                    </li>
                    <li>
                    <i className="bi bi-check2-circle text-success me-2"></i>
                    Nhận thông báo
                    </li>
                </ul>
                </div>
            </div>
            </div>

            {/* Đơn vị tổ chức */}
            <div className="col-md-4">
            <div className="card border-success rounded-4 h-100 bg-white bg-opacity-80 shadow-sm card-doi-tuong">
                <div className="card-body p-4 p-lg-5">
                <div className="icon-doi-tuong bg-success bg-opacity-10 text-success mb-3">
                    <i className="bi bi-briefcase"></i>
                </div>
                <h4 className="card-title text-success fw-bold mb-3">
                    Đơn vị tổ chức
                </h4>
                <ul className="list-unstyled mb-0 fs-5">
                    <li className="mb-3">
                    <i className="bi bi-check2-circle text-success me-2"></i>
                    Tạo & quản lý hoạt động
                    </li>
                    <li className="mb-3">
                    <i className="bi bi-check2-circle text-success me-2"></i>
                    Duyệt đăng ký
                    </li>
                    <li className="mb-3">
                    <i className="bi bi-check2-circle text-success me-2"></i>
                    Xác nhận tham gia & ghi điểm
                    </li>
                    <li>
                    <i className="bi bi-check2-circle text-success me-2"></i>
                    Thống kê & thông báo
                    </li>
                </ul>
                </div>
            </div>
            </div>

            {/* Quản trị viên */}
            <div className="col-md-4">
            <div className="card border-danger rounded-4 h-100 bg-white bg-opacity-80 shadow-sm card-doi-tuong">
                <div className="card-body p-4 p-lg-5">
                <div className="icon-doi-tuong bg-danger bg-opacity-10 text-danger mb-3">
                    <i className="bi bi-shield-lock"></i>
                </div>
                <h4 className="card-title text-danger fw-bold mb-3">
                    Quản trị viên
                </h4>
                <ul className="list-unstyled mb-0 fs-5">
                    <li className="mb-3">
                    <i className="bi bi-check2-circle text-success me-2"></i>
                    Quản lý tài khoản
                    </li>
                    <li className="mb-3">
                    <i className="bi bi-check2-circle text-success me-2"></i>
                    Phân quyền
                    </li>
                    <li className="mb-3">
                    <i className="bi bi-check2-circle text-success me-2"></i>
                    Theo dõi toàn hệ thống
                    </li>
                    <li>
                    <i className="bi bi-check2-circle text-success me-2"></i>
                    Báo cáo tổng hợp
                    </li>
                </ul>
                </div>
            </div>
            </div>
        </div>
        </div>
    </section>

    {/* ================= FOOTER ================= */}
    <footer className="bg-primary text-white mt-5 pt-5 pb-3">
        <div className="container-fluid px-4">
        <div className="row justify-content-between">
            {/* Thông tin trường */}
            <div className="col-lg-9 col-md-9 col-12">
            <h2 className="fw-bold mb-3">Đại học Trà Vinh</h2>
            <p className="fs-5 text-light mb-4">Tra Vinh University</p>

            <div
                className="bg-warning mb-4"
                style={{ height: "4px", width: "150px" }}
            ></div>

            <p className="fs-5 mb-3">
                <i className="bi bi-geo-alt-fill me-3"></i>
                Số 126, Nguyễn Thiện Thành, Khóm 4, Phường Hòa Thuận, Tỉnh Vĩnh
                Long
            </p>

            <p className="fs-5 mb-3">
                <i className="bi bi-telephone-fill me-3"></i>
                (+84) 294.3855246
            </p>

            <p className="fs-5 mb-3">
                <i className="bi bi-envelope-fill me-3"></i>
                <a
                href="mailto:tvu@tvu.edu.vn"
                className="text-warning text-decoration-none"
                >
                tvu@tvu.edu.vn
                </a>
            </p>

            <p className="fs-5 mb-3">
                <i className="bi bi-globe me-3"></i>
                <a
                href="https://www.tvu.edu.vn/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-warning text-decoration-none"
                >
                https://www.tvu.edu.vn/
                </a>
            </p>
            </div>

            {/* Mạng xã hội */}
            <div className="col-lg-3 col-md-3 col-12 d-flex justify-content-lg-end justify-content-start align-items-start gap-3 mt-4 mt-lg-0">
            <a
                href="https://www.facebook.com/?locale=vi_VN"
                className="bg-info text-white rounded-circle d-flex align-items-center justify-content-center text-decoration-none"
                style={{ width: "65px", height: "65px" }}
            >
                <i className="bi bi-facebook fs-2"></i>
            </a>

            <a
                href="https://www.youtube.com/?app=desktop&hl=vi"
                className="bg-danger text-white rounded-circle d-flex align-items-center justify-content-center text-decoration-none"
                style={{ width: "65px", height: "65px" }}
            >
                <i className="bi bi-youtube fs-2"></i>
            </a>

            <a
                href="https://github.com/Anhxiao/TT_chuyen_nganh.git"
                className="bg-dark text-white rounded-circle d-flex align-items-center justify-content-center text-decoration-none"
                style={{ width: "65px", height: "65px" }}
            >
                <i className="bi bi-github fs-2"></i>
            </a>
            </div>
        </div>

        {/* Phần cuối footer */}
        <div className="row mt-4 align-items-center">
            <div className="col-12">
            <div
                className="bg-warning mb-3"
                style={{ height: "3px", width: "230px" }}
            ></div>
            </div>

            <div className="col-md-4 col-12">
            <h4 className="fw-bold text-warning mb-0">
                Tra Vinh University
            </h4>
            </div>

            <div className="col-md-8 col-12 text-md-end mt-3 mt-md-0">
            <small className="text-light">
                © 2025 Hệ thống Quản lý Hoạt động Phục vụ Cộng đồng · Đồ án
                chuyên ngành · Thạch Nam Anh
            </small>
            </div>
        </div>
        </div>
    </footer>
    </>
);
}

export default App;