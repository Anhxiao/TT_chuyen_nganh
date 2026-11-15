
import { useState } from "react";
import Header from "../components/Header Student Activities";
import Footer from "../components/Footer";
import "../styles/styles-activities-student.css";

function ActivitiesStudent() {
    const [selectedOrganization, setSelectedOrganization] = useState(null);

    // Danh sách đơn vị tổ chức
    const organizations = [
        {
            id: "TECH_UNION",
            name: "Đoàn Trường Kỹ thuật và Công nghệ",
            type: "Đoàn Trường",
            icon: "bi-laptop"
        },
        {
            id: "LAW_UNION",
            name: "Đoàn Trường Kinh tế và Luật",
            type: "Đoàn Trường",
            icon: "bi-bank"
        },
        {
            id: "MED_UNION",
            name: "Đoàn Trường Y Dược",
            type: "Đoàn Trường",
            icon: "bi-heart-pulse"
        },
        {
            id: "LIFE_SKILL_CLUB",
            name: "Câu lạc bộ Kỹ năng sống",
            type: "Câu lạc bộ",
            icon: "bi-lightbulb"
        },
        {
            id: "MEDIA_CLUB",
            name: "Câu lạc bộ Truyền thông",
            type: "Câu lạc bộ",
            icon: "bi-camera"
        },
        {
            id: "ART_CLUB",
            name: "Câu lạc bộ Văn hóa nghệ thuật",
            type: "Câu lạc bộ",
            icon: "bi-palette"
        }
    ];

    const handleSelectOrganization = (organization) => {
        setSelectedOrganization(organization);
    };

    return (
        <div className="student-activities-layout">

            {/* Header dành cho sinh viên */}
            <Header role="STUDENT" />

            {/* Nội dung trang hoạt động */}
            <main className="student-activities-page">
                <div className="container py-4">
                    <div className="row g-4">

                        {/* Danh sách trường và đơn vị */}
                        <div className="col-lg-4 col-xl-3">
                            <div className="organization-box">

                                <div className="organization-box-header">
                                    <h5>
                                        <i className="bi bi-buildings me-2"></i>
                                        Trường và đơn vị tổ chức
                                    </h5>

                                    <p>
                                        Lựa chọn đơn vị để xem hoạt động
                                    </p>
                                </div>

                                <ul className="organization-menu">
                                    {organizations.map((organization) => (
                                        <li key={organization.id}>
                                            <button
                                                type="button"
                                                className={`organization-menu-item ${
                                                    selectedOrganization?.id === organization.id
                                                        ? "active"
                                                        : ""
                                                }`}
                                                onClick={() =>
                                                    handleSelectOrganization(organization)
                                                }
                                            >
                                                <span className="organization-menu-icon">
                                                    <i className={`bi ${organization.icon}`}></i>
                                                </span>

                                                <span className="organization-menu-content">
                                                    <strong>{organization.type}</strong>
                                                    <small>{organization.name}</small>
                                                </span>

                                                <i className="bi bi-chevron-right organization-chevron"></i>
                                            </button>
                                        </li>
                                    ))}
                                </ul>

                            </div>
                        </div>

                        {/* Khu vực hiển thị hoạt động */}
                        <div className="col-lg-8 col-xl-9">
                            <div className="organization-activities-box">

                                {selectedOrganization ? (
                                    <>
                                        <div className="selected-organization-header">
                                            <div className="selected-organization-icon">
                                                <i className="bi bi-building"></i>
                                            </div>

                                            <div>
                                                <span>ĐƠN VỊ TỔ CHỨC</span>
                                                <h4>{selectedOrganization.name}</h4>
                                                <p>{selectedOrganization.type}</p>
                                            </div>
                                        </div>

                                        <div className="organization-activities-title">
                                            <div>
                                                <h5>Danh sách hoạt động</h5>
                                                <p>
                                                    Các hoạt động được đăng tải bởi đơn vị này
                                                </p>
                                            </div>

                                            <span className="activity-total">
                                                0 hoạt động
                                            </span>
                                        </div>

                                        <div className="activity-empty-state">
                                            <div className="activity-empty-icon">
                                                <i className="bi bi-calendar2-event"></i>
                                            </div>

                                            <h5>Chưa có hoạt động được đăng tải</h5>

                                            <p>
                                                Hoạt động của đơn vị sẽ được hiển thị
                                                tại khu vực này khi có dữ liệu.
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="organization-welcome">
                                        <div className="organization-welcome-icon">
                                            <i className="bi bi-buildings"></i>
                                        </div>

                                        <h4>Khám phá hoạt động sinh viên</h4>

                                        <p>
                                            Vui lòng chọn một trường hoặc đơn vị tổ chức
                                            ở danh sách bên trái để xem các hoạt động.
                                        </p>
                                    </div>
                                )}

                            </div>
                        </div>

                    </div>
                </div>
            </main>

            {/* Footer */}
            <Footer />

        </div>
    );
}

export default ActivitiesStudent;
