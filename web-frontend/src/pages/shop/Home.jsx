import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import categoriesAPI from '../../api/categoriesAPI';
import productsAPI from '../../api/productsAPI';
import ProductCard from '../../components/customer/ProductCard';
import ProductDetailModal from '../../components/customer/ProductDetailModal';
import useCart from '../../hooks/useCart';
import bannersAPI from '../../api/bannersAPI';

// Import Swiper React components & styles
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const Home = () => {
  const { addToCart } = useCart();
  
  // State quản lý Banner
  const [banners, setBanners] = useState([]);

  // State quản lý danh mục
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null); // null = Tất cả

  // State quản lý sản phẩm theo danh mục (Collections)
  const [categoryCollections, setCategoryCollections] = useState({});
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMoreCat, setLoadingMoreCat] = useState({}); // tracking loading state per category
  const [error, setError] = useState(null);

  // State tìm kiếm
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // State quản lý Modal Chi Tiết Món & Toast thông báo giỏ hàng
  const [activeDetailProduct, setActiveDetailProduct] = useState(null);
  const [toastAlert, setToastAlert] = useState(null);

  const menuSectionRef = useRef(null);

  // Tạo map id -> name danh mục
  const categoryNameMap = useMemo(() => {
    const map = {};
    categories.forEach((cat) => {
      map[cat.id] = cat.name;
    });
    return map;
  }, [categories]);

  // Debounce input tìm kiếm
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Tải danh sách Categories và Banners (chỉ chạy 1 lần khi mount)
  useEffect(() => {
    const fetchCategoriesAndBanners = async () => {
      try {
        const [catRes, banRes] = await Promise.all([
          categoriesAPI.getCategories(),
          bannersAPI.getPublicBanners()
        ]);
        
        // Handle Categories
        const catData = Array.isArray(catRes) ? catRes : (catRes?.data?.data || catRes?.data || catRes?.items || []);
        if (Array.isArray(catData)) setCategories(catData);
        
        // Handle Banners
        const banData = Array.isArray(banRes) ? banRes : (banRes?.data || []);
        setBanners(banData);
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu khởi tạo:', err);
      }
    };
    fetchCategoriesAndBanners();
  }, []);

  // Tải danh sách Products theo category (hoặc tất cả)
  useEffect(() => {
    if (categories.length === 0) return;

    const fetchCollections = async () => {
      setLoadingInitial(true);
      setError(null);
      try {
        const newCollections = {};
        
        if (selectedCategory === null) {
          // Lấy 4 sản phẩm cho TẤT CẢ danh mục
          const promises = categories.map(cat => 
            productsAPI.getPublicProducts({ category_id: cat.id, page: 1, page_size: 4, search: debouncedSearch })
              .then(res => {
                const resData = (res && res.items !== undefined) ? res : (res?.data?.data || res?.data || res || {});
                const items = resData.items || resData.data || (Array.isArray(resData) ? resData : []);
                const itemsArray = Array.isArray(items) ? items : [];
                newCollections[cat.id] = {
                  items: itemsArray,
                  page: 1,
                  hasMore: itemsArray.length === 4 // Đơn giản hóa, nếu đúng 4 thì có thể có thêm
                };
              })
              .catch(err => console.error(err))
          );
          await Promise.all(promises);
        } else {
          // Nếu chọn 1 danh mục, lấy 12 sản phẩm ban đầu cho danh mục đó
          const res = await productsAPI.getPublicProducts({ category_id: selectedCategory, page: 1, page_size: 12, search: debouncedSearch });
          const resData = (res && res.items !== undefined) ? res : (res?.data?.data || res?.data || res || {});
          const items = resData.items || resData.data || (Array.isArray(resData) ? resData : []);
          const itemsArray = Array.isArray(items) ? items : [];
          newCollections[selectedCategory] = {
            items: itemsArray,
            page: 1,
            hasMore: itemsArray.length === 12
          };
        }

        setCategoryCollections(newCollections);
      } catch (err) {
        console.error('Lỗi khi tải thực đơn:', err);
        setError('Không thể tải thực đơn lúc này. Vui lòng thử lại sau.');
      } finally {
        setLoadingInitial(false);
      }
    };

    fetchCollections();
  }, [categories, selectedCategory, debouncedSearch]);

  // Handle Load More
  const handleLoadMore = async (categoryId) => {
    setLoadingMoreCat(prev => ({ ...prev, [categoryId]: true }));
    try {
      const currentData = categoryCollections[categoryId];
      if (!currentData) return;
      
      const nextPage = currentData.page + 1;
      const pageSize = selectedCategory === null ? 4 : 12;

      const res = await productsAPI.getPublicProducts({ category_id: categoryId, page: nextPage, page_size: pageSize, search: debouncedSearch });
      const resData = (res && res.items !== undefined) ? res : (res?.data?.data || res?.data || res || {});
      const newItems = resData.items || resData.data || (Array.isArray(resData) ? resData : []);
      const newItemsArray = Array.isArray(newItems) ? newItems : [];

      setCategoryCollections(prev => ({
        ...prev,
        [categoryId]: {
          items: [...prev[categoryId].items, ...newItemsArray],
          page: nextPage,
          hasMore: newItemsArray.length === pageSize
        }
      }));
    } catch (err) {
      console.error('Lỗi khi tải thêm:', err);
    } finally {
      setLoadingMoreCat(prev => ({ ...prev, [categoryId]: false }));
    }
  };

  // Reset toàn bộ bộ lọc
  const handleClearFilters = () => {
    setSelectedCategory(null);
    setSearchQuery('');
    setDebouncedSearch('');
  };

  // Xử lý khi chọn món (Mở Modal chi tiết)
  const handleSelectProduct = (product) => {
    setActiveDetailProduct(product);
  };

  const handleAddToCartFromModal = async (payload) => {
    if (!payload) return;
    const apiPayload = {
      product_id: payload.product.id,
      size_name: payload.size?.size_name || null,
      toppings: (payload.toppings || []).map(t => ({
        name: t.topping_name || t.name,
        price: Number(t.extra_price || t.price || 0)
      })),
      quantity: payload.quantity || 1,
      note: payload.note || "",
      unit_price: Number(payload.unitPrice || 0),
      product_info: payload.product
    };
    const result = await addToCart(apiPayload);
    if (result && result.success !== false) {
      setToastAlert('Đã thêm vào giỏ hàng');
      setTimeout(() => {
        setToastAlert(null);
      }, 4000);
    } else {
      alert(result?.message || 'Có lỗi khi thêm vào giỏ hàng');
    }
  };

  // Hàm cuộn mượt khi chọn category trên navbar
  const handleCategoryClick = (catId) => {
    setSelectedCategory(catId);
    // Có thể cuộn xuống menu để người dùng thấy món ăn ngay
    menuSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen pb-16 bg-gray-50">
      {/* Modal Chi tiết Món */}
      <ProductDetailModal
        product={activeDetailProduct}
        isOpen={Boolean(activeDetailProduct)}
        onClose={() => setActiveDetailProduct(null)}
        onAddToCart={handleAddToCartFromModal}
      />

      {/* Toast */}
      {toastAlert && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-6 py-3.5 rounded-2xl shadow-xl shadow-emerald-600/30 flex items-center gap-4 animate-fadeIn border border-emerald-500/30">
          <span className="text-sm font-bold tracking-wide">{toastAlert}</span>
          <button
            onClick={() => setToastAlert(null)}
            className="text-emerald-200 hover:text-white transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sticky Category Bar (Nằm trên Banner, gắn liền với topbar khi cuộn) */}
      <div className="sticky top-[60px] sm:top-[64px] z-40 w-full bg-white border-b border-gray-100 py-3 px-4 flex justify-center shadow-sm">
        <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-600 text-white shadow-md shadow-red-600/20 border border-red-700/50 rounded-full px-4 sm:px-6 py-1.5 sm:py-2 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-6xl w-full">
          
          {/* Menu Danh Mục */}
          <div className="flex-1 flex items-center sm:justify-center gap-6 overflow-x-auto no-scrollbar scroll-smooth w-full">
            <button
              type="button"
              onClick={() => handleCategoryClick(null)}
              className={`py-2 whitespace-nowrap text-sm sm:text-base transition-all duration-300 border-b-[3px] uppercase ${
                selectedCategory === null
                  ? 'border-white text-white font-bold'
                  : 'border-transparent text-white/70 hover:text-white font-medium'
              }`}
            >
              TẤT CẢ
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryClick(cat.id)}
                className={`py-2 whitespace-nowrap text-sm sm:text-base transition-all duration-300 border-b-[3px] uppercase ${
                  selectedCategory === cat.id
                    ? 'border-white text-white font-bold'
                    : 'border-transparent text-white/70 hover:text-white font-medium'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Thanh Tìm Kiếm */}
          <div className="relative shrink-0 w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Search className="w-4 h-4 text-gray-500" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm món ăn..."
              className="w-full pl-10 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Banner Section */}
      {banners.length > 0 && (
        <section className="w-full">
          <Swiper
            modules={[Autoplay, Pagination, Navigation]}
            spaceBetween={0}
            slidesPerView={1}
            navigation
            pagination={{ clickable: true }}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            loop={banners.length > 1}
            className="w-full h-[250px] sm:h-[350px] md:h-[450px] lg:h-[500px]"
          >
            {banners.map((banner) => (
              <SwiperSlide key={banner.id}>
                <div 
                  className="w-full h-full relative group cursor-pointer"
                  onClick={() => {
                    if (banner.link_url) {
                      window.location.href = banner.link_url;
                    }
                  }}
                >
                  <img
                    src={banner.image_url.startsWith('http') ? banner.image_url : `http://localhost:8000${banner.image_url}`}
                    alt={banner.title || 'Banner'}
                    className="w-full h-full object-cover object-center"
                  />
                  {(banner.title || banner.description) && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-8 sm:p-12 md:px-24">
                      {banner.title && (
                        <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white drop-shadow-lg mb-2 sm:mb-4">
                          {banner.title}
                        </h2>
                      )}
                      {banner.description && (
                        <p className="text-gray-200 text-sm sm:text-lg lg:text-xl max-w-2xl drop-shadow-md leading-relaxed">
                          {banner.description}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </section>
      )}

      {/* Menu Section */}
      <section ref={menuSectionRef} className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 scroll-mt-32">
        {/* Thông báo lỗi nếu có */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-5 rounded-2xl mb-8 text-center font-medium shadow-sm">
            {error}
          </div>
        )}

        {/* Loading Spinner cho dữ liệu khởi tạo */}
        {loadingInitial ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#b31b1b]">
            <Loader2 className="w-12 h-12 animate-spin mb-4" />
            <p className="font-medium animate-pulse">Đang tải thực đơn...</p>
          </div>
        ) : (
          /* Render Sections theo từng Danh mục */
          <div className="flex flex-col gap-12 sm:gap-16">
            {categories.map((cat) => {
              // Nếu đang chọn 1 danh mục cụ thể và không phải danh mục này thì bỏ qua
              if (selectedCategory !== null && selectedCategory !== cat.id) return null;

              const catData = categoryCollections[cat.id];
              // Ẩn nếu không có dữ liệu cho danh mục này
              if (!catData || catData.items.length === 0) {
                // Chỉ hiển thị thông báo trống nếu đang chọn đích danh danh mục này
                if (selectedCategory === cat.id) {
                  return (
                    <div key={cat.id} className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-12 text-center max-w-lg mx-auto my-6">
                      <span className="text-5xl block mb-4">🍽️</span>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Không tìm thấy món ăn phù hợp
                      </h3>
                      <button
                        type="button"
                        onClick={handleClearFilters}
                        className="mt-4 px-6 py-2.5 bg-[#b31b1b] hover:bg-red-800 text-white font-semibold rounded-xl text-sm transition-all"
                      >
                        Xóa tất cả bộ lọc
                      </button>
                    </div>
                  );
                }
                return null;
              }

              return (
                <section key={cat.id} className="w-full">
                  {/* Tiêu đề Section */}
                  <div className="flex items-center gap-4 mb-6 sm:mb-8">
                    <h3 className="text-xl sm:text-2xl font-black uppercase text-gray-900 border-l-4 border-[#b31b1b] pl-3 sm:pl-4">
                      {cat.name}
                    </h3>
                    <div className="h-px bg-gray-200 flex-1"></div>
                  </div>

                  {/* Lưới sản phẩm */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
                    {catData.items.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        categoryNameMap={categoryNameMap}
                        onSelectProduct={handleSelectProduct}
                      />
                    ))}
                  </div>

                  {/* Nút Xem thêm */}
                  {catData.hasMore && (
                    <div className="mt-8 sm:mt-10 flex justify-center">
                      <button
                        onClick={() => handleLoadMore(cat.id)}
                        disabled={loadingMoreCat[cat.id]}
                        className="flex items-center justify-center min-w-[160px] gap-2 px-6 py-2.5 sm:py-3 border-2 border-[#b31b1b] text-[#b31b1b] font-bold rounded-full hover:bg-[#b31b1b] hover:text-white transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed group shadow-sm hover:shadow-md"
                      >
                        {loadingMoreCat[cat.id] ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Đang tải...</span>
                          </>
                        ) : (
                          <span>Xem thêm {cat.name}</span>
                        )}
                      </button>
                    </div>
                  )}
                </section>
              );
            })}
            
            {/* Trường hợp tất cả rỗng (Tìm kiếm không ra) */}
            {selectedCategory === null && Object.values(categoryCollections).every(c => !c || c.items.length === 0) && (
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-12 text-center max-w-lg mx-auto my-6">
                <span className="text-5xl block mb-4">🍽️</span>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Không tìm thấy món ăn phù hợp
                </h3>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="mt-4 px-6 py-2.5 bg-[#b31b1b] hover:bg-red-800 text-white font-semibold rounded-xl text-sm transition-all"
                >
                  Xóa tất cả bộ lọc
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;