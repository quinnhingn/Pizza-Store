import axiosInstance from './axiosInstance';

const userAPI = {
  getProfile: async () => {
    return await axiosInstance.get('/users/me');
  },

  updateProfile: async (data) => {
    return await axiosInstance.put('/users/me', data);
  },

  getAddresses: async () => {
    return await axiosInstance.get('/users/me/addresses');
  },

  createAddress: async (data) => {
    return await axiosInstance.post('/users/me/addresses', data);
  },

  updateAddress: async (id, data) => {
    return await axiosInstance.put(`/users/me/addresses/${id}`, data);
  },

  deleteAddress: async (id) => {
    return await axiosInstance.delete(`/users/me/addresses/${id}`);
  },

  setDefaultAddress: async (id) => {
    return await axiosInstance.put(`/users/me/addresses/${id}/default`);
  },
};

export default userAPI;
