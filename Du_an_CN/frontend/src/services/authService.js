
import api from './api';

// =====================================
// XỬ LÝ DỮ LIỆU API
// =====================================

const unwrapResponse = (response) => {
    let result = response;

    while (
        result &&
        typeof result === 'object' &&
        result.data &&
        typeof result.data === 'object'
    ) {
        result = result.data;
    }

    return result;
};

// =====================================
// AUTH SERVICE
// =====================================

const authService = {

    // =====================================
    // ĐĂNG NHẬP
    // =====================================

    async login(email, password, role) {

        const response = await api.post('/auth/login', {
            email: email.trim().toLowerCase(),
            password,
            role
        });

        const result = unwrapResponse(response);

        if (!result?.token || !result?.user) {
            throw new Error(
                'Dữ liệu đăng nhập từ máy chủ không hợp lệ.'
            );
        }

        // Lưu JWT riêng cho tab hiện tại
        sessionStorage.setItem(
            'accessToken',
            result.token
        );

        return {
            token: result.token,
            user: result.user
        };
    },

    // =====================================
    // LẤY THÔNG TIN NGƯỜI DÙNG HIỆN TẠI
    // =====================================

    async getCurrentUser() {

        const response = await api.get('/auth/me');

        const result = unwrapResponse(response);

        const user = result?.user || result;

        if (!user || typeof user !== 'object') {
            throw new Error(
                'Không thể lấy thông tin người dùng.'
            );
        }

        return user;
    },

    // =====================================
    // CẬP NHẬT THÔNG TIN CÁ NHÂN
    // =====================================

    async updateProfile(profileData) {

        const response = await api.put(
            '/auth/profile',
            profileData
        );

        const result = unwrapResponse(response);

        return result?.user || result;
    },

    // =====================================
    // CẬP NHẬT ẢNH ĐẠI DIỆN
    // =====================================

    async updateAvatar(formData) {

        const response = await api.put(
            '/auth/avatar',
            formData
        );

        const result = unwrapResponse(response);

        return result?.user || result;
    },

    // =====================================
    // ĐĂNG XUẤT
    // =====================================

    async logout() {

        try {

            // Gửi yêu cầu đăng xuất lên Backend
            await api.post('/auth/logout', {});

        } finally {

            // Chỉ xóa phiên đăng nhập của tab hiện tại
            sessionStorage.removeItem('accessToken');

            sessionStorage.removeItem('currentUser');
        }
    }
};

export default authService;
