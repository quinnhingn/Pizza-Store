import axiosInstance from './axiosInstance';

const productsAPI = {
  /**
   * Lấy danh sách sản phẩm với các bộ lọc và phân trang (Public)
   * @param {Object} params { skip, limit, category_id, is_available }
   * @returns {Promise<Array>} Danh sách products
   */
  getProducts: (params = {}) => {
    return axiosInstance.get('/products', { params });
  },

  /**
   * Lấy chi tiết một sản phẩm theo ID (Public)
   * @param {number} id 
   * @returns {Promise<Object>} Chi tiết product
   */
  getProductById: (id) => {
    return axiosInstance.get(`/products/${id}`);
  },

  /**
   * Tạo sản phẩm mới (Admin only)
   * @param {Object} data { name, description, price, image_url, category_id, is_available, ingredients }
   * @returns {Promise<Object>} Product vừa tạo
   */
  createProduct: (data) => {
    return axiosInstance.post('/products', data);
  },

  /**
   * Cập nhật sản phẩm (Admin only)
   * @param {number} id 
   * @param {Object} data { name, description, price, image_url, category_id, is_available, ingredients }
   * @returns {Promise<Object>} Product sau cập nhật
   */
  updateProduct: (id, data) => {
    return axiosInstance.put(`/products/${id}`, data);
  },

  /**
   * Xóa sản phẩm (Admin only)
   * @param {number} id 
   * @returns {Promise<Object>} Kết quả xóa
   */
  deleteProduct: (id) => {
    return axiosInstance.delete(`/products/${id}`);
  },

  /**
   * Lấy danh sách sản phẩm phân trang dành riêng cho Khách hàng (Public Customer API)
   * @param {Object} params { page, page_size, category_id, min_price, max_price, search }
   * @returns {Promise<Object>} Object phân trang { items, total_count, total_pages, page, page_size }
   */
  getPublicProducts: (params = {}) => {
    return axiosInstance.get('/public/products', { params });
  },

  /**
   * Lấy chi tiết một sản phẩm dành cho Khách hàng (Public Customer API)
   * @param {number} id 
   * @returns {Promise<Object>} Chi tiết product (đã eager load sizes, toppings, ingredients)
   */
  getPublicProductById: (id) => {
    return axiosInstance.get(`/public/products/${id}`);
  },
};

export default productsAPI;
