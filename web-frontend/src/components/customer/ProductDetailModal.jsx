import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Minus, Check, ShoppingBag, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

const DEFAULT_PIZZA_IMG = 'http://localhost:8000/static/uploads/default_pizza.png';

const getIngredientName = (ing) => {
  if (!ing) return '';
  if (typeof ing === 'string') return ing;
  return ing.name || ing.ingredient_name || '';
};

const ProductDetailModal = ({ product, isOpen, onClose, onAddToCart, initialCartItem = null }) => {
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [imgError, setImgError] = useState(false);

  // Khởi tạo state mỗi khi mở modal hoặc thay đổi món
  useEffect(() => {
    if (product && isOpen) {
      const sizesList = Array.isArray(product.sizes) ? product.sizes : [];
      if (initialCartItem) {
        // Pre-select size matching initialCartItem.size_name
        const foundSize = sizesList.find(s => (s.size_name || "").trim().toLowerCase() === (initialCartItem.size_name || "").trim().toLowerCase()) || sizesList[0] || null;
        setSelectedSize(foundSize);

        // Pre-select toppings matching initialCartItem.toppings
        const initTops = Array.isArray(initialCartItem.toppings) ? initialCartItem.toppings : [];
        const prodTops = Array.isArray(product.toppings) ? product.toppings : [];
        const matchedTops = prodTops.filter(pt =>
          initTops.some(it => (it.name || it.topping_name || "").trim().toLowerCase() === (pt.topping_name || pt.name || "").trim().toLowerCase())
        );
        setSelectedToppings(matchedTops);

        setQuantity(initialCartItem.quantity || 1);
        setNote(initialCartItem.note || '');
      } else {
        const defaultSize = sizesList.find((s) => Number(s.price_multiplier || s.mult) === 1) || sizesList[0] || null;
        setSelectedSize(defaultSize);
        setSelectedToppings([]);
        setQuantity(1);
        setNote('');
      }
      setImgError(false);
    }
  }, [product, isOpen, initialCartItem]);

  // Kiểm tra trạng thái có sẵn để bán
  const isAvailable = useMemo(() => {
    if (!product) return false;
    return product.is_available !== false && product.is_available !== 0 && product.status !== 'inactive' && product.status !== 'out_of_stock';
  }, [product]);

  // Tính toán giá đơn vị & tổng tiền tự động
  const basePrice = useMemo(() => Number(product?.price || 0), [product]);

  const sizePrice = useMemo(() => {
    if (!selectedSize) return basePrice;
    const mult = Number(selectedSize.price_multiplier !== undefined ? selectedSize.price_multiplier : (selectedSize.mult || 1));
    const extra = Number(selectedSize.extra_price !== undefined ? selectedSize.extra_price : (selectedSize.extra || 0));
    return Math.round(basePrice * mult + extra);
  }, [basePrice, selectedSize]);

  const toppingsPrice = useMemo(() => {
    return selectedToppings.reduce((sum, t) => {
      const extra = Number(t.extra_price !== undefined ? t.extra_price : (t.extra || 0));
      return sum + extra;
    }, 0);
  }, [selectedToppings]);

  const unitPrice = sizePrice + toppingsPrice;
  const totalPrice = unitPrice * quantity;

  // Xử lý chọn/bỏ chọn Topping
  const handleToggleTopping = (topping) => {
    setSelectedToppings((prev) => {
      const exists = prev.some((t) => (t.id && t.id === topping.id) || (t.topping_name === topping.topping_name));
      if (exists) {
        return prev.filter((t) => (t.id ? t.id !== topping.id : t.topping_name !== topping.topping_name));
      }
      return [...prev, topping];
    });
  };

  if (!isOpen || !product) return null;

  const sizesList = Array.isArray(product.sizes) ? product.sizes : [];
  const toppingsList = Array.isArray(product.toppings) ? product.toppings : [];
  const ingredientsList = Array.isArray(product.ingredients) ? product.ingredients : [];
  const displayImage = (!imgError && product.image_url) ? product.image_url : DEFAULT_PIZZA_IMG;

  const handleImgError = () => {
    if (!imgError) setImgError(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-gray-100 flex flex-col lg:flex-row my-auto max-h-[92vh] lg:max-h-[86vh]"
      >
        {/* Cột Trái: Khung ảnh & Thẻ nguyên liệu */}
        <div className="lg:w-5/12 bg-gray-100 relative flex flex-col justify-between shrink-0">
          <div className="relative aspect-[4/3] lg:aspect-auto lg:h-full w-full overflow-hidden">
            <img
              src={displayImage}
              alt={product.name}
              onError={handleImgError}
              className={`w-full h-full object-cover ${!isAvailable ? 'filter grayscale-[25%] opacity-80' : ''}`}
            />

            {/* Badge Trạng thái: Chỉ hiển thị Hết món */}
            {!isAvailable && (
              <div className="absolute top-4 right-4 z-10">
                <span className="bg-stone-800/95 text-gray-300 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold tracking-wide flex items-center gap-1.5 shadow-sm border border-stone-600/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  Hết món
                </span>
              </div>
            )}
          </div>

          {/* Thành phần nguyên liệu bên dưới ảnh trên màn lớn */}
          {ingredientsList.length > 0 && (
            <div className="p-4 bg-stone-900 text-white border-t border-stone-800 hidden lg:block">
              <span className="text-xs uppercase tracking-wider font-semibold text-gray-400 block mb-2">
                Nguyên liệu chính
              </span>
              <div className="flex flex-wrap gap-1.5">
                {ingredientsList.map((ing, idx) => {
                  const ingName = getIngredientName(ing);
                  return (
                    <span
                      key={ing?.id || ingName || idx}
                      className="px-2.5 py-1 bg-stone-800 text-gray-200 rounded-lg text-xs font-medium border border-stone-700/60"
                    >
                      {ingName}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Cột Phải: Tiêu đề, Tùy chọn Size/Topping, Số lượng & Footer */}
        <div className="lg:w-7/12 flex flex-col flex-grow overflow-hidden bg-white">
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-gray-100 flex items-start justify-between gap-4 shrink-0">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 leading-snug">
                {product.name}
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-gray-500 leading-relaxed">
                {product.description || 'Hương vị tuyệt hảo từ nguyên liệu tươi ngon chuẩn vị Ý.'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body cuộn scroll */}
          <div className="p-5 sm:p-6 overflow-y-auto flex-grow space-y-6">
            {/* Nguyên liệu cho màn nhỏ (mobile) */}
            {ingredientsList.length > 0 && (
              <div className="block lg:hidden">
                <span className="text-xs uppercase tracking-wider font-semibold text-gray-400 block mb-2">
                  Nguyên liệu chính
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {ingredientsList.map((ing, idx) => {
                    const ingName = getIngredientName(ing);
                    return (
                      <span
                        key={ing?.id || ingName || idx}
                        className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium"
                      >
                        {ingName}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Chọn Kích Cỡ (Sizes) */}
            {sizesList.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs sm:text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    Chọn kích cỡ
                  </span>
                  <span className="text-xs text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded-md">Bắt buộc</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {sizesList.map((size, idx) => {
                    const mult = Number(size.price_multiplier !== undefined ? size.price_multiplier : (size.mult || 1));
                    const extra = Number(size.extra_price !== undefined ? size.extra_price : (size.extra || 0));
                    const calcPrice = Math.round(basePrice * mult + extra);
                    const diff = calcPrice - basePrice;
                    const isSelected = selectedSize && ((selectedSize.id && selectedSize.id === size.id) || selectedSize.size_name === size.size_name);

                    return (
                      <button
                        key={size.id || size.size_name || idx}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                          isSelected
                            ? 'border-red-600 bg-red-50/60 ring-2 ring-red-600/20 shadow-sm'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className={`text-sm font-bold ${isSelected ? 'text-red-700' : 'text-gray-900'}`}>
                            {size.size_name}
                          </span>
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs font-semibold text-gray-700">
                            {formatCurrency(calcPrice)}
                          </span>
                          {diff !== 0 ? (
                            <span className={`text-[11px] font-medium px-1.5 py-0.2 rounded ${
                              diff > 0 ? 'bg-red-100/80 text-red-700' : 'bg-emerald-100/80 text-emerald-700'
                            }`}>
                              {diff > 0 ? `+${formatCurrency(diff)}` : `-${formatCurrency(Math.abs(diff))}`}
                            </span>
                          ) : (
                            <span className="text-[11px] text-gray-400 font-medium">(Tiêu chuẩn)</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Chọn Món Thêm (Toppings) */}
            {toppingsList.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs sm:text-sm font-bold text-gray-900 uppercase tracking-wider">
                    Chọn món thêm (Topping)
                  </span>
                  <span className="text-xs text-gray-500 font-medium">Chọn nhiều tùy ý</span>
                </div>
                <div className="flex flex-col space-y-2.5">
                  {toppingsList.map((top, idx) => {
                    const extra = Number(top.extra_price !== undefined ? top.extra_price : (top.extra || 0));
                    const isSelected = selectedToppings.some(
                      (t) => (t.id && t.id === top.id) || (t.topping_name === top.topping_name)
                    );

                    return (
                      <button
                        key={top.id || top.topping_name || idx}
                        type="button"
                        onClick={() => handleToggleTopping(top)}
                        className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'border-red-600 bg-red-50/60 ring-1 ring-red-600/20 shadow-sm'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                            isSelected ? 'bg-red-600 border-red-600 text-white' : 'border-gray-300 bg-white'
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <span className={`text-sm font-medium ${isSelected ? 'text-gray-900 font-semibold' : 'text-gray-700'}`}>
                            {top.topping_name}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-red-600 shrink-0 bg-red-50 px-2 py-0.5 rounded-md border border-red-100">
                          +{formatCurrency(extra)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ghi chú & Số lượng */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pt-2 border-t border-gray-100">
              <div className="sm:col-span-8">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Ghi chú cho nhà bếp (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ví dụ: Ít cay, không hành, cắt làm 8 miếng..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-sm outline-none transition-all"
                />
              </div>
              <div className="sm:col-span-4 flex flex-col justify-end">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Số lượng
                </label>
                <div className="flex items-center justify-between border border-gray-200 rounded-xl bg-gray-50 p-1">
                  <button
                    type="button"
                    disabled={quantity <= 1 || !isAvailable}
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    className="w-9 h-9 rounded-lg bg-white shadow-sm border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                  >
                    <Minus className="w-4 h-4 stroke-[2.5]" />
                  </button>
                  <span className="font-extrabold text-base text-gray-900 px-3">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    disabled={quantity >= 99 || !isAvailable}
                    onClick={() => setQuantity((prev) => Math.min(99, prev + 1))}
                    className="w-9 h-9 rounded-lg bg-white shadow-sm border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Bar: Tổng hợp & Nút Thêm giỏ hàng */}
          <div className="p-5 sm:p-6 border-t border-gray-100 bg-gray-50/80 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
            <div className="w-full sm:w-auto flex items-center justify-between sm:block">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                Tổng thành tiền
              </span>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-black tracking-tight ${isAvailable ? 'text-red-600' : 'text-gray-400'}`}>
                  {formatCurrency(totalPrice)}
                </span>
                {quantity > 1 && (
                  <span className="text-xs font-medium text-gray-500">
                    ({formatCurrency(unitPrice)}/món)
                  </span>
                )}
              </div>
            </div>

            {isAvailable ? (
              <button
                type="button"
                onClick={() => {
                  const itemPayload = {
                    product,
                    size: selectedSize,
                    toppings: selectedToppings,
                    quantity,
                    unitPrice,
                    totalPrice,
                    note: note.trim(),
                  };
                  if (onAddToCart) {
                    onAddToCart(itemPayload, initialCartItem);
                  }
                  onClose();
                }}
                className="w-full sm:w-auto px-8 py-3.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-base rounded-2xl shadow-lg shadow-red-600/25 transition-all flex items-center justify-center gap-2 shrink-0"
              >
                <span>{initialCartItem ? 'Cập nhật lựa chọn' : 'Thêm vào giỏ hàng'}</span>
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="w-full sm:w-auto px-8 py-3.5 bg-gray-200 text-gray-400 font-bold text-base rounded-2xl cursor-not-allowed flex items-center justify-center gap-2 shrink-0"
              >
                <AlertCircle className="w-5 h-5" />
                <span>Món tạm ngưng bán</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;
