
const API_URL = (
    import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
).replace(/\/+$/, '');

const getToken = () => localStorage.getItem('accessToken');

const request = async (endpoint, options = {}) => {
    const token = getToken();

    const headers = {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers
    };

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
        throw new Error(
            result?.message ||
            result?.error ||
            `Yêu cầu thất bại (${response.status})`
        );
    }

    return result;
};

const api = {
    get: (endpoint) => request(endpoint),

    post: (endpoint, data) => request(endpoint, {
        method: 'POST',
        body: JSON.stringify(data)
    }),

    put: (endpoint, data) => request(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),

    patch: (endpoint, data) => request(endpoint, {
        method: 'PATCH',
        body: JSON.stringify(data)
    }),

    delete: (endpoint) => request(endpoint, {
        method: 'DELETE'
    })
};

export default api;
