const NOTIFICATION_TYPES = {
    ACTIVITY_CREATED: {
        category: "ACTIVITY",
        label: "Hoạt động",
        icon: "bi-calendar-plus",
        color: "blue",
    },
    ACTIVITY_EXPIRING: {
        category: "ACTIVITY",
        label: "Hoạt động",
        icon: "bi-calendar-event",
        color: "orange",
    },
    ACTIVITY_CANCELLED: {
        category: "ACTIVITY",
        label: "Hoạt động",
        icon: "bi-calendar-x",
        color: "red",
    },
    ACTIVITY_UPDATED: {
        category: "ACTIVITY",
        label: "Hoạt động",
        icon: "bi-calendar-check",
        color: "blue",
    },

    ACTIVITY_REGISTRATION: {
        category: "REGISTRATION",
        label: "Đăng ký hoạt động",
        icon: "bi-person-plus",
        color: "purple",
    },
    REGISTRATION_APPROVED: {
        category: "REGISTRATION",
        label: "Đăng ký hoạt động",
        icon: "bi-check-circle",
        color: "green",
    },
    REGISTRATION_REJECTED: {
        category: "REGISTRATION",
        label: "Đăng ký hoạt động",
        icon: "bi-x-circle",
        color: "red",
    },

    CLUB_MEMBER_REQUEST: {
        category: "CLUB",
        label: "Câu lạc bộ",
        icon: "bi-people",
        color: "purple",
    },
    CLUB_REQUEST_APPROVED: {
        category: "CLUB",
        label: "Câu lạc bộ",
        icon: "bi-person-check",
        color: "green",
    },
    CLUB_REQUEST_REJECTED: {
        category: "CLUB",
        label: "Câu lạc bộ",
        icon: "bi-person-x",
        color: "red",
    },
    CLUB_ACTIVITY_REGISTRATION: {
        category: "CLUB",
        label: "Câu lạc bộ",
        icon: "bi-people",
        color: "purple",
    },

    PARTICIPATION_CONFIRMED: {
        category: "PARTICIPATION",
        label: "Kết quả tham gia",
        icon: "bi-clipboard-check",
        color: "green",
    },
    PARTICIPATION_UPDATED: {
        category: "PARTICIPATION",
        label: "Kết quả tham gia",
        icon: "bi-clipboard-data",
        color: "blue",
    },

    POINTS_UPDATED: {
        category: "POINTS",
        label: "Điểm phục vụ cộng đồng",
        icon: "bi-award",
        color: "orange",
    },
    POINTS_ASSIGNED: {
        category: "POINTS",
        label: "Điểm phục vụ cộng đồng",
        icon: "bi-award-fill",
        color: "orange",
    },
};

export const NOTIFICATION_CATEGORIES = [
    { key: "ALL", label: "Tất cả" },
    { key: "ACTIVITY", label: "Hoạt động" },
    { key: "REGISTRATION", label: "Đăng ký hoạt động" },
    { key: "CLUB", label: "Câu lạc bộ" },
    { key: "PARTICIPATION", label: "Kết quả tham gia" },
    { key: "POINTS", label: "Điểm phục vụ cộng đồng" },
];

export const getNotificationMeta = (notification) => {
    const type = String(
        notification?.type ||
        notification?.notificationType ||
        notification?.notification_type ||
        ""
    ).toUpperCase();

    if (NOTIFICATION_TYPES[type]) {
        return NOTIFICATION_TYPES[type];
    }

    // Phân loại dự phòng cho các thông báo cũ chưa có notification_type.
    const text = `${notification?.title || ""} ${notification?.content || ""}`
        .toLowerCase();

    if (
        text.includes("câu lạc bộ") ||
        text.includes("clb") ||
        text.includes("thành viên")
    ) {
        return {
            category: "CLUB",
            label: "Câu lạc bộ",
            icon: "bi-people",
            color: "purple",
        };
    }

    if (
        text.includes("đăng ký") ||
        text.includes("đơn đăng ký")
    ) {
        return {
            category: "REGISTRATION",
            label: "Đăng ký hoạt động",
            icon: "bi-person-plus",
            color: "purple",
        };
    }

    if (
        text.includes("điểm") ||
        text.includes("điểm rèn luyện")
    ) {
        return {
            category: "POINTS",
            label: "Điểm phục vụ cộng đồng",
            icon: "bi-award",
            color: "orange",
        };
    }

    if (
        text.includes("tham gia") ||
        text.includes("có mặt") ||
        text.includes("vắng mặt")
    ) {
        return {
            category: "PARTICIPATION",
            label: "Kết quả tham gia",
            icon: "bi-clipboard-check",
            color: "green",
        };
    }

    return {
        category: "ACTIVITY",
        label: "Thông báo chung",
        icon: "bi-bell",
        color: "blue",
    };
};

export const isNotificationRead = (notification) => {
    return (
        notification?.isRead === true ||
        notification?.isRead === 1 ||
        notification?.isRead === "1" ||
        notification?.is_read === true ||
        notification?.is_read === 1 ||
        notification?.is_read === "1" ||
        notification?.status === "READ"
    );
};

export const getNotificationId = (notification) => {
    return (
        notification?.notificationId ||
        notification?.notification_id ||
        notification?.id
    );
};

export const formatNotificationDate = (date) => {
    if (!date) return "Không có thông tin";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return "Không có thông tin";
    }

    return parsedDate.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};