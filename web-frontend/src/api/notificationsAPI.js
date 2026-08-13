import axiosInstance from './axiosInstance';

const notificationsAPI = {
  /**
   * Lấy danh sách thông báo của user hiện tại
   */
  getMyNotifications: async () => {
    return await axiosInstance.get('/notifications');
  },

  /**
   * Đánh dấu 1 thông báo là đã đọc
   * @param {number} id
   */
  markAsRead: async (id) => {
    return await axiosInstance.patch(`/notifications/${id}/read`);
  },

  /**
   * Đánh dấu tất cả thông báo là đã đọc
   */
  markAllAsRead: async () => {
    return await axiosInstance.patch('/notifications/read-all');
  },
  /**
   * Xóa tất cả thông báo đã đọc
   * @param {string} type 'general' hoặc 'voucher'
   */
  clearAll: async (type = 'general') => {
    return await axiosInstance.delete(`/notifications/clear-all?type=${type}`);
  },
};

export default notificationsAPI;
