import React, { useState, useEffect, useCallback } from 'react';
import { Star, Eye, EyeOff, Trash2, X } from 'lucide-react';
import reviewsAPI from '../../api/reviewsAPI';

const AdminProductReviewsModal = ({ product, onClose, onSuccess }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await reviewsAPI.getAdminProductReviews(product.product_id, page);
      setReviews(res.items || []);
      setTotalPages(res.total_pages || 1);
      setTotalCount(res.total_count || 0);
      setError(null);
    } catch (err) {
      setError('Lỗi khi tải dữ liệu đánh giá');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [product.product_id, page]);

  // Mark as read only once when modal mounts
  useEffect(() => {
    if (product.new_reviews_count > 0) {
      reviewsAPI.markProductReviewsRead(product.product_id)
        .then(() => {
          if (onSuccess) onSuccess();
        })
        .catch(err => console.error(err));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleToggleVisibility = async (reviewId) => {
    try {
      await reviewsAPI.toggleReviewVisibility(reviewId);
      // Cập nhật state trực tiếp để đỡ gọi API lại
      setReviews(reviews.map(r => 
        r.id === reviewId ? { ...r, is_visible: !r.is_visible } : r
      ));
    } catch (err) {
      alert('Không thể thay đổi trạng thái hiển thị');
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đánh giá này không? Hành động này không thể hoàn tác.')) return;
    try {
      await reviewsAPI.deleteReview(reviewId);
      alert('Đã xóa đánh giá thành công');
      fetchReviews(); // Gọi lại để cập nhật phân trang
      if (onSuccess) onSuccess(); // Báo component cha cập nhật tổng số
    } catch (err) {
      alert('Không thể xóa đánh giá');
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('vi-VN', {
      hour: '2-digit', minute: '2-digit',
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
              {product.image_url ? (
                <img src={product.image_url} alt={product.product_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-xs">Pizza</div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-gray-900 line-clamp-1">
                Đánh giá: {product.product_name}
              </h2>
              <div className="flex items-center gap-2 text-sm mt-1">
                <span className="flex items-center text-amber-500 font-bold">
                  <Star className="w-4 h-4 fill-current mr-1" />
                  {product.average_rating > 0 ? product.average_rating.toFixed(1) : '0'}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600">{totalCount} đánh giá</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
            </div>
          ) : error ? (
            <div className="text-center p-8 text-rose-600 bg-rose-50 rounded-2xl border border-rose-100 font-medium">
              {error}
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center p-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-gray-500 font-medium">Chưa có đánh giá nào cho sản phẩm này.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div 
                  key={review.id} 
                  className={`bg-white p-5 rounded-2xl border transition-all duration-200 shadow-sm ${
                    review.is_visible ? 'border-gray-100' : 'border-rose-100 bg-rose-50/30 opacity-75'
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-md">
                        {review.user?.full_name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{review.user?.full_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3.5 h-3.5 ${
                                  star <= review.rating 
                                    ? 'text-yellow-400 fill-current' 
                                    : 'text-gray-200 fill-current'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-gray-400">• {formatDate(review.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleVisibility(review.id)}
                        title={review.is_visible ? "Ẩn đánh giá" : "Hiện đánh giá"}
                        className={`p-2 rounded-xl transition cursor-pointer ${
                          review.is_visible 
                            ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' 
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        }`}
                      >
                        {review.is_visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(review.id)}
                        title="Xóa đánh giá"
                        className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {review.comment && (
                    <div className="mt-4 pl-14">
                      <p className="text-gray-700 bg-gray-50 rounded-xl p-3 border border-gray-100 italic text-sm">
                        "{review.comment}"
                      </p>
                    </div>
                  )}
                  
                  {!review.is_visible && (
                    <div className="mt-3 pl-14">
                      <span className="inline-flex items-center px-2 py-1 bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg">
                        Đã ẩn khỏi trang khách hàng
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-white border-t border-gray-100 flex justify-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold disabled:opacity-50 hover:bg-gray-50 transition cursor-pointer"
            >
              Trang trước
            </button>
            <div className="flex items-center px-4 font-bold text-gray-700">
              {page} / {totalPages}
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold disabled:opacity-50 hover:bg-gray-50 transition cursor-pointer"
            >
              Trang sau
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProductReviewsModal;
