
import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback
} from "react";

import authService from "../services/authService";

// Khởi tạo AuthContext
export const AuthContext = createContext(null);

// AuthProvider quản lý trạng thái đăng nhập toàn hệ thống
export const AuthProvider = ({ children }) => {

    // Lấy thông tin người dùng đã lưu
    const [user, setUser] = useState(() => {
        try {
            const savedUser = localStorage.getItem("currentUser");
            return savedUser ? JSON.parse(savedUser) : null;
        } catch (error) {
            localStorage.removeItem("currentUser");
            return null;
        }
    });

    // Kiểm tra trạng thái tải phiên đăng nhập
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
                const currentUser = await authService.getCurrentUser();

                if (!currentUser) {
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
                const result = await authService.login(
                    email,
                    password,
                    expectedRole
                );

                if (!result || !result.user) {
                    throw new Error(
                        "Thông tin đăng nhập không hợp lệ."
                    );
                }

                const userData = {
                    ...result.user,
                    role: result.user.role || expectedRole
                };

                setUser(userData);

                localStorage.setItem(
                    "currentUser",
                    JSON.stringify(userData)
                );

                return {
                    success: true,
                    user: userData
                };

            } catch (error) {
                return {
                    success: false,
                    message:
                        error.message || "Đăng nhập thất bại."
                };
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
            // Xóa thông tin phiên đăng nhập
            localStorage.removeItem("accessToken");
            localStorage.removeItem("currentUser");

            // Cập nhật trạng thái người dùng
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
