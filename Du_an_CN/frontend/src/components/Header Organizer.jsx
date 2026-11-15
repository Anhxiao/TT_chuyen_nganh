import '../styles/components/header.css';

function Header() {
    return (
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
                <a href="" className="nav-item home-active">
                    <i className="bi bi-house"></i>
                    Trang chủ
                </a>
                </li>

                <li className="nav-menu">
                <a
                    href="#"
                    className="nav-item"
                >
                    <i className="bi bi-bell"></i>
                    Thông báo
                </a>
                </li>

                <li className="nav-menu">
                <a
                    href="#"
                    className="nav-item"
                    data-bs-toggle="dropdown"
                >
                    <i className="bi bi-people"></i>
                    Hoạt động
                </a>
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
                    <i className="bi bi-clock-fill"></i>
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

                <li className="nav-menu">
                <a
                    href="#"
                    className="nav-item"
                    data-bs-toggle="dropdown"
                >
                    <i className="bi bi-people"></i>
                    Thông tin đơn vị
                </a>
                </li>

            </ul>
            </nav>
        </div>
        </div>
    </header>
    );
}

export default Header;