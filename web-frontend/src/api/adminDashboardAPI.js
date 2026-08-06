import axiosInstance from './axiosInstance';

const adminDashboardAPI = {
  getStats: () => {
    return axiosInstance.get('/admin/dashboard/');
  },
};

export default adminDashboardAPI;
