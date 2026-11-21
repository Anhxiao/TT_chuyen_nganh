
import Header from '../components/Header Student';
import Footer from "./Footer.jsx";
import "../styles/styles-organization-introduction-student.css";

function OrganizationIntroductionStudent({ organization }) {
    return (
        <>
            <Header />

            <main className="org-intro-page">
                <div className="container">

                    {/* Breadcrumb */}
                    <div className="org-breadcrumb">
                        <span>Trang chủ</span>
                        <i className="bi bi-chevron-right"></i>
                        <span>Giới thiệu</span>
                        <i className="bi bi-chevron-right"></i>
                        <strong>{organization.name}</strong>
                    </div>

                    {/* Giới thiệu đơn vị */}
                    <section className="org-hero">
                        <div className="org-hero-icon">
                            <i className="bi bi-mortarboard-fill"></i>
                        </div>

                        <div className="org-hero-content">
                            <span className="org-label">
                                GIỚI THIỆU ĐƠN VỊ
                            </span>

                            <h1>{organization.name}</h1>

                            <p>
                                {organization.description ||
                                    "Thông tin giới thiệu về đơn vị đang được cập nhật."}
                            </p>
                        </div>
                    </section>

                    {/* Thông tin đơn vị */}
                    <section className="org-info-section">
                        <div className="org-section-heading">
                            <div>
                                <h2>Thông tin đơn vị</h2>
                                <p>
                                    Thông tin liên hệ và hoạt động của đơn vị
                                </p>
                            </div>

                            <i className="bi bi-building"></i>
                        </div>

                        <div className="org-info-grid">

                            <div className="org-info-item">
                                <div className="org-info-icon">
                                    <i className="bi bi-geo-alt-fill"></i>
                                </div>
                                <div>
                                    <span>Địa chỉ</span>
                                    <strong>
                                        {organization.address || "Chưa cập nhật"}
                                    </strong>
                                </div>
                            </div>

                            <div className="org-info-item">
                                <div className="org-info-icon">
                                    <i className="bi bi-envelope-fill"></i>
                                </div>
                                <div>
                                    <span>Email</span>
                                    <strong>
                                        {organization.email || "Chưa cập nhật"}
                                    </strong>
                                </div>
                            </div>

                            <div className="org-info-item">
                                <div className="org-info-icon">
                                    <i className="bi bi-telephone-fill"></i>
                                </div>
                                <div>
                                    <span>Số điện thoại</span>
                                    <strong>
                                        {organization.phone || "Chưa cập nhật"}
                                    </strong>
                                </div>
                            </div>

                            <div className="org-info-item">
                                <div className="org-info-icon">
                                    <i className="bi bi-people-fill"></i>
                                </div>
                                <div>
                                    <span>Số lượng Ban Chấp hành</span>
                                    <strong>
                                        {organization.members?.length || 0} thành viên
                                    </strong>
                                </div>
                            </div>

                        </div>
                    </section>

                    {/* Ban Chấp hành */}
                    <section className="org-members-section">
                        <div className="org-section-heading">
                            <div>
                                <h2>Ban Chấp hành</h2>
                                <p>
                                    Danh sách thành viên Ban Chấp hành Đoàn trường
                                </p>
                            </div>

                            <span className="org-member-count">
                                <i className="bi bi-people-fill"></i>
                                {organization.members?.length || 0} thành viên
                            </span>
                        </div>

                        <div className="org-members-grid">
                            {organization.members?.map((member, index) => (
                                <div className="org-member-card" key={index}>

                                    <div className="org-member-avatar">
                                        {member.avatarUrl ? (
                                            <img
                                                src={member.avatarUrl}
                                                alt={member.name || "Thành viên"}
                                            />
                                        ) : (
                                            <i className="bi bi-person-fill"></i>
                                        )}
                                    </div>

                                    <span className="org-member-position">
                                        {member.position}
                                    </span>

                                    <h3>
                                        {member.name || "Chưa cập nhật"}
                                    </h3>

                                    <div className="org-member-phone">
                                        <i className="bi bi-telephone-fill"></i>
                                        {member.phone || "Chưa cập nhật"}
                                    </div>

                                </div>
                            ))}
                        </div>
                    </section>

                </div>
            </main>

            <Footer />
        </>
    );
}

export default OrganizationIntroductionStudent;
