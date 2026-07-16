import { useState, useEffect } from 'react';
import productsAPI from '../../api/productsAPI';
import categoriesAPI from '../../api/categoriesAPI';
import ProductModal from '../../components/admin/ProductModal';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import { Plus, Search, Edit2, Trash2, Package, Image as ImageIcon, Filter } from 'lucide-react';

const ProductsManagement = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Quản lý Sản phẩm</h2>
          <p className="text-sm text-gray-600 mt-1">
            Quản lý thực đơn Pizza, món ăn, giá tiền, hình ảnh và danh sách nguyên liệu
          </p>
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
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Sản phẩm</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Danh mục</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Giá bán</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Nguyên liệu</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Trạng thái</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                      <span>Đang tải thực đơn...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-500">
                    <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" strokeWidth={1.5} />
                    <span>Không tìm thấy sản phẩm nào phù hợp.</span>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const categoryName = categories.find((c) => c.id === prod.category_id)?.name || 'Khác';
                  return (
                    <tr key={prod.id} className="hover:bg-gray-50/75 transition-colors">
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          {prod.image_url ? (
                            <img
                              src={prod.image_url}
                              alt={prod.name}
                              className="w-10 h-10 rounded-lg object-cover border border-gray-200 flex-shrink-0 bg-gray-50"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 flex-shrink-0">
                              <ImageIcon className="w-5 h-5" strokeWidth={1.5} />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900">{prod.name}</div>
                            <div className="text-xs text-gray-400 font-mono">ID: {prod.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-6">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {categoryName}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 font-semibold text-gray-900">
                        {formatCurrency(prod.price)}
                      </td>
                      <td className="py-3.5 px-6 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(prod.ingredients) && prod.ingredients.length > 0 ? (
                            prod.ingredients.map((ing, idx) => (
                              <span
                                key={idx}
                                className="inline-block px-2 py-0.5 bg-gray-50 border border-gray-200 rounded text-[11px] text-gray-600 truncate"
                              >
                                {ing}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 italic text-xs">--</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-6">
                        {prod.is_available ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Đang kinh doanh
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                            Tạm ngưng bán
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(prod)}
                            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
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
