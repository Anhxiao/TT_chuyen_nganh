import api from "./api";

const clubService = {
    // Lấy danh sách câu lạc bộ
    getClubs: async () => {
        const response = await api.get("/clubs");
        return response.data;
    },

    // Sinh viên gửi đơn xin tham gia CLB
    applyForClub: async (clubId, data) => {
        const response = await api.post(`/clubs/${clubId}/apply`, data);
        return response.data;
    },

    // Lấy danh sách đơn đăng ký CLB của sinh viên hiện tại
    getMyRequests: async () => {
        const response = await api.get("/clubs/my-requests");
        return response.data;
    },

    // Tổ chức lấy danh sách đơn xin tham gia CLB
    getMembershipRequests: async (status = "PENDING") => {
        const response = await api.get(
            "/clubs/membership-requests",
            {
                params: status ? { status } : {}
            }
        );

        return response.data;
    },

    // Tổ chức duyệt hoặc từ chối đơn
    reviewMembershipRequest: async (requestId, data) => {
        const response = await api.patch(
            `/clubs/membership-requests/${requestId}/review`,
            data
        );

        return response.data;
    }
};

export default clubService;