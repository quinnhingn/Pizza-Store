import axiosInstance from './axiosInstance';

const vouchersAPI = {
  validateVoucher: (code, orderValue) => {
    return axiosInstance.post('/vouchers/validate', {
      code,
      order_value: orderValue
    });
  },

  getActiveVouchers: () => {
    return axiosInstance.get('/vouchers');
  },

  getAdminVouchers: () => {
    return axiosInstance.get('/vouchers/admin/all');
  },

  createVoucher: (data) => {
    return axiosInstance.post('/vouchers', data);
  },

  updateVoucher: (id, data) => {
    return axiosInstance.put(`/vouchers/${id}`, data);
  },

  toggleVoucherStatus: (id) => {
    return axiosInstance.patch(`/vouchers/${id}/status`);
  },

  deleteVoucher: (id) => {
    return axiosInstance.delete(`/vouchers/${id}`);
  },

  giftVoucher: (id, data) => {
    return axiosInstance.post(`/vouchers/${id}/gift`, data);
  },

  saveUserVoucher: (code, notificationId = null) => {
    return axiosInstance.post('/vouchers/save', {
      code,
      notification_id: notificationId
    });
  },

  getMySavedVouchers: (tab = 'active') => {
    return axiosInstance.get(`/vouchers/my-saved-vouchers?tab=${tab}`);
  }
};

export default vouchersAPI;
