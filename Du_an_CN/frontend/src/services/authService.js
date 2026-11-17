import api from './api';

const unwrapResponse = (response) => {
    let result = response;

    // Bóc tách dữ liệu nếu Backend trả về dạng:
    // { success: true, message: "...", data: {...} }
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

const authService = {
    // Đăng nhập bằng email và mật khẩu
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

        // Lưu JWT để sử dụng cho các API cần xác thực
        localStorage.setItem('accessToken', result.token);

        return {
            token: result.token,
            user: result.user
        };
    },

    // Lấy thông tin người dùng đang đăng nhập
    async getCurrentUser() {
        const response = await api.get('/auth/me');
        const result = unwrapResponse(response);

        return result?.user || result;
    },

    // Đăng xuất
    async logout() {
        try {
            await api.post('/auth/logout', {});
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('currentUser');
        }
    }
};

export default authService;
