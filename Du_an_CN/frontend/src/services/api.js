
const API_URL = (
    import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
).replace(/\/+$/, '');

const getToken = () => localStorage.getItem('accessToken');

const request = async (endpoint, options = {}) => {
    const token = getToken();

    const headers = {
        ...options.headers
    };

    // Nhận biết dữ liệu FormData
    const isFormData = options.body instanceof FormData;

    // Chỉ thiết lập JSON khi body không phải FormData
    if (options.body && !isFormData) {
        headers['Content-Type'] = 'application/json';
    }

    // Gửi JWT
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
    });

    const contentType = response.headers.get('content-type') || '';

    const result = contentType.includes('application/json')
        ? await response.json()
        : await response.text();

    if (!response.ok) {
        const error = new Error(
            result?.message ||
            result?.error ||
            `Yêu cầu thất bại (${response.status})`
        );

        error.status = response.status;
        error.response = {
            status: response.status,
            data: result
        };

        throw error;
    }

    return result;
};

const api = {
    get: (endpoint) => request(endpoint),

    post: (endpoint, data) => request(endpoint, {
        method: 'POST',
        body: data instanceof FormData
            ? data
            : JSON.stringify(data)
    }),

    put: (endpoint, data) => request(endpoint, {
        method: 'PUT',
        body: data instanceof FormData
            ? data
            : JSON.stringify(data)
    }),

    patch: (endpoint, data) => request(endpoint, {
        method: 'PATCH',
        body: data instanceof FormData
            ? data
            : JSON.stringify(data)
    }),

    delete: (endpoint) => request(endpoint, {
        method: 'DELETE'
    })
};

export default api;
