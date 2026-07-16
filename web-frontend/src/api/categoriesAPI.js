import axiosInstance from './axiosInstance';

const categoriesAPI = {
  /**
   * Lấy danh sách tất cả danh mục (Public)
   * @returns {Promise<Array>} Danh sách categories
   */
  getCategories: () => {
    return axiosInstance.get('/categories');
  },

  /**
   * Lấy chi tiết một danh mục theo ID (Public)
   * @param {number} id 
   * @returns {Promise<Object>} Chi tiết category
   */
  getCategoryById: (id) => {
    return axiosInstance.get(`/categories/${id}`);
  },

  /**
   * Tạo danh mục mới (Admin only)
   * @param {Object} data { name, description, icon }
   * @returns {Promise<Object>} Category vừa tạo
   */
  createCategory: (data) => {
    return axiosInstance.post('/categories', data);
  },

  /**
   * Cập nhật danh mục (Admin only)
   * @param {number} id 
   * @param {Object} data { name, description, icon }
   * @returns {Promise<Object>} Category sau cập nhật
   */
  updateCategory: (id, data) => {
    return axiosInstance.put(`/categories/${id}`, data);
  },

  /**
   * Xóa danh mục (Admin only)
   * @param {number} id 
   * @returns {Promise<Object>} Kết quả xóa
   */
  deleteCategory: (id) => {
    return axiosInstance.delete(`/categories/${id}`);
  },
};

export default categoriesAPI;
