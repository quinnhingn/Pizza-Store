import axiosInstance from './axiosInstance';

const notificationsAPI = {
  getMyNotifications: () => {
    return axiosInstance.get('/notifications');
  },

  markRead: (id) => {
    return axiosInstance.patch(`/notifications/${id}/read`);
  },

  markAllRead: () => {
    return axiosInstance.patch('/notifications/read-all');
  }
};

export default notificationsAPI;
