import axiosInstance from './axiosInstance';

const authAPI = {
  /**
   * Gửi yêu cầu đăng nhập
   * @param {Object} credentials - { email, password }
   * @returns {Promise<Object>} Response từ server (bao gồm access_token và user data)
   */
  login: async (credentials) => {
    return await axiosInstance.post('/auth/login', credentials);
  },

  /**
   * Gửi yêu cầu đăng ký tài khoản
   * @param {Object} userData - { email, full_name, password, confirm_password }
   * @returns {Promise<Object>} Response từ server
   */
  register: async (userData) => {
    return await axiosInstance.post('/auth/register', userData);
  },

  /**
   * Gửi yêu cầu đăng xuất
   * @returns {Promise<Object>}
   */
  logout: async () => {
    return await axiosInstance.post('/auth/logout');
  },
};

export default authAPI;
