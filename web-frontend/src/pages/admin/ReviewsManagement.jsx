import React, { useState, useEffect } from 'react';
import { MessageSquare, Star, Search, ChevronRight } from 'lucide-react';
import reviewsAPI from '../../api/reviewsAPI';
import AdminProductReviewsModal from '../../components/admin/AdminProductReviewsModal';

const ReviewsManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalCount: 0 });
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    fetchProducts(pagination.page);
  }, [pagination.page]);

  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);
      const res = await reviewsAPI.getAdminProductReviewAggregates(page, 12);
      const data = res.data || res;
      setProducts(data.items || []);
      setPagination({
        page: data.page || 1,
        totalPages: data.total_pages || 1,
        totalCount: data.total_count || 0
      });
    } catch (error) {
      console.error('Failed to fetch product reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-7 h-7 text-red-600" />
            Quản lý Đánh giá
          </h2>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full mb-3" />
            <p className="text-gray-500">Đang tải dữ liệu...</p>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <div key={product.product_id} className="group relative bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-xl hover:border-red-100 transition-all duration-300 flex flex-col h-full">
                  
                  {/* New review badge */}
                  {product.new_reviews_count > 0 && (
                    <div className="absolute -top-2 -right-2 z-10 bg-rose-500 text-white text-[10px] font-extrabold px-2 py-1 rounded-full shadow-lg border-2 border-white animate-bounce">
                      Có {product.new_reviews_count} đánh giá mới!
                    </div>
                  )}

                  <div className="w-full h-40 bg-gray-50 rounded-xl overflow-hidden mb-4 flex-shrink-0 relative">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.product_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold text-lg">
                        Pizza
                      </div>
                    )}
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  
                  <div className="flex-1 flex flex-col">
                    <h3 className="font-bold text-gray-900 text-base line-clamp-2 mb-2 group-hover:text-red-600 transition-colors">
                      {product.product_name}
                    </h3>
                    
                    {product.total_reviews > 0 ? (
                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                        <div>
                          <div className="flex items-center text-amber-500 font-bold text-sm">
                            <Star className="w-4 h-4 fill-current mr-1" />
                            {product.average_rating > 0 ? product.average_rating.toFixed(1) : '0'}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{product.total_reviews} đánh giá</p>
                        </div>
                        <button
                          onClick={() => setSelectedProduct(product)}
                          className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors shadow-sm"
                          title="Xem đánh giá"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                         <p className="text-sm font-semibold text-gray-400 italic">Chưa có đánh giá nào!</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {products.length === 0 && (
              <div className="text-center py-16">
                <p className="text-gray-500 text-lg font-medium">Không tìm thấy món ăn nào.</p>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
            <p className="text-sm text-gray-500 font-medium">
              Hiển thị trang <span className="font-bold text-gray-900">{pagination.page}</span> / {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={pagination.page === 1}
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition"
              >
                Trước
              </button>
              <button
                disabled={pagination.page === pagination.totalPages}
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Product Reviews Modal */}
      {selectedProduct && (
        <AdminProductReviewsModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onSuccess={() => fetchProducts(pagination.page)}
        />
      )}
    </div>
  );
};

export default ReviewsManagement;
