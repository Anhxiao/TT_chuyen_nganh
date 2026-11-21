
import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback
} from "react";

import authService from "../services/authService";

// =====================================
// KHỞI TẠO AUTH CONTEXT
// =====================================

export const AuthContext = createContext(null);

// =====================================
// AUTH PROVIDER
// =====================================

export const AuthProvider = ({ children }) => {

    // =====================================
    // STATE NGƯỜI DÙNG
    // =====================================

    const [user, setUser] = useState(() => {
        try {
            const savedUser = localStorage.getItem("currentUser");

            return savedUser ? JSON.parse(savedUser) : null;

        } catch (error) {
            console.error("Lỗi đọc thông tin người dùng:", error);

            localStorage.removeItem("currentUser");

            return null;
        }
    });

    // Trạng thái tải phiên đăng nhập
    const [isLoading, setIsLoading] = useState(
        () => !!localStorage.getItem("accessToken")
    );

    // =====================================
    // KIỂM TRA PHIÊN ĐĂNG NHẬP
    // =====================================

    useEffect(() => {
        let isMounted = true;

        const verifySession = async () => {
            const token = localStorage.getItem("accessToken");

            if (!token) {
                if (isMounted) {
                    setUser(null);
                    setIsLoading(false);
                }

                return;
            }

            try {
                // Lấy thông tin đầy đủ từ Backend
                const currentUser = await authService.getCurrentUser();

                console.log(
                    "Dữ liệu API getCurrentUser:",
                    currentUser
                );

                if (!currentUser || typeof currentUser !== "object") {
                    throw new Error(
                        "Không lấy được thông tin tài khoản."
                    );
                }

                if (!isMounted) return;

                setUser(currentUser);

                localStorage.setItem(
                    "currentUser",
                    JSON.stringify(currentUser)
                );

            } catch (error) {
                console.error(
                    "Không thể xác thực phiên:",
                    error
                );

                localStorage.removeItem("accessToken");
                localStorage.removeItem("currentUser");

                if (isMounted) {
                    setUser(null);
                }

            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        verifySession();

        return () => {
            isMounted = false;
        };

    }, []);

    // =====================================
    // ĐĂNG NHẬP
    // =====================================

    const login = useCallback(
        async (email, password, expectedRole) => {

            try {
                setIsLoading(true);

                // BƯỚC 1: GỬI YÊU CẦU ĐĂNG NHẬP
                const result = await authService.login(
                    email,
                    password,
                    expectedRole
                );

                console.log(
                    "Dữ liệu API login:",
                    result
                );

                if (!result || !result.token || !result.user) {
                    throw new Error(
                        "Thông tin đăng nhập không hợp lệ."
                    );
                }

                // BƯỚC 2: LẤY ĐẦY ĐỦ THÔNG TIN TÀI KHOẢN
                // Token đã được authService lưu vào localStorage
                const currentUser = await authService.getCurrentUser();

                console.log(
                    "Dữ liệu người dùng sau đăng nhập:",
                    currentUser
                );

                if (!currentUser || typeof currentUser !== "object") {
                    throw new Error(
                        "Không thể lấy đầy đủ thông tin tài khoản."
                    );
                }

                // BƯỚC 3: KẾT HỢP DỮ LIỆU
                // Giữ role từ kết quả đăng nhập nếu API /me không trả về
                const userData = {
                    ...currentUser,

                    role:
                        currentUser.role ||
                        result.user.role ||
                        expectedRole
                };

                // BƯỚC 4: CẬP NHẬT AUTH CONTEXT
                setUser(userData);

                // BƯỚC 5: LƯU THÔNG TIN NGƯỜI DÙNG
                localStorage.setItem(
                    "currentUser",
                    JSON.stringify(userData)
                );

                console.log(
                    "Thông tin người dùng đã cập nhật:",
                    userData
                );

                return {
                    success: true,
                    user: userData
                };

            } catch (error) {
                console.error(
                    "Lỗi đăng nhập:",
                    error
                );

                // Xóa phiên nếu không thể hoàn tất đăng nhập
                localStorage.removeItem("accessToken");
                localStorage.removeItem("currentUser");

                setUser(null);

                return {
                    success: false,
                    message:
                        error.message || "Đăng nhập thất bại."
                };

            } finally {
                setIsLoading(false);
            }
        },
        []
    );

    // =====================================
    // ĐĂNG XUẤT
    // =====================================

    const logout = useCallback(async () => {
        try {
            await authService.logout();

        } catch (error) {
            console.error(
                "Lỗi đăng xuất:",
                error
            );

        } finally {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("currentUser");

            setUser(null);
        }
    }, []);

    // =====================================
    // GIÁ TRỊ CUNG CẤP CHO TOÀN HỆ THỐNG
    // =====================================

    const contextValue = {
        user,
        setUser,
        login,
        logout,
        isAuthenticated: !!user,
        isLoading
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

// =====================================
// CUSTOM HOOK: USEAUTH
// =====================================

export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth phải được sử dụng bên trong AuthProvider."
        );
    }

    return context;
};
