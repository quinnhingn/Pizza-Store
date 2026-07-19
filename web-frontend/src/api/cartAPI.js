import axiosInstance from './axiosInstance';

const cartAPI = {
  /**
   * Lấy toàn bộ sản phẩm trong giỏ hàng & tổng tiền của user hiện tại
   * @returns {Promise<{items: Array, total_items: number, subtotal: number}>}
   */
  getCart: () => {
    return axiosInstance.get('/cart');
  },

  /**
   * Thêm sản phẩm vào giỏ (tự động gộp nếu trùng size, topping, note)
   * @param {Object} payload { product_id, size_name, toppings, quantity, note, unit_price }
   * @returns {Promise<Object>} Cart item vừa thêm hoặc gộp
   */
  addItem: (payload) => {
    return axiosInstance.post('/cart/items', payload);
  },

  /**
   * Cập nhật số lượng hoặc thuộc tính món trong giỏ
   * @param {number} itemId 
   * @param {Object} payload { quantity, size_name, toppings, note }
   * @returns {Promise<Object>} Cart item sau cập nhật
   */
  updateItem: (itemId, payload) => {
    return axiosInstance.put(`/cart/items/${itemId}`, payload);
  },

  /**
   * Xóa 1 món khỏi giỏ hàng
   * @param {number} itemId 
   * @returns {Promise<void>}
   */
  deleteItem: (itemId) => {
    return axiosInstance.delete(`/cart/items/${itemId}`);
  },

  /**
   * Xóa toàn bộ giỏ hàng
   * @returns {Promise<void>}
   */
  clearCart: () => {
    return axiosInstance.delete('/cart/clear');
  }
};

export default cartAPI;
