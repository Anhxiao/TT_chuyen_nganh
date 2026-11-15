import '../styles/components/footer.css';

function Footer() {
    return (
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
    );
}

export default Footer;