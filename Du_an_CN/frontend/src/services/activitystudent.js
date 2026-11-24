
const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * Lấy danh sách hoạt động được công khai của một đơn vị.
 *
 * @param {number|string} organizationId
 * @param {AbortSignal} signal
 */
export async function getActivitiesByOrganization(organizationId, signal) {
    const response = await fetch(
        `${API_BASE_URL}/activities?organizationId=${encodeURIComponent(organizationId)}`,
        { signal }
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.message || "Không thể tải danh sách hoạt động."
        );
    }

    return result;
}

/**
 * Lấy thông tin chi tiết một hoạt động.
 *
 * @param {number|string} activityId
 * @param {AbortSignal} signal
 */
export async function getActivityById(activityId, signal) {
    const response = await fetch(
        `${API_BASE_URL}/activities/${encodeURIComponent(activityId)}`,
        { signal }
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.message || "Không thể tải thông tin hoạt động."
        );
    }

    return result;
}
