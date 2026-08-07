import { useState, useEffect } from 'react';
import ingredientsAPI from '../../api/ingredientsAPI';
import sizesToppingsAPI from '../../api/sizesToppingsAPI';
import IngredientModal from '../../components/admin/IngredientModal';
import SizeModal from '../../components/admin/SizeModal';
import ToppingModal from '../../components/admin/ToppingModal';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import { Plus, Search, Edit2, Trash2, Sliders, Layers, Maximize2 } from 'lucide-react';

const CatalogManagement = () => {
  const [activeTab, setActiveTab] = useState('ingredients'); // 'ingredients' | 'sizes' | 'toppings'

  // Ingredients state
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Sizes state
  const [sizes, setSizes] = useState([]);
  const [sizesLoading, setSizesLoading] = useState(false);
  const [sizesError, setSizesError] = useState(null);
  const [sizesSearchTerm, setSizesSearchTerm] = useState('');

  // Toppings state
  const [toppings, setToppings] = useState([]);
  const [toppingsLoading, setToppingsLoading] = useState(false);
  const [toppingsError, setToppingsError] = useState(null);
  const [toppingsSearchTerm, setToppingsSearchTerm] = useState('');

  // Modals state - Ingredients
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [ingredientToDelete, setIngredientToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Modals state - Sizes
  const [isSizeModalOpen, setIsSizeModalOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState(null);
  const [isSizeDeleteModalOpen, setIsSizeDeleteModalOpen] = useState(false);
  const [sizeToDelete, setSizeToDelete] = useState(null);
  const [deletingSize, setDeletingSize] = useState(false);

  // Modals state - Toppings
  const [isToppingModalOpen, setIsToppingModalOpen] = useState(false);
  const [selectedTopping, setSelectedTopping] = useState(null);
  const [isToppingDeleteModalOpen, setIsToppingDeleteModalOpen] = useState(false);
  const [toppingToDelete, setToppingToDelete] = useState(null);
  const [deletingTopping, setDeletingTopping] = useState(false);

  const fetchIngredients = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ingredientsAPI.getIngredients();
      setIngredients(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Lỗi khi tải danh sách từ điển gốc';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fetchSizes = async () => {
    setSizesLoading(true);
    setSizesError(null);
    try {
      const data = await sizesToppingsAPI.getSizes();
      setSizes(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Lỗi khi tải danh sách kích cỡ chuẩn';
      setSizesError(msg);
    } finally {
      setSizesLoading(false);
    }
  };

  const fetchToppings = async () => {
    setToppingsLoading(true);
    setToppingsError(null);
    try {
      const data = await sizesToppingsAPI.getToppings();
      setToppings(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Lỗi khi tải danh sách món thêm chuẩn';
      setToppingsError(msg);
    } finally {
      setToppingsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'ingredients') {
      fetchIngredients();
    } else if (activeTab === 'sizes') {
      fetchSizes();
    } else if (activeTab === 'toppings') {
      fetchToppings();
    }
  }, [activeTab]);

  // Handlers - Ingredients
  const handleOpenAdd = () => {
    setSelectedIngredient(null);
    setIsModalOpen(true);
  };
  const handleOpenEdit = (ing) => {
    setSelectedIngredient(ing);
    setIsModalOpen(true);
  };
  const handleOpenDelete = (ing) => {
    setIngredientToDelete(ing);
    setIsDeleteModalOpen(true);
  };
  const handleConfirmDelete = async () => {
    if (!ingredientToDelete?.id) return;
    setDeleting(true);
    try {
      await ingredientsAPI.deleteIngredient(ingredientToDelete.id);
      setIsDeleteModalOpen(false);
      setIngredientToDelete(null);
      await fetchIngredients();
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Không thể xóa nguyên liệu này';
      alert(msg);
    } finally {
      setDeleting(false);
    }
  };

  // Handlers - Sizes
  const handleOpenAddSize = () => {
    setSelectedSize(null);
    setIsSizeModalOpen(true);
  };
  const handleOpenEditSize = (sz) => {
    setSelectedSize(sz);
    setIsSizeModalOpen(true);
  };
  const handleOpenDeleteSize = (sz) => {
    setSizeToDelete(sz);
    setIsSizeDeleteModalOpen(true);
  };
  const handleConfirmDeleteSize = async () => {
    if (!sizeToDelete?.id) return;
    setDeletingSize(true);
    try {
      await sizesToppingsAPI.deleteSize(sizeToDelete.id);
      setIsSizeDeleteModalOpen(false);
      setSizeToDelete(null);
      await fetchSizes();
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Không thể xóa kích cỡ này';
      alert(msg);
    } finally {
      setDeletingSize(false);
    }
  };

  // Handlers - Toppings
  const handleOpenAddTopping = () => {
    setSelectedTopping(null);
    setIsToppingModalOpen(true);
  };
  const handleOpenEditTopping = (tp) => {
    setSelectedTopping(tp);
    setIsToppingModalOpen(true);
  };
  const handleOpenDeleteTopping = (tp) => {
    setToppingToDelete(tp);
    setIsToppingDeleteModalOpen(true);
  };
  const handleConfirmDeleteTopping = async () => {
    if (!toppingToDelete?.id) return;
    setDeletingTopping(true);
    try {
      await sizesToppingsAPI.deleteTopping(toppingToDelete.id);
      setIsToppingDeleteModalOpen(false);
      setToppingToDelete(null);
      await fetchToppings();
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Không thể xóa món thêm này';
      alert(msg);
    } finally {
      setDeletingTopping(false);
    }
  };

  const filteredIngredients = ingredients.filter((ing) =>
    ing.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredSizes = sizes.filter((sz) =>
    sz.name?.toLowerCase().includes(sizesSearchTerm.toLowerCase())
  );
  const filteredToppings = toppings.filter((tp) =>
    tp.name?.toLowerCase().includes(toppingsSearchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Cấu hình Thuộc tính & Từ điển gốc</h2>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 flex items-center gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('ingredients')}
          className={`pb-3.5 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'ingredients'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Sliders className="w-4 h-4" strokeWidth={1.75} />
          <span>Từ điển Nguyên liệu ({ingredients.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sizes')}
          className={`pb-3.5 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'sizes'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Maximize2 className="w-4 h-4" strokeWidth={1.75} />
          <span>Cấu hình Kích cỡ ({sizes.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('toppings')}
          className={`pb-3.5 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'toppings'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Layers className="w-4 h-4" strokeWidth={1.75} />
          <span>Cấu hình Topping ({toppings.length})</span>
        </button>
      </div>

      {/* Tab 1: Master Ingredients */}
      {activeTab === 'ingredients' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-2xs flex items-center gap-3 w-full sm:max-w-md">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm nguyên liệu chuẩn..."
                className="w-full text-sm focus:outline-none placeholder-gray-400"
              />
            </div>

            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm cursor-pointer self-start sm:self-auto flex-shrink-0"
            >
              <Plus className="w-4 h-4" strokeWidth={2} />
              <span>Thêm Nguyên liệu gốc</span>
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">ID</th>
                    <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Tên nguyên liệu chuẩn hóa</th>
                    <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan="3" className="py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                          <span>Đang tải từ điển gốc...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredIngredients.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="py-12 text-center text-gray-500">
                        <Sliders className="w-10 h-10 text-gray-300 mx-auto mb-2" strokeWidth={1.5} />
                        <span>Chưa có nguyên liệu nào hoặc không tìm thấy kết quả phù hợp.</span>
                      </td>
                    </tr>
                  ) : (
                    filteredIngredients.map((ing) => (
                      <tr key={ing.id} className="hover:bg-gray-50/75 transition-colors">
                        <td className="py-3.5 px-6 font-mono text-gray-500 text-xs">#{ing.id}</td>
                        <td className="py-3.5 px-6 font-medium text-gray-900">{ing.name}</td>
                        <td className="py-3.5 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(ing)}
                              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                              title="Sửa tên nguyên liệu gốc"
                            >
                              <Edit2 className="w-4 h-4" strokeWidth={1.75} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenDelete(ing)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Xóa nguyên liệu"
                            >
                              <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Sizes */}
      {activeTab === 'sizes' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-2xs flex items-center gap-3 w-full sm:max-w-md">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={sizesSearchTerm}
                onChange={(e) => setSizesSearchTerm(e.target.value)}
                placeholder="Tìm kiếm kích cỡ chuẩn..."
                className="w-full text-sm focus:outline-none placeholder-gray-400"
              />
            </div>

            <button
              type="button"
              onClick={handleOpenAddSize}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm cursor-pointer self-start sm:self-auto flex-shrink-0"
            >
              <Plus className="w-4 h-4" strokeWidth={2} />
              <span>Thêm Mẫu Kích cỡ chuẩn</span>
            </button>
          </div>

          {sizesError && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
              {sizesError}
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">ID</th>
                    <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Tên kích cỡ chuẩn</th>
                    <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Hệ số giá mặc định</th>
                    <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Giá cộng thêm (VNĐ)</th>
                    <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {sizesLoading ? (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                          <span>Đang tải danh sách kích cỡ...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredSizes.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-gray-500">
                        <Maximize2 className="w-10 h-10 text-gray-300 mx-auto mb-2" strokeWidth={1.5} />
                        <span>Chưa có kích cỡ chuẩn hoặc không tìm thấy kết quả.</span>
                      </td>
                    </tr>
                  ) : (
                    filteredSizes.map((sz) => (
                      <tr key={sz.id} className="hover:bg-gray-50/75 transition-colors">
                        <td className="py-3.5 px-6 font-mono text-gray-500 text-xs">#{sz.id}</td>
                        <td className="py-3.5 px-6 font-medium text-gray-900">{sz.name}</td>
                        <td className="py-3.5 px-6 font-mono text-gray-700">x{Number(sz.default_price_multiplier || 1).toFixed(2)}</td>
                        <td className="py-3.5 px-6 font-mono text-emerald-600 font-medium">
                          +{Number(sz.default_extra_price || 0).toLocaleString('vi-VN')} đ
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEditSize(sz)}
                              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                              title="Sửa mẫu kích cỡ"
                            >
                              <Edit2 className="w-4 h-4" strokeWidth={1.75} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenDeleteSize(sz)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Xóa mẫu kích cỡ"
                            >
                              <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Toppings */}
      {activeTab === 'toppings' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-2xs flex items-center gap-3 w-full sm:max-w-md">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={toppingsSearchTerm}
                onChange={(e) => setToppingsSearchTerm(e.target.value)}
                placeholder="Tìm kiếm món thêm chuẩn..."
                className="w-full text-sm focus:outline-none placeholder-gray-400"
              />
            </div>

            <button
              type="button"
              onClick={handleOpenAddTopping}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm cursor-pointer self-start sm:self-auto flex-shrink-0"
            >
              <Plus className="w-4 h-4" strokeWidth={2} />
              <span>Thêm Món thêm (Topping) chuẩn</span>
            </button>
          </div>

          {toppingsError && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
              {toppingsError}
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">ID</th>
                    <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Tên món thêm (Topping)</th>
                    <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Giá cộng thêm mặc định (VNĐ)</th>
                    <th className="py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {toppingsLoading ? (
                    <tr>
                      <td colSpan="4" className="py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                          <span>Đang tải danh sách món thêm...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredToppings.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-12 text-center text-gray-500">
                        <Layers className="w-10 h-10 text-gray-300 mx-auto mb-2" strokeWidth={1.5} />
                        <span>Chưa có món thêm nào hoặc không tìm thấy kết quả.</span>
                      </td>
                    </tr>
                  ) : (
                    filteredToppings.map((tp) => (
                      <tr key={tp.id} className="hover:bg-gray-50/75 transition-colors">
                        <td className="py-3.5 px-6 font-mono text-gray-500 text-xs">#{tp.id}</td>
                        <td className="py-3.5 px-6 font-medium text-gray-900">{tp.name}</td>
                        <td className="py-3.5 px-6 font-mono text-emerald-600 font-medium">
                          +{Number(tp.default_extra_price || 0).toLocaleString('vi-VN')} đ
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEditTopping(tp)}
                              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                              title="Sửa mẫu món thêm"
                            >
                              <Edit2 className="w-4 h-4" strokeWidth={1.75} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenDeleteTopping(tp)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Xóa mẫu món thêm"
                            >
                              <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <IngredientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchIngredients}
        initialData={selectedIngredient}
      />
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa nguyên liệu"
        message={`Bạn có chắc chắn muốn xóa nguyên liệu "${ingredientToDelete?.name}" khỏi từ điển gốc không? Toàn bộ các món ăn đang sử dụng nguyên liệu này sẽ tự động gỡ bỏ liên kết.`}
        loading={deleting}
      />

      <SizeModal
        isOpen={isSizeModalOpen}
        onClose={() => setIsSizeModalOpen(false)}
        onSuccess={fetchSizes}
        initialData={selectedSize}
      />
      <ConfirmDeleteModal
        isOpen={isSizeDeleteModalOpen}
        onClose={() => setIsSizeDeleteModalOpen(false)}
        onConfirm={handleConfirmDeleteSize}
        title="Xác nhận xóa mẫu kích cỡ"
        message={`Bạn có chắc chắn muốn xóa kích cỡ chuẩn "${sizeToDelete?.name}" khỏi từ điển không?`}
        loading={deletingSize}
      />

      <ToppingModal
        isOpen={isToppingModalOpen}
        onClose={() => setIsToppingModalOpen(false)}
        onSuccess={fetchToppings}
        initialData={selectedTopping}
      />
      <ConfirmDeleteModal
        isOpen={isToppingDeleteModalOpen}
        onClose={() => setIsToppingDeleteModalOpen(false)}
        onConfirm={handleConfirmDeleteTopping}
        title="Xác nhận xóa mẫu món thêm"
        message={`Bạn có chắc chắn muốn xóa món thêm "${toppingToDelete?.name}" khỏi từ điển không?`}
        loading={deletingTopping}
      />
    </div>
  );
};

export default CatalogManagement;

