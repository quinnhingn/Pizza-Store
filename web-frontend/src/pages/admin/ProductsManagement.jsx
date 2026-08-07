import { useState, useEffect, Fragment } from 'react';
import productsAPI from '../../api/productsAPI';
import categoriesAPI from '../../api/categoriesAPI';
import ProductModal from '../../components/admin/ProductModal';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import { Plus, Search, Edit2, Trash2, Package, Image as ImageIcon, Filter, Maximize2, Layers, UtensilsCrossed, ChevronRight } from 'lucide-react';

const ProductsManagement = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleRowExpand = (productId) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'available', 'unavailable'

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [catsData, prodsData] = await Promise.all([
        categoriesAPI.getCategories(),
        productsAPI.getProducts()
      ]);
      setCategories(Array.isArray(catsData) ? catsData : []);
      setProducts(Array.isArray(prodsData) ? prodsData : []);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Lỗi khi tải danh sách sản phẩm';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prod) => {
    setSelectedProduct(prod);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (prod) => {
    setProductToDelete(prod);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete?.id) return;
    setDeleting(true);
    try {
      await productsAPI.deleteProduct(productToDelete.id);
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
      await fetchData();
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Không thể xóa sản phẩm này';
      alert(msg);
    } finally {
      setDeleting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const filteredProducts = products.filter((prod) => {
    const matchSearch = prod.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = selectedCategoryId ? String(prod.category_id) === String(selectedCategoryId) : true;
    const matchStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'available'
        ? prod.is_available === true
        : prod.is_available === false;

    return matchSearch && matchCategory && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Quản lý Sản phẩm</h2>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          <span>Thêm Sản phẩm</span>
        </button>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="flex items-center gap-3 bg-gray-50/75 border border-gray-200 px-3 py-2 rounded-lg">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên sản phẩm..."
            className="w-full text-sm bg-transparent focus:outline-none placeholder-gray-400"
          />
        </div>

        <div className="flex items-center gap-2 bg-gray-50/75 border border-gray-200 px-3 py-2 rounded-lg">
          <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="w-full text-sm bg-transparent focus:outline-none text-gray-700"
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 bg-gray-50/75 border border-gray-200 px-3 py-2 rounded-lg">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full text-sm bg-transparent focus:outline-none text-gray-700"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="available">Đang kinh doanh (Available)</option>
            <option value="unavailable">Ngừng kinh doanh (Unavailable)</option>
          </select>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="py-3 px-4 w-10 text-center text-xs font-semibold text-gray-400">#</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Sản phẩm</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Danh mục</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Giá bán</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Kích cỡ / Toppings</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Nguyên liệu chính</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Trạng thái</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                      <span>Đang tải thực đơn...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-500">
                    <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" strokeWidth={1.5} />
                    <span>Không tìm thấy sản phẩm nào phù hợp.</span>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const categoryName = categories.find((c) => c.id === prod.category_id)?.name || 'Khác';
                  const isExpanded = expandedRows.has(prod.id);
                  return (
                    <Fragment key={prod.id}>
                      <tr className={`hover:bg-gray-50/75 transition-colors ${isExpanded ? 'bg-blue-50/30' : ''}`}>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => toggleRowExpand(prod.id)}
                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all cursor-pointer"
                            title={isExpanded ? "Thu gọn chi tiết" : "Xem chi tiết cấu hình"}
                          >
                            <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90 text-blue-600' : ''}`} />
                          </button>
                        </td>
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3">
                            {prod.image_url ? (
                              <img
                                src={prod.image_url}
                                alt={prod.name}
                                className="w-10 h-10 rounded-lg object-cover border border-gray-200 flex-shrink-0 bg-gray-50 shadow-2xs"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 flex-shrink-0">
                                <ImageIcon className="w-5 h-5" strokeWidth={1.5} />
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-gray-900 text-sm">{prod.name}</div>
                              <div className="text-[11px] text-gray-400 font-mono">ID: {prod.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-6 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/80 shadow-2xs">
                            {categoryName}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 whitespace-nowrap font-mono text-gray-900 text-sm">
                          {formatCurrency(prod.price)}
                        </td>
                        <td className="py-3.5 px-6">
                          <div className="flex flex-wrap gap-1.5 items-center">
                            {/* Sizes badge */}
                            {Array.isArray(prod.sizes) && prod.sizes.length > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/80">
                                <Maximize2 className="w-2.5 h-2.5" /> {prod.sizes.length} Sizes
                              </span>
                            ) : null}

                            {/* Toppings badge */}
                            {Array.isArray(prod.toppings) && prod.toppings.length > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200/80">
                                <Layers className="w-2.5 h-2.5" /> {prod.toppings.length} Topping
                              </span>
                            ) : null}

                            {(!Array.isArray(prod.sizes) || prod.sizes.length === 0) &&
                             (!Array.isArray(prod.toppings) || prod.toppings.length === 0) && (
                              <span className="text-gray-400 italic text-[11px]">-- Mặc định --</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-6">
                          {Array.isArray(prod.ingredients) && prod.ingredients.length > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-200/80">
                              <UtensilsCrossed className="w-2.5 h-2.5" /> {prod.ingredients.length} Nguyên liệu
                            </span>
                          ) : (
                            <span className="text-gray-400 italic text-xs">-- Không có --</span>
                          )}
                        </td>
                        <td className="py-3.5 px-6 whitespace-nowrap">
                          {prod.is_available ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 whitespace-nowrap">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                              Đang kinh doanh
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200 whitespace-nowrap">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                              Tạm ngưng bán
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-6 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(prod)}
                              className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Sửa sản phẩm"
                            >
                              <Edit2 className="w-4 h-4" strokeWidth={1.75} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenDelete(prod)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Xóa sản phẩm"
                            >
                              <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Detail Drawer Row */}
                      {isExpanded && (
                        <tr className="bg-gradient-to-b from-blue-50/40 via-gray-50/70 to-white border-b border-gray-200">
                          <td colSpan="8" className="p-5 pl-14">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* Box 1: Sizes detail */}
                              <div className="bg-white border border-blue-100 rounded-xl p-3.5 shadow-2xs">
                                <div className="flex items-center gap-2 mb-2.5 pb-2 border-b border-blue-50">
                                  <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center text-blue-600">
                                    <Maximize2 className="w-3.5 h-3.5" />
                                  </div>
                                  <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider">Kích cỡ (sizes)</h4>
                                </div>
                                {Array.isArray(prod.sizes) && prod.sizes.length > 0 ? (
                                  <div className="space-y-1.5">
                                    {prod.sizes.map((s, idx) => {
                                      const multText = s.price_multiplier !== 1 ? `Hệ số x${s.price_multiplier}` : 'Giá chuẩn';
                                      const extraText = s.extra_price > 0 ? `+${formatCurrency(s.extra_price)}` : '';
                                      const calcPrice = (Number(prod.price) * Number(s.price_multiplier)) + Number(s.extra_price);
                                      return (
                                        <div key={idx} className="flex items-center justify-between text-xs bg-blue-50/40 px-2.5 py-1.5 rounded-lg border border-blue-100/60 font-medium">
                                          <span className="text-blue-900 font-semibold">{s.size_name} <span className="text-[11px] text-blue-600 font-normal">({[multText, extraText].filter(Boolean).join(' • ')})</span></span>
                                          <span className="font-mono text-blue-700">{formatCurrency(calcPrice)}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-400 italic py-2">Sản phẩm dùng 1 kích cỡ chuẩn ({formatCurrency(prod.price)}).</p>
                                )}
                              </div>

                              {/* Box 2: Toppings detail */}
                              <div className="bg-white border border-purple-100 rounded-xl p-3.5 shadow-2xs">
                                <div className="flex items-center gap-2 mb-2.5 pb-2 border-b border-purple-50">
                                  <div className="w-6 h-6 rounded-md bg-purple-50 flex items-center justify-center text-purple-600">
                                    <Layers className="w-3.5 h-3.5" />
                                  </div>
                                  <h4 className="text-xs font-bold text-purple-950 uppercase tracking-wider">Topping & Món bán kèm</h4>
                                </div>
                                {Array.isArray(prod.toppings) && prod.toppings.length > 0 ? (
                                  <div className="flex flex-wrap gap-1.5">
                                    {prod.toppings.map((t, idx) => (
                                      <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-950 border border-purple-200/80 rounded-lg text-xs font-medium">
                                        <span>{t.topping_name}</span>
                                        {t.extra_price > 0 && <span className="text-purple-600 font-mono">+{formatCurrency(t.extra_price)}</span>}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-400 italic py-2">Không có topping cấu hình riêng cho món này.</p>
                                )}
                              </div>

                              {/* Box 3: Ingredients detail */}
                              <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs">
                                <div className="flex items-center gap-2 mb-2.5 pb-2 border-b border-gray-100">
                                  <div className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center text-gray-700">
                                    <UtensilsCrossed className="w-3.5 h-3.5" />
                                  </div>
                                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Nguyên liệu chính</h4>
                                </div>
                                {Array.isArray(prod.ingredients) && prod.ingredients.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {prod.ingredients.map((ing, idx) => (
                                      <span key={idx} className="inline-block px-2.5 py-1 bg-gray-50 border border-gray-200 text-gray-800 rounded-lg text-xs font-medium">
                                        {ing}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-400 italic py-2">Chưa cập nhật danh sách nguyên liệu.</p>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
        initialData={selectedProduct}
        categories={categories}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa sản phẩm"
        message={`Bạn có chắc chắn muốn xóa sản phẩm "${productToDelete?.name}" không? Hành động này sẽ xóa đồng thời các liên kết nguyên liệu của sản phẩm.`}
        loading={deleting}
      />
    </div>
  );
};

export default ProductsManagement;
