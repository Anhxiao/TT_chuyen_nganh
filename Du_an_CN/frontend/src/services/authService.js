
import api from './api';

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

const authService = {
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

        localStorage.setItem(
            'accessToken',
            result.token
        );

        return {
            token: result.token,
            user: result.user
        };
    },

    async getCurrentUser() {
        const response = await api.get('/auth/me');

        const result = unwrapResponse(response);

        return result?.user || result;
    },

    async updateProfile(profileData) {
        const response = await api.put(
            '/auth/profile',
            profileData
        );

        const result = unwrapResponse(response);

        return result?.user || result;
    },

    async updateAvatar(formData) {
        const response = await api.put(
            '/auth/avatar',
            formData
        );

        const result = unwrapResponse(response);

        return result?.user || result;
    },

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
