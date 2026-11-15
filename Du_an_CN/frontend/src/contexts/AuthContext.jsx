import React, { createContext, useState, useEffect } from 'react';
import demoAccounts from '../data/demoAccounts';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('currentUser');

        return savedUser ? JSON.parse(savedUser) : null;
    });

    // Đăng nhập mô phỏng bằng tài khoản tạo sẵn
    const login = (username, password, expectedRole) => {
        const account = demoAccounts.find(
            item =>
                item.username === username.trim() &&
                item.password === password &&
                item.role === expectedRole
        );

        if (!account) {
            return {
                success: false,
                message: 'Tên tài khoản hoặc mật khẩu không chính xác.'
            };
        }

        const userData = { ...account };

        // Không lưu mật khẩu vào phiên đăng nhập
        delete userData.password;

        setUser(userData);
        localStorage.setItem('currentUser', JSON.stringify(userData));

        return {
            success: true,
            user: userData
        };
    };

    // Đăng xuất
    const logout = () => {
        setUser(null);
        localStorage.removeItem('currentUser');
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                logout,
                isAuthenticated: !!user
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};