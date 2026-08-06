import axiosInstance from './axiosInstance';

const adminCustomersAPI = {
  getCustomers: () => {
    return axiosInstance.get('/admin/customers/');
  },
  toggleStatus: (userId) => {
    return axiosInstance.put(`/admin/customers/${userId}/toggle-status`);
  },
};

export default adminCustomersAPI;
