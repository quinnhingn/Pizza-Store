import React, { useState, useEffect } from 'react';
import reviewsAPI from '../../api/reviewsAPI';
import uploadAPI from '../../api/uploadAPI';
import { Camera, X } from 'lucide-react';

const ReviewOrderModal = ({ order, onClose, onSuccess }) => {
  const [reviewStatus, setReviewStatus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // State for user input: { productId: { rating: 5, comment: '' } }
  const [reviewsInput, setReviewsInput] = useState({});

  useEffect(() => {
    if (order) {
      fetchReviewStatus();
    }
  }, [order]);

  const fetchReviewStatus = async () => {
    try {
      setLoading(true);
      const res = await reviewsAPI.getOrderReviewStatus(order.id);
      const items = res.data?.items || res.items || [];
      setReviewStatus(items);
      
      // Initialize inputs for unreviewed items
      const initialInputs = {};
      items.forEach(item => {
        if (!item.is_reviewed) {
          initialInputs[item.product_id] = { rating: 5, comment: '', image_url: null, uploading: false };
        }
      });
      setReviewsInput(initialInputs);
      
    } catch (err) {
      console.error(err);
      setError('Lỗi khi tải dữ liệu đánh giá');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (productId, rating) => {
    setReviewsInput(prev => ({
      ...prev,
      [productId]: { ...prev[productId], rating }
    }));
  };

  const handleCommentChange = (productId, comment) => {
    setReviewsInput(prev => ({
      ...prev,
      [productId]: { ...prev[productId], comment }
    }));
  };

  const handleImageUpload = async (productId, file) => {
    if (!file) return;
    try {
      setReviewsInput(prev => ({
        ...prev,
        [productId]: { ...prev[productId], uploading: true }
      }));
      const formData = new FormData();
      formData.append('file', file);
      const res = await uploadAPI.uploadReviewImage(formData);
      setReviewsInput(prev => ({
        ...prev,
        [productId]: { ...prev[productId], image_url: res.data.url, uploading: false }
      }));
    } catch (err) {
      console.error(err);
      alert('Lỗi khi tải ảnh lên');
      setReviewsInput(prev => ({
        ...prev,
        [productId]: { ...prev[productId], uploading: false }
      }));
    }
  };

  const handleRemoveImage = (productId) => {
    setReviewsInput(prev => ({
      ...prev,
      [productId]: { ...prev[productId], image_url: null }
    }));
  };

  const handleSubmit = async () => {
    // Collect all inputs
    const payload = [];
    for (const [productId, data] of Object.entries(reviewsInput)) {
      payload.push({
        product_id: parseInt(productId),
        rating: data.rating,
        comment: data.comment,
        image_url: data.image_url || null
      });
    }

    if (payload.length === 0) {
      alert("Không có món ăn nào để đánh giá!");
      return;
    }

    try {
      setSubmitting(true);
      await reviewsAPI.submitOrderReviews(order.id, { reviews: payload });
      alert("Cảm ơn bạn đã đánh giá!");
      onSuccess();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Có lỗi xảy ra khi gửi đánh giá.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-white p-6 rounded-2xl">Đang tải...</div>
      </div>
    );
  }

  // Filter unique products in the order since multiple sizes of same product might be there
  const uniqueProducts = [];
  const addedIds = new Set();
  
  order.items?.forEach(item => {
    if (!addedIds.has(item.product_id)) {
      uniqueProducts.push(item);
      addedIds.add(item.product_id);
    }
  });

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full flex flex-col shadow-2xl my-auto">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h3 className="text-xl font-extrabold text-gray-900">
            Đánh giá đơn hàng {order.order_code}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:bg-gray-200 w-8 h-8 rounded-full">✕</button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
          {error && <p className="text-red-500">{error}</p>}
          
          {uniqueProducts.map(item => {
            const status = reviewStatus.find(s => s.product_id === item.product_id);
            const isReviewed = status?.is_reviewed;
            const pastReview = status?.review;
            const currentInput = reviewsInput[item.product_id];

            return (
              <div key={item.product_id} className="border border-gray-200 rounded-2xl p-4 bg-white">
                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
                  <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                     {item.product?.image_url ? (
                        <img src={item.product.image_url} alt="" className="w-full h-full object-cover" />
                     ) : <span className="text-xs">Pizza</span>}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{item.product?.name}</h4>
                    {isReviewed && <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full font-bold">Đã đánh giá</span>}
                  </div>
                </div>

                {isReviewed ? (
                  <div className="space-y-2">
                    <div className="flex text-yellow-400">
                      {[1,2,3,4,5].map(star => (
                        <span key={star} className="text-xl">{star <= pastReview.rating ? '★' : '☆'}</span>
                      ))}
                    </div>
                    {pastReview.comment && <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-xl">{pastReview.comment}</p>}
                    {pastReview.image_url && (
                      <div className="mt-2">
                        <img src={pastReview.image_url} alt="Review" className="w-24 h-24 object-cover rounded-xl border border-gray-200" />
                      </div>
                    )}
                  </div>
                ) : (
                  currentInput && (
                    <div className="space-y-3">
                      <div className="flex text-yellow-400 gap-1 cursor-pointer">
                        {[1,2,3,4,5].map(star => (
                          <span 
                            key={star} 
                            onClick={() => handleRatingChange(item.product_id, star)}
                            className="text-2xl hover:scale-110 transition"
                          >
                            {star <= currentInput.rating ? '★' : '☆'}
                          </span>
                        ))}
                      </div>
                      <textarea
                        className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                        rows="3"
                        placeholder="Chia sẻ cảm nhận của bạn về món ăn này nhé..."
                        value={currentInput.comment}
                        onChange={(e) => handleCommentChange(item.product_id, e.target.value)}
                      />
                      
                      <div className="flex items-center gap-4 mt-2">
                        {currentInput.image_url ? (
                          <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
                            <img src={currentInput.image_url} alt="Review" className="w-full h-full object-cover" />
                            <button 
                              onClick={() => handleRemoveImage(item.product_id)}
                              className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex items-center justify-center w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-red-500 hover:bg-red-50 transition text-gray-400 flex-col gap-1">
                            {currentInput.uploading ? (
                               <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                               <>
                                 <Camera className="w-6 h-6" />
                                 <span className="text-[10px] font-medium">Thêm ảnh</span>
                               </>
                            )}
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              disabled={currentInput.uploading}
                              onChange={(e) => handleImageUpload(item.product_id, e.target.files[0])} 
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            );
          })}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 bg-gray-200 text-gray-800 font-bold rounded-xl text-sm">Trở lại</button>
          
          {Object.keys(reviewsInput).length > 0 && (
            <button 
              onClick={handleSubmit} 
              disabled={submitting}
              className="px-5 py-2.5 bg-red-600 text-white font-bold rounded-xl text-sm disabled:opacity-50"
            >
              {submitting ? 'Đang gửi...' : 'Gửi Đánh Giá'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewOrderModal;
