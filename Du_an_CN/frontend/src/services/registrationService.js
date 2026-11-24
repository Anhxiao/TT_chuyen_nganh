
const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * Tạo headers xác thực cho các API yêu cầu đăng nhập.
 */
function getAuthHeaders() {
    const accessToken = sessionStorage.getItem("accessToken");

    if (!accessToken) {
        throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    }

    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
    };
}

/**
 * Xử lý kết quả trả về từ API.
 */
async function handleResponse(response) {
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            result.message || "Đã xảy ra lỗi khi xử lý đăng ký."
        );
    }

    return result;
}

/**
 * Sinh viên đăng ký tham gia hoạt động.
 *
 * POST /api/registrations/activities/:activityId
 */
export async function registerForActivity(activityId) {
    const response = await fetch(
        `${API_BASE_URL}/registrations/activities/${encodeURIComponent(activityId)}`,
        {
            method: "POST",
            headers: getAuthHeaders()
        }
    );

    return handleResponse(response);
}

/**
 * Sinh viên hủy đăng ký hoạt động của chính mình.
 *
 * DELETE /api/registrations/activities/:activityId/me
 */
export async function cancelMyRegistration(activityId) {
    const response = await fetch(
        `${API_BASE_URL}/registrations/activities/${encodeURIComponent(activityId)}/me`,
        {
            method: "DELETE",
            headers: getAuthHeaders()
        }
    );

    return handleResponse(response);
}

/**
 * Lấy lịch sử đăng ký của sinh viên đang đăng nhập.
 *
 * GET /api/registrations/me
 *
 * @param {Object} options
 * @param {string} options.status
 * @param {number} options.page
 * @param {number} options.limit
 */
export async function getMyRegistrations({
    status,
    page = 1,
    limit = 20
} = {}) {
    const params = new URLSearchParams({
        page: String(page),
        limit: String(limit)
    });

    if (status) {
        params.append("status", status);
    }

    const response = await fetch(
        `${API_BASE_URL}/registrations/me?${params.toString()}`,
        {
            method: "GET",
            headers: getAuthHeaders()
        }
    );

    return handleResponse(response);
}
// Đơn vị tổ chức lấy danh sách đăng ký của hoạt động
export async function getActivityRegistrations(
    activityId,
    { status, page = 1, limit = 20 } = {}
) {
    const params = new URLSearchParams({
        page: String(page),
        limit: String(limit)
    });

    if (status) {
        params.append("status", status);
    }

    const response = await fetch(
        `${API_BASE_URL}/registrations/activities/${encodeURIComponent(activityId)}?${params.toString()}`,
        {
            method: "GET",
            headers: getAuthHeaders()
        }
    );

    return handleResponse(response);
}

// Đơn vị tổ chức chấp nhận đăng ký
export async function approveRegistration(registrationId, note = "") {
    const response = await fetch(
        `${API_BASE_URL}/registrations/${encodeURIComponent(registrationId)}/approve`,
        {
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify({ note })
        }
    );

    return handleResponse(response);
}

// Đơn vị tổ chức từ chối đăng ký
export async function rejectRegistration(registrationId, note = "") {
    const response = await fetch(
        `${API_BASE_URL}/registrations/${encodeURIComponent(registrationId)}/reject`,
        {
            method: "PATCH",
            headers: getAuthHeaders(),
            body: JSON.stringify({ note })
        }
    );

    return handleResponse(response);
}