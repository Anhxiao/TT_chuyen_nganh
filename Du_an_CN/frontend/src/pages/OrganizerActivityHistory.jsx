
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header Organizer";
import Footer from "../components/Footer";
import { useAuth } from "../contexts/AuthContext";
import "../styles/organizer-activity-history.css";

const API_BASE_URL = (
    import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

const PUBLISHED_STATUSES = [
    "PUBLISHED",
    "REGISTERING",
    "ONGOING",
    "COMPLETED",
    "CANCELLED"
];

function getOrganizationInfo(user) {
    if (!user) return null;

    const organization =
        user.organization ||
        (Array.isArray(user.organizations) &&
        user.organizations.length === 1
            ? user.organizations[0]
            : null);

    const id =
        user.organizationId ??
        user.organization_id ??
        organization?.organizationId ??
        organization?.organization_id ??
        organization?.id;

    if (!id) return null;

    return {
        id: Number(id),
        name:
            user.organizationName ||
            user.organization_name ||
            organization?.organizationName ||
            organization?.organization_name ||
            organization?.name ||
            "Đơn vị tổ chức"
    };
}

function getActivityId(activity) {
    return (
        activity.activity_id ??
        activity.activityId ??
        activity.id
    );
}

function normalizeActivities(response) {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.activities)) return response.activities;
    if (Array.isArray(response?.data?.activities)) {
        return response.data.activities;
    }
    if (Array.isArray(response?.result)) return response.result;

    return [];
}

function getStatusLabel(status) {
    const labels = {
        DRAFT: "Bản nháp",
        PUBLISHED: "Đã công bố",
        REGISTERING: "Đang mở đăng ký",
        ONGOING: "Đang diễn ra",
        COMPLETED: "Đã hoàn thành",
        CANCELLED: "Đã hủy"
    };

    return labels[status] || "Chưa xác định";
}

function getStatusClass(status) {
    const classes = {
        DRAFT: "draft",
        PUBLISHED: "published",
        REGISTERING: "registering",
        ONGOING: "ongoing",
        COMPLETED: "completed",
        CANCELLED: "cancelled"
    };

    return classes[status] || "default";
}

function formatDate(value) {
    if (!value) return "Chưa cập nhật";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Chưa cập nhật";
    }

    return date.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function getActivityName(activity) {
    return (
        activity.activity_name ||
        activity.activityName ||
        "Chưa có tên hoạt động"
    );
}

function OrganizerActivityHistory() {
    const { user, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();

    const organization = useMemo(
        () => getOrganizationInfo(user),
        [user]
    );

    const [draftActivities, setDraftActivities] = useState([]);
    const [publishedActivities, setPublishedActivities] = useState([]);

    const [loading, setLoading] = useState(true);
    const [publishingId, setPublishingId] = useState(null);

    const [keyword, setKeyword] = useState("");
    const [publishedFilter, setPublishedFilter] = useState("ALL");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const getHeaders = useCallback(() => {
        const token = sessionStorage.getItem("accessToken");

        return {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        };
    }, []);

    const fetchActivitiesByStatus = useCallback(
        async (organizationId, status) => {
            const params = new URLSearchParams({
                organizationId: String(organizationId),
                page: "1",
                limit: "100"
            });

            if (status) {
                params.set("status", status);
            }

            const response = await fetch(
                `${API_BASE_URL}/activities?${params.toString()}`,
                {
                    method: "GET",
                    headers: getHeaders()
                }
            );

            const result = await response.json().catch(() => ({}));

            if (!response.ok || result.success === false) {
                throw new Error(
                    result.message || "Không thể tải danh sách hoạt động."
                );
            }

            return normalizeActivities(result.data ?? result);
        },
        [getHeaders]
    );

    const loadActivities = useCallback(async () => {
        if (!organization?.id) {
            setDraftActivities([]);
            setPublishedActivities([]);
            setLoading(false);
            setError(
                "Không tìm thấy thông tin đơn vị tổ chức của tài khoản đăng nhập."
            );
            return;
        }

        setLoading(true);
        setError("");

        try {
            const drafts = await fetchActivitiesByStatus(
                organization.id,
                "DRAFT"
            );

            const publishedResults = await Promise.all(
                PUBLISHED_STATUSES.map((status) =>
                    fetchActivitiesByStatus(organization.id, status)
                )
            );

            const published = publishedResults.flat();

            const uniquePublished = Array.from(
                new Map(
                    published
                        .filter((activity) => getActivityId(activity))
                        .map((activity) => [
                            String(getActivityId(activity)),
                            activity
                        ])
                ).values()
            );

            setDraftActivities(
                drafts.filter((activity) => activity.status === "DRAFT")
            );

            setPublishedActivities(uniquePublished);
        } catch (err) {
            console.error("Lỗi tải hoạt động:", err);
            setError(err.message || "Đã xảy ra lỗi khi tải hoạt động.");
        } finally {
            setLoading(false);
        }
    }, [organization?.id, fetchActivitiesByStatus]);

    useEffect(() => {
        if (!authLoading) {
            loadActivities();
        }
    }, [authLoading, loadActivities]);

    const filteredDrafts = useMemo(() => {
        const search = keyword.trim().toLowerCase();

        return draftActivities.filter((activity) =>
            getActivityName(activity).toLowerCase().includes(search)
        );
    }, [draftActivities, keyword]);

    const filteredPublished = useMemo(() => {
        const search = keyword.trim().toLowerCase();

        return publishedActivities.filter((activity) => {
            const matchesKeyword = getActivityName(activity)
                .toLowerCase()
                .includes(search);

            const matchesStatus =
                publishedFilter === "ALL" ||
                activity.status === publishedFilter;

            return matchesKeyword && matchesStatus;
        });
    }, [publishedActivities, keyword, publishedFilter]);

    const handlePublish = async (activity) => {
        const activityId = getActivityId(activity);

        if (!activityId) {
            setError("Không xác định được mã hoạt động.");
            return;
        }

        const confirmed = window.confirm(
            `Bạn có chắc chắn muốn công bố hoạt động "${getActivityName(activity)}"?`
        );

        if (!confirmed) return;

        setPublishingId(activityId);
        setError("");
        setSuccess("");

        try {
            const response = await fetch(
                `${API_BASE_URL}/activities/${activityId}/publish`,
                {
                    method: "PATCH",
                    headers: getHeaders()
                }
            );

            const result = await response.json().catch(() => ({}));

            if (!response.ok || result.success === false) {
                throw new Error(
                    result.message || "Không thể công bố hoạt động."
                );
            }

            setSuccess("Công bố hoạt động thành công.");
            await loadActivities();
        } catch (err) {
            setError(err.message || "Không thể công bố hoạt động.");
        } finally {
            setPublishingId(null);
        }
    };

    const handleEdit = (activity) => {
        const activityId = getActivityId(activity);

        if (!activityId) {
            setError("Không xác định được mã hoạt động.");
            return;
        }

        navigate(`/organizer/activities/${activityId}/edit`);
    };

    const handleViewDetail = (activity) => {
        const activityId = getActivityId(activity);

        if (!activityId) {
            setError("Không xác định được mã hoạt động.");
            return;
        }

        navigate(`/organizer/activities/${activityId}`);
    };

    const renderActivityCard = (activity, isDraft = false) => {
        const activityId = getActivityId(activity);

        const status = activity.status || (isDraft ? "DRAFT" : "PUBLISHED");

        const startDate =
            activity.activity_start || activity.activityStart;

        const endDate =
            activity.activity_end || activity.activityEnd;

        const maxParticipants =
            activity.max_participants ?? activity.maxParticipants;

        const registrationMode =
            activity.registration_mode || activity.registrationMode;

        return (
            <article
                className={`organizer-history-card ${!isDraft ? "published-card" : "draft-card"}`}
                key={activityId}
            >
                <div className="history-card-content">
                    <div className="history-card-heading">
                        <div className="history-card-title">
                            <h3
                                className={!isDraft ? "history-card-title-link" : ""}
                                onClick={
                                    !isDraft
                                        ? () => handleViewDetail(activity)
                                        : undefined
                                }
                                title={
                                    !isDraft
                                        ? "Mở quản lý hoạt động"
                                        : undefined
                                }
                            >
                                {getActivityName(activity)}
                            </h3>

                            <span
                                className={`history-status ${getStatusClass(status)}`}
                            >
                                {getStatusLabel(status)}
                            </span>
                        </div>

                        <p className="history-card-description">
                            {activity.description ||
                                "Chưa có mô tả cho hoạt động này."}
                        </p>
                    </div>

                    <div className="history-card-info">
                        <div>
                            <i className="bi bi-geo-alt"></i>
                            <span>
                                {activity.location || "Chưa cập nhật địa điểm"}
                            </span>
                        </div>

                        <div>
                            <i className="bi bi-calendar-event"></i>
                            <span>
                                Bắt đầu: {formatDate(startDate)}
                            </span>
                        </div>

                        <div>
                            <i className="bi bi-calendar-check"></i>
                            <span>
                                Kết thúc: {formatDate(endDate)}
                            </span>
                        </div>

                        <div>
                            <i className="bi bi-people"></i>
                            <span>
                                Số lượng tối đa:{" "}
                                {maxParticipants ?? "Không giới hạn"}
                            </span>
                        </div>

                        {!isDraft && (
                            <div>
                                <i className="bi bi-card-checklist"></i>
                                <span>
                                    Hình thức đăng ký:{" "}
                                    {registrationMode === "APPROVAL"
                                        ? "Chờ đơn vị duyệt"
                                        : "Đăng ký tự động"}
                                </span>
                            </div>
                        )}
                    </div>

                    {isDraft ? (
                        <div className="history-card-note draft-note">
                            <i className="bi bi-info-circle"></i>
                            Hoạt động này chưa được công bố và chưa hiển thị
                            cho sinh viên.
                        </div>
                    ) : (
                        <div className="history-card-note published-note">
                            <i className="bi bi-info-circle"></i>
                            Xem danh sách đăng ký, điểm danh QR, minh chứng
                            và kết quả trong trang quản lý hoạt động.
                        </div>
                    )}
                </div>

                <div className="history-card-actions">
                    {isDraft ? (
                        <>
                            <button
                                type="button"
                                className="history-btn history-btn-edit"
                                onClick={() => handleEdit(activity)}
                            >
                                <i className="bi bi-pencil-square"></i>
                                Chỉnh sửa
                            </button>

                            <button
                                type="button"
                                className="history-btn history-btn-publish"
                                onClick={() => handlePublish(activity)}
                                disabled={publishingId === activityId}
                            >
                                {publishingId === activityId ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm"></span>
                                        Đang công bố...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-cloud-upload"></i>
                                        Công bố
                                    </>
                                )}
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            className="history-btn history-btn-detail"
                            onClick={() => handleViewDetail(activity)}
                        >
                            <i className="bi bi-gear-wide-connected"></i>
                            Quản lý hoạt động
                            <i className="bi bi-arrow-right ms-1"></i>
                        </button>
                    )}
                </div>
            </article>
        );
    };

    if (authLoading) {
        return (
            <div className="history-page-loading">
                <div className="spinner-border text-primary"></div>
                <p>Đang tải thông tin tài khoản...</p>
            </div>
        );
    }

    return (
        <div className="organizer-history-page">
            <Header />

            <main className="organizer-history-container container">
                <div className="organizer-history-heading">
                    <div>
                        <span className="history-eyebrow">
                            QUẢN LÝ HOẠT ĐỘNG
                        </span>

                        <h1>Các hoạt động đã tạo</h1>

                        <p>
                            Theo dõi bản nháp và các hoạt động đã công bố của{" "}
                            <strong>{organization?.name || "đơn vị tổ chức"}</strong>.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="history-create-btn"
                        onClick={() =>
                            navigate("/organizer/activities/create")
                        }
                    >
                        <i className="bi bi-plus-circle"></i>
                        Tạo hoạt động
                    </button>
                </div>

                <div className="history-summary">
                    <div className="history-summary-card">
                        <span className="summary-icon total">
                            <i className="bi bi-collection"></i>
                        </span>
                        <div>
                            <strong>
                                {draftActivities.length +
                                    publishedActivities.length}
                            </strong>
                            <span>Tổng hoạt động</span>
                        </div>
                    </div>

                    <div className="history-summary-card">
                        <span className="summary-icon draft">
                            <i className="bi bi-file-earmark-text"></i>
                        </span>
                        <div>
                            <strong>{draftActivities.length}</strong>
                            <span>Bản nháp</span>
                        </div>
                    </div>

                    <div className="history-summary-card">
                        <span className="summary-icon published">
                            <i className="bi bi-megaphone"></i>
                        </span>
                        <div>
                            <strong>{publishedActivities.length}</strong>
                            <span>Đã đăng tải</span>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="alert alert-danger history-alert">
                        <i className="bi bi-exclamation-circle me-2"></i>
                        {error}
                    </div>
                )}

                {success && (
                    <div className="alert alert-success history-alert">
                        <i className="bi bi-check-circle me-2"></i>
                        {success}
                    </div>
                )}

                <div className="history-toolbar">
                    <div className="history-search">
                        <i className="bi bi-search"></i>
                        <input
                            type="search"
                            placeholder="Tìm kiếm theo tên hoạt động..."
                            value={keyword}
                            onChange={(event) => setKeyword(event.target.value)}
                        />
                    </div>

                    <button
                        type="button"
                        className="history-refresh-btn"
                        onClick={loadActivities}
                        disabled={loading}
                    >
                        <i className="bi bi-arrow-clockwise"></i>
                        Làm mới
                    </button>
                </div>

                {loading ? (
                    <div className="history-loading">
                        <div className="spinner-border text-primary"></div>
                        <p>Đang tải danh sách hoạt động...</p>
                    </div>
                ) : (
                    <>
                        <section className="history-section">
                            <div className="history-section-heading">
                                <div className="history-section-title">
                                    <span className="history-section-icon draft-icon">
                                        <i className="bi bi-file-earmark-text"></i>
                                    </span>

                                    <div>
                                        <h2>Bản nháp hoạt động</h2>
                                        <p>
                                            Các hoạt động đã lưu nhưng chưa công bố.
                                        </p>
                                    </div>
                                </div>

                                <span className="history-count draft-count">
                                    {filteredDrafts.length} bản nháp
                                </span>
                            </div>

                            {filteredDrafts.length > 0 ? (
                                <div className="history-list">
                                    {filteredDrafts.map((activity) =>
                                        renderActivityCard(activity, true)
                                    )}
                                </div>
                            ) : (
                                <div className="history-empty">
                                    <span className="history-empty-icon">
                                        <i className="bi bi-folder2-open"></i>
                                    </span>
                                    <h3>Chưa có bản nháp nào</h3>
                                    <p>
                                        Khi chọn “Lưu bản nháp” ở trang tạo hoạt
                                        động, hoạt động sẽ xuất hiện tại đây.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            navigate("/organizer/activities/create")
                                        }
                                    >
                                        <i className="bi bi-plus-circle me-2"></i>
                                        Tạo hoạt động mới
                                    </button>
                                </div>
                            )}
                        </section>

                        <section className="history-section published-section">
                            <div className="history-section-heading">
                                <div className="history-section-title">
                                    <span className="history-section-icon published-icon">
                                        <i className="bi bi-megaphone"></i>
                                    </span>

                                    <div>
                                        <h2>Hoạt động đã đăng tải</h2>
                                        <p>
                                            Các hoạt động đã công bố và được hiển
                                            thị cho sinh viên.
                                        </p>
                                    </div>
                                </div>

                                <span className="history-count published-count">
                                    {filteredPublished.length} hoạt động
                                </span>
                            </div>

                            <div className="history-filter">
                                <label htmlFor="publishedStatusFilter">
                                    Trạng thái:
                                </label>

                                <select
                                    id="publishedStatusFilter"
                                    value={publishedFilter}
                                    onChange={(event) =>
                                        setPublishedFilter(event.target.value)
                                    }
                                >
                                    <option value="ALL">Tất cả</option>
                                    <option value="PUBLISHED">Đã công bố</option>
                                    <option value="REGISTERING">Đang mở đăng ký</option>
                                    <option value="ONGOING">Đang diễn ra</option>
                                    <option value="COMPLETED">Đã hoàn thành</option>
                                    <option value="CANCELLED">Đã hủy</option>
                                </select>
                            </div>

                            {filteredPublished.length > 0 ? (
                                <div className="history-list">
                                    {filteredPublished.map((activity) =>
                                        renderActivityCard(activity, false)
                                    )}
                                </div>
                            ) : (
                                <div className="history-empty">
                                    <span className="history-empty-icon">
                                        <i className="bi bi-megaphone"></i>
                                    </span>
                                    <h3>Chưa có hoạt động phù hợp</h3>
                                    <p>
                                        Hoạt động sau khi được công bố sẽ xuất
                                        hiện tại khu vực này.
                                    </p>
                                </div>
                            )}
                        </section>
                    </>
                )}
            </main>

            <Footer />
        </div>
    );
}

export default OrganizerActivityHistory;
