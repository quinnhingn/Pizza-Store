import axiosInstance from './axiosInstance';

const bannersAPI = {
  // Public
  getPublicBanners: () => {
    return axiosInstance.get('/banners/public/');
  },

  // Admin
  getAdminBanners: () => {
    return axiosInstance.get('/admin/banners/');
  },
  
  createBanner: (data) => {
    return axiosInstance.post('/admin/banners/', data);
  },
  
  updateBanner: (id, data) => {
    return axiosInstance.put(`/admin/banners/${id}`, data);
  },
  
  deleteBanner: (id) => {
    return axiosInstance.delete(`/admin/banners/${id}`);
  },
};

export default bannersAPI;
