export async function getActivitiesByOrganization(organizationId, signal) {
    const response = await fetch(
        `${API_BASE_URL}/activities?organizationId=${encodeURIComponent(organizationId)}`,
        { signal }
    );

    if (!response.ok) {
        throw new Error("Không thể tải danh sách hoạt động.");
    }

    return response.json();
}
