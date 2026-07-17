import { useState, useEffect, useRef } from 'react';
import productsAPI from '../../api/productsAPI';
import uploadAPI from '../../api/uploadAPI';
import ingredientsAPI from '../../api/ingredientsAPI';
import sizesToppingsAPI from '../../api/sizesToppingsAPI';
import { X, Upload, Plus, Image as ImageIcon, Search, Check, Maximize2, Layers, Trash2 } from 'lucide-react';

const ProductModal = ({ isOpen, onClose, onSuccess, initialData = null, categories = [] }) => {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  
  // Ingredients state
  const [ingredients, setIngredients] = useState([]);
  const [inputIngredient, setInputIngredient] = useState('');
  const [masterIngredients, setMasterIngredients] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [creatingMasterIng, setCreatingMasterIng] = useState(false);
  const dropdownRef = useRef(null);

  // Sizes state
  const [sizes, setSizes] = useState([]);
  const [masterSizes, setMasterSizes] = useState([]);
  const [showSizesDropdown, setShowSizesDropdown] = useState(false);
  const sizesDropdownRef = useRef(null);

  // Toppings state
  const [toppings, setToppings] = useState([]);
  const [masterToppings, setMasterToppings] = useState([]);
  const [showToppingsDropdown, setShowToppingsDropdown] = useState(false);
  const toppingsDropdownRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const [ingData, sizeData, topData] = await Promise.all([
          ingredientsAPI.getIngredients(),
          sizesToppingsAPI.getSizes(),
          sizesToppingsAPI.getToppings()
        ]);
        setMasterIngredients(Array.isArray(ingData) ? ingData : []);
        setMasterSizes(Array.isArray(sizeData) ? sizeData : []);
        setMasterToppings(Array.isArray(topData) ? topData : []);
      } catch (err) {
        console.error('Failed to load master catalogs:', err);
      }
    };
    if (isOpen) {
      fetchMasters();
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setCategoryId(initialData.category_id || (categories[0]?.id || ''));
      setPrice(initialData.price !== undefined ? String(initialData.price) : '');
      setDescription(initialData.description || '');
      setImageUrl(initialData.image_url || '');
      setIsAvailable(initialData.is_available !== undefined ? initialData.is_available : true);
      setIngredients(Array.isArray(initialData.ingredients) ? [...initialData.ingredients] : []);
      setSizes(Array.isArray(initialData.sizes) ? initialData.sizes.map(s => ({
        size_name: s.size_name || '',
        price_multiplier: s.price_multiplier !== undefined ? Number(s.price_multiplier) : 1.0,
        extra_price: s.extra_price !== undefined ? Number(s.extra_price) : 0
      })) : []);
      setToppings(Array.isArray(initialData.toppings) ? initialData.toppings.map(t => ({
        topping_name: t.topping_name || '',
        extra_price: t.extra_price !== undefined ? Number(t.extra_price) : 0
      })) : []);
    } else {
      setName('');
      setCategoryId(categories[0]?.id || '');
      setPrice('');
      setDescription('');
      setImageUrl('');
      setIsAvailable(true);
      setIngredients([]);
      setSizes([]);
      setToppings([]);
    }
    setInputIngredient('');
    setShowDropdown(false);
    setShowSizesDropdown(false);
    setShowToppingsDropdown(false);
    setError(null);
  }, [initialData, isOpen, categories]);

  if (!isOpen) return null;

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await uploadAPI.uploadImage(formData);
      const url = res?.data?.url || res?.url;
      if (url) {
        setImageUrl(url);
      } else {
        setError('Không lấy được đường dẫn ảnh từ server');
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Lỗi khi tải ảnh lên server';
      setError(msg);
    } finally {
      setUploadingImage(false);
    }
  };

  // Ingredients handlers
  const handleSelectSuggestion = (ingName) => {
    if (!ingredients.includes(ingName)) {
      setIngredients([...ingredients, ingName]);
    }
    setInputIngredient('');
    setShowDropdown(false);
  };

  const handleCreateAndSelectMaster = async () => {
    const val = inputIngredient.trim();
    if (!val) return;

    setCreatingMasterIng(true);
    try {
      const newIng = await ingredientsAPI.createIngredient({ name: val });
      setMasterIngredients([...masterIngredients, newIng]);
      if (!ingredients.includes(newIng.name)) {
        setIngredients([...ingredients, newIng.name]);
      }
      setInputIngredient('');
      setShowDropdown(false);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Lỗi khi tạo nguyên liệu gốc';
      alert(msg);
    } finally {
      setCreatingMasterIng(false);
    }
  };

  const handleRemoveIngredient = (indexToRemove) => {
    setIngredients(ingredients.filter((_, idx) => idx !== indexToRemove));
  };

  // Sizes handlers
  const handleAddMasterSize = (master) => {
    if (!sizes.some(s => s.size_name.toLowerCase() === master.name.toLowerCase())) {
      setSizes([...sizes, {
        size_name: master.name,
        price_multiplier: Number(master.default_price_multiplier || 1.0),
        extra_price: Number(master.default_extra_price || 0)
      }]);
    }
    setShowSizesDropdown(false);
  };

  const handleAddCustomSize = () => {
    setSizes([...sizes, { size_name: '', price_multiplier: 1.0, extra_price: 0 }]);
  };

  const handleSizeChange = (idx, field, value) => {
    const newSizes = [...sizes];
    newSizes[idx] = { ...newSizes[idx], [field]: value };
    setSizes(newSizes);
  };

  const handleRemoveSize = (idx) => {
    setSizes(sizes.filter((_, i) => i !== idx));
  };

  // Toppings handlers
  const handleAddMasterTopping = (master) => {
    if (!toppings.some(t => t.topping_name.toLowerCase() === master.name.toLowerCase())) {
      setToppings([...toppings, {
        topping_name: master.name,
        extra_price: Number(master.default_extra_price || 0)
      }]);
    }
    setShowToppingsDropdown(false);
  };

  const handleAddCustomTopping = () => {
    setToppings([...toppings, { topping_name: '', extra_price: 0 }]);
  };

  const handleToppingChange = (idx, field, value) => {
    const newToppings = [...toppings];
    newToppings[idx] = { ...newToppings[idx], [field]: value };
    setToppings(newToppings);
  };

  const handleRemoveTopping = (idx) => {
    setToppings(toppings.filter((_, i) => i !== idx));
  };

  const filteredSuggestions = masterIngredients.filter((master) => {
    const matchQuery = master.name.toLowerCase().includes(inputIngredient.trim().toLowerCase());
    const notSelected = !ingredients.includes(master.name);
    return matchQuery && notSelected;
  });

  const exactMatchExists = masterIngredients.some(
    (master) => master.name.toLowerCase() === inputIngredient.trim().toLowerCase()
  );

  const availableMasterSizes = masterSizes.filter(
    (ms) => !sizes.some((s) => s.size_name.toLowerCase() === ms.name.toLowerCase())
  );

  const availableMasterToppings = masterToppings.filter(
    (mt) => !toppings.some((t) => t.topping_name.toLowerCase() === mt.name.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Tên sản phẩm không được để trống');
      return;
    }
    if (!categoryId) {
      setError('Vui lòng chọn danh mục sản phẩm');
      return;
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      setError('Giá bán sản phẩm phải lớn hơn 0');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        name: name.trim(),
        category_id: parseInt(categoryId, 10),
        price: numPrice,
        description: description.trim() || null,
        image_url: imageUrl.trim() || null,
        is_available: isAvailable,
        ingredients: ingredients,
        sizes: sizes
          .map(s => ({
            size_name: String(s.size_name).trim(),
            price_multiplier: Number(s.price_multiplier || 1.0),
            extra_price: Number(s.extra_price || 0)
          }))
          .filter(s => s.size_name !== ''),
        toppings: toppings
          .map(t => ({
            topping_name: String(t.topping_name).trim(),
            extra_price: Number(t.extra_price || 0)
          }))
          .filter(t => t.topping_name !== '')
      };

      if (initialData?.id) {
        await productsAPI.updateProduct(initialData.id, payload);
      } else {
        await productsAPI.createProduct(payload);
      }

      onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Có lỗi xảy ra khi lưu sản phẩm';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 max-w-3xl w-full p-6 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 sticky top-0 bg-white z-10">
          <h3 className="text-base font-semibold text-gray-900">
            {initialData ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên sản phẩm <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Pizza Hải Sản Pesto..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Danh mục <span className="text-red-500">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                disabled={loading || categories.length === 0}
                required
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giá bán (VNĐ) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Ví dụ: 199000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                disabled={loading}
                min="0"
                step="1000"
                required
              />
            </div>

            <div className="flex items-center pt-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                  disabled={loading}
                />
                <span className="text-sm font-medium text-gray-700">Đang kinh doanh (Available)</span>
              </label>
            </div>
          </div>

          {/* Image Upload Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hình ảnh sản phẩm</label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {imageUrl ? (
                <div className="relative w-24 h-24 rounded-lg border border-gray-200 overflow-hidden flex-shrink-0 bg-gray-50">
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-lg border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 bg-gray-50 flex-shrink-0">
                  <ImageIcon className="w-6 h-6" strokeWidth={1.5} />
                  <span className="text-[10px] mt-1">Chưa có ảnh</span>
                </div>
              )}

              <div className="flex-1 space-y-2 w-full">
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-2 px-3.5 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer shadow-sm">
                    <Upload className="w-4 h-4" strokeWidth={1.75} />
                    <span>{uploadingImage ? 'Đang tải lên...' : 'Chọn file ảnh để tải lên'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      disabled={loading || uploadingImage}
                      className="hidden"
                    />
                  </label>
                  {uploadingImage && (
                    <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Hoặc dán URL hình ảnh trực tiếp..."
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  disabled={loading || uploadingImage}
                />
              </div>
            </div>
          </div>

          {/* Ingredients Autocomplete Section */}
          <div className="relative border-t border-gray-100 pt-4" ref={dropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nguyên liệu (Chọn từ Từ điển gốc Autocomplete)
            </label>
            <div className="relative">
              <input
                type="text"
                value={inputIngredient}
                onChange={(e) => {
                  setInputIngredient(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Gõ để tìm chọn hoặc tạo mới nguyên liệu..."
                className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 pr-10"
                disabled={loading}
              />
              <Search className="w-4 h-4 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>

            {/* Autocomplete Dropdown */}
            {showDropdown && (
              <div className="absolute left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg z-30 max-h-56 overflow-y-auto divide-y divide-gray-100">
                {filteredSuggestions.length > 0 ? (
                  <div className="py-1">
                    <div className="px-3 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      Gợi ý từ Từ điển gốc ({filteredSuggestions.length})
                    </div>
                    {filteredSuggestions.map((master) => (
                      <button
                        key={master.id}
                        type="button"
                        onClick={() => handleSelectSuggestion(master.name)}
                        className="w-full text-left px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <span>{master.name}</span>
                        <Check className="w-4 h-4 text-emerald-600 opacity-0 group-hover:opacity-100" />
                      </button>
                    ))}
                  </div>
                ) : inputIngredient.trim() && exactMatchExists ? (
                  <div className="p-3 text-xs text-gray-500 text-center">
                    Nguyên liệu này đã được chọn trong món ăn.
                  </div>
                ) : null}

                {/* Inline Creation Option */}
                {inputIngredient.trim() && !exactMatchExists && (
                  <div className="p-2 bg-gray-50/80">
                    <button
                      type="button"
                      onClick={handleCreateAndSelectMaster}
                      disabled={creatingMasterIng}
                      className="w-full px-3 py-2 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
                    >
                      {creatingMasterIng ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      <span>+ Tạo nhanh nguyên liệu gốc: "{inputIngredient.trim()}"</span>
                    </button>
                  </div>
                )}

                {filteredSuggestions.length === 0 && !inputIngredient.trim() && (
                  <div className="p-4 text-xs text-gray-400 text-center">
                    Gõ tên nguyên liệu để tìm kiếm từ {masterIngredients.length} mục trong từ điển gốc.
                  </div>
                )}
              </div>
            )}

            {ingredients.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                {ingredients.map((ing, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-white border border-gray-200 text-gray-800 shadow-2xs"
                  >
                    <span>{ing}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredient(idx)}
                      disabled={loading}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Sizes Configuration Section (Day 9) */}
          <div className="border-t border-gray-100 pt-4" ref={sizesDropdownRef}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-800 flex items-center gap-2">
                <Maximize2 className="w-4 h-4 text-gray-600" />
                <span>Kích cỡ (Sizes) & Định giá</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowSizesDropdown(!showSizesDropdown)}
                    disabled={loading || availableMasterSizes.length === 0}
                    className="px-2.5 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Chọn từ Từ điển ({availableMasterSizes.length})</span>
                  </button>

                  {showSizesDropdown && availableMasterSizes.length > 0 && (
                    <div className="absolute right-0 mt-1.5 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-30 py-1 divide-y divide-gray-100 max-h-48 overflow-y-auto">
                      <div className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                        Kích cỡ chuẩn chưa chọn
                      </div>
                      {availableMasterSizes.map((ms) => (
                        <button
                          key={ms.id}
                          type="button"
                          onClick={() => handleAddMasterSize(ms)}
                          className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <span className="font-medium">{ms.name}</span>
                          <span className="text-[11px] text-emerald-600 font-mono">+{Number(ms.default_extra_price || 0).toLocaleString()}đ</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleAddCustomSize}
                  disabled={loading}
                  className="px-2.5 py-1.5 text-xs font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Custom Size</span>
                </button>
              </div>
            </div>

            {sizes.length === 0 ? (
              <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center text-xs text-gray-400">
                Sản phẩm này chưa cấu hình kích cỡ riêng (sẽ dùng 1 size mặc định theo giá gốc).
              </div>
            ) : (
              <div className="space-y-2">
                {sizes.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs">
                    <div className="w-1/3">
                      <input
                        type="text"
                        value={s.size_name}
                        onChange={(e) => handleSizeChange(idx, 'size_name', e.target.value)}
                        placeholder="Tên size (VD: S, M, L)..."
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white font-medium"
                      />
                    </div>
                    <div className="w-1/3 flex items-center gap-1">
                      <span className="text-gray-500">Hệ số x:</span>
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        value={s.price_multiplier}
                        onChange={(e) => handleSizeChange(idx, 'price_multiplier', e.target.value)}
                        placeholder="1.0"
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white font-mono"
                      />
                    </div>
                    <div className="w-1/3 flex items-center gap-1">
                      <span className="text-gray-500">+ Giá (đ):</span>
                      <input
                        type="number"
                        step="1000"
                        min="0"
                        value={s.extra_price}
                        onChange={(e) => handleSizeChange(idx, 'extra_price', e.target.value)}
                        placeholder="0"
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white font-mono text-emerald-700 font-medium"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSize(idx)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors"
                      title="Xóa kích cỡ này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Toppings Configuration Section (Day 9) */}
          <div className="border-t border-gray-100 pt-4" ref={toppingsDropdownRef}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-800 flex items-center gap-2">
                <Layers className="w-4 h-4 text-gray-600" />
                <span>Món thêm (Topping) bán kèm</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowToppingsDropdown(!showToppingsDropdown)}
                    disabled={loading || availableMasterToppings.length === 0}
                    className="px-2.5 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Chọn từ Từ điển ({availableMasterToppings.length})</span>
                  </button>

                  {showToppingsDropdown && availableMasterToppings.length > 0 && (
                    <div className="absolute right-0 mt-1.5 w-60 bg-white border border-gray-200 rounded-xl shadow-lg z-30 py-1 divide-y divide-gray-100 max-h-48 overflow-y-auto">
                      <div className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                        Topping chuẩn chưa chọn
                      </div>
                      {availableMasterToppings.map((mt) => (
                        <button
                          key={mt.id}
                          type="button"
                          onClick={() => handleAddMasterTopping(mt)}
                          className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <span className="font-medium">{mt.name}</span>
                          <span className="text-[11px] text-emerald-600 font-mono">+{Number(mt.default_extra_price || 0).toLocaleString()}đ</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleAddCustomTopping}
                  disabled={loading}
                  className="px-2.5 py-1.5 text-xs font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Custom Topping</span>
                </button>
              </div>
            </div>

            {toppings.length === 0 ? (
              <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center text-xs text-gray-400">
                Sản phẩm này chưa cấu hình món thêm (Topping) nào.
              </div>
            ) : (
              <div className="space-y-2">
                {toppings.map((t, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs">
                    <div className="w-3/5">
                      <input
                        type="text"
                        value={t.topping_name}
                        onChange={(e) => handleToppingChange(idx, 'topping_name', e.target.value)}
                        placeholder="Tên topping (VD: Thêm phô mai phủ)..."
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white font-medium"
                      />
                    </div>
                    <div className="w-2/5 flex items-center gap-1">
                      <span className="text-gray-500">+ Giá (đ):</span>
                      <input
                        type="number"
                        step="1000"
                        min="0"
                        value={t.extra_price}
                        onChange={(e) => handleToppingChange(idx, 'extra_price', e.target.value)}
                        placeholder="0"
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white font-mono text-emerald-700 font-medium"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveTopping(idx)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors"
                      title="Xóa topping này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả sản phẩm
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập mô tả về hương vị, thành phần..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
              disabled={loading}
            />
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              disabled={loading || uploadingImage}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading || uploadingImage}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <span>{initialData ? 'Cập nhật' : 'Tạo mới'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
