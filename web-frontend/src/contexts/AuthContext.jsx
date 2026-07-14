import { createContext, useState, useEffect } from 'react';
import authAPI from '../api/authAPI';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('access_token') || null);
  const [loading, setLoading] = useState(false);

  // Sync token and user changes across tabs or initial load if needed
  useEffect(() => {
    if (token) {
      localStorage.setItem('access_token', token);
    } else {
      localStorage.removeItem('access_token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  /**
   * Đăng nhập người dùng
   */
  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await authAPI.login({ email, password });
      if (response && response.status === 'success' && response.data) {
        const { access_token, user: userData } = response.data;
        setToken(access_token);
        setUser(userData);
        return { success: true, user: userData };
      }
      return { success: false, message: response.message || 'Đăng nhập không thành công' };
    } catch (error) {
      const errorMsg = error.response?.data?.detail || error.message || 'Đăng nhập không thành công';
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Đăng ký tài khoản mới
   */
  const register = async (userData) => {
    setLoading(true);
    try {
      const response = await authAPI.register(userData);
      if (response && response.status === 'success') {
        return { success: true, message: response.message || 'Đăng ký thành công' };
      }
      return { success: false, message: response.message || 'Đăng ký không thành công' };
    } catch (error) {
      const errorMsg = error.response?.data?.detail || error.message || 'Đăng ký không thành công';
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Đăng xuất người dùng
   */
  const logout = async () => {
    try {
      if (token) {
        await authAPI.logout();
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
