import axiosInstance from './axiosInstance';

const reviewsAPI = {
  // Customer APIs
  getOrderReviewStatus: (orderId) => {
    return axiosInstance.get(`/customer/orders/${orderId}/review-status`);
  },
  submitOrderReviews: (orderId, payload) => {
    return axiosInstance.post(`/customer/orders/${orderId}/reviews`, payload);
  },

  // Public APIs
  getPublicReviews: (productId, params = {}) => {
    return axiosInstance.get(`/public/products/${productId}/reviews`, { params });
  },

  // Admin APIs
  getAllReviews: (page = 1, pageSize = 20) => {
    return axiosInstance.get(`/admin/reviews`, {
      params: { page, page_size: pageSize }
    });
  },
  
  getAdminProductReviewAggregates: (page = 1, pageSize = 20) => {
    return axiosInstance.get('/admin/reviews/products', {
      params: { page, page_size: pageSize }
    });
  },

  getAdminProductReviews: (productId, page = 1, pageSize = 20) => {
    return axiosInstance.get(`/admin/reviews/products/${productId}`, {
      params: { page, page_size: pageSize }
    });
  },

  markProductReviewsRead: (productId) => {
    return axiosInstance.patch(`/admin/reviews/products/${productId}/mark-read`);
  },

  toggleReviewVisibility: (reviewId) => {
    return axiosInstance.patch(`/admin/reviews/${reviewId}/visibility`);
  },
  deleteReview: (reviewId) => {
    return axiosInstance.delete(`/admin/reviews/${reviewId}`);
  }
};

export default reviewsAPI;
