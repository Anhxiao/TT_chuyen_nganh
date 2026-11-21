
import { useState } from "react";
import Header from "../components/Header Student";
import Footer from "../components/Footer";
import "../styles/styles-activities-student.css";

const STORAGE_KEY = "clubMembershipRequests";

function ActivitiesStudent() {
    const [selectedOrganization, setSelectedOrganization] = useState(null);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [pendingOrganization, setPendingOrganization] = useState(null);

    // Lấy danh sách yêu cầu đăng ký đã lưu trên trình duyệt
    const [membershipRequests, setMembershipRequests] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
        } catch {
            return {};
        }
    });

    // Thông tin đăng ký thành viên CLB
    const [formData, setFormData] = useState({
        studentCode: "",
        className: "",
        school: ""
    });

    const [formError, setFormError] = useState("");

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

    // Kiểm tra một đơn vị có phải CLB hay không
    const isClub = (organization) =>
        organization?.type === "Câu lạc bộ";

    // Xử lý khi sinh viên chọn đơn vị
    const handleSelectOrganization = (organization) => {
        setFormError("");

        // Đơn vị Đoàn trường: hiển thị hoạt động trực tiếp
        if (!isClub(organization)) {
            setSelectedOrganization(organization);
            return;
        }

        // CLB đã gửi yêu cầu đăng ký trước đó
        if (membershipRequests[organization.id]) {
            setSelectedOrganization(organization);
            return;
        }

        // CLB chưa đăng ký: mở hộp thoại đăng ký thành viên
        setPendingOrganization(organization);
        setShowRegisterModal(true);
    };

    // Thay đổi dữ liệu biểu mẫu
    const handleInputChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));

        setFormError("");
    };

    // Gửi yêu cầu đăng ký thành viên
    const handleSubmitRegistration = (event) => {
        event.preventDefault();

        if (!pendingOrganization) return;

        const studentCode = formData.studentCode.trim();
        const className = formData.className.trim();
        const school = formData.school.trim();

        if (!studentCode || !className || !school) {
            setFormError("Vui lòng nhập đầy đủ thông tin đăng ký.");
            return;
        }

        const newRequest = {
            organizationId: pendingOrganization.id,
            organizationName: pendingOrganization.name,
            studentCode,
            className,
            school,
            status: "PENDING",
            registeredAt: new Date().toISOString()
        };

        const updatedRequests = {
            ...membershipRequests,
            [pendingOrganization.id]: newRequest
        };

        // Lưu tạm trên trình duyệt, chưa gửi lên Backend
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(updatedRequests)
        );

        setMembershipRequests(updatedRequests);
        setSelectedOrganization(pendingOrganization);

        setShowRegisterModal(false);
        setPendingOrganization(null);
        setFormData({
            studentCode: "",
            className: "",
            school: ""
        });
        setFormError("");
    };

    // Đóng hộp thoại
    const handleCloseModal = () => {
        setShowRegisterModal(false);
        setPendingOrganization(null);
        setFormError("");
    };

    const currentRequest = selectedOrganization
        ? membershipRequests[selectedOrganization.id]
        : null;

    return (
        <div className="student-activities-layout">
            <Header role="STUDENT" />

            <main className="student-activities-page">
                <div className="container py-4">
                    <div className="row g-4">

                        {/* DANH SÁCH ĐƠN VỊ */}
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
                                    {organizations.map((organization) => {
                                        const isRegistered =
                                            !!membershipRequests[organization.id];

                                        return (
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

                                                        {isClub(organization) && isRegistered && (
                                                            <span className="club-request-label">
                                                                <i className="bi bi-clock-history me-1"></i>
                                                                Đã gửi yêu cầu
                                                            </span>
                                                        )}
                                                    </span>

                                                    <i className="bi bi-chevron-right organization-chevron"></i>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>

                            </div>
                        </div>

                        {/* KHU VỰC HIỂN THỊ HOẠT ĐỘNG */}
                        <div className="col-lg-8 col-xl-9">
                            <div className="organization-activities-box">

                                {selectedOrganization ? (
                                    <>
                                        <div className="selected-organization-header">
                                            <div className="selected-organization-icon">
                                                <i className={`bi ${selectedOrganization.icon}`}></i>
                                            </div>

                                            <div>
                                                <span>ĐƠN VỊ TỔ CHỨC</span>
                                                <h4>{selectedOrganization.name}</h4>
                                                <p>{selectedOrganization.type}</p>
                                            </div>
                                        </div>

                                        {/* Trạng thái đăng ký thành viên CLB */}
                                        {isClub(selectedOrganization) && currentRequest ? (
                                            <div className="club-pending-notice">
                                                <div className="club-pending-icon">
                                                    <i className="bi bi-hourglass-split"></i>
                                                </div>

                                                <div>
                                                    <h5>Yêu cầu đăng ký thành viên đã được gửi</h5>
                                                    <p>
                                                        Thông tin đăng ký của bạn đã được lưu.
                                                        Vui lòng chờ đơn vị tổ chức xét duyệt.
                                                        Sau khi được xác nhận là thành viên,
                                                        bạn mới có thể đăng ký các hoạt động
                                                        của câu lạc bộ.
                                                    </p>

                                                    <span className="club-pending-status">
                                                        <i className="bi bi-clock me-1"></i>
                                                        Đang chờ xét duyệt
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
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
                                        )}
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

            <Footer />

            {/* HỘP THOẠI ĐĂNG KÝ THÀNH VIÊN CLB */}
            {showRegisterModal && pendingOrganization && (
                <div className="club-modal-overlay">
                    <div
                        className="club-register-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="clubRegisterTitle"
                    >
                        <div className="club-modal-header">
                            <div className="club-modal-icon">
                                <i className="bi bi-people-fill"></i>
                            </div>

                            <button
                                type="button"
                                className="club-modal-close"
                                onClick={handleCloseModal}
                                aria-label="Đóng"
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>

                            <h4 id="clubRegisterTitle">
                                Đăng ký thành viên
                            </h4>

                            <p>
                                {pendingOrganization.name}
                            </p>
                        </div>

                        <form onSubmit={handleSubmitRegistration}>
                            <div className="club-modal-body">

                                <div className="club-register-intro">
                                    <i className="bi bi-info-circle-fill"></i>
                                    <span>
                                        Vui lòng cung cấp thông tin sinh viên
                                        để gửi yêu cầu tham gia câu lạc bộ.
                                    </span>
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="studentCode">
                                        Mã số sinh viên
                                        <span className="required-mark"> *</span>
                                    </label>

                                    <input
                                        type="text"
                                        id="studentCode"
                                        name="studentCode"
                                        className="form-control"
                                        placeholder="Nhập mã số sinh viên"
                                        value={formData.studentCode}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="className">
                                        Lớp đang theo học
                                        <span className="required-mark"> *</span>
                                    </label>

                                    <input
                                        type="text"
                                        id="className"
                                        name="className"
                                        className="form-control"
                                        placeholder="Ví dụ: DA23TTA"
                                        value={formData.className}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="school">
                                        Trường đang theo học
                                        <span className="required-mark"> *</span>
                                    </label>

                                    <select
                                        id="school"
                                        name="school"
                                        className="form-select"
                                        value={formData.school}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">
                                            -- Chọn trường đang theo học --
                                        </option>
                                        <option value="Trường Kỹ thuật và Công nghệ">
                                            Trường Kỹ thuật và Công nghệ
                                        </option>
                                        <option value="Trường Kinh tế và Luật">
                                            Trường Kinh tế và Luật
                                        </option>
                                        <option value="Trường Y Dược">
                                            Trường Y Dược
                                        </option>
                                    </select>
                                </div>

                                {formError && (
                                    <div className="club-form-error">
                                        <i className="bi bi-exclamation-circle me-2"></i>
                                        {formError}
                                    </div>
                                )}

                                <p className="club-register-note">
                                    <i className="bi bi-shield-check me-1"></i>
                                    Yêu cầu đăng ký sẽ được đơn vị tổ chức
                                    xem xét và xác nhận.
                                </p>
                            </div>

                            <div className="club-modal-footer">
                                <button
                                    type="button"
                                    className="btn-club-cancel"
                                    onClick={handleCloseModal}
                                >
                                    Để sau
                                </button>

                                <button
                                    type="submit"
                                    className="btn-club-submit"
                                >
                                    <i className="bi bi-send me-2"></i>
                                    Gửi đăng ký
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ActivitiesStudent;
