
import { useMemo, useState } from "react";
import Header from '../components/Header Student';
import Footer from "../components/Footer.jsx";
import "../styles/styles-student-history.css";

function StudentEvidence() {
    // Danh sách minh chứng lấy từ API sau này
    const [evidences] = useState([]);

    const [keyword, setKeyword] = useState("");
    const [filter, setFilter] = useState("ALL");

    // Lọc danh sách minh chứng
    const filteredEvidences = useMemo(() => {
        return evidences.filter((evidence) => {
            const matchesFilter =
                filter === "ALL" ||
                evidence.fileType?.toLowerCase() === filter.toLowerCase();

            const matchesKeyword = [
                evidence.activityName,
                evidence.fileName,
                evidence.organizationName
            ]
                .join(" ")
                .toLowerCase()
                .includes(keyword.trim().toLowerCase());

            return matchesFilter && matchesKeyword;
        });
    }, [evidences, keyword, filter]);

    // Xác định biểu tượng tệp
    const getFileIcon = (fileType) => {
        switch (fileType?.toLowerCase()) {
            case "pdf":
                return "bi-file-earmark-pdf";

            case "jpg":
            case "jpeg":
            case "png":
                return "bi-file-earmark-image";

            case "doc":
            case "docx":
                return "bi-file-earmark-word";

            default:
                return "bi-file-earmark";
        }
    };

    // Định dạng ngày cấp minh chứng
    const formatDate = (date) => {
        if (!date) return "Chưa cập nhật";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return date;
        }

        return parsedDate.toLocaleDateString("vi-VN");
    };

    return (
        <>
            <Header />

            <main className="student-history-page">
                <div className="container">

                    {/* Breadcrumb */}
                    <div className="history-breadcrumb">
                        <span>Trang chủ</span>
                        <i className="bi bi-chevron-right"></i>
                        <span>Lịch sử</span>
                        <i className="bi bi-chevron-right"></i>
                        <strong>Minh chứng</strong>
                    </div>

                    {/* Tiêu đề */}
                    <section className="history-heading">
                        <div>
                            <span className="history-label">
                                QUẢN LÝ MINH CHỨNG CÁ NHÂN
                            </span>

                            <h1>Minh chứng hoạt động</h1>

                            <p>
                                Xem và tải xuống minh chứng được hệ thống cấp tự động
                                sau khi bạn hoàn thành hoạt động và được đơn vị tổ chức
                                xác nhận tham gia.
                            </p>
                        </div>

                        <div className="history-heading-icon">
                            <i className="bi bi-folder-check"></i>
                        </div>
                    </section>

                    {/* Thống kê */}
                    <section className="history-statistics">

                        <div className="history-stat-card">
                            <div className="history-stat-icon blue">
                                <i className="bi bi-folder"></i>
                            </div>

                            <div>
                                <span>Tổng minh chứng</span>
                                <strong>{evidences.length}</strong>
                            </div>
                        </div>

                        <div className="history-stat-card">
                            <div className="history-stat-icon green">
                                <i className="bi bi-patch-check"></i>
                            </div>

                            <div>
                                <span>Hoạt động được cấp minh chứng</span>
                                <strong>{evidences.length}</strong>
                            </div>
                        </div>

                        <div className="history-stat-card">
                            <div className="history-stat-icon orange">
                                <i className="bi bi-download"></i>
                            </div>

                            <div>
                                <span>Có thể tải xuống</span>
                                <strong>
                                    {evidences.filter(
                                        item => Boolean(item.fileUrl)
                                    ).length}
                                </strong>
                            </div>
                        </div>

                    </section>

                    {/* Danh sách minh chứng */}
                    <section className="history-content">

                        <div className="history-section-heading">
                            <div>
                                <h2>Danh sách minh chứng</h2>
                                <p>
                                    Minh chứng được cấp sau khi hoàn thành hoạt động
                                </p>
                            </div>
                        </div>

                        {/* Tìm kiếm và lọc */}
                        <div className="history-toolbar">

                            <div className="history-search">
                                <i className="bi bi-search"></i>

                                <input
                                    type="text"
                                    placeholder="Tìm tên hoạt động hoặc tên tệp..."
                                    value={keyword}
                                    onChange={(e) =>
                                        setKeyword(e.target.value)
                                    }
                                />
                            </div>

                            <select
                                value={filter}
                                onChange={(e) =>
                                    setFilter(e.target.value)
                                }
                            >
                                <option value="ALL">Tất cả loại tệp</option>
                                <option value="pdf">PDF</option>
                                <option value="jpg">JPG</option>
                                <option value="jpeg">JPEG</option>
                                <option value="png">PNG</option>
                                <option value="doc">DOC</option>
                                <option value="docx">DOCX</option>
                            </select>

                        </div>

                        {/* Danh sách */}
                        {filteredEvidences.length > 0 ? (
                            <div className="evidence-list">

                                {filteredEvidences.map((evidence) => (
                                    <article
                                        className="evidence-card"
                                        key={evidence.evidenceId}
                                    >

                                        {/* Biểu tượng tệp */}
                                        <div className="evidence-file-icon">
                                            <i
                                                className={`bi ${getFileIcon(
                                                    evidence.fileType
                                                )}`}
                                            ></i>
                                        </div>

                                        {/* Thông tin minh chứng */}
                                        <div className="evidence-info">

                                            <h3>
                                                {evidence.fileName ||
                                                    "Minh chứng hoạt động"}
                                            </h3>

                                            <p className="evidence-activity">
                                                <i className="bi bi-people"></i>
                                                {evidence.activityName ||
                                                    "Chưa cập nhật hoạt động"}
                                            </p>

                                            <div className="evidence-meta">

                                                <span>
                                                    <i className="bi bi-building"></i>
                                                    {evidence.organizationName ||
                                                        "Chưa cập nhật đơn vị"}
                                                </span>

                                                <span>
                                                    <i className="bi bi-calendar3"></i>
                                                    Ngày cấp: {formatDate(
                                                        evidence.createdAt
                                                    )}
                                                </span>

                                                <span>
                                                    <i className="bi bi-file-earmark"></i>
                                                    {evidence.fileType?.toUpperCase() ||
                                                        "Tệp minh chứng"}
                                                </span>

                                                <span>
                                                    <i className="bi bi-hdd"></i>
                                                    {evidence.fileSize ||
                                                        "Chưa cập nhật dung lượng"}
                                                </span>

                                            </div>

                                            <span className="history-status approved">
                                                <i className="bi bi-check-circle-fill me-1"></i>
                                                Đã cấp minh chứng
                                            </span>

                                        </div>

                                        {/* Tải minh chứng */}
                                        <div className="evidence-actions">

                                            {evidence.fileUrl ? (
                                                <a
                                                    href={evidence.fileUrl}
                                                    className="evidence-download-btn"
                                                    download={evidence.fileName}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <i className="bi bi-download"></i>
                                                    Tải minh chứng
                                                </a>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="evidence-download-btn disabled"
                                                    disabled
                                                    title="Tệp minh chứng chưa được cập nhật"
                                                >
                                                    <i className="bi bi-download"></i>
                                                    Chưa có tệp
                                                </button>
                                            )}

                                        </div>

                                    </article>
                                ))}

                            </div>
                        ) : (
                            <div className="history-empty">

                                <div className="history-empty-icon">
                                    <i className="bi bi-folder2-open"></i>
                                </div>

                                <h3>
                                    {keyword || filter !== "ALL"
                                        ? "Không tìm thấy minh chứng"
                                        : "Bạn chưa được cấp minh chứng"}
                                </h3>

                                <p>
                                    Sau khi hoàn thành hoạt động và được đơn vị tổ chức
                                    xác nhận tham gia, hệ thống sẽ tự động cấp minh chứng.
                                    Bạn có thể xem và tải minh chứng tại đây.
                                </p>

                            </div>
                        )}

                    </section>

                    {/* Hướng dẫn */}
                    <section className="evidence-note">

                        <div className="evidence-note-icon">
                            <i className="bi bi-info-circle-fill"></i>
                        </div>

                        <div>
                            <h3>Thông tin về minh chứng</h3>

                            <p>
                                Minh chứng được hệ thống tự động cấp sau khi đơn vị tổ chức
                                xác nhận sinh viên đã tham gia hoạt động. Sinh viên không
                                cần gửi tệp minh chứng hoặc chờ xác nhận minh chứng riêng.
                                Sau khi được cấp, bạn có thể tải tệp về máy để lưu trữ
                                và sử dụng khi cần thiết.
                            </p>
                        </div>

                    </section>

                </div>
            </main>

            <Footer />
        </>
    );
}

export default StudentEvidence;
// Sinh viên đăng ký hoạt động

// Hệ thống lưu thông tin đăng ký và trạng thái tham gia.



// Sinh viên tham gia hoạt động

// Đơn vị tổ chức kiểm tra và xác nhận kết quả tham gia.



// Đơn vị tổ chức xác nhận hoàn thành

// Cập nhật trạng thái tham gia ATTENDED và điểm phục vụ cộng đồng theo quy định.



// Tự động
//  Hệ thống cấp minh chứng

// Tạo minh chứng gắn với sinh viên và hoạt động đã hoàn thành.



// Sinh viên xem và tải minh chứng

// Minh chứng xuất hiện ngay trong trang Lịch sử → Minh chứng.