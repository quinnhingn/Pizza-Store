import React, { useState, useEffect } from 'react';
import { Star, X } from 'lucide-react';
import reviewsAPI from '../../api/reviewsAPI';

const CustomerProductReviewsModal = ({ product, onClose }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchReviews(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const fetchReviews = async (currentPage) => {
    try {
      setLoading(true);
      const res = await reviewsAPI.getPublicReviews(product.id || product.product_id, { page: currentPage, page_size: 10 });
      const data = res.data || res;
      setReviews(data.items || []);
      setTotalPages(data.total_pages || 1);
      setTotalCount(data.total_count || 0);
      setError(null);
    } catch (err) {
      setError('Lỗi khi tải dữ liệu đánh giá');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  const productName = product.name || product.product_name;
  const productImage = product.image_url;
  const averageRating = product.average_rating || 0;
  const reviewCount = product.total_reviews || 0;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => { e.stopPropagation(); onClose(); }}
    >
      <div 
        className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
              {productImage ? (
                <img src={productImage} alt={productName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-xs">Pizza</div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-gray-900 line-clamp-1">
                Đánh giá: {productName}
              </h2>
              <div className="flex items-center gap-2 text-sm mt-1">
                <span className="flex items-center text-amber-500 font-bold">
                  <Star className="w-4 h-4 fill-current mr-1" />
                  {averageRating > 0 ? averageRating.toFixed(1) : '0'}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600">{reviewCount} đánh giá</span>
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
              <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full" />
            </div>
          ) : error ? (
            <div className="text-center p-8 text-rose-600 bg-rose-50 rounded-2xl border border-rose-100 font-medium">
              {error}
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center p-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-gray-500 font-medium text-lg">Chưa có đánh giá nào cho sản phẩm này.</p>
              <p className="text-sm text-gray-400 mt-2">Hãy là người đầu tiên trải nghiệm và để lại đánh giá nhé!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div 
                  key={review.id} 
                  className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm transition-all duration-200"
                >
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-red-500 to-orange-500 flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
                      {review.user?.full_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-gray-900">{review.user?.full_name || 'Khách hàng'}</p>
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
                      
                      {(review.comment || review.image_url) && (
                        <div className="mt-3 space-y-3">
                          {review.comment && (
                            <p className="text-gray-700 leading-relaxed text-sm">
                              {review.comment}
                            </p>
                          )}
                          {review.image_url && (
                            <div className="w-24 h-24 rounded-xl overflow-hidden border border-gray-200 cursor-pointer hover:opacity-90 transition" onClick={() => window.open(review.image_url, '_blank')}>
                              <img src={review.image_url} alt="Review" className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
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

export default CustomerProductReviewsModal;
