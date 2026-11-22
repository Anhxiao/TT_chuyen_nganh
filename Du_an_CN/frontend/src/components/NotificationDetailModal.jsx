
import { useEffect, useMemo, useState } from "react";

import notificationService from "../services/notificationService";

import {
    getNotificationMeta,
    getNotificationId,
    isNotificationRead,
    formatNotificationDate,
} from "../utils/notificationUtils";

import "../styles/notification-detail-modal.css";

// =====================================
// HÀM HỖ TRỢ ĐỌC DỮ LIỆU
// =====================================

const getValue = (source, ...keys) => {
    for (const key of keys) {
        const value = source?.[key];

        if (
            value !== undefined &&
            value !== null &&
            value !== ""
        ) {
            return value;
        }
    }

    return null;
};

const formatValue = (value) => {
    if (value === null || value === undefined || value === "") {
        return "Chưa có thông tin";
    }

    if (typeof value === "boolean") {
        return value ? "Có" : "Không";
    }

    return String(value);
};

const formatDate = (value) => {
    if (!value) return "Chưa có thông tin";

    return formatNotificationDate(value);
};

const formatNumber = (value, suffix = "") => {
    if (value === null || value === undefined || value === "") {
        return "Chưa có thông tin";
    }

    return `${value}${suffix}`;
};

// =====================================
// THÀNH PHẦN HIỂN THỊ THÔNG TIN
// =====================================

function DetailRow({ icon, label, value, highlight }) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return null;
    }

    return (
        <div className="notification-detail-row">
            <div className="notification-detail-row-label">
                <i className={`bi ${icon || "bi-info-circle"}`}></i>
                <span>{label}</span>
            </div>

            <strong className={highlight ? "highlight" : ""}>
                {value}
            </strong>
        </div>
    );
}

function DetailSection({ title, icon, children }) {
    return (
        <section className="notification-detail-section">
            <h6>
                <i className={`bi ${icon || "bi-card-list"}`}></i>
                {title}
            </h6>

            <div className="notification-detail-section-content">
                {children}
            </div>
        </section>
    );
}

// =====================================
// NỘI DUNG CHI TIẾT CHO SINH VIÊN
// =====================================

function StudentNotificationDetail({ type, detail, notification }) {
    const request = detail?.request || detail?.membershipRequest || detail;
    const activity = detail?.activity || detail;
    const registration = detail?.registration || detail;
    const participation = detail?.participation || detail;

    // Kết quả duyệt đơn tham gia câu lạc bộ.
    if (
        type === "CLUB_REQUEST_APPROVED" ||
        type === "CLUB_REQUEST_REJECTED"
    ) {
        const approved = type === "CLUB_REQUEST_APPROVED";

        return (
            <>
                <div className={`notification-result-banner ${approved ? "success" : "danger"}`}>
                    <i className={`bi ${approved ? "bi-check-circle-fill" : "bi-x-circle-fill"}`}></i>

                    <div>
                        <strong>
                            {approved
                                ? "Đơn đăng ký đã được chấp thuận"
                                : "Đơn đăng ký chưa được chấp thuận"}
                        </strong>

                        <p>
                            {approved
                                ? "Bạn đã được công nhận là thành viên của câu lạc bộ."
                                : "Đơn đăng ký tham gia câu lạc bộ của bạn đã bị từ chối."}
                        </p>
                    </div>
                </div>

                <DetailSection
                    title="Thông tin đăng ký câu lạc bộ"
                    icon="bi-people"
                >
                    <DetailRow
                        icon="bi-building"
                        label="Tên câu lạc bộ"
                        value={getValue(
                            request,
                            "clubName",
                            "club_name",
                            "organizationName",
                            "organization_name"
                        )}
                    />

                    <DetailRow
                        icon="bi-calendar-plus"
                        label="Ngày gửi đơn"
                        value={formatDate(getValue(
                            request,
                            "requestedAt",
                            "requested_at",
                            "createdAt",
                            "created_at"
                        ))}
                    />

                    <DetailRow
                        icon="bi-calendar-check"
                        label="Ngày xét duyệt"
                        value={formatDate(getValue(
                            request,
                            "reviewedAt",
                            "reviewed_at"
                        ))}
                    />

                    <DetailRow
                        icon="bi-person-check"
                        label="Người xét duyệt"
                        value={getValue(
                            request,
                            "reviewerName",
                            "reviewer_name",
                            "reviewedByName",
                            "reviewed_by_name"
                        )}
                    />

                    <DetailRow
                        icon="bi-info-circle"
                        label="Kết quả"
                        value={approved ? "Đã chấp thuận" : "Bị từ chối"}
                        highlight
                    />
                </DetailSection>

                {!approved && (
                    <DetailSection
                        title="Lý do từ chối"
                        icon="bi-chat-left-text"
                    >
                        <div className="notification-detail-note">
                            {getValue(
                                request,
                                "reviewNote",
                                "review_note"
                            ) || "Đơn vị chưa cung cấp lý do từ chối."}
                        </div>
                    </DetailSection>
                )}

                {approved && (
                    <div className="notification-detail-hint success">
                        <i className="bi bi-info-circle"></i>
                        Bạn đã được chấp thuận trở thành thành viên câu lạc bộ.
                    </div>
                )}
            </>
        );
    }

    // Hoạt động mới hoặc hoạt động sắp hết hạn.
    if (
        type === "ACTIVITY_CREATED" ||
        type === "ACTIVITY_EXPIRING" ||
        type === "ACTIVITY_UPDATED" ||
        type === "ACTIVITY_CANCELLED"
    ) {
        const isExpiring = type === "ACTIVITY_EXPIRING";
        const isCancelled = type === "ACTIVITY_CANCELLED";

        return (
            <>
                <div className={`notification-result-banner ${
                    isCancelled ? "danger" : isExpiring ? "warning" : "info"
                }`}>
                    <i className={`bi ${
                        isCancelled
                            ? "bi-calendar-x"
                            : isExpiring
                                ? "bi-alarm"
                                : "bi-calendar-event"
                    }`}></i>

                    <div>
                        <strong>
                            {isCancelled
                                ? "Hoạt động đã bị hủy"
                                : isExpiring
                                    ? "Hoạt động sắp hết hạn đăng ký"
                                    : type === "ACTIVITY_UPDATED"
                                        ? "Thông tin hoạt động đã được cập nhật"
                                        : "Có hoạt động mới được đăng tải"}
                        </strong>

                        <p>
                            {notification.content}
                        </p>
                    </div>
                </div>

                <DetailSection
                    title="Thông tin hoạt động"
                    icon="bi-calendar-event"
                >
                    <DetailRow
                        icon="bi-card-heading"
                        label="Tên hoạt động"
                        value={getValue(
                            activity,
                            "activityName",
                            "activity_name",
                            "title",
                            "name"
                        )}
                    />

                    <DetailRow
                        icon="bi-building"
                        label="Đơn vị tổ chức"
                        value={getValue(
                            activity,
                            "organizationName",
                            "organization_name"
                        )}
                    />

                    <DetailRow
                        icon="bi-calendar-event"
                        label="Thời gian bắt đầu"
                        value={formatDate(getValue(
                            activity,
                            "startAt",
                            "start_at",
                            "startDate",
                            "start_date"
                        ))}
                    />

                    <DetailRow
                        icon="bi-calendar-check"
                        label="Thời gian kết thúc"
                        value={formatDate(getValue(
                            activity,
                            "endAt",
                            "end_at",
                            "endDate",
                            "end_date"
                        ))}
                    />

                    <DetailRow
                        icon="bi-geo-alt"
                        label="Địa điểm"
                        value={getValue(
                            activity,
                            "location",
                            "venue"
                        )}
                    />

                    <DetailRow
                        icon="bi-clock-history"
                        label="Hạn đăng ký"
                        value={formatDate(getValue(
                            activity,
                            "registrationDeadline",
                            "registration_deadline",
                            "deadline"
                        ))}
                        highlight={isExpiring}
                    />

                    <DetailRow
                        icon="bi-award"
                        label="Điểm phục vụ cộng đồng"
                        value={formatNumber(getValue(
                            activity,
                            "communityPoints",
                            "community_points",
                            "points",
                            "point"
                        ), " điểm")}
                    />

                    <DetailRow
                        icon="bi-people"
                        label="Số lượng dự kiến"
                        value={formatNumber(getValue(
                            activity,
                            "capacity",
                            "maxParticipants",
                            "max_participants"
                        ), " sinh viên")}
                    />

                    <DetailRow
                        icon="bi-info-circle"
                        label="Trạng thái"
                        value={getValue(
                            activity,
                            "status",
                            "activityStatus",
                            "activity_status"
                        )}
                    />
                </DetailSection>

                {isExpiring && (
                    <div className="notification-detail-hint warning">
                        <i className="bi bi-exclamation-triangle"></i>
                        Hoạt động đang gần đến hạn đăng ký. Hãy kiểm tra thời hạn trước khi đăng ký.
                    </div>
                )}

                {isCancelled && (
                    <div className="notification-detail-hint danger">
                        <i className="bi bi-info-circle"></i>
                        Hoạt động này đã bị hủy. Bạn cần kiểm tra lại trạng thái đăng ký của mình.
                    </div>
                )}
            </>
        );
    }

    // Kết quả đăng ký hoạt động.
    if (
        type === "REGISTRATION_APPROVED" ||
        type === "REGISTRATION_REJECTED" ||
        type === "ACTIVITY_REGISTRATION"
    ) {
        const approved = type === "REGISTRATION_APPROVED";

        return (
            <>
                <div className={`notification-result-banner ${
                    approved ? "success" : type === "REGISTRATION_REJECTED" ? "danger" : "info"
                }`}>
                    <i className={`bi ${
                        approved
                            ? "bi-check-circle-fill"
                            : type === "REGISTRATION_REJECTED"
                                ? "bi-x-circle-fill"
                                : "bi-person-plus-fill"
                    }`}></i>

                    <div>
                        <strong>
                            {approved
                                ? "Đăng ký hoạt động đã được duyệt"
                                : type === "REGISTRATION_REJECTED"
                                    ? "Đăng ký hoạt động bị từ chối"
                                    : "Thông tin đăng ký hoạt động"}
                        </strong>

                        <p>{notification.content}</p>
                    </div>
                </div>

                <DetailSection title="Thông tin đăng ký" icon="bi-clipboard-check">
                    <DetailRow
                        icon="bi-card-heading"
                        label="Hoạt động"
                        value={getValue(
                            registration,
                            "activityName",
                            "activity_name",
                            "title"
                        )}
                    />

                    <DetailRow
                        icon="bi-building"
                        label="Đơn vị tổ chức"
                        value={getValue(
                            registration,
                            "organizationName",
                            "organization_name"
                        )}
                    />

                    <DetailRow
                        icon="bi-calendar-plus"
                        label="Ngày đăng ký"
                        value={formatDate(getValue(
                            registration,
                            "registeredAt",
                            "registered_at",
                            "createdAt",
                            "created_at"
                        ))}
                    />

                    <DetailRow
                        icon="bi-info-circle"
                        label="Trạng thái"
                        value={getValue(
                            registration,
                            "status",
                            "registrationStatus",
                            "registration_status"
                        )}
                        highlight
                    />

                    <DetailRow
                        icon="bi-chat-left-text"
                        label="Ghi chú xét duyệt"
                        value={getValue(
                            registration,
                            "reviewNote",
                            "review_note"
                        )}
                    />
                </DetailSection>
            </>
        );
    }

    // Kết quả xác nhận tham gia.
    if (
        type === "PARTICIPATION_CONFIRMED" ||
        type === "PARTICIPATION_UPDATED"
    ) {
        return (
            <DetailSection title="Kết quả tham gia" icon="bi-clipboard-check">
                <DetailRow
                    icon="bi-card-heading"
                    label="Hoạt động"
                    value={getValue(
                        participation,
                        "activityName",
                        "activity_name",
                        "title"
                    )}
                />

                <DetailRow
                    icon="bi-person-check"
                    label="Kết quả"
                    value={getValue(
                        participation,
                        "attendanceStatus",
                        "attendance_status",
                        "status"
                    )}
                    highlight
                />

                <DetailRow
                    icon="bi-calendar-check"
                    label="Ngày xác nhận"
                    value={formatDate(getValue(
                        participation,
                        "confirmedAt",
                        "confirmed_at",
                        "updatedAt",
                        "updated_at"
                    ))}
                />

                <DetailRow
                    icon="bi-chat-left-text"
                    label="Ghi chú"
                    value={getValue(
                        participation,
                        "note",
                        "reviewNote",
                        "review_note"
                    )}
                />
            </DetailSection>
        );
    }

    // Điểm phục vụ cộng đồng.
    if (
        type === "POINTS_UPDATED" ||
        type === "POINTS_ASSIGNED"
    ) {
        return (
            <DetailSection title="Thông tin điểm" icon="bi-award">
                <DetailRow
                    icon="bi-card-heading"
                    label="Hoạt động"
                    value={getValue(
                        detail,
                        "activityName",
                        "activity_name",
                        "title"
                    )}
                />

                <DetailRow
                    icon="bi-award-fill"
                    label="Điểm được ghi nhận"
                    value={formatNumber(getValue(
                        detail,
                        "points",
                        "communityPoints",
                        "community_points",
                        "point"
                    ), " điểm")}
                    highlight
                />

                <DetailRow
                    icon="bi-calendar-check"
                    label="Ngày cập nhật"
                    value={formatDate(getValue(
                        detail,
                        "assignedAt",
                        "assigned_at",
                        "updatedAt",
                        "updated_at"
                    ))}
                />
            </DetailSection>
        );
    }

    return (
        <div className="notification-detail-note">
            {notification.content || "Không có nội dung chi tiết."}
        </div>
    );
}

// =====================================
// NỘI DUNG CHI TIẾT CHO ĐƠN VỊ TỔ CHỨC
// =====================================


function OrganizerNotificationDetail({
    type,
    detail,
    notification,
    canReviewClubRequests = false,
}) {
    const request = detail?.request || detail?.membershipRequest || detail;
    const activity = detail?.activity || detail;

    const [reviewing, setReviewing] = useState(false);
    const [reviewNote, setReviewNote] = useState("");
    const [reviewError, setReviewError] = useState("");
    const [reviewResult, setReviewResult] = useState(null);

    // Nhận diện thông báo đăng ký thành viên CLB.
    const relatedType = String(
        notification?.relatedType ||
        notification?.related_type ||
        detail?.notification?.relatedType ||
        detail?.notification?.related_type ||
        ""
    ).trim().toUpperCase();

    const normalizedType = String(type || "").trim().toUpperCase();

    const isClubMembershipRequest = [
        "CLUB_MEMBER_REQUEST",
        "CLUB_MEMBERSHIP_REQUEST",
        "CLUB_MEMBERSHIP",
    ].includes(normalizedType) || [
        "CLUB_MEMBER_REQUEST",
        "CLUB_MEMBERSHIP_REQUEST",
        "CLUB_MEMBERSHIP",
    ].includes(relatedType);

    // Lấy mã đơn.
    const requestId = getValue(
        request,
        "requestId",
        "request_id"
    );

    // Lấy trạng thái đơn.
    const currentStatus = String(
        reviewResult?.status ||
        getValue(
            request,
            "status",
            "requestStatus",
            "request_status"
        ) ||
        "PENDING"
    ).trim().toUpperCase();

    const isPending = currentStatus === "PENDING";
    const isApproved = currentStatus === "APPROVED";
    const isRejected = currentStatus === "REJECTED";

    // Xét duyệt đơn đăng ký thành viên CLB.
    const handleReview = async (decision) => {
        if (reviewing) return;

        const normalizedDecision = String(decision || "")
            .trim()
            .toUpperCase();

        const normalizedNote = reviewNote.trim();

        if (!requestId) {
            setReviewError("Không tìm thấy mã đơn đăng ký thành viên.");
            return;
        }

        if (!["APPROVED", "REJECTED"].includes(normalizedDecision)) {
            setReviewError("Quyết định xét duyệt không hợp lệ.");
            return;
        }

        if (
            normalizedDecision === "REJECTED" &&
            !normalizedNote
        ) {
            setReviewError("Vui lòng nhập lý do từ chối đơn đăng ký.");
            return;
        }

        if (normalizedNote.length > 1000) {
            setReviewError("Lý do từ chối không được vượt quá 1000 ký tự.");
            return;
        }

        const confirmMessage =
            normalizedDecision === "APPROVED"
                ? "Bạn có chắc chắn muốn chấp nhận sinh viên này tham gia câu lạc bộ?"
                : "Bạn có chắc chắn muốn từ chối đơn đăng ký này?";

        if (!window.confirm(confirmMessage)) {
            return;
        }

        try {
            setReviewing(true);
            setReviewError("");

            const result =
                await notificationService.reviewClubMembershipRequest(
                    requestId,
                    normalizedDecision,
                    normalizedNote
                );

            // Hỗ trợ response dạng:
            // { status: "APPROVED" }
            // { data: { status: "APPROVED" } }
            // { data: { data: { status: "APPROVED" } } }
            const resultData =
                result?.data?.data ||
                result?.data ||
                result?.result ||
                result;

            const returnedStatus = String(
                resultData?.status ||
                resultData?.requestStatus ||
                resultData?.request_status ||
                normalizedDecision
            ).trim().toUpperCase();

            setReviewResult({
                status: returnedStatus,
                reviewNote:
                    resultData?.reviewNote ||
                    resultData?.review_note ||
                    normalizedNote ||
                    null,
                reviewedAt:
                    resultData?.reviewedAt ||
                    resultData?.reviewed_at ||
                    new Date().toISOString(),
            });

            setReviewNote("");

        } catch (error) {
            console.error(
                "Lỗi xét duyệt đơn thành viên CLB:",
                error
            );

            setReviewError(
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message ||
                "Không thể xử lý đơn đăng ký. Vui lòng thử lại."
            );

        } finally {
            setReviewing(false);
        }
    };

    // =====================================
    // THÔNG BÁO ĐĂNG KÝ THÀNH VIÊN CLB
    // =====================================

    if (isClubMembershipRequest) {
        return (
            <>
                <div className="notification-result-banner info">
                    <i className="bi bi-person-plus-fill"></i>

                    <div>
                        <strong>Có đơn đăng ký thành viên mới</strong>
                        <p>{notification?.content}</p>
                    </div>
                </div>

                <DetailSection
                    title="Thông tin sinh viên đăng ký"
                    icon="bi-person-vcard"
                >
                    <DetailRow
                        icon="bi-person"
                        label="Họ và tên"
                        value={getValue(
                            request,
                            "studentName",
                            "student_name",
                            "fullName",
                            "full_name"
                        )}
                    />

                    <DetailRow
                        icon="bi-upc"
                        label="Mã sinh viên"
                        value={getValue(
                            request,
                            "studentCode",
                            "student_code"
                        )}
                    />

                    <DetailRow
                        icon="bi-building"
                        label="Khoa"
                        value={getValue(
                            request,
                            "facultyName",
                            "faculty_name"
                        )}
                    />

                    <DetailRow
                        icon="bi-mortarboard"
                        label="Lớp"
                        value={getValue(
                            request,
                            "className",
                            "class_name",
                            "classCode",
                            "class_code"
                        )}
                    />
                </DetailSection>

                <DetailSection
                    title="Thông tin đơn đăng ký"
                    icon="bi-clipboard-check"
                >
                    <DetailRow
                        icon="bi-hash"
                        label="Mã đơn"
                        value={requestId}
                    />

                    <DetailRow
                        icon="bi-people"
                        label="Câu lạc bộ"
                        value={getValue(
                            request,
                            "clubName",
                            "club_name",
                            "organizationName",
                            "organization_name"
                        )}
                    />

                    <DetailRow
                        icon="bi-calendar-plus"
                        label="Ngày gửi đơn"
                        value={formatDate(
                            getValue(
                                request,
                                "requestedAt",
                                "requested_at",
                                "createdAt",
                                "created_at"
                            )
                        )}
                    />

                    <DetailRow
                        icon="bi-info-circle"
                        label="Trạng thái"
                        value={
                            isApproved
                                ? "Đã chấp nhận"
                                : isRejected
                                    ? "Đã từ chối"
                                    : "Đang chờ xét duyệt"
                        }
                        highlight
                    />
                </DetailSection>

                <DetailSection
                    title="Lý do tham gia"
                    icon="bi-chat-left-text"
                >
                    <div className="notification-detail-note">
                        {getValue(
                            request,
                            "reason",
                            "requestReason",
                            "request_reason"
                        ) || "Sinh viên không cung cấp lý do."}
                    </div>
                </DetailSection>

                {getValue(
                    request,
                    "selfIntroduction",
                    "self_introduction"
                ) && (
                    <DetailSection
                        title="Giới thiệu bản thân"
                        icon="bi-person-lines-fill"
                    >
                        <div className="notification-detail-note">
                            {getValue(
                                request,
                                "selfIntroduction",
                                "self_introduction"
                            )}
                        </div>
                    </DetailSection>
                )}

                {getValue(request, "skills") && (
                    <DetailSection
                        title="Kỹ năng"
                        icon="bi-lightbulb"
                    >
                        <div className="notification-detail-note">
                            {getValue(request, "skills")}
                        </div>
                    </DetailSection>
                )}

                {/* Đơn đã được xét duyệt */}
                {!isPending && (
                    <div
                        className={`club-review-result ${
                            isApproved ? "approved" : "rejected"
                        }`}
                    >
                        <i
                            className={`bi ${
                                isApproved
                                    ? "bi-check-circle-fill"
                                    : "bi-x-circle-fill"
                            }`}
                        ></i>

                        <div>
                            <strong>
                                {isApproved
                                    ? "Đã chấp nhận đơn đăng ký"
                                    : "Đã từ chối đơn đăng ký"}
                            </strong>

                            <p>
                                {isApproved
                                    ? "Sinh viên đã được thêm vào danh sách thành viên câu lạc bộ."
                                    : "Đơn đăng ký tham gia câu lạc bộ đã bị từ chối."}
                            </p>

                            {isRejected && (
                                <p className="club-review-note">
                                    <strong>Lý do:</strong>{" "}
                                    {reviewResult?.reviewNote ||
                                        getValue(
                                            request,
                                            "reviewNote",
                                            "review_note"
                                        ) ||
                                        "Không có lý do được cung cấp."}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Khu vực xét duyệt */}
                {isPending && canReviewClubRequests && (
                    <div className="club-review-panel">
                        <div className="club-review-heading">
                            <i className="bi bi-clipboard-check"></i>

                            <div>
                                <strong>Xét duyệt đơn đăng ký</strong>
                                <p>
                                    Kiểm tra thông tin trước khi đưa ra quyết định.
                                </p>
                            </div>
                        </div>

                        <label
                            htmlFor="club-review-note"
                            className="club-review-label"
                        >
                            Lý do từ chối
                            <span> (bắt buộc nếu không đồng ý)</span>
                        </label>

                        <textarea
                            id="club-review-note"
                            className="club-review-textarea"
                            rows={3}
                            maxLength={1000}
                            placeholder="Nhập lý do nếu bạn không chấp nhận đơn đăng ký..."
                            value={reviewNote}
                            onChange={(event) => {
                                setReviewNote(event.target.value);
                                setReviewError("");
                            }}
                            disabled={reviewing}
                        />

                        <div className="club-review-counter">
                            {reviewNote.length}/1000 ký tự
                        </div>

                        {reviewError && (
                            <div className="club-review-error">
                                <i className="bi bi-exclamation-circle"></i>
                                {reviewError}
                            </div>
                        )}

                        <div className="club-review-actions">
                            <button
                                type="button"
                                className="club-review-button reject"
                                onClick={() => handleReview("REJECTED")}
                                disabled={reviewing}
                            >
                                {reviewing ? (
                                    <span className="spinner-border spinner-border-sm"></span>
                                ) : (
                                    <i className="bi bi-x-circle"></i>
                                )}

                                Không đồng ý
                            </button>

                            <button
                                type="button"
                                className="club-review-button approve"
                                onClick={() => handleReview("APPROVED")}
                                disabled={reviewing}
                            >
                                {reviewing ? (
                                    <span className="spinner-border spinner-border-sm"></span>
                                ) : (
                                    <i className="bi bi-check-circle"></i>
                                )}

                                Đồng ý tham gia
                            </button>
                        </div>
                    </div>
                )}

                {isPending && !canReviewClubRequests && (
                    <div className="notification-detail-hint warning">
                        <i className="bi bi-exclamation-circle"></i>
                        Tài khoản hiện tại không có quyền xét duyệt đơn đăng ký của câu lạc bộ này.
                    </div>
                )}
            </>
        );
    }

    // =====================================
    // THÔNG BÁO HOẠT ĐỘNG
    // =====================================

    if (
        type === "ACTIVITY_CREATED" ||
        type === "ACTIVITY_EXPIRING" ||
        type === "ACTIVITY_UPDATED" ||
        type === "ACTIVITY_CANCELLED"
    ) {
        const isExpiring = type === "ACTIVITY_EXPIRING";

        return (
            <>
                <div
                    className={`notification-result-banner ${
                        isExpiring
                            ? "warning"
                            : type === "ACTIVITY_CANCELLED"
                                ? "danger"
                                : "info"
                    }`}
                >
                    <i
                        className={`bi ${
                            isExpiring
                                ? "bi-alarm"
                                : type === "ACTIVITY_CANCELLED"
                                    ? "bi-calendar-x"
                                    : "bi-calendar-event"
                        }`}
                    ></i>

                    <div>
                        <strong>
                            {isExpiring
                                ? "Hoạt động sắp hết hạn đăng ký"
                                : type === "ACTIVITY_CANCELLED"
                                    ? "Hoạt động đã bị hủy"
                                    : type === "ACTIVITY_UPDATED"
                                        ? "Thông tin hoạt động đã cập nhật"
                                        : "Hoạt động đã được tạo"}
                        </strong>

                        <p>{notification?.content}</p>
                    </div>
                </div>

                <DetailSection
                    title="Thông tin hoạt động"
                    icon="bi-calendar-event"
                >
                    <DetailRow
                        icon="bi-hash"
                        label="Mã hoạt động"
                        value={getValue(
                            activity,
                            "activityId",
                            "activity_id",
                            "id"
                        )}
                    />

                    <DetailRow
                        icon="bi-card-heading"
                        label="Tên hoạt động"
                        value={getValue(
                            activity,
                            "activityName",
                            "activity_name",
                            "title",
                            "name"
                        )}
                    />

                    <DetailRow
                        icon="bi-calendar-event"
                        label="Thời gian bắt đầu"
                        value={formatDate(
                            getValue(
                                activity,
                                "startAt",
                                "start_at",
                                "startDate",
                                "start_date"
                            )
                        )}
                    />

                    <DetailRow
                        icon="bi-calendar-check"
                        label="Thời gian kết thúc"
                        value={formatDate(
                            getValue(
                                activity,
                                "endAt",
                                "end_at",
                                "endDate",
                                "end_date"
                            )
                        )}
                    />

                    <DetailRow
                        icon="bi-clock-history"
                        label="Hạn đăng ký"
                        value={formatDate(
                            getValue(
                                activity,
                                "registrationDeadline",
                                "registration_deadline",
                                "deadline"
                            )
                        )}
                        highlight={isExpiring}
                    />

                    <DetailRow
                        icon="bi-geo-alt"
                        label="Địa điểm"
                        value={getValue(activity, "location", "venue")}
                    />

                    <DetailRow
                        icon="bi-award"
                        label="Điểm phục vụ cộng đồng"
                        value={formatNumber(
                            getValue(
                                activity,
                                "communityPoints",
                                "community_points",
                                "points",
                                "point"
                            ),
                            " điểm"
                        )}
                    />

                    <DetailRow
                        icon="bi-info-circle"
                        label="Trạng thái"
                        value={getValue(
                            activity,
                            "status",
                            "activityStatus",
                            "activity_status"
                        )}
                    />
                </DetailSection>

                <DetailSection
                    title="Tình hình đăng ký"
                    icon="bi-people"
                >
                    <DetailRow
                        icon="bi-people-fill"
                        label="Tổng số đăng ký"
                        value={formatNumber(
                            getValue(
                                activity,
                                "registrationCount",
                                "registration_count",
                                "totalRegistrations",
                                "total_registrations"
                            ),
                            " sinh viên"
                        )}
                    />

                    <DetailRow
                        icon="bi-hourglass-split"
                        label="Đơn chờ duyệt"
                        value={formatNumber(
                            getValue(
                                activity,
                                "pendingCount",
                                "pending_count",
                                "pendingRegistrations",
                                "pending_registrations"
                            ),
                            " đơn"
                        )}
                    />

                    <DetailRow
                        icon="bi-check-circle"
                        label="Đã được duyệt"
                        value={formatNumber(
                            getValue(
                                activity,
                                "approvedCount",
                                "approved_count"
                            ),
                            " sinh viên"
                        )}
                    />

                    <DetailRow
                        icon="bi-person-plus"
                        label="Số chỗ còn lại"
                        value={formatNumber(
                            getValue(
                                activity,
                                "remainingSlots",
                                "remaining_slots",
                                "availableSlots",
                                "available_slots"
                            ),
                            " chỗ"
                        )}
                        highlight={isExpiring}
                    />
                </DetailSection>

                {isExpiring && (
                    <div className="notification-detail-hint warning">
                        <i className="bi bi-exclamation-triangle"></i>
                        Hoạt động sắp hết hạn đăng ký. Đơn vị nên kiểm tra các đơn đang chờ duyệt và tình hình số lượng sinh viên đăng ký.
                    </div>
                )}
            </>
        );
    }

    return (
        <div className="notification-detail-note">
            {notification?.content || "Không có nội dung chi tiết."}
        </div>
    );
}

// =====================================
// MODAL CHÍNH
// =====================================

function NotificationDetailModal({
    notification,
    onClose,
    role = "STUDENT",
    canReviewClubRequests = false,
}) {
    const [detail, setDetail] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [detailError, setDetailError] = useState("");

    const notificationId = getNotificationId(notification);

    const type = String(
        notification?.type ||
        notification?.notificationType ||
        notification?.notification_type ||
        ""
    ).toUpperCase();

    const meta = useMemo(
        () => getNotificationMeta(notification),
        [notification]
    );

    const isRead = isNotificationRead(notification);

    useEffect(() => {
        if (!notificationId) {
            setDetail(null);
            return;
        }

        let cancelled = false;

        const loadDetail = async () => {
            try {
                setLoadingDetail(true);
                setDetailError("");
                setDetail(null);

                const result =
                    await notificationService.getNotificationDetail(
                        notificationId
                    );

                if (cancelled) return;

                // Hỗ trợ một số dạng response phổ biến.
                const detailData =
                    result?.detail ||
                    result?.notificationDetail ||
                    result?.data?.detail ||
                    result?.data ||
                    result;

                setDetail(detailData);
            } catch (error) {
                if (cancelled) return;

                console.error("Lỗi tải chi tiết thông báo:", error);

                setDetailError(
                    error?.response?.data?.message ||
                    error?.message ||
                    "Không thể tải dữ liệu chi tiết của thông báo."
                );
            } finally {
                if (!cancelled) {
                    setLoadingDetail(false);
                }
            }
        };

        loadDetail();

        return () => {
            cancelled = true;
        };
    }, [notificationId]);

    useEffect(() => {
        if (!notification) return;

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                onClose?.();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [notification, onClose]);

    if (!notification) return null;

    return (
        <div
            className="notification-modal-overlay"
            onClick={onClose}
        >
            <div
                className="notification-detail-modal notification-detail-modal-role"
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="notification-detail-title"
            >
                <div className="notification-modal-header">
                    <div className="notification-modal-heading">
                        <div className={`notification-detail-icon ${meta.color}`}>
                            <i className={`bi ${meta.icon}`}></i>
                        </div>

                        <div>
                            <span className="notification-modal-eyebrow">
                                {role === "ORGANIZER"
                                    ? "THÔNG TIN DÀNH CHO ĐƠN VỊ TỔ CHỨC"
                                    : "THÔNG TIN DÀNH CHO SINH VIÊN"}
                            </span>

                            <h4 id="notification-detail-title">
                                {notification.title || "Thông báo"}
                            </h4>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="notification-modal-close"
                        onClick={onClose}
                        aria-label="Đóng"
                    >
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>

                <div className="notification-modal-body">
                    <div className="notification-detail-category">
                        <span className={`notification-category-badge ${meta.color}`}>
                            <i className={`bi ${meta.icon}`}></i>
                            {meta.label}
                        </span>

                        <span className={`notification-read-badge ${isRead ? "read" : "unread"}`}>
                            <i className={`bi ${isRead ? "bi-envelope-open" : "bi-envelope"}`}></i>
                            {isRead ? "Đã đọc" : "Chưa đọc"}
                        </span>
                    </div>

                    <div className="notification-detail-content">
                        <h6>Nội dung thông báo</h6>
                        <p>{notification.content || "Không có nội dung."}</p>
                    </div>

                    <div className="notification-detail-information">
                        <div className="notification-information-row">
                            <span>
                                <i className="bi bi-clock"></i>
                                Thời gian gửi
                            </span>

                            <strong>
                                {formatNotificationDate(
                                    notification.createdAt ||
                                    notification.created_at
                                )}
                            </strong>
                        </div>

                        <div className="notification-information-row">
                            <span>
                                <i className="bi bi-hash"></i>
                                Mã thông báo
                            </span>

                            <strong>{notificationId || "—"}</strong>
                        </div>
                    </div>

                    <div className="notification-role-detail">
                        {loadingDetail ? (
                            <div className="notification-detail-loading">
                                <div className="spinner-border text-primary"></div>
                                <p>Đang tải thông tin chi tiết...</p>
                            </div>
                        ) : detailError ? (
                            <div className="notification-detail-error">
                                <i className="bi bi-exclamation-circle"></i>
                                <p>{detailError}</p>
                            </div>
                        ) : role === "ORGANIZER" ? (
                            <OrganizerNotificationDetail
                                type={type}
                                detail={detail || {}}
                                notification={notification}
                                canReviewClubRequests={canReviewClubRequests}
                            />
                        ) : (
                            <StudentNotificationDetail
                                type={type}
                                detail={detail || {}}
                                notification={notification}
                            />
                        )}
                    </div>
                </div>

                <div className="notification-modal-footer">
                    <button
                        type="button"
                        className="notification-modal-button"
                        onClick={onClose}
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}

export default NotificationDetailModal;
