
import {
    useState,
    useRef,
    useEffect,
    useMemo
} from "react";

import { useNavigate } from "react-router-dom";

import Header from "../components/Header Organizer";
import Footer from "../components/Footer";
import { useAuth } from "../contexts/AuthContext";

import "../styles/organizer-organization-introduction.css";

// Chức vụ theo loại đơn vị
const POSITION_OPTIONS = {
    SCHOOL_UNION: [
        "Bí thư",
        "Phó Bí thư",
        "Ủy viên"
    ],

    CLUB: [
        "Chủ nhiệm",
        "Phó Chủ nhiệm",
        "Ủy viên"
    ]
};

// Tên hiển thị
const ORGANIZATION_TYPE_LABELS = {
    SCHOOL_UNION: "Đoàn trường",
    CLUB: "Câu lạc bộ"
};

// Mã đơn vị trong cơ sở dữ liệu
const ORGANIZATION_CODE_MAP = {
    TVU_UNION: "SCHOOL_UNION",

    LIFE_SKILL_CLUB: "CLUB",
    MEDIA_CLUB: "CLUB",
    ART_CLUB: "CLUB"
};

// Lấy giá trị hợp lệ đầu tiên
function getFirstValue(...values) {
    return values.find(value =>
        value !== undefined &&
        value !== null &&
        value !== ""
    ) ?? "";
}

// Chuẩn hóa loại đơn vị
function normalizeOrganizationType(value, organizationCode) {
    if (value) {
        const normalizedValue = String(value)
            .trim()
            .toUpperCase();

        if (ORGANIZATION_TYPE_LABELS[normalizedValue]) {
            return normalizedValue;
        }
    }

    if (organizationCode) {
        const normalizedCode = String(organizationCode)
            .trim()
            .toUpperCase();

        return ORGANIZATION_CODE_MAP[normalizedCode] || "";
    }

    return "";
}

// Lấy thông tin đơn vị từ tài khoản
function getOrganizationInfo(user) {
    if (!user) return null;

    let organization = user.organization || null;

    if (!organization && Array.isArray(user.organizations)) {
        if (user.organizations.length === 1) {
            organization = user.organizations[0];
        }
    }

    if (!organization && user.profile?.organization) {
        organization = user.profile.organization;
    }

    if (
        !organization &&
        Array.isArray(user.organizations) &&
        user.organizations.length > 1
    ) {
        return null;
    }

    const organizationId = getFirstValue(
        organization?.organizationId,
        organization?.organization_id,
        organization?.id,
        user.organizationId,
        user.organization_id,
        user.profile?.organizationId,
        user.profile?.organization_id
    );

    const organizationCode = getFirstValue(
        organization?.organizationCode,
        organization?.organization_code,
        user.organizationCode,
        user.organization_code
    );

    const organizationName = getFirstValue(
        organization?.organizationName,
        organization?.organization_name,
        organization?.name,
        user.organizationName,
        user.organization_name
    );

    const rawOrganizationType = getFirstValue(
        organization?.organizationType,
        organization?.organization_type,
        organization?.type,
        user.organizationType,
        user.organization_type
    );

    const organizationType = normalizeOrganizationType(
        rawOrganizationType,
        organizationCode
    );

    return {
        organizationId,
        organizationCode,
        organizationName,
        organizationType
    };
}

// Tạo ID nhân sự
function createMemberId() {
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;
}

function OrganizerOrganizationIntroduction() {
    const navigate = useNavigate();

    const {
        user,
        logout,
        isLoading
    } = useAuth();

    const logoInputRef = useRef(null);
    const memberInputRefs = useRef({});
    const objectUrlsRef = useRef(new Set());

    // Thông tin đơn vị từ tài khoản đăng nhập
    const accountOrganization = useMemo(
        () => getOrganizationInfo(user),
        [user]
    );

    // Thông tin đơn vị
    const [organization, setOrganization] = useState({
        organizationId: "",
        organizationName: "",
        organizationCode: "",
        organizationType: "",
        description: "",
        address: "",
        email: "",
        phone: "",
        logo: null
    });

    // Danh sách nhân sự
    const [members, setMembers] = useState([]);

    // Trạng thái giao diện
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmType, setConfirmType] = useState("");
    const [message, setMessage] = useState("");
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // Đồng bộ thông tin đơn vị từ tài khoản
    useEffect(() => {
        if (isLoading) return;

        if (!accountOrganization) {
            setOrganization(prev => ({
                ...prev,
                organizationId: "",
                organizationName: "",
                organizationCode: "",
                organizationType: ""
            }));

            return;
        }

        setOrganization(prev => ({
            ...prev,
            organizationId: accountOrganization.organizationId || "",
            organizationName: accountOrganization.organizationName || "",
            organizationCode: accountOrganization.organizationCode || "",
            organizationType: accountOrganization.organizationType || ""
        }));
    }, [isLoading, accountOrganization]);

    // Thu hồi URL ảnh khi rời trang
    useEffect(() => {
        return () => {
            objectUrlsRef.current.forEach(url => {
                URL.revokeObjectURL(url);
            });

            objectUrlsRef.current.clear();
        };
    }, []);

    const hasOrganization = Boolean(
        accountOrganization?.organizationId ||
        accountOrganization?.organizationName
    );

    const positions =
        POSITION_OPTIONS[organization.organizationType] || [];

    const organizationTypeLabel =
        ORGANIZATION_TYPE_LABELS[organization.organizationType] ||
        "Chưa xác định";

    // Tạo URL xem trước ảnh
    const createImagePreview = file => {
        const preview = URL.createObjectURL(file);
        objectUrlsRef.current.add(preview);

        return preview;
    };

    // Kiểm tra ảnh
    const validateImage = file => {
        if (!file) return false;

        if (!file.type.startsWith("image/")) {
            setMessage("Vui lòng chọn tệp hình ảnh hợp lệ.");
            return false;
        }

        if (file.size > 5 * 1024 * 1024) {
            setMessage("Kích thước ảnh không được vượt quá 5MB.");
            return false;
        }

        return true;
    };

    // Cập nhật thông tin đơn vị
    const handleOrganizationChange = (field, value) => {
        setOrganization(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Tải logo đơn vị
    const handleLogoChange = event => {
        const file = event.target.files?.[0];

        if (!file) return;

        if (!validateImage(file)) {
            event.target.value = "";
            return;
        }

        const preview = createImagePreview(file);

        setOrganization(prev => ({
            ...prev,
            logo: {
                file,
                preview
            }
        }));

        setMessage("");
        event.target.value = "";
    };

    // Thêm nhân sự
    const addMember = () => {
        if (!hasOrganization) {
            setMessage("Tài khoản chưa được gán đơn vị tổ chức.");
            return;
        }

        if (!positions.length) {
            setMessage("Không xác định được loại đơn vị.");
            return;
        }

        const newMember = {
            id: createMemberId(),
            fullName: "",
            position: "",
            phone: "",
            email: "",
            avatar: null
        };

        setMembers(prev => [
            ...prev,
            newMember
        ]);
    };

    // Cập nhật thông tin nhân sự
    const updateMember = (id, field, value) => {
        setMembers(prev =>
            prev.map(member =>
                member.id === id
                    ? {
                        ...member,
                        [field]: value
                    }
                    : member
            )
        );
    };

    // Tải ảnh đại diện nhân sự
    const handleMemberAvatar = (id, event) => {
        const file = event.target.files?.[0];

        if (!file) return;

        if (!validateImage(file)) {
            event.target.value = "";
            return;
        }

        const preview = createImagePreview(file);

        setMembers(prev =>
            prev.map(member =>
                member.id === id
                    ? {
                        ...member,
                        avatar: {
                            file,
                            preview
                        }
                    }
                    : member
            )
        );

        setMessage("");
        event.target.value = "";
    };

    // Xóa nhân sự
    const removeMember = id => {
        setMembers(prev =>
            prev.filter(member => member.id !== id)
        );

        delete memberInputRefs.current[id];
    };

    // Mở hộp thoại xác nhận
    const requestConfirm = type => {
        if (type === "save" && !hasOrganization) {
            setMessage("Không thể lưu vì tài khoản chưa được gán đơn vị.");
            return;
        }

        setConfirmType(type);
        setShowConfirm(true);
    };

    // Xác nhận thao tác
    const handleConfirm = async () => {
        if (confirmType === "save") {
            // Chưa kết nối API lưu dữ liệu
            setMessage(
                "Chức năng lưu dữ liệu chưa được kết nối API. Những thay đổi hiện tại chưa được lưu vào cơ sở dữ liệu."
            );

            setShowConfirm(false);
            return;
        }

        if (confirmType === "logout") {
            try {
                setIsLoggingOut(true);

                await logout();

                navigate("/login", {
                    replace: true
                });
            } catch (error) {
                console.error("Lỗi đăng xuất:", error);

                setMessage("Không thể đăng xuất. Vui lòng thử lại.");
                setIsLoggingOut(false);
                setShowConfirm(false);
            }
        }
    };

    if (isLoading) {
        return (
            <>
                <Header />

                <main className="org-intro-page">
                    <div className="org-intro-container">
                        <div className="org-member-empty">
                            <div className="org-empty-icon">
                                <i className="bi bi-arrow-repeat"></i>
                            </div>

                            <h3>Đang tải thông tin tài khoản</h3>
                            <p>Vui lòng chờ trong giây lát.</p>
                        </div>
                    </div>
                </main>

                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />

            <main className="org-intro-page">
                <div className="org-intro-container">

                    {/* Tiêu đề */}
                    <div className="org-intro-heading">
                        <div>
                            <span className="org-intro-eyebrow">
                                QUẢN LÝ ĐƠN VỊ
                            </span>

                            <h1>Thông tin đơn vị</h1>

                            <p>
                                Quản lý thông tin giới thiệu và danh sách
                                nhân sự của đơn vị.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="org-logout-btn"
                            onClick={() => requestConfirm("logout")}
                        >
                            <i className="bi bi-box-arrow-right"></i>
                            Đăng xuất
                        </button>
                    </div>

                    {/* Thông báo */}
                    {message && (
                        <div
                            className="org-intro-message"
                            role="alert"
                        >
                            <span>{message}</span>

                            <button
                                type="button"
                                onClick={() => setMessage("")}
                                aria-label="Đóng thông báo"
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>
                    )}

                    {!hasOrganization && (
                        <div className="org-intro-warning">
                            <i className="bi bi-exclamation-triangle"></i>

                            <div>
                                <strong>Chưa xác định được đơn vị</strong>

                                <p>
                                    Tài khoản chưa có thông tin đơn vị tổ chức.
                                    Vui lòng kiểm tra API getCurrentUser hoặc
                                    cấu hình tài khoản.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Thông tin chung */}
                    <section className="org-intro-section">
                        <div className="org-section-heading">
                            <div>
                                <h2>Thông tin chung</h2>

                                <p>
                                    Thông tin giới thiệu chính thức của đơn vị.
                                </p>
                            </div>

                            <span className="org-section-icon">
                                <i className="bi bi-building"></i>
                            </span>
                        </div>

                        <div className="org-general-layout">

                            {/* Logo */}
                            <div className="org-logo-area">
                                <div className="org-logo-preview">
                                    {organization.logo?.preview ? (
                                        <img
                                            src={organization.logo.preview}
                                            alt="Logo đơn vị"
                                        />
                                    ) : (
                                        <i className="bi bi-image"></i>
                                    )}
                                </div>

                                <input
                                    ref={logoInputRef}
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    onChange={handleLogoChange}
                                />

                                <button
                                    type="button"
                                    className="org-upload-btn"
                                    onClick={() =>
                                        logoInputRef.current?.click()
                                    }
                                    disabled={!hasOrganization}
                                >
                                    <i className="bi bi-camera"></i>
                                    Tải ảnh lên
                                </button>

                                <span className="org-upload-note">
                                    Logo đơn vị
                                </span>
                            </div>

                            {/* Thông tin đơn vị */}
                            <div className="org-general-fields">
                                <div className="org-form-group">
                                    <label>Tên đơn vị</label>

                                    <input
                                        type="text"
                                        value={organization.organizationName}
                                        readOnly
                                        className="org-readonly-input"
                                        placeholder="Đang lấy thông tin tài khoản..."
                                    />
                                </div>

                                <div className="org-form-group">
                                    <label>Loại đơn vị</label>

                                    <input
                                        type="text"
                                        value={organizationTypeLabel}
                                        readOnly
                                        className="org-readonly-input"
                                    />
                                </div>

                                <div className="org-form-group">
                                    <label>Địa chỉ</label>

                                    <input
                                        type="text"
                                        value={organization.address}
                                        onChange={e =>
                                            handleOrganizationChange(
                                                "address",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Nhập địa chỉ đơn vị"
                                        disabled={!hasOrganization}
                                    />
                                </div>

                                <div className="org-form-row">
                                    <div className="org-form-group">
                                        <label>Email</label>

                                        <input
                                            type="email"
                                            value={organization.email}
                                            onChange={e =>
                                                handleOrganizationChange(
                                                    "email",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Nhập email"
                                            disabled={!hasOrganization}
                                        />
                                    </div>

                                    <div className="org-form-group">
                                        <label>Số điện thoại</label>

                                        <input
                                            type="tel"
                                            value={organization.phone}
                                            onChange={e =>
                                                handleOrganizationChange(
                                                    "phone",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Nhập số điện thoại"
                                            disabled={!hasOrganization}
                                        />
                                    </div>
                                </div>

                                <div className="org-form-group">
                                    <label>Giới thiệu về đơn vị</label>

                                    <textarea
                                        rows="5"
                                        value={organization.description}
                                        onChange={e =>
                                            handleOrganizationChange(
                                                "description",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Nhập nội dung giới thiệu về đơn vị..."
                                        disabled={!hasOrganization}
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Danh sách nhân sự */}
                    <section className="org-intro-section">
                        <div className="org-section-heading">
                            <div>
                                <h2>Nhân sự đơn vị</h2>

                                <p>
                                    Quản lý hình ảnh, chức vụ và thông tin
                                    liên hệ của các thành viên.
                                </p>
                            </div>

                            <span className="org-member-count">
                                {members.length} thành viên
                            </span>
                        </div>

                        <div className="org-member-toolbar">
                            <div className="org-member-description">
                                <i className="bi bi-info-circle"></i>

                                <span>
                                    Thông tin nhân sự sẽ hiển thị trên trang
                                    giới thiệu dành cho sinh viên sau khi
                                    lưu thành công.
                                </span>
                            </div>

                            <button
                                type="button"
                                className="org-add-member-btn"
                                onClick={addMember}
                                disabled={!hasOrganization || !positions.length}
                            >
                                <i className="bi bi-plus-lg"></i>
                                Thêm nhân sự
                            </button>
                        </div>

                        {members.length === 0 ? (
                            <div className="org-member-empty">
                                <div className="org-empty-icon">
                                    <i className="bi bi-people"></i>
                                </div>

                                <h3>Chưa có thông tin nhân sự</h3>

                                <p>
                                    Thêm thành viên để cập nhật danh sách
                                    nhân sự của đơn vị.
                                </p>

                                <button
                                    type="button"
                                    className="org-add-member-btn"
                                    onClick={addMember}
                                    disabled={!hasOrganization || !positions.length}
                                >
                                    <i className="bi bi-plus-lg"></i>
                                    Thêm nhân sự đầu tiên
                                </button>
                            </div>
                        ) : (
                            <div className="org-member-list">
                                {members.map((member, index) => (
                                    <article
                                        className="org-member-card"
                                        key={member.id}
                                    >
                                        <div className="org-member-card-top">
                                            <span className="org-member-number">
                                                THÀNH VIÊN {index + 1}
                                            </span>

                                            <button
                                                type="button"
                                                className="org-remove-member-btn"
                                                onClick={() =>
                                                    removeMember(member.id)
                                                }
                                                title="Xóa nhân sự"
                                                aria-label="Xóa nhân sự"
                                            >
                                                <i className="bi bi-trash3"></i>
                                            </button>
                                        </div>

                                        <div className="org-member-main">

                                            {/* Ảnh đại diện */}
                                            <div className="org-member-avatar-area">
                                                <div className="org-member-avatar">
                                                    {member.avatar?.preview ? (
                                                        <img
                                                            src={member.avatar.preview}
                                                            alt={`Ảnh ${member.fullName || "nhân sự"}`}
                                                        />
                                                    ) : (
                                                        <i className="bi bi-person"></i>
                                                    )}
                                                </div>

                                                <input
                                                    ref={element => {
                                                        memberInputRefs.current[
                                                            member.id
                                                        ] = element;
                                                    }}
                                                    type="file"
                                                    accept="image/*"
                                                    hidden
                                                    onChange={e =>
                                                        handleMemberAvatar(
                                                            member.id,
                                                            e
                                                        )
                                                    }
                                                />

                                                <button
                                                    type="button"
                                                    className="org-avatar-upload"
                                                    onClick={() =>
                                                        memberInputRefs.current[
                                                            member.id
                                                        ]?.click()
                                                    }
                                                >
                                                    <i className="bi bi-camera"></i>
                                                    Đổi ảnh
                                                </button>
                                            </div>

                                            {/* Thông tin nhân sự */}
                                            <div className="org-member-fields">
                                                <div className="org-form-group">
                                                    <label>Họ và tên</label>

                                                    <input
                                                        type="text"
                                                        value={member.fullName}
                                                        onChange={e =>
                                                            updateMember(
                                                                member.id,
                                                                "fullName",
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="Nhập họ và tên"
                                                    />
                                                </div>

                                                <div className="org-form-group">
                                                    <label>Chức vụ</label>

                                                    <select
                                                        value={member.position}
                                                        onChange={e =>
                                                            updateMember(
                                                                member.id,
                                                                "position",
                                                                e.target.value
                                                            )
                                                        }
                                                    >
                                                        <option value="">
                                                            Chọn chức vụ
                                                        </option>

                                                        {positions.map(position => (
                                                            <option
                                                                key={position}
                                                                value={position}
                                                            >
                                                                {position}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="org-form-row">
                                                    <div className="org-form-group">
                                                        <label>Số điện thoại</label>

                                                        <input
                                                            type="tel"
                                                            value={member.phone}
                                                            onChange={e =>
                                                                updateMember(
                                                                    member.id,
                                                                    "phone",
                                                                    e.target.value
                                                                )
                                                            }
                                                            placeholder="Nhập số điện thoại"
                                                        />
                                                    </div>

                                                    <div className="org-form-group">
                                                        <label>Email</label>

                                                        <input
                                                            type="email"
                                                            value={member.email}
                                                            onChange={e =>
                                                                updateMember(
                                                                    member.id,
                                                                    "email",
                                                                    e.target.value
                                                                )
                                                            }
                                                            placeholder="Nhập email"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Nút thao tác */}
                    <div className="org-intro-actions">
                        <button
                            type="button"
                            className="org-cancel-btn"
                            onClick={() => navigate(-1)}
                        >
                            Quay lại
                        </button>

                        <button
                            type="button"
                            className="org-save-btn"
                            onClick={() => requestConfirm("save")}
                            disabled={!hasOrganization}
                        >
                            <i className="bi bi-check2-circle"></i>
                            Lưu thay đổi
                        </button>
                    </div>
                </div>
            </main>

            <Footer />

            {/* Hộp thoại xác nhận */}
            {showConfirm && (
                <div
                    className="org-confirm-overlay"
                    onClick={() => {
                        if (!isLoggingOut) {
                            setShowConfirm(false);
                        }
                    }}
                >
                    <div
                        className="org-confirm-dialog"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="org-confirm-title"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="org-confirm-icon">
                            <i
                                className={
                                    confirmType === "logout"
                                        ? "bi bi-box-arrow-right"
                                        : "bi bi-question-circle"
                                }
                            ></i>
                        </div>

                        <h3 id="org-confirm-title">
                            {confirmType === "logout"
                                ? "Xác nhận đăng xuất"
                                : "Xác nhận thay đổi"}
                        </h3>

                        <p>
                            {confirmType === "logout"
                                ? "Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?"
                                : "Bạn có chắc chắn muốn lưu những thay đổi thông tin đơn vị và nhân sự?"}
                        </p>

                        <div className="org-confirm-actions">
                            <button
                                type="button"
                                className="org-confirm-cancel"
                                onClick={() => setShowConfirm(false)}
                                disabled={isLoggingOut}
                            >
                                Hủy
                            </button>

                            <button
                                type="button"
                                className="org-confirm-accept"
                                onClick={handleConfirm}
                                disabled={isLoggingOut}
                            >
                                {isLoggingOut
                                    ? "Đang xử lý..."
                                    : "Xác nhận"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default OrganizerOrganizationIntroduction;
