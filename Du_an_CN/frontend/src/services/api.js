
// =====================================
// CẤU HÌNH API
// =====================================

const API_URL = '/api';

// =====================================
// LẤY TOKEN ĐĂNG NHẬP
// =====================================

const getToken = () => {
    return sessionStorage.getItem('accessToken');
};


// =====================================
// HÀM GỬI REQUEST ĐẾN BACKEND
// =====================================

const request = async (endpoint, options = {}) => {

    // Lấy JWT của tab hiện tại
    const token = getToken();

    // Khởi tạo headers
    const headers = {
        ...options.headers
    };

    // Nhận biết dữ liệu FormData
    const isFormData = options.body instanceof FormData;

    // Chỉ thiết lập JSON khi body không phải FormData
    if (options.body && !isFormData) {
        headers['Content-Type'] = 'application/json';
    }

    // Gửi JWT lên Backend
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    // Gửi request
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
    });

    // Kiểm tra kiểu dữ liệu phản hồi
    const contentType = response.headers.get('content-type') || '';

    // Đọc dữ liệu trả về
    const result = contentType.includes('application/json')
        ? await response.json()
        : await response.text();

    // Xử lý lỗi HTTP
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


// =====================================
// API METHODS
// =====================================

const api = {

    // GET
    get: (endpoint) => request(endpoint),

    // POST
    post: (endpoint, data) => request(endpoint, {
        method: 'POST',
        body: data instanceof FormData
            ? data
            : JSON.stringify(data)
    }),

    // PUT
    put: (endpoint, data) => request(endpoint, {
        method: 'PUT',
        body: data instanceof FormData
            ? data
            : JSON.stringify(data)
    }),

    // PATCH
    patch: (endpoint, data) => request(endpoint, {
        method: 'PATCH',
        body: data instanceof FormData
            ? data
            : JSON.stringify(data)
    }),

    // DELETE
    delete: (endpoint) => request(endpoint, {
        method: 'DELETE'
    })
};

export default api;
