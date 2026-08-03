import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useCart from '../../hooks/useCart';
import useAuth from '../../hooks/useAuth';
import userAPI from '../../api/userAPI';
import ordersAPI from '../../api/ordersAPI';
import SavedVouchersModal from '../../components/customer/SavedVouchersModal';

const Checkout = () => {
  const navigate = useNavigate();
  const {
    cartItems,
    subtotal,
    appliedVoucher,
    applyVoucher,
    removeVoucher,
    clearCart,
    loading: cartLoading
  } = useCart();
  const { isAuthenticated, user } = useAuth();

  // Address states
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [useCustomAddress, setUseCustomAddress] = useState(false);
  const [shippingForm, setShippingForm] = useState({
    shipping_full_name: '',
    shipping_phone: '',
    shipping_address: ''
  });
  const [note, setNote] = useState('');

  // Payment method: 'cod' | 'bank'
  const [paymentMethod, setPaymentMethod] = useState('cod');

  // Voucher modal state
  const [showSavedVouchers, setShowSavedVouchers] = useState(false);
  const [voucherInput, setVoucherInput] = useState('');
  const [applyingVoucher, setApplyingVoucher] = useState(false);

  // Submit states
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [createdOrder, setCreatedOrder] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/cart');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAddresses();
    }
  }, [isAuthenticated]);

  // Pre-fill full_name and phone if user profile exists and no custom input yet
  useEffect(() => {
    if (user && !useCustomAddress && !selectedAddressId) {
      setShippingForm((prev) => ({
        ...prev,
        shipping_full_name: prev.shipping_full_name || user.full_name || '',
        shipping_phone: prev.shipping_phone || user.phone || ''
      }));
    }
  }, [user, useCustomAddress, selectedAddressId]);

  const fetchAddresses = async () => {
    try {
      const res = await userAPI.getAddresses();
      const list = Array.isArray(res) ? res : (res.data || []);
      setAddresses(list);

      // Auto select default or first address if available
      const defaultAddr = list.find((a) => a.is_default);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
        setUseCustomAddress(false);
      } else if (list.length > 0) {
        setSelectedAddressId(list[0].id);
        setUseCustomAddress(false);
      } else {
        setUseCustomAddress(true);
      }
    } catch (err) {
      console.error('Failed to load user addresses:', err);
      setUseCustomAddress(true);
    }
  };

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return '0đ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  // Calculations
  const discountAmount = appliedVoucher ? Number(appliedVoucher.discount_amount || 0) : 0;
  const shippingFee = subtotal >= 200000 ? 0 : 25000;
  const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee);

  const handleAddressSelect = (addr) => {
    setSelectedAddressId(addr.id);
    setUseCustomAddress(false);
  };

  const handleCustomAddressToggle = () => {
    setSelectedAddressId(null);
    setUseCustomAddress(true);
    if (user && !shippingForm.shipping_full_name) {
      setShippingForm({
        shipping_full_name: user.full_name || '',
        shipping_phone: user.phone || '',
        shipping_address: ''
      });
    }
  };

  const handleApplyVoucherInput = async (e) => {
    e.preventDefault();
    if (!voucherInput.trim()) return;
    setApplyingVoucher(true);
    setErrorMessage(null);
    const res = await applyVoucher(voucherInput.trim());
    setApplyingVoucher(false);
    if (res.success) {
      setVoucherInput('');
    } else {
      setErrorMessage(res.message || 'Mã giảm giá không hợp lệ.');
    }
  };

  const handleSelectFromVoucherModal = async (code) => {
    setErrorMessage(null);
    const res = await applyVoucher(code);
    if (!res.success) {
      setErrorMessage(res.message || 'Không thể áp dụng mã giảm giá này.');
    }
  };

  const handleSubmitOrder = async () => {
    setErrorMessage(null);

    // Validate cart not empty
    if (!cartItems || cartItems.length === 0) {
      setErrorMessage('Giỏ hàng đang trống, không thể đặt hàng.');
      return;
    }

    // Validate shipping fields
    let finalName = '';
    let finalPhone = '';
    let finalAddress = '';
    let finalAddressId = null;

    if (!useCustomAddress && selectedAddressId) {
      const addrObj = addresses.find((a) => a.id === selectedAddressId);
      if (!addrObj) {
        setErrorMessage('Vui lòng chọn địa chỉ giao hàng hợp lệ.');
        return;
      }
      finalName = addrObj.full_name;
      finalPhone = addrObj.phone;
      const fullAddressParts = [
        addrObj.address_line,
        addrObj.ward,
        addrObj.district,
        addrObj.province
      ].filter(Boolean);
      finalAddress = fullAddressParts.join(', ');
      finalAddressId = addrObj.id;
    } else {
      finalName = shippingForm.shipping_full_name.trim();
      finalPhone = shippingForm.shipping_phone.trim();
      finalAddress = shippingForm.shipping_address.trim();

      if (!finalName || !finalPhone || !finalAddress) {
        setErrorMessage('Vui lòng điền đầy đủ Họ tên, Số điện thoại và Địa chỉ giao hàng.');
        return;
      }
    }

    const payload = {
      voucher_code: appliedVoucher?.code || null,
      shipping_full_name: finalName,
      shipping_phone: finalPhone,
      shipping_address: finalAddress,
      shipping_address_id: finalAddressId,
      note: note.trim() ? note.trim() : null
    };

    try {
      setSubmitting(true);
      const res = await ordersAPI.createOrder(payload);
      // res is response.data from axiosInstance
      await clearCart();
      removeVoucher();
      setCreatedOrder(res);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Đặt hàng thất bại. Vui lòng kiểm tra lại.';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (cartLoading && cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 text-sm">Đang tải thông tin thanh toán...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Step Header */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Thanh toán đơn hàng</h1>
            <p className="text-sm text-gray-500 mt-1">
              Kiểm tra thông tin giao hàng và lựa chọn hình thức thanh toán phù hợp
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
            <Link to="/cart" className="hover:text-gray-700 transition-colors">Giỏ hàng</Link>
            <span>/</span>
            <span className="text-red-600 font-bold">Thanh toán</span>
            <span>/</span>
            <span>Hoàn tất</span>
          </div>
        </div>

        {/* Empty Cart Notice */}
        {cartItems.length === 0 && !createdOrder ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm space-y-4">
            <p className="text-gray-600 font-medium">Giỏ hàng của bạn hiện đang trống.</p>
            <Link
              to="/"
              className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-sm"
            >
              Quay lại thực đơn
            </Link>
          </div>
        ) : null}

        {/* Main Content (2 Columns) */}
        {cartItems.length > 0 && !createdOrder ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Shipping & Payment */}
            <div className="lg:col-span-7 space-y-6">
              {/* Shipping Address Box */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <h2 className="text-lg font-black text-gray-900">1. Địa chỉ giao hàng</h2>
                  {isAuthenticated && (
                    <Link
                      to="/profile"
                      className="text-xs text-red-600 hover:underline font-semibold"
                    >
                      Quản lý sổ địa chỉ
                    </Link>
                  )}
                </div>

                {/* Authenticated User Saved Addresses */}
                {isAuthenticated && addresses.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Chọn từ sổ địa chỉ của bạn
                    </p>
                    <div className="grid grid-cols-1 gap-3">
                      {addresses.map((addr) => {
                        const isSelected = selectedAddressId === addr.id && !useCustomAddress;
                        return (
                          <div
                            key={addr.id}
                            onClick={() => handleAddressSelect(addr)}
                            className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                              isSelected
                                ? 'border-2 border-red-500 bg-red-50/20 shadow-sm'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                          >
                            <div className="space-y-1.5 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-extrabold text-gray-900 text-sm">
                                  {addr.full_name}
                                </span>
                                <span className="text-gray-400 text-xs font-semibold">|</span>
                                <span className="text-xs text-gray-700 font-semibold">
                                  {addr.phone}
                                </span>
                                {addr.is_default && (
                                  <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                                    Mặc định
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-800 font-medium leading-relaxed">
                                {addr.address_line}
                              </p>
                              {[addr.ward, addr.district, addr.province].filter(Boolean).length > 0 && (
                                <p className="text-xs text-gray-500 leading-relaxed">
                                  {[addr.ward, addr.district, addr.province].filter(Boolean).join(', ')}
                                </p>
                              )}
                            </div>
                            <div className="mt-0.5">
                              <input
                                type="radio"
                                name="shipping_address_option"
                                checked={isSelected}
                                onChange={() => handleAddressSelect(addr)}
                                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Switch to Custom Address option */}
                    <div
                      onClick={handleCustomAddressToggle}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                        useCustomAddress
                          ? 'border-red-500 bg-red-50/30 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <span className="text-sm font-semibold text-gray-800">
                        Giao đến địa chỉ khác / Nhập địa chỉ mới
                      </span>
                      <input
                        type="radio"
                        name="shipping_address_option"
                        checked={useCustomAddress}
                        onChange={handleCustomAddressToggle}
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                      />
                    </div>
                  </div>
                )}

                {/* Custom / Guest Address Form */}
                {(!isAuthenticated || useCustomAddress || addresses.length === 0) && (
                  <div className="space-y-4 pt-2">
                    {isAuthenticated && addresses.length > 0 && (
                      <p className="text-xs font-semibold text-gray-600">
                        Nhập thông tin nhận hàng cho đơn này:
                      </p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">
                          Họ tên người nhận <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Ví dụ: Nguyễn Văn A"
                          value={shippingForm.shipping_full_name}
                          onChange={(e) =>
                            setShippingForm({ ...shippingForm, shipping_full_name: e.target.value })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-red-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">
                          Số điện thoại <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          placeholder="Ví dụ: 0912345678"
                          value={shippingForm.shipping_phone}
                          onChange={(e) =>
                            setShippingForm({ ...shippingForm, shipping_phone: e.target.value })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-red-500 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        Địa chỉ nhận hàng chi tiết <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                        value={shippingForm.shipping_address}
                        onChange={(e) =>
                          setShippingForm({ ...shippingForm, shipping_address: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-red-500 text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* Order Note */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Ghi chú đơn hàng (tuỳ chọn)
                  </label>
                  <textarea
                    rows="2"
                    placeholder="Ghi chú cho nhà hàng hoặc shipper (ví dụ: ít cay, gọi trước khi giao...)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-red-500 text-sm resize-none"
                  ></textarea>
                </div>
              </div>

              {/* Payment Method Box */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
                <h2 className="text-lg font-black text-gray-900 border-b border-gray-100 pb-4">
                  2. Phương thức thanh toán
                </h2>

                <div className="space-y-3">
                  <div
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      paymentMethod === 'cod'
                        ? 'border-red-500 bg-red-50/30 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-gray-900 text-sm">
                        Thanh toán khi nhận hàng (COD)
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Khách hàng thanh toán bằng tiền mặt khi shipper giao bánh tới tận tay
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="payment_method"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                    />
                  </div>

                  <div
                    onClick={() => setPaymentMethod('bank')}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      paymentMethod === 'bank'
                        ? 'border-red-500 bg-red-50/30 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-gray-900 text-sm">
                        Chuyển khoản Ngân hàng (VietQR / Internet Banking)
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Quét mã VietQR tiện lợi, xác nhận đơn hàng siêu tốc
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="payment_method"
                      checked={paymentMethod === 'bank'}
                      onChange={() => setPaymentMethod('bank')}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                    />
                  </div>
                </div>

                {/* Bank details preview if bank selected */}
                {paymentMethod === 'bank' && (
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs space-y-2 text-gray-700 animate-fade-in">
                    <div className="font-bold text-gray-900">Thông tin chuyển khoản nhanh:</div>
                    <div>Ngân hàng: <strong className="text-gray-900">MB Bank (Quân Đội)</strong></div>
                    <div>Số tài khoản: <strong className="text-gray-900">1900 8888 9999</strong></div>
                    <div>Chủ tài khoản: <strong className="text-gray-900">PIZZA STORE VIETNAM</strong></div>
                    <div className="text-gray-500 italic pt-1">
                      * Nhân viên sẽ gửi mã QR VietQR chuẩn số tiền và nội dung xác nhận ngay sau khi bạn đặt đơn.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Order Summary & Voucher */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-5">
                <h2 className="text-lg font-black text-gray-900 border-b border-gray-100 pb-4">
                  3. Tóm tắt đơn hàng ({cartItems.length} món)
                </h2>

                {/* Items list */}
                <div className="max-h-64 overflow-y-auto space-y-3 pr-1 divide-y divide-gray-100">
                  {cartItems.map((item) => (
                    <div key={item.id} className="pt-3 first:pt-0 flex justify-between gap-3 text-sm">
                      <div className="space-y-0.5 flex-1">
                        <div className="font-bold text-gray-900">
                          {item.product?.name || `Sản phẩm #${item.product_id}`}
                          <span className="text-xs font-normal text-gray-500 ml-1.5">
                            (Size: {item.size_name || 'Mặc định'})
                          </span>
                        </div>
                        {item.toppings && item.toppings.length > 0 && (
                          <div className="text-xs text-gray-500">
                            Topping: {item.toppings.map((t) => t.topping_name || t.name).join(', ')}
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          Số lượng: <strong className="text-gray-800">{item.quantity}</strong>
                        </div>
                      </div>
                      <div className="font-semibold text-gray-900 text-right whitespace-nowrap">
                        {formatCurrency(item.total_price)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Voucher Section */}
                <div className="border-t border-b border-gray-100 py-4 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                    <span>Mã ưu đãi giảm giá</span>
                    <button
                      type="button"
                      onClick={() => setShowSavedVouchers(true)}
                      className="text-red-600 hover:underline font-semibold"
                    >
                      Chọn từ kho voucher
                    </button>
                  </div>

                  {appliedVoucher ? (
                    <div className="bg-red-50 border border-red-200 p-3 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="text-xs font-black text-red-700 uppercase">
                          Mã: {appliedVoucher.code}
                        </div>
                        <div className="text-xs text-red-600 mt-0.5 font-semibold">
                          Tiết kiệm {formatCurrency(appliedVoucher.discount_amount)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeVoucher}
                        className="text-xs text-gray-500 hover:text-gray-800 underline font-semibold"
                      >
                        Hủy mã
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyVoucherInput} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Nhập mã giảm giá..."
                        value={voucherInput}
                        onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                        className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-red-500 text-xs uppercase"
                      />
                      <button
                        type="submit"
                        disabled={applyingVoucher || !voucherInput.trim()}
                        className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl text-xs transition-all disabled:opacity-50"
                      >
                        {applyingVoucher ? '...' : 'Áp dụng'}
                      </button>
                    </form>
                  )}
                </div>

                {/* Price Summary */}
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Tạm tính</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(subtotal)}</span>
                  </div>
                  {appliedVoucher && (
                    <div className="flex justify-between text-red-600 font-medium">
                      <span>Giảm giá từ voucher</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Phí vận chuyển</span>
                    <span className="font-semibold text-gray-900">
                      {shippingFee === 0 ? (
                        <span className="text-emerald-600 font-bold">Miễn phí</span>
                      ) : (
                        formatCurrency(shippingFee)
                      )}
                    </span>
                  </div>
                  {shippingFee > 0 && (
                    <div className="text-[11px] text-gray-400 text-right">
                      * Đơn từ 200.000đ được miễn phí vận chuyển
                    </div>
                  )}
                  <hr className="border-gray-100 my-2" />
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-base font-black text-gray-900">Tổng thanh toán</span>
                    <span className="text-2xl font-black text-red-600">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>
                </div>

                {/* Error Message */}
                {errorMessage && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-xs font-medium">
                    {errorMessage}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="button"
                  onClick={handleSubmitOrder}
                  disabled={submitting}
                  className="w-full py-4 bg-red-600 hover:bg-red-700 active:scale-98 disabled:opacity-60 text-white font-black text-base rounded-xl transition-all shadow-sm hover:shadow"
                >
                  {submitting ? 'Đang xử lý đơn hàng...' : 'Xác nhận Đặt hàng ngay'}
                </button>

                <p className="text-[11px] text-center text-gray-400">
                  Bằng việc bấm đặt hàng, bạn đồng ý với các quy định mua hàng của Pizza Store.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Modal Kho Voucher đã lưu */}
        <SavedVouchersModal
          isOpen={showSavedVouchers}
          onClose={() => setShowSavedVouchers(false)}
          onSelectVoucher={handleSelectFromVoucherModal}
          currentOrderValue={subtotal}
          appliedVoucherCode={appliedVoucher?.code}
        />



        {/* Order Success Modal */}
        {createdOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-lg p-7 shadow-2xl border border-gray-100 space-y-6 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Đặt hàng thành công!</h3>
                <p className="text-sm text-gray-500">
                  Cảm ơn bạn đã lựa chọn Pizza Store. Đơn hàng của bạn đang được nhà hàng tiếp nhận và chuẩn bị.
                </p>
              </div>

              {/* Summary card inside modal */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-left text-xs space-y-2 text-gray-700">
                <div className="flex justify-between">
                  <span className="text-gray-500">Mã đơn hàng:</span>
                  <strong className="font-black text-gray-900 text-sm">{createdOrder.order_code}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Người nhận:</span>
                  <span className="font-semibold text-gray-800">{createdOrder.shipping_full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Số điện thoại:</span>
                  <span className="font-semibold text-gray-800">{createdOrder.shipping_phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Địa chỉ giao:</span>
                  <span className="font-semibold text-gray-800 truncate max-w-[220px]">
                    {createdOrder.shipping_address}
                  </span>
                </div>
                <hr className="border-gray-200 my-1" />
                <div className="flex justify-between items-center pt-1">
                  <span className="font-bold text-gray-800">Tổng thanh toán:</span>
                  <span className="font-black text-red-600 text-base">
                    {formatCurrency(createdOrder.total_amount)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => navigate('/orders')}
                  className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-all shadow-sm"
                >
                  Theo dõi đơn hàng
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-sm transition-all"
                >
                  Về trang chủ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;
