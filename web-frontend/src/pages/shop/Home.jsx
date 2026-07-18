import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import categoriesAPI from '../../api/categoriesAPI';
import productsAPI from '../../api/productsAPI';
import ProductCard from '../../components/customer/ProductCard';

const PRICE_RANGES = [
  { label: 'Tất cả giá', min: null, max: null },
  { label: 'Dưới 150k', min: 0, max: 150000 },
  { label: '150k - 250k', min: 150000, max: 250000 },
  { label: 'Trên 250k', min: 250000, max: null },
];

const Home = () => {
  // State quản lý danh mục
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null); // null = Tất cả

  // State quản lý sản phẩm & phân trang
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 8;

  // State tìm kiếm & bộ lọc giá
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedPriceIndex, setSelectedPriceIndex] = useState(0);

  // State thông báo/chọn món tạm thời (chuẩn bị cho Day 13 Modal)
  const [selectedProductAlert, setSelectedProductAlert] = useState(null);

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
      setCurrentPage(1); // Reset về trang 1 khi tìm kiếm mới
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Tải danh sách Categories (chỉ chạy 1 lần khi mount)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoriesAPI.getCategories();
        // Do axiosInstance interceptor đã trả về response.data, response chính là mảng categories
        const data = Array.isArray(response) ? response : (response?.data?.data || response?.data || response?.items || []);
        if (Array.isArray(data)) {
          setCategories(data);
        }
      } catch (err) {
        console.error('Lỗi khi tải danh mục:', err);
      }
    };
    fetchCategories();
  }, []);

  // Tải danh sách Products từ Public API mỗi khi bộ lọc/trang thay đổi
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const currentPriceRange = PRICE_RANGES[selectedPriceIndex];
        const params = {
          page: currentPage,
          page_size: pageSize,
        };

        if (selectedCategory !== null) {
          params.category_id = selectedCategory;
        }
        if (debouncedSearch) {
          params.search = debouncedSearch;
        }
        if (currentPriceRange.min !== null) {
          params.min_price = currentPriceRange.min;
        }
        if (currentPriceRange.max !== null) {
          params.max_price = currentPriceRange.max;
        }

        const response = await productsAPI.getPublicProducts(params);
        // Do axiosInstance interceptor đã trả về response.data, response chính là object { items, total_count, ... }
        const resData = (response && response.items !== undefined) ? response : (response?.data?.data || response?.data || response || {});

        const items = resData.items || resData.data || (Array.isArray(resData) ? resData : []);
        setProducts(Array.isArray(items) ? items : []);
        setTotalPages(resData.total_pages || 1);
        setTotalCount(resData.total_count !== undefined ? resData.total_count : items.length);
      } catch (err) {
        console.error('Lỗi khi tải thực đơn:', err);
        setError('Không thể tải thực đơn lúc này. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedCategory, debouncedSearch, selectedPriceIndex, currentPage]);

  // Cuộn mượt xuống khu vực thực đơn khi bấm Khám Phá
  const handleScrollToMenu = () => {
    menuSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Reset toàn bộ bộ lọc
  const handleClearFilters = () => {
    setSelectedCategory(null);
    setSearchQuery('');
    setDebouncedSearch('');
    setSelectedPriceIndex(0);
    setCurrentPage(1);
  };

  // Xử lý khi chọn món (Day 12 feedback - chuẩn bị chuyển tiếp Day 13)
  const handleSelectProduct = (product) => {
    setSelectedProductAlert(product);
    setTimeout(() => {
      setSelectedProductAlert(null);
    }, 4000);
  };

  return (
    <div className="min-h-screen pb-16 bg-gray-50">
      {/* Toast thông báo chọn món nhanh (Day 12 feedback) */}
      {selectedProductAlert && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-stone-700 flex items-center gap-3 animate-bounce">
          <span className="text-xl">🍕</span>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Đã chọn món</p>
            <p className="text-sm font-bold text-white">{selectedProductAlert.name}</p>
          </div>
          <button
            onClick={() => setSelectedProductAlert(null)}
            className="ml-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hero Banner Section - Phong cách Italian Artisan Dining */}
      <section className="relative overflow-hidden bg-gradient-to-r from-stone-900 via-red-950 to-stone-900 text-white py-20 sm:py-28 lg:py-32 shadow-lg">
        {/* Họa tiết phông nền mờ tạo độ sâu sang trọng */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center max-w-4xl">
          <span className="inline-block px-4 py-1.5 rounded-full bg-red-600/30 border border-red-500/40 text-red-300 font-semibold text-xs sm:text-sm tracking-widest uppercase mb-6 backdrop-blur-sm">
            Italian Artisan Pizzeria
          </span>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-tight text-white drop-shadow-sm">
            Hương Vị Pizza Ý <span className="text-red-500">Đích Thực</span>
          </h1>
          <p className="mt-6 text-base sm:text-lg lg:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed font-light">
            Thưởng thức công thức vỏ bánh thủ công ủ men tự nhiên giòn rụm, phô mai Mozzarella hảo hạng cùng nguồn nguyên liệu tươi ngon chuẩn vị mỗi ngày.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
            <button
              onClick={handleScrollToMenu}
              className="w-full sm:w-auto px-8 py-4 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-base sm:text-lg rounded-2xl shadow-xl hover:shadow-red-600/30 transition-all duration-200"
            >
              Khám Phá Thực Đơn
            </button>
          </div>
        </div>
      </section>

      {/* Menu Section */}
      <section ref={menuSectionRef} className="container mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-16">
        {/* Tiêu đề khu vực */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Thực Đơn <span className="text-red-600">Hôm Nay</span>
            </h2>
            <p className="text-gray-500 text-sm sm:text-base mt-1.5">
              Chọn ngay món ăn yêu thích và tùy chỉnh kích thước theo ý bạn
            </p>
          </div>

          {/* Ô Tìm Kiếm theo từ khóa món / nguyên liệu */}
          <div className="relative w-full md:w-80 lg:w-96">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tên món hoặc nguyên liệu (tôm, phô mai...)"
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Bộ Lọc Nhanh: Danh mục (Tabs ngang) & Khoảng giá (Pills) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-sm mb-10 space-y-4">
          {/* Hàng 1: Danh mục */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory(null);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                selectedCategory === null
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200/80'
              }`}
            >
              Tất cả
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                  selectedCategory === cat.id
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200/80'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Hàng 2: Bộ lọc mức giá */}
          <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
            <span className="text-gray-500 font-medium">Khoảng giá:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {PRICE_RANGES.map((range, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedPriceIndex(idx);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    selectedPriceIndex === idx
                      ? 'bg-stone-900 text-white shadow-sm'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Thông báo lỗi nếu có */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-5 rounded-2xl mb-8 text-center font-medium shadow-sm">
            {error}
          </div>
        )}

        {/* Lưới Sản Phẩm hoặc Trạng thái tải / Trống */}
        {loading ? (
          /* Skeleton Loading Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col animate-pulse"
              >
                <div className="w-full aspect-[4/3] bg-gray-200 rounded-xl mb-4" />
                <div className="h-5 bg-gray-200 rounded-md w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded-md w-full mb-1" />
                <div className="h-4 bg-gray-200 rounded-md w-2/3 mb-6" />
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between mt-auto">
                  <div className="h-6 bg-gray-200 rounded-md w-1/3" />
                  <div className="h-10 bg-gray-200 rounded-xl w-28" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          /* Lưới Sản Phẩm Thực Tế */
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  categoryNameMap={categoryNameMap}
                  onSelectProduct={handleSelectProduct}
                />
              ))}
            </div>

            {/* Phân trang */}
            {totalPages > 1 && (
              <div className="mt-14 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 sm:px-6 rounded-2xl border border-gray-200 shadow-sm">
                <span className="text-sm text-gray-600 font-medium">
                  Hiển thị trang <strong className="text-gray-900">{currentPage}</strong> / <strong className="text-gray-900">{totalPages}</strong> (Tổng cộng <strong className="text-red-600">{totalCount}</strong> món)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => {
                      setCurrentPage((prev) => Math.max(prev - 1, 1));
                      handleScrollToMenu();
                    }}
                    className={`px-3.5 py-2 rounded-xl text-sm font-semibold flex items-center gap-1 transition-all ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 active:scale-95 shadow-sm'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                    <span>Trước</span>
                  </button>
                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => {
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                      handleScrollToMenu();
                    }}
                    className={`px-3.5 py-2 rounded-xl text-sm font-semibold flex items-center gap-1 transition-all ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 active:scale-95 shadow-sm'
                    }`}
                  >
                    <span>Tiếp</span>
                    <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Trạng thái không tìm thấy món phù hợp */
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-12 text-center max-w-lg mx-auto my-6">
            <span className="text-5xl block mb-4">🍽️</span>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Không tìm thấy món ăn phù hợp
            </h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Vui lòng thử điều chỉnh lại bộ lọc giá, từ khóa tìm kiếm hoặc chọn danh mục khác nhé!
            </p>
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-red-600/20"
            >
              Xóa tất cả bộ lọc
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;