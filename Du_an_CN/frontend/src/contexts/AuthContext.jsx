
import React, {
    createContext,
    useState,
    useEffect,
    useCallback
} from 'react';

import authService from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {

    const [user, setUser] = useState(() => {
        try {
            const savedUser = localStorage.getItem('currentUser');
            return savedUser ? JSON.parse(savedUser) : null;
        } catch {
            localStorage.removeItem('currentUser');
            return null;
        }
    });

    const [isLoading, setIsLoading] = useState(
        () => !!localStorage.getItem('accessToken')
    );

    // Kiểm tra phiên đăng nhập khi tải lại trang
    useEffect(() => {
        const verifySession = async () => {
            const token = localStorage.getItem('accessToken');

            if (!token) {
                setUser(null);
                setIsLoading(false);
                return;
            }

            try {
                const currentUser = await authService.getCurrentUser();

                if (!currentUser) {
                    throw new Error('Không lấy được thông tin tài khoản.');
                }

                setUser(currentUser);

                localStorage.setItem(
                    'currentUser',
                    JSON.stringify(currentUser)
                );

            } catch (error) {
                console.error('Không thể xác thực phiên:', error);

                localStorage.removeItem('accessToken');
                localStorage.removeItem('currentUser');

                setUser(null);

            } finally {
                setIsLoading(false);
            }
        };

        verifySession();
    }, []);

    // Đăng nhập
    const login = useCallback(async (email, password, expectedRole) => {
        try {
            const result = await authService.login(
                email,
                password,
                expectedRole
            );

            const userData = {
                ...result.user,
                role: result.user.role || expectedRole
            };

            setUser(userData);

            localStorage.setItem(
                'currentUser',
                JSON.stringify(userData)
            );

            return {
                success: true,
                user: userData
            };

        } catch (error) {
            return {
                success: false,
                message: error.message || 'Đăng nhập thất bại.'
            };
        }
    }, []);

    // Đăng xuất
    const logout = useCallback(async () => {
        try {
            await authService.logout();

        } catch (error) {
            console.error('Lỗi đăng xuất:', error);

        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('currentUser');

            setUser(null);
        }
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                logout,
                isAuthenticated: !!user,
                isLoading
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
