import axiosInstance from './axiosInstance';

const adminDashboardAPI = {
  getTodayStats: () => {
    return axiosInstance.get('/admin/dashboard/today');
  },
  getAnalytics: (startDate, endDate) => {
    return axiosInstance.get('/admin/dashboard/analytics', {
      params: { start_date: startDate, end_date: endDate }
    });
  },
};

export default adminDashboardAPI;
