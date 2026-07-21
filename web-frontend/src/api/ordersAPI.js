import axiosInstance from './axiosInstance';

const ordersAPI = {
  /**
   * Tạo đơn hàng mới từ giỏ hàng hoặc mua ngay (Customer)
   * @param {Object} payload - { voucher_code, shipping_full_name, shipping_phone, shipping_address, shipping_address_id, note }
   */
  createOrder: async (payload) => {
    return await axiosInstance.post('/orders', payload);
  },

  /**
   * Lấy lịch sử đơn hàng của người dùng hiện tại (Customer)
   */
  getMyOrders: async () => {
    return await axiosInstance.get('/orders/my-orders');
  },

  /**
   * Lấy toàn bộ danh sách đơn hàng trong hệ thống (Admin only)
   */
  getAllOrdersAdmin: async () => {
    return await axiosInstance.get('/orders');
  },

  /**
   * Cập nhật trạng thái đơn hàng (Admin only)
   * @param {number} orderId
   * @param {string} status - 'pending' | 'confirmed' | 'shipping' | 'completed' | 'cancelled'
   */
  updateOrderStatus: async (orderId, status) => {
    return await axiosInstance.put(`/orders/${orderId}/status`, { status });
  },
};

export default ordersAPI;
