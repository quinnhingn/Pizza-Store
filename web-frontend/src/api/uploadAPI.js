import axiosInstance from './axiosInstance';

const uploadAPI = {
  /**
   * Upload image file (Product or Category image) to server/Cloudinary
   * @param {FormData} formData - FormData containing the 'file' field
   * @returns {Promise<Object>} API response with image url, public_id, and provider
   */
  uploadImage: (formData) => {
    return axiosInstance.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000,
    });
  },
};

export default uploadAPI;
