import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Check } from 'lucide-react';
import useCart from '../../hooks/useCart';
import { formatCurrency } from '../../utils/formatCurrency';
import ProductDetailModal from '../../components/customer/ProductDetailModal';
import productsAPI from '../../api/productsAPI';

const DEFAULT_PIZZA_IMG = 'http://localhost:8000/static/uploads/default_pizza.png';

const Cart = () => {
  const { cartItems, totalItems, subtotal, loading, addToCart, updateCartItem, removeFromCart, clearCart } = useCart();
  const [updatingId, setUpdatingId] = useState(null);
  const [activeEditItem, setActiveEditItem] = useState(null);
  const [activeModalProduct, setActiveModalProduct] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const navigate = useNavigate();

  const handleEditItem = async (item) => {
    let fullProduct = item.product;
    if (!fullProduct || !Array.isArray(fullProduct.sizes) || fullProduct.sizes.length === 0) {
      try {
        fullProduct = await productsAPI.getPublicProductById(item.product_id);
      } catch (e) {
        console.error('Lỗi khi tải chi tiết món:', e);
        fullProduct = item.product || { id: item.product_id, name: `Sản phẩm #${item.product_id}`, price: item.unit_price };
      }
    }
    setActiveEditItem(item);
    setActiveModalProduct(fullProduct);
  };

  const handleSaveFromModal = async (payload, editingItem) => {
    if (!payload) return;
    const newSizeName = payload.size?.size_name || null;
    const newToppings = (payload.toppings || []).map(t => ({
      name: t.topping_name || t.name,
      price: Number(t.extra_price || t.price || 0)
    }));
    const newUnitPrice = Number(payload.unitPrice || 0);
    const newQty = payload.quantity || 1;
    const newNote = payload.note || "";

    if (editingItem) {
      setUpdatingId(editingItem.id);
      await removeFromCart(editingItem.id);
      const apiPayload = {
        product_id: payload.product.id,
        size_name: newSizeName,
        toppings: newToppings,
        quantity: newQty,
        note: newNote,
        unit_price: newUnitPrice,
        product_info: payload.product
      };
      await addToCart(apiPayload);
      setUpdatingId(null);
    }
    setActiveEditItem(null);
    setActiveModalProduct(null);
  };

  const handleQuantityChange = async (itemId, currentQty, delta) => {
    const newQty = currentQty + delta;
    if (newQty < 1) return;
    setUpdatingId(itemId);
    await updateCartItem(itemId, { quantity: newQty });
    setUpdatingId(null);
  };

  const handleRemoveItem = async (itemId) => {
    if (window.confirm('Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?')) {
      setUpdatingId(itemId);
      await removeFromCart(itemId);
      setUpdatingId(null);
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('Bạn có chắc muốn xóa toàn bộ sản phẩm trong giỏ hàng?')) {
      await clearCart();
    }
  };

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (couponCode.trim()) {
      setCouponApplied(true);
    }
  };

  const discountAmount = couponApplied ? 30000 : 0;
  const shippingFee = totalItems > 0 ? (subtotal >= 200000 ? 0 : 25000) : 0;
  const finalTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  if (loading && cartItems.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6">
        <div className="w-10 h-10 border-3 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500 text-sm">Đang tải giỏ hàng...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        {/* Header tinh giản */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-6 border-b border-gray-200 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Giỏ hàng của bạn
            </h1>
            {totalItems > 0 && (
              <p className="text-gray-500 text-sm sm:text-base mt-1.5 font-medium">
                Có <span className="font-bold text-gray-800">{totalItems}</span> sản phẩm trong giỏ hàng của bạn
              </p>
            )}
          </div>

          {cartItems.length > 0 && (
            <button
              type="button"
              onClick={handleClearCart}
              className="self-start sm:self-auto text-gray-500 hover:text-red-600 font-medium text-sm transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa tất cả</span>
            </button>
          )}
        </div>

        {/* Trạng thái giỏ hàng trống */}
        {cartItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 sm:p-16 border border-gray-200/80 text-center max-w-xl mx-auto my-12 flex flex-col items-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <ShoppingBag className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Giỏ hàng đang trống
            </h2>
            <p className="text-gray-500 text-sm sm:text-base mb-8 max-w-sm">
              Bạn chưa có món ăn nào trong giỏ. Hãy quay lại menu để chọn món nhé.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-semibold px-6 py-3 rounded-xl transition-all text-sm sm:text-base"
            >
              <span>Khám phá thực đơn</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Cột Trái: Danh sách sản phẩm */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => {
                const prod = item.product || {};
                const displayImage = prod.image_url || DEFAULT_PIZZA_IMG;
                const toppingsList = Array.isArray(item.toppings) ? item.toppings : [];
                const isUpdating = updatingId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-2xl p-5 sm:p-6 border border-gray-200/80 flex flex-col sm:flex-row gap-5 relative ${
                      isUpdating ? 'opacity-60 pointer-events-none' : ''
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="w-full sm:w-24 sm:h-24 h-44 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                      <img
                        src={displayImage}
                        alt={prod.name || 'Sản phẩm'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = DEFAULT_PIZZA_IMG;
                        }}
                      />
                    </div>

                    {/* Thông tin chi tiết */}
                    <div className="flex-grow flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-bold text-gray-900 text-lg sm:text-xl">
                            {prod.name || `Sản phẩm #${item.product_id}`}
                          </h3>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            title="Xóa món này"
                            className="text-gray-400 hover:text-red-600 p-1.5 transition-colors shrink-0 -mt-1 -mr-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Size, Topping, Ghi chú với màu xám nhạt */}
                        <div className="mt-1.5 space-y-1 text-sm text-gray-400">
                          {item.size_name && (
                            <p>
                              Size: <span className="text-gray-400 font-medium">{item.size_name}</span>
                            </p>
                          )}
                          {toppingsList.length > 0 && (
                            <p>
                              Topping:{' '}
                              <span className="text-gray-400 font-medium">
                                {toppingsList
                                  .map((top) => {
                                    const price = Number(top.price || top.extra_price || 0);
                                    return `${top.name || top.topping_name}${price > 0 ? ` (+${formatCurrency(price)})` : ''}`;
                                  })
                                  .join(', ')}
                              </span>
                            </p>
                          )}
                          {item.note && (
                            <p className="italic text-gray-400">Ghi chú: {item.note}</p>
                          )}
                        </div>

                        {/* Nút Chỉnh sửa */}
                        <button
                          type="button"
                          onClick={() => handleEditItem(item)}
                          className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 transition-colors"
                        >
                          <span>Chỉnh sửa</span>
                        </button>
                      </div>

                      {/* Giá đơn vị & Điều chỉnh số lượng */}
                      <div className="flex flex-wrap items-center justify-between gap-4 mt-5 pt-4 border-t border-gray-100">
                        <div className="text-sm text-gray-500">
                          Đơn giá: <span className="font-semibold text-gray-800">{formatCurrency(item.unit_price)}</span>
                        </div>

                        <div className="flex items-center gap-6">
                          {/* Stepper số lượng tinh gọn */}
                          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(item.id, item.quantity, -1)}
                              disabled={item.quantity <= 1 || isUpdating}
                              className="w-8 h-8 bg-gray-50 hover:bg-gray-100 text-gray-600 flex items-center justify-center transition-colors disabled:opacity-40 disabled:pointer-events-none"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-10 text-center font-bold text-gray-800 text-sm">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(item.id, item.quantity, 1)}
                              disabled={isUpdating}
                              className="w-8 h-8 bg-gray-50 hover:bg-gray-100 text-gray-600 flex items-center justify-center transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Tổng giá món */}
                          <div className="text-right min-w-[100px]">
                            <span className="font-bold text-red-600 text-lg sm:text-xl">
                              {formatCurrency(item.total_price)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cột Phải: Tóm tắt đơn hàng */}
            <div className="lg:col-span-1 sticky top-24">
              <div className="bg-white rounded-2xl p-6 sm:p-7 border border-gray-200/80">
                <h2 className="text-lg font-bold text-gray-900 pb-4 border-b border-gray-200">
                  Tóm tắt đơn hàng
                </h2>

                {/* Mã giảm giá */}
                <form onSubmit={handleApplyCoupon} className="mt-4 mb-6">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-2">
                    Mã ưu đãi
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Nhập mã ưu đãi..."
                      disabled={couponApplied}
                      className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 font-medium transition-all disabled:bg-gray-100"
                    />
                    {couponApplied ? (
                      <button
                        type="button"
                        onClick={() => {
                          setCouponApplied(false);
                          setCouponCode('');
                        }}
                        className="px-3 py-2 bg-green-100 text-green-700 rounded-xl text-xs font-semibold flex items-center gap-1 hover:bg-green-200 transition-colors shrink-0"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Đã dùng</span>
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={!couponCode.trim()}
                        className="px-4 py-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white font-semibold text-sm rounded-xl transition-all shrink-0"
                      >
                        Áp dụng
                      </button>
                    )}
                  </div>
                  {couponApplied && (
                    <p className="text-xs text-emerald-600 font-medium mt-1.5 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Giảm 30.000 ₫ cho đơn hàng
                    </p>
                  )}
                </form>

                {/* Chi tiết tính tiền */}
                <div className="space-y-3 text-sm py-4 border-y border-gray-200 text-gray-600">
                  <div className="flex justify-between">
                    <span>Tạm tính ({totalItems} món):</span>
                    <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
                  </div>

                  {couponApplied && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Ưu đãi giảm giá:</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Phí giao hàng:</span>
                    <span className="font-medium text-gray-900">
                      {shippingFee === 0 ? (
                        <span className="text-emerald-600 font-semibold">Miễn phí</span>
                      ) : (
                        formatCurrency(shippingFee)
                      )}
                    </span>
                  </div>
                </div>

                {/* Tổng thanh toán */}
                <div className="pt-4 pb-6">
                  <div className="flex items-baseline justify-between">
                    <span className="text-base font-bold text-gray-900">Tổng thanh toán:</span>
                    <span className="text-2xl font-black text-red-600">
                      {formatCurrency(finalTotal)}
                    </span>
                  </div>
                  {subtotal < 200000 && shippingFee > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      Mua thêm <strong className="text-gray-700">{formatCurrency(200000 - subtotal)}</strong> để được Miễn phí giao hàng.
                    </p>
                  )}
                </div>

                {/* Nút đặt hàng */}
                <button
                  type="button"
                  onClick={() => {
                    alert('Tính năng đặt hàng sẽ được ra mắt trong các task tiếp theo!');
                  }}
                  className="w-full py-3.5 bg-red-600 hover:bg-red-700 active:scale-98 text-white font-bold text-base rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <span>Tiến hành đặt hàng</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="mt-4 text-center">
                  <Link
                    to="/"
                    className="text-xs sm:text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
                  >
                    ← Tiếp tục chọn thêm món ăn
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal chỉnh sửa món ăn */}
        <ProductDetailModal
          product={activeModalProduct}
          isOpen={Boolean(activeModalProduct)}
          onClose={() => {
            setActiveModalProduct(null);
            setActiveEditItem(null);
          }}
          onAddToCart={handleSaveFromModal}
          initialCartItem={activeEditItem}
        />
      </div>
    </div>
  );
};

export default Cart;
