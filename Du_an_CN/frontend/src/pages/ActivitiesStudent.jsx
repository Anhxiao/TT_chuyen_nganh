import {
    getActivitiesByOrganization
} from "../services/activitystudent";

import {
    useState,
    useEffect,
    useCallback,
    useMemo,
    useRef
} from "react";

import { useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header Student";
import Footer from "../components/Footer";
import { useAuth } from "../contexts/AuthContext";
import clubService from "../services/clubService";
import "../styles/styles-activities-student.css";

// =====================================
// XÁC ĐỊNH ĐOÀN TRƯỜNG CỦA SINH VIÊN
// =====================================

const getStudentOrganizationId = (user) => {
    if (!user) return null;

    const validOrganizationIds = [
        "TECH_UNION",
        "LAW_UNION",
        "MED_UNION"
    ];

    const organizationId =
        user.organizationId ||
        user.organization_id ||
        user.student?.organizationId ||
        user.student?.organization_id;

    if (validOrganizationIds.includes(organizationId)) {
        return organizationId;
    }

    const faculty =
        user.faculty ||
        user.facultyName ||
        user.faculty_name ||
        user.student?.faculty ||
        user.student?.facultyName ||
        user.student?.faculty_name ||
        user.studentInfo?.faculty ||
        user.studentInfo?.facultyName ||
        user.student_info?.faculty ||
        user.student_info?.faculty_name ||
        "";

    const facultyName =
        typeof faculty === "object"
            ? (
                faculty.name ||
                faculty.facultyName ||
                faculty.faculty_name ||
                faculty.code ||
                ""
            )
            : faculty;

    const normalizedFaculty = String(facultyName)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

    const facultyOrganizations = {
        "trường kỹ thuật và công nghệ": "TECH_UNION",
        "kỹ thuật và công nghệ": "TECH_UNION",
        "tech_union": "TECH_UNION",

        "trường kinh tế và luật": "LAW_UNION",
        "kinh tế và luật": "LAW_UNION",
        "law_union": "LAW_UNION",

        "trường y dược": "MED_UNION",
        "y dược": "MED_UNION",
        "med_union": "MED_UNION"
    };

    return facultyOrganizations[normalizedFaculty] || null;
};

// =====================================
// THÔNG TIN CÁC ĐƠN VỊ
// =====================================

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
        name: "Câu lạc bộ Truyền thông TVU",
        type: "Câu lạc bộ",
        icon: "bi-camera"
    },
    {
        id: "ART_CLUB",
        name: "Câu lạc bộ Văn hóa Nghệ thuật TVU",
        type: "Câu lạc bộ",
        icon: "bi-palette"
    }
];

const isClub = (organization) =>
    organization?.type === "Câu lạc bộ";

const emptyForm = {
    reason: "",
    introduction: "",
    skills: ""
};

// =====================================
// CHUẨN HÓA DỮ LIỆU CÂU LẠC BỘ
// =====================================

const normalizeCode = (value) =>
    String(value || "")
        .trim()
        .toUpperCase();

const getOrganizationCode = (club) =>
    normalizeCode(
        club?.organization_code ||
        club?.organizationCode ||
        club?.organization?.organization_code ||
        club?.organization?.organizationCode ||
        club?.code
    );

const getRequestStatus = (club) =>
    normalizeCode(
        club?.request_status ||
        club?.requestStatus ||
        club?.application_status ||
        club?.applicationStatus
    );

const getMembershipStatus = (club) =>
    normalizeCode(
        club?.membership_status ||
        club?.membershipStatus ||
        club?.member_status ||
        club?.memberStatus
    );

const getRequestId = (club) =>
    club?.request_id ??
    club?.requestId ??
    club?.membership_request_id ??
    club?.membershipRequestId ??
    null;

const getClubId = (club) =>
    club?.club_id ??
    club?.clubId ??
    club?.id ??
    null;

// =====================================
// CHUẨN HÓA KẾT QUẢ API
// =====================================

const extractClubList = (response) => {
    if (Array.isArray(response)) {
        return response;
    }

    if (Array.isArray(response?.data)) {
        return response.data;
    }

    if (Array.isArray(response?.data?.data)) {
        return response.data.data;
    }

    if (Array.isArray(response?.clubs)) {
        return response.clubs;
    }

    if (Array.isArray(response?.data?.clubs)) {
        return response.data.clubs;
    }

    return [];
};

const extractResponseData = (response) =>
    response?.data?.data ??
    response?.data ??
    response;

// =====================================
// COMPONENT
// =====================================

function ActivitiesStudent() {
    const { user } = useAuth();

    const navigate = useNavigate();
    const location = useLocation();

    const studentOrganizationId =
        getStudentOrganizationId(user);

    const [selectedOrganization, setSelectedOrganization] =
        useState(null);
    // =====================================
    // KHÔI PHỤC ĐƠN VỊ KHI QUAY LẠI TỪ CHI TIẾT
    // =====================================

    useEffect(() => {
        const organizationCode =
            location.state?.organizationCode;

        if (!organizationCode) {
            return;
        }

        const organization = organizations.find(
            (item) => item.id === organizationCode
        );

        if (!organization) {
            return;
        }

        // Đoàn Trường chỉ được khôi phục nếu thuộc trường sinh viên.
        if (
            !isClub(organization) &&
            organization.id !== studentOrganizationId
        ) {
            return;
        }

        setSelectedOrganization(organization);
    }, [
        location.state?.organizationCode,
        studentOrganizationId
    ]);
    const [showRegisterModal, setShowRegisterModal] =
        useState(false);

    const [pendingOrganization, setPendingOrganization] =
        useState(null);

    const [clubs, setClubs] = useState([]);

    const [isLoadingClubs, setIsLoadingClubs] =
        useState(true);

    const [isSubmitting, setIsSubmitting] =
        useState(false);

    const [loadError, setLoadError] = useState("");

    const [formData, setFormData] = useState(emptyForm);

    const [formError, setFormError] = useState("");

    // =====================================
    // THÔNG BÁO ĐƯỢC DUYỆT THÀNH VIÊN
    // =====================================

    const [showMemberNotice, setShowMemberNotice] =
        useState(false);

    const [memberNoticeMessage, setMemberNoticeMessage] =
        useState("");
    // =====================================
    // QUẢN LÝ DANH SÁCH HOẠT ĐỘNG
    // =====================================

    const [activities, setActivities] = useState([]);

    const [isLoadingActivities, setIsLoadingActivities] =
        useState(false);

    const [activityError, setActivityError] = useState("");
    // Lưu trạng thái CLB trước lần tải dữ liệu tiếp theo.
    const previousClubStatesRef = useRef(null);

    // Lưu những CLB vừa được duyệt nhưng sinh viên
    // chưa mở trang chi tiết của CLB đó.
    const pendingMemberNoticeRef = useRef(new Set());

    // Quản lý thời gian tự ẩn thông báo.
    const memberNoticeTimerRef = useRef(null);
    
    // =====================================
    // TẠO KHÓA LƯU TRẠNG THÁI THÔNG BÁO
    // =====================================

    const getMemberNoticeStorageKey = useCallback(
        (organizationId) => {
            if (!user?.userId || !organizationId) {
                return null;
            }

            return `club_member_notice_${user.userId}_${organizationId}`;
        },
        [user?.userId]
    );

    // =====================================
    // HIỂN THỊ THÔNG BÁO THÀNH VIÊN
    // =====================================

    const displayMemberNotice = useCallback(
        (organizationId) => {
            const storageKey =
                getMemberNoticeStorageKey(organizationId);

            if (!storageKey) {
                return;
            }

            let alreadyShown = false;

            try {
                alreadyShown =
                    localStorage.getItem(storageKey) === "shown";
            } catch (error) {
                console.warn(
                    "Không thể kiểm tra trạng thái thông báo:",
                    error
                );
            }

            // Không hiển thị lại thông báo đã xuất hiện.
            if (alreadyShown) {
                pendingMemberNoticeRef.current.delete(
                    organizationId
                );
                return;
            }

            pendingMemberNoticeRef.current.delete(
                organizationId
            );

            setMemberNoticeMessage(
                "Bạn đã trở thành thành viên của câu lạc bộ. Bạn có thể xem và đăng ký các hoạt động dành cho thành viên."
            );

            setShowMemberNotice(true);

            try {
                localStorage.setItem(storageKey, "shown");
            } catch (error) {
                console.warn(
                    "Không thể lưu trạng thái thông báo:",
                    error
                );
            }

            // Xóa bộ đếm cũ nếu có.
            if (memberNoticeTimerRef.current) {
                clearTimeout(memberNoticeTimerRef.current);
            }

            // Tự ẩn thông báo sau 5 giây.
            memberNoticeTimerRef.current = setTimeout(() => {
                setShowMemberNotice(false);
                memberNoticeTimerRef.current = null;
            }, 5000);
        },
        [getMemberNoticeStorageKey]
    );

    // =====================================
    // TẢI DANH SÁCH CÂU LẠC BỘ
    // =====================================

    const loadClubs = useCallback(
        async (silent = false) => {
            if (!user?.userId) {
                setClubs([]);
                setIsLoadingClubs(false);
                return [];
            }

            try {
                if (!silent) {
                    setIsLoadingClubs(true);
                    setLoadError("");
                }

                const response = await clubService.getClubs();

                const clubList = extractClubList(response);

                setClubs(clubList);

                return clubList;

            } catch (error) {
                console.error(
                    "Lỗi tải danh sách câu lạc bộ:",
                    error
                );

                if (!silent) {
                    setLoadError(
                        error.message ||
                        "Không thể tải danh sách câu lạc bộ."
                    );
                }

                return null;

            } finally {
                if (!silent) {
                    setIsLoadingClubs(false);
                }
            }
        },
        [user?.userId]
    );
    const extractActivityList = (response) => {
        if (Array.isArray(response)) {
            return response;
        }

        if (Array.isArray(response?.data)) {
            return response.data;
        }

        if (Array.isArray(response?.data?.data)) {
            return response.data.data;
        }

        return [];
    };
    // =====================================
    // TẢI DỮ LIỆU BAN ĐẦU
    // =====================================

    useEffect(() => {
        loadClubs();
    }, [loadClubs]);

    // =====================================
    // TỰ ĐỘNG KIỂM TRA TRẠNG THÁI CLB
    // =====================================

    useEffect(() => {
        if (!user?.userId) {
            return;
        }

        // Kiểm tra lại danh sách CLB mỗi 30 giây.
        const intervalId = setInterval(() => {
            loadClubs(true);
        }, 30000);

        // Kiểm tra lại khi sinh viên quay lại tab.
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                loadClubs(true);
            }
        };

        document.addEventListener(
            "visibilitychange",
            handleVisibilityChange
        );

        return () => {
            clearInterval(intervalId);

            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            );
        };
    }, [user?.userId, loadClubs]);

    // =====================================
    // PHÁT HIỆN CLB VỪA DUYỆT THÀNH VIÊN
    // =====================================

    const getClubState = (club) => {
        const membershipStatus = getMembershipStatus(club);
        const requestStatus = getRequestStatus(club);

        if (membershipStatus === "ACTIVE") {
            return "ACTIVE";
        }

        if (
            requestStatus === "PENDING" ||
            requestStatus === "WAITING"
        ) {
            return "PENDING";
        }

        if (
            requestStatus === "APPROVED" &&
            membershipStatus !== "ACTIVE"
        ) {
            return "APPROVED";
        }

        if (requestStatus === "REJECTED") {
            return "REJECTED";
        }

        return "NONE";
    };

    useEffect(() => {
        if (!user?.userId || isLoadingClubs) {
            return;
        }

        // Tạo bản đồ trạng thái hiện tại của các CLB.
        const currentStates = {};

        clubs.forEach((club) => {
            const organizationCode = getOrganizationCode(club);

            if (!organizationCode) {
                return;
            }

            currentStates[organizationCode] =
                getClubState(club);
        });

        // Lần tải dữ liệu đầu tiên chỉ ghi nhận trạng thái.
        // Không thông báo đối với những CLB đã ACTIVE từ trước.
        if (previousClubStatesRef.current === null) {
            previousClubStatesRef.current = currentStates;
            return;
        }

        const previousStates =
            previousClubStatesRef.current;

        Object.entries(currentStates).forEach(
            ([organizationId, currentState]) => {
                const previousState =
                    previousStates[organizationId];

                // Chỉ phát hiện khi trạng thái thực sự chuyển
                // từ chưa là thành viên sang ACTIVE.
                if (
                    previousState !== undefined &&
                    previousState !== "ACTIVE" &&
                    currentState === "ACTIVE"
                ) {
                    pendingMemberNoticeRef.current.add(
                        organizationId
                    );

                    // Nếu sinh viên đang mở đúng CLB vừa được duyệt,
                    // hiển thị thông báo ngay.
                    if (
                        selectedOrganization?.id === organizationId
                    ) {
                        displayMemberNotice(organizationId);
                    }
                }
            }
        );

        previousClubStatesRef.current = currentStates;

    }, [
        clubs,
        isLoadingClubs,
        user?.userId,
        selectedOrganization?.id,
        displayMemberNotice
    ]);

    // =====================================
    // DỌN BỘ ĐẾM KHI RỜI TRANG
    // =====================================

    useEffect(() => {
        return () => {
            if (memberNoticeTimerRef.current) {
                clearTimeout(memberNoticeTimerRef.current);
            }
        };
    }, []);

    // =====================================
    // DANH SÁCH ĐƠN VỊ ĐƯỢC PHÉP HIỂN THỊ
    // =====================================

    const visibleOrganizations = useMemo(
        () =>
            organizations.filter((organization) => {
                if (isClub(organization)) {
                    return true;
                }

                return organization.id === studentOrganizationId;
            }),
        [studentOrganizationId]
    );

    // =====================================
    // TÌM DỮ LIỆU CÂU LẠC BỘ
    // =====================================

    const getClubData = useCallback(
        (organization, source = clubs) => {
            if (!organization || !isClub(organization)) {
                return null;
            }

            return source.find(
                (club) =>
                    getOrganizationCode(club) ===
                    normalizeCode(organization.id)
            ) || null;
        },
        [clubs]
    );
    const formatActivityDate = (value) => {
        if (!value) return "Chưa cập nhật";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "Chưa cập nhật";
        }

        return date.toLocaleString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    };
    // =====================================
    // ĐỒNG BỘ TRẠNG THÁI SAU KHI GỬI ĐƠN
    // =====================================

    const syncClubAfterSubmission = async (organization) => {
        const latestClubs = await loadClubs();

        if (!latestClubs) {
            return false;
        }

        const latestClub = getClubData(
            organization,
            latestClubs
        );

        if (!latestClub) {
            return false;
        }

        return getClubState(latestClub) === "PENDING";
    };

    // =====================================
    // XỬ LÝ CHỌN ĐƠN VỊ
    // =====================================

    const handleSelectOrganization = (organization) => {
        if (!organization) return;

        setFormError("");

        // Ẩn thông báo cũ khi chuyển sang đơn vị khác.
        setShowMemberNotice(false);

        if (
            !isClub(organization) &&
            organization.id !== studentOrganizationId
        ) {
            setFormError(
                "Bạn chỉ được xem hoạt động của Đoàn Trường thuộc trường mình."
            );
            return;
        }

        if (!isClub(organization)) {
            setSelectedOrganization(organization);
            return;
        }

        const club = getClubData(organization);

        if (!club) {
            setFormError(
                "Không tìm thấy dữ liệu câu lạc bộ. Vui lòng tải lại danh sách."
            );
            return;
        }

        setSelectedOrganization(organization);

        const state = getClubState(club);

        // Đã là thành viên.
        if (state === "ACTIVE") {
            // Nếu CLB vừa được duyệt trong lúc sinh viên
            // đang xem đơn vị khác, hiển thị thông báo tại đây.
            if (
                pendingMemberNoticeRef.current.has(
                    organization.id
                )
            ) {
                displayMemberNotice(organization.id);
            }

            return;
        }

        // Đang chờ xét duyệt.
        if (state === "PENDING") {
            return;
        }

        // Đơn đã được duyệt nhưng dữ liệu thành viên chưa đồng bộ.
        if (state === "APPROVED") {
            setFormError(
                "Đơn đăng ký đã được duyệt. Vui lòng tải lại trang hoặc liên hệ câu lạc bộ nếu trạng thái thành viên chưa được cập nhật."
            );
            return;
        }

        // Chưa đăng ký hoặc đã bị từ chối.
        setPendingOrganization(organization);
        setFormData(emptyForm);
        setShowRegisterModal(true);
    };

    // =====================================
    // THAY ĐỔI DỮ LIỆU BIỂU MẪU
    // =====================================

    const handleInputChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));

        setFormError("");
    };

    // =====================================
    // GỬI ĐƠN ĐĂNG KÝ THÀNH VIÊN
    // =====================================

    const handleSubmitRegistration = async (event) => {
        event.preventDefault();

        if (!pendingOrganization || isSubmitting) {
            return;
        }

        const reason = formData.reason.trim();

        if (!reason) {
            setFormError("Vui lòng nhập lý do đăng ký.");
            return;
        }

        if (reason.length > 1000) {
            setFormError(
                "Lý do đăng ký không được vượt quá 1000 ký tự."
            );
            return;
        }

        const organization = pendingOrganization;
        const club = getClubData(organization);

        const clubId = getClubId(club);

        if (!clubId) {
            setFormError(
                "Không xác định được mã câu lạc bộ."
            );
            return;
        }

        const clubState = getClubState(club);

        if (clubState === "ACTIVE") {
            setFormError(
                "Bạn đã là thành viên của câu lạc bộ này."
            );
            return;
        }

        if (clubState === "PENDING") {
            setFormError(
                "Bạn đã gửi đơn và đang chờ câu lạc bộ xét duyệt."
            );
            return;
        }

        try {
            setIsSubmitting(true);
            setFormError("");

            const response = await clubService.applyForClub(
                clubId,
                {
                    reason,
                    introduction: formData.introduction.trim(),
                    skills: formData.skills.trim()
                }
            );

            const result = extractResponseData(response);

            // Chỉ xem là thất bại khi API xác nhận rõ ràng.
            if (
                result?.success === false ||
                response?.success === false
            ) {
                throw new Error(
                    result?.message ||
                    response?.message ||
                    "Không thể gửi đơn đăng ký."
                );
            }

            // Tải lại dữ liệu sau khi API gửi đơn hoàn tất.
            const isPendingNow =
                await syncClubAfterSubmission(organization);

            setSelectedOrganization(organization);
            setShowRegisterModal(false);
            setPendingOrganization(null);
            setFormData(emptyForm);

            if (!isPendingNow) {
                setLoadError(
                    "Đơn đã được gửi nhưng chưa đồng bộ được trạng thái. Vui lòng tải lại trang để kiểm tra."
                );
            }

            alert(
                result?.message ||
                response?.message ||
                "Đã gửi đơn đăng ký thành công. Vui lòng chờ câu lạc bộ xét duyệt."
            );

        } catch (error) {
            console.error(
                "Lỗi gửi đơn đăng ký CLB:",
                error
            );

            const statusCode =
                error?.response?.status ||
                error?.statusCode ||
                error?.status;

            // Backend xác nhận đã có đơn đang chờ duyệt.
            if (Number(statusCode) === 409) {
                await loadClubs();

                setSelectedOrganization(organization);
                setShowRegisterModal(false);
                setPendingOrganization(null);
                setFormData(emptyForm);

                alert(
                    "Bạn đã gửi đơn đăng ký câu lạc bộ này và đang chờ xét duyệt."
                );

                return;
            }

            setFormError(
                error.message ||
                "Không thể gửi đơn đăng ký. Vui lòng thử lại."
            );

        } finally {
            setIsSubmitting(false);
        }
    };

    // =====================================
    // ĐÓNG HỘP THOẠI
    // =====================================

    const handleCloseModal = () => {
        if (isSubmitting) return;

        setShowRegisterModal(false);
        setPendingOrganization(null);
        setFormError("");
        setFormData(emptyForm);
    };

    // =====================================
    // ĐỒNG BỘ LỰA CHỌN ĐOÀN TRƯỜNG
    // =====================================

    useEffect(() => {
        if (
            selectedOrganization &&
            !isClub(selectedOrganization) &&
            selectedOrganization.id !== studentOrganizationId
        ) {
            setSelectedOrganization(null);
        }
    }, [studentOrganizationId, selectedOrganization]);

    // =====================================
    // TRẠNG THÁI CÂU LẠC BỘ ĐANG CHỌN
    // =====================================

    const currentClub = selectedOrganization
        ? getClubData(selectedOrganization)
        : null;

    const currentClubState = getClubState(currentClub);

    const isPending =
        isClub(selectedOrganization) &&
        currentClubState === "PENDING";

    const isMember =
        isClub(selectedOrganization) &&
        currentClubState === "ACTIVE";

    const isRejected =
        isClub(selectedOrganization) &&
        currentClubState === "REJECTED";
// =====================================
// TẢI HOẠT ĐỘNG THEO ĐƠN VỊ ĐƯỢC CHỌN
// =====================================

    useEffect(() => {
        if (!selectedOrganization) {
            setActivities([]);
            setActivityError("");
            setIsLoadingActivities(false);
            return;
        }

        // CLB chỉ được xem hoạt động khi đã là thành viên.
        if (
            isClub(selectedOrganization) &&
            !isMember
        ) {
            setActivities([]);
            setActivityError("");
            setIsLoadingActivities(false);
            return;
        }

        const controller = new AbortController();

        const loadActivities = async () => {
            try {
                setIsLoadingActivities(true);
                setActivityError("");
                setActivities([]);

                const response = await getActivitiesByOrganization(
                    selectedOrganization.id,
                    controller.signal
                );

                const activityList = extractActivityList(response);

                setActivities(activityList);

            } catch (error) {
                if (error.name === "AbortError") {
                    return;
                }

                console.error(
                    "Lỗi tải danh sách hoạt động:",
                    error
                );

                setActivityError(
                    error.message ||
                    "Không thể tải danh sách hoạt động."
                );

                setActivities([]);

            } finally {
                if (!controller.signal.aborted) {
                    setIsLoadingActivities(false);
                }
            }
        };

        loadActivities();

        return () => {
            controller.abort();
        };

    }, [
        selectedOrganization?.id,
        isMember
    ]);
    // =====================================
    // GIAO DIỆN
    // =====================================

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

                                {!studentOrganizationId && (
                                    <div className="alert alert-warning mx-3 mt-3 mb-2">
                                        Chưa xác định được trường của tài khoản sinh viên.
                                        Bạn vẫn có thể xem các câu lạc bộ.
                                        Vui lòng kiểm tra thông tin trường trong hồ sơ tài khoản.
                                    </div>
                                )}

                                {loadError && (
                                    <div className="alert alert-danger mx-3 mt-3">
                                        {loadError}

                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-danger ms-2"
                                            onClick={() => loadClubs()}
                                        >
                                            Tải lại
                                        </button>
                                    </div>
                                )}

                                <ul className="organization-menu">
                                    {visibleOrganizations.map((organization) => {
                                        const club = getClubData(organization);
                                        const state = getClubState(club);

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
                                                    disabled={
                                                        isClub(organization) &&
                                                        isLoadingClubs
                                                    }
                                                >
                                                    <span className="organization-menu-icon">
                                                        <i className={`bi ${organization.icon}`}></i>
                                                    </span>

                                                    <span className="organization-menu-content">
                                                        <strong>{organization.type}</strong>
                                                        <small>{organization.name}</small>

                                                        {isClub(organization) && state === "PENDING" && (
                                                            <span className="club-request-label">
                                                                <i className="bi bi-clock-history me-1"></i>
                                                                Đang chờ duyệt
                                                            </span>
                                                        )}

                                                        {isClub(organization) && state === "ACTIVE" && (
                                                            <span className="club-request-label">
                                                                <i className="bi bi-check-circle me-1"></i>
                                                                Đã là thành viên
                                                            </span>
                                                        )}

                                                        {isClub(organization) && state === "REJECTED" && (
                                                            <span className="club-request-label">
                                                                <i className="bi bi-x-circle me-1"></i>
                                                                Đơn bị từ chối
                                                            </span>
                                                        )}
                                                    </span>

                                                    <i className="bi bi-chevron-right organization-chevron"></i>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>

                                {isLoadingClubs && (
                                    <div className="text-center py-3">
                                        <div
                                            className="spinner-border spinner-border-sm text-primary"
                                            role="status"
                                        ></div>

                                        <span className="ms-2">
                                            Đang tải dữ liệu...
                                        </span>
                                    </div>
                                )}

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

                                        {/* TRẠNG THÁI THÀNH VIÊN */}
                                        {isClub(selectedOrganization) && (
                                            <>
                                                {isPending && (
                                                    <div className="club-pending-notice">
                                                        <div className="club-pending-icon">
                                                            <i className="bi bi-hourglass-split"></i>
                                                        </div>

                                                        <div>
                                                            <h5>
                                                                Yêu cầu đăng ký thành viên đã được gửi
                                                            </h5>

                                                            <p>
                                                                Thông tin đăng ký của bạn đã được lưu.
                                                                Vui lòng chờ câu lạc bộ xét duyệt.
                                                                Sau khi được chấp nhận, bạn mới có thể
                                                                đăng ký các hoạt động của câu lạc bộ.
                                                            </p>

                                                            <span className="club-pending-status">
                                                                <i className="bi bi-clock me-1"></i>
                                                                Đang chờ xét duyệt
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* THÔNG BÁO THÀNH VIÊN TẠM THỜI */}
                                                {isMember && showMemberNotice && (
                                                    <div
                                                        className="alert alert-success d-flex align-items-center"
                                                        role="status"
                                                    >
                                                        <i className="bi bi-check-circle-fill me-2"></i>

                                                        <div>
                                                            <strong>
                                                                Đăng ký thành viên thành công!
                                                            </strong>

                                                            <div>
                                                                {memberNoticeMessage}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {isRejected && (
                                                    <div className="alert alert-warning">
                                                        <i className="bi bi-exclamation-circle me-2"></i>
                                                        Đơn đăng ký trước đây của bạn đã bị từ chối.
                                                        Bạn có thể gửi yêu cầu đăng ký mới.
                                                    </div>
                                                )}

                                                {currentClubState === "NONE" && (
                                                    <div className="alert alert-info">
                                                        <i className="bi bi-info-circle me-2"></i>
                                                        Bạn chưa đăng ký thành viên câu lạc bộ này.
                                                        Hãy chọn câu lạc bộ để gửi yêu cầu tham gia.
                                                    </div>
                                                )}

                                                {currentClubState === "APPROVED" && (
                                                    <div className="alert alert-info">
                                                        <i className="bi bi-info-circle me-2"></i>
                                                        Đơn đăng ký đã được duyệt. Hệ thống đang chờ
                                                        cập nhật trạng thái thành viên.
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {(!isClub(selectedOrganization) || isMember) && (
                                            <>
                                                <div className="organization-activities-title">
                                                    <div>
                                                        <h5>Danh sách hoạt động</h5>
                                                        <p>
                                                            Các hoạt động được đăng tải bởi đơn vị này
                                                        </p>
                                                    </div>

                                                    <span className="activity-total">
                                                        {activities.length} hoạt động
                                                    </span>
                                                </div>

                                                {isLoadingActivities ? (
                                                    <div className="text-center py-5">
                                                        <div
                                                            className="spinner-border text-primary"
                                                            role="status"
                                                        ></div>

                                                        <p className="mt-2">
                                                            Đang tải danh sách hoạt động...
                                                        </p>
                                                    </div>
                                                ) : activityError ? (
                                                    <div className="alert alert-danger">
                                                        <i className="bi bi-exclamation-circle me-2"></i>
                                                        {activityError}

                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-danger ms-3"
                                                            onClick={() => {
                                                                setSelectedOrganization(null);
                                                                setTimeout(() => {
                                                                    setSelectedOrganization(
                                                                        selectedOrganization
                                                                    );
                                                                }, 0);
                                                            }}
                                                        >
                                                            Thử lại
                                                        </button>
                                                    </div>
                                                ) : activities.length === 0 ? (
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
                                                ) : (
                                                    <div className="row g-3">
                                                        {activities.map((activity) => (
                                                            <div
                                                                className="col-12"
                                                                key={activity.activity_id}
                                                            >
                                                                <div className="card shadow-sm h-100">
                                                                    <div className="card-body">
                                                                        <div className="d-flex justify-content-between align-items-start gap-2">
                                                                            <div>
                                                                                <h5 className="card-title mb-2">
                                                                                    {activity.activity_name}
                                                                                </h5>

                                                                                <span className="badge bg-success">
                                                                                    Đang công bố
                                                                                </span>
                                                                            </div>

                                                                            <span className="badge bg-primary">
                                                                                {activity.registration_mode === "OPEN"
                                                                                    ? "Đăng ký trực tiếp"
                                                                                    : "Chờ xét duyệt"}
                                                                            </span>
                                                                        </div>

                                                                        <p className="text-muted mt-3 mb-2">
                                                                            <i className="bi bi-building me-2"></i>
                                                                            {activity.organization_name}
                                                                        </p>

                                                                        <p className="mb-2">
                                                                            <i className="bi bi-geo-alt me-2"></i>
                                                                            {activity.location || "Chưa cập nhật địa điểm"}
                                                                        </p>

                                                                        <p className="mb-2">
                                                                            <i className="bi bi-calendar-event me-2"></i>
                                                                            Bắt đầu: {formatActivityDate(
                                                                                activity.activity_start
                                                                            )}
                                                                        </p>

                                                                        <p className="mb-2">
                                                                            <i className="bi bi-calendar-check me-2"></i>
                                                                            Hạn đăng ký: {formatActivityDate(
                                                                                activity.registration_end
                                                                            )}
                                                                        </p>

                                                                        <p className="mb-0">
                                                                            <i className="bi bi-people me-2"></i>
                                                                            Đã đăng ký: {activity.current_participants ?? 0}
                                                                            {activity.max_participants
                                                                                ? ` / ${activity.max_participants}`
                                                                                : " / Không giới hạn"}
                                                                        </p>

                                                                        {activity.description && (
                                                                            <p className="card-text mt-3">
                                                                                {activity.description}
                                                                            </p>
                                                                        )}

                                                                        {/* CÁC NÚT THAO TÁC */}
                                                                        <div className="d-flex flex-wrap gap-2 mt-4">

                                                                            {/* XEM CHI TIẾT */}
                                                                            <button
                                                                                type="button"
                                                                                className="btn btn-outline-primary"
                                                                                onClick={() =>
                                                                                    navigate(`/activities/${activity.activity_id}`, {
                                                                                        state: {
                                                                                            from:
                                                                                                location.pathname +
                                                                                                location.search +
                                                                                                location.hash,

                                                                                            organizationCode: selectedOrganization.id
                                                                                        }
                                                                                    })
                                                                                }
                                                                            >
                                                                                <i className="bi bi-eye me-2"></i>
                                                                                Xem chi tiết
                                                                            </button>

                                                                            {/* ĐĂNG KÝ HOẠT ĐỘNG */}
                                                                            <button
                                                                                type="button"
                                                                                className="btn btn-primary"
                                                                                onClick={() =>
                                                                                    navigate(`/activities/${activity.activity_id}`, {
                                                                                        state: {
                                                                                            from:
                                                                                                location.pathname +
                                                                                                location.search +
                                                                                                location.hash,

                                                                                            organizationCode: selectedOrganization.id
                                                                                        }
                                                                                    })
                                                                                }
                                                                            >
                                                                                <i className="bi bi-person-plus me-2"></i>
                                                                                Đăng ký
                                                                            </button>

                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

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
                                disabled={isSubmitting}
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
                                        Vui lòng giới thiệu bản thân và lý do
                                        mong muốn tham gia câu lạc bộ.
                                    </span>
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="reason">
                                        Lý do đăng ký
                                        <span className="required-mark"> *</span>
                                    </label>

                                    <textarea
                                        id="reason"
                                        name="reason"
                                        className="form-control"
                                        rows="3"
                                        maxLength={1000}
                                        placeholder="Trình bày lý do bạn muốn tham gia câu lạc bộ..."
                                        value={formData.reason}
                                        onChange={handleInputChange}
                                        required
                                        disabled={isSubmitting}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="introduction">
                                        Giới thiệu bản thân
                                    </label>

                                    <textarea
                                        id="introduction"
                                        name="introduction"
                                        className="form-control"
                                        rows="3"
                                        maxLength={2000}
                                        placeholder="Giới thiệu ngắn gọn về bản thân..."
                                        value={formData.introduction}
                                        onChange={handleInputChange}
                                        disabled={isSubmitting}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="skills">
                                        Kỹ năng và sở trường
                                    </label>

                                    <textarea
                                        id="skills"
                                        name="skills"
                                        className="form-control"
                                        rows="2"
                                        maxLength={1000}
                                        placeholder="Ví dụ: giao tiếp, làm việc nhóm, thiết kế..."
                                        value={formData.skills}
                                        onChange={handleInputChange}
                                        disabled={isSubmitting}
                                    />
                                </div>

                                {formError && (
                                    <div className="club-form-error" role="alert">
                                        <i className="bi bi-exclamation-circle me-2"></i>
                                        {formError}
                                    </div>
                                )}

                                <p className="club-register-note">
                                    <i className="bi bi-shield-check me-1"></i>
                                    MSSV, lớp và trường được xác định từ hồ sơ
                                    sinh viên trong hệ thống.
                                </p>
                            </div>

                            <div className="club-modal-footer">
                                <button
                                    type="button"
                                    className="btn-club-cancel"
                                    onClick={handleCloseModal}
                                    disabled={isSubmitting}
                                >
                                    Để sau
                                </button>

                                <button
                                    type="submit"
                                    className="btn-club-submit"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span
                                                className="spinner-border spinner-border-sm me-2"
                                                role="status"
                                            ></span>
                                            Đang gửi...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-send me-2"></i>
                                            Gửi đăng ký
                                        </>
                                    )}
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
