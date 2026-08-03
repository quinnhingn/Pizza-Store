import React from 'react';

const STEPPER_STAGES = [
  { key: 'pending', label: 'Chờ xác nhận' },
  { key: 'confirmed', label: 'Đã xác nhận' },
  { key: 'shipping', label: 'Đang giao' },
  { key: 'completed', label: 'Hoàn thành' }
];

const STATUS_MAP = {
  pending: { nextStatus: 'confirmed', nextLabel: 'Xác nhận đơn', nextBtnClass: 'bg-blue-600 hover:bg-blue-700 text-white' },
  confirmed: { nextStatus: 'shipping', nextLabel: 'Bắt đầu giao', nextBtnClass: 'bg-indigo-600 hover:bg-indigo-700 text-white' },
  shipping: { nextStatus: 'completed', nextLabel: 'Hoàn thành đơn', nextBtnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
  completed: { nextStatus: null, nextLabel: null },
  cancelled: { nextStatus: null, nextLabel: null }
};

const OrderDetailModal = ({ isOpen, order, onClose, onActionClick, hideActions = false }) => {
  if (!isOpen || !order) return null;

  const formatPrice = (amount) => {
    if (amount == null) return '0đ';
    return Number(amount).toLocaleString('vi-VN') + 'đ';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStepProgressIndex = (status) => {
    if (status === 'cancelled') return -1;
    const idx = STEPPER_STAGES.findIndex((s) => s.key === status);
    return idx >= 0 ? idx : 0;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h3 className="text-xl font-extrabold text-gray-900">
              Chi Tiết Đơn Hàng {order.order_code}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Thời gian đặt: {formatDate(order.created_at)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 flex items-center justify-center font-bold text-sm transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-grow text-sm">
          {/* Order Timeline Stepper */}
          {order.status !== 'cancelled' ? (
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
              <span className="text-xs font-extrabold uppercase tracking-wider text-gray-500 block mb-4">
                Tiến trình đơn hàng
              </span>
              <div className="flex items-center justify-between relative">
                {/* Background line */}
                <div className="absolute top-1/2 left-4 right-4 h-1 bg-gray-200 -translate-y-1/2 -z-0" />
                {/* Active line */}
                <div
                  className="absolute top-1/2 left-4 h-1 bg-red-600 -translate-y-1/2 transition-all duration-300 -z-0"
                  style={{
                    width: `${(getStepProgressIndex(order.status) / (STEPPER_STAGES.length - 1)) * 90}%`
                  }}
                />

                {STEPPER_STAGES.map((step, idx) => {
                  const currentIdx = getStepProgressIndex(order.status);
                  const isDone = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;

                  return (
                    <div key={step.key} className="relative z-10 flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition ${
                          isCurrent
                            ? 'bg-red-600 text-white ring-4 ring-red-100 shadow-md'
                            : isDone
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <span className={`text-[11px] font-bold mt-2 whitespace-nowrap ${
                        isCurrent ? 'text-red-600' : isDone ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between">
              <div>
                <span className="font-bold block">Đơn hàng này đã bị hủy bỏ.</span>
                {order.cancel_reason && (
                  <span className="text-xs mt-1 block">Lý do: {order.cancel_reason}</span>
                )}
              </div>
              <span className="px-3 py-1 bg-rose-100 rounded-full text-xs font-bold">Đã hủy</span>
            </div>
          )}

          {/* Customer Confirmation Info Banner (when order is in shipping or completed) */}
          {(order.status === 'shipping' || order.status === 'completed') && (
            <div className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs font-semibold ${
              order.customer_confirmed
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-base">{order.customer_confirmed ? '✓' : '⏳'}</span>
                <span>
                  {order.customer_confirmed
                    ? 'Khách hàng đã bấm xác nhận "Đã nhận hàng" trên ứng dụng.'
                    : 'Khách hàng chưa xác nhận nhận hàng (Admin cần đợi khách bấm xác nhận mới có thể hoàn thành đơn).'}
                </span>
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                order.customer_confirmed ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
              }`}>
                {order.customer_confirmed ? 'Đã xác nhận' : 'Chờ xác nhận'}
              </span>
            </div>
          )}


          {/* Shipping & Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-1.5 text-gray-700">
              <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-wider mb-2">Người mua / Nhận hàng</h4>
              <p><span className="font-bold text-gray-900">Họ tên:</span> {order.shipping_full_name}</p>
              <p><span className="font-bold text-gray-900">Điện thoại:</span> {order.shipping_phone}</p>
              <p><span className="font-bold text-gray-900">Địa chỉ:</span> {order.shipping_address}</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-1.5 text-gray-700">
              <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-wider mb-2">Ghi chú & Khuyến mãi</h4>
              <p><span className="font-bold text-gray-900">Ghi chú từ khách:</span> {order.note || 'Không có ghi chú'}</p>
              <p><span className="font-bold text-gray-900">Mã voucher đã dùng:</span> {order.voucher_code || 'Không sử dụng'}</p>
            </div>
          </div>

          {/* Order Items List */}
          <div>
            <h4 className="font-extrabold text-gray-900 mb-3 uppercase text-xs tracking-wider">
              Danh sách món ăn đặt mua ({order.items?.length || 0})
            </h4>
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl overflow-hidden">
              {order.items?.map((item) => {
                const toppingsList = Array.isArray(item.toppings) ? item.toppings : [];
                return (
                  <div key={item.id} className="p-4 bg-white flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl bg-gray-100 border border-gray-200 flex-shrink-0 overflow-hidden flex items-center justify-center">
                        {item.product?.image_url ? (
                          <img src={item.product.image_url} alt={item.product?.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-gray-400">Pizza</span>
                        )}
                      </div>
                      <div>
                        <p className="font-extrabold text-gray-900 text-base">
                          {item.product?.name || 'Bánh Pizza'} <span className="text-red-600 font-bold">(x{item.quantity})</span>
                        </p>
                        {item.size_name && (
                          <p className="text-xs text-gray-500 font-medium mt-0.5">Kích cỡ: <span className="font-bold text-gray-700">{item.size_name}</span></p>
                        )}
                        {toppingsList.length > 0 && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            Topping: {toppingsList.map(t => typeof t === 'string' ? t : t.name).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 font-medium">Đơn giá: {formatPrice(item.unit_price)}</p>
                      <p className="font-extrabold text-gray-900 text-base mt-0.5">
                        {formatPrice(item.unit_price * item.quantity)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 space-y-2.5">
            <div className="flex justify-between text-gray-600">
              <span>Tổng tiền hàng (Tạm tính)</span>
              <span className="font-semibold text-gray-900">
                {formatPrice((order.total_amount || 0) + (order.discount_amount || 0))}
              </span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Voucher giảm giá {order.voucher_code ? `(${order.voucher_code})` : ''}</span>
                <span className="font-bold">-{formatPrice(order.discount_amount)}</span>
              </div>
            )}
            <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
              <span className="font-extrabold text-gray-900 text-base">Tổng thanh toán đơn hàng</span>
              <span className="text-2xl font-extrabold text-red-600">
                {formatPrice(order.total_amount)}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
          {!hideActions && order.status !== 'completed' && order.status !== 'cancelled' ? (
            <>
              {order.status === 'pending' && (
                <button
                  onClick={() => onActionClick('cancelled', 'Hủy đơn')}
                  className="px-6 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl transition text-sm shadow-sm cursor-pointer border border-rose-200"
                >
                  Hủy đơn
                </button>
              )}
              {STATUS_MAP[order.status]?.nextStatus && (
                order.status === 'shipping' && !order.customer_confirmed ? (
                  <button
                    disabled
                    title="Khách hàng chưa bấm 'Đã nhận hàng' trên ứng dụng"
                    className="px-6 py-2.5 font-bold rounded-xl text-sm bg-gray-200 text-gray-500 cursor-not-allowed border border-gray-300 flex items-center gap-1.5"
                  >
                    🔒 Chờ khách nhận hàng
                  </button>
                ) : (
                  <button
                    onClick={() => onActionClick(STATUS_MAP[order.status].nextStatus, STATUS_MAP[order.status].nextLabel)}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition shadow-sm ${STATUS_MAP[order.status].nextBtnClass} cursor-pointer`}
                  >
                    {STATUS_MAP[order.status].nextLabel}
                  </button>
                )
              )}
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl transition text-sm shadow-sm cursor-pointer"
            >
              Đóng
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
