import { useState, useEffect } from 'react';
import ingredientsAPI from '../../api/ingredientsAPI';
import IngredientModal from '../../components/admin/IngredientModal';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import { Plus, Search, Edit2, Trash2, Sliders, Layers, Maximize2, Sparkles } from 'lucide-react';

const CatalogManagement = () => {
  const [activeTab, setActiveTab] = useState('ingredients'); // 'ingredients' | 'sizes' | 'toppings'

  // Ingredients state
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [ingredientToDelete, setIngredientToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

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

  useEffect(() => {
    if (activeTab === 'ingredients') {
      fetchIngredients();
    }
  }, [activeTab]);

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

  const filteredIngredients = ingredients.filter((ing) =>
    ing.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Cấu hình Thuộc tính & Từ điển gốc</h2>
        <p className="text-sm text-gray-600 mt-1">
          Quản lý tập trung các thông số chuẩn hóa: Từ điển nguyên liệu (`Master Ingredients`), kích cỡ (`Sizes`), và món thêm (`Toppings`).
        </p>
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
          <span>Cấu hình Kích cỡ (Sizes)</span>
          <span className="ml-1 text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-700 font-mono rounded border border-amber-200">
            Ngày 9
          </span>
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
          <span>Cấu hình Topping</span>
          <span className="ml-1 text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-700 font-mono rounded border border-amber-200">
            Ngày 9
          </span>
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

      {/* Tab 2: Sizes (Placeholder Day 9) */}
      {activeTab === 'sizes' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-xs max-w-2xl mx-auto my-6">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-800 mx-auto mb-4">
            <Maximize2 className="w-6 h-6" strokeWidth={1.75} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Quản lý Định lượng Kích cỡ (Sizes)</h3>
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">
            Nơi chuẩn hóa danh sách kích cỡ theo từng nhóm món (ví dụ: <span className="font-medium text-gray-800">Size S/M/L</span> cho Pizza, hoặc <span className="font-medium text-gray-800">Suất 3/6/9 Miếng</span> cho Gà rán) cùng mức giá cộng thêm tương ứng.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-xs font-medium text-amber-800">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Đang chuẩn bị tích hợp trong Ngày 9</span>
          </div>
        </div>
      )}

      {/* Tab 3: Toppings (Placeholder Day 9) */}
      {activeTab === 'toppings' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-xs max-w-2xl mx-auto my-6">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-800 mx-auto mb-4">
            <Layers className="w-6 h-6" strokeWidth={1.75} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Quản lý Món thêm (Toppings)</h3>
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">
            Nơi chuẩn hóa các tùy chọn bán thêm khi khách chọn món (ví dụ: <span className="font-medium text-gray-800">+20.000đ Phô mai phủ</span>, <span className="font-medium text-gray-800">+30.000đ Viền Phô Mai</span>) và gắn cho các danh mục phù hợp.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-xs font-medium text-amber-800">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Đang chuẩn bị tích hợp trong Ngày 9</span>
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
    </div>
  );
};

export default CatalogManagement;
