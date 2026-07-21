import { useState, useEffect } from 'react';
import vouchersAPI from '../../api/vouchersAPI';

const SavedVouchersModal = ({ isOpen, onClose, onSelectVoucher, currentOrderValue, appliedVoucherCode }) => {
  const [savedVouchers, setSavedVouchers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadSavedVouchers();
    }
  }, [isOpen]);

  const loadSavedVouchers = async () => {
    try {
      setLoading(true);
      const res = await vouchersAPI.getMySavedVouchers();
      setSavedVouchers(Array.isArray(res) ? res : (res.data || []));
    } catch (err) {
      console.error('Failed to load saved vouchers:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return '0đ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-black text-gray-900 text-base">Kho voucher của tôi</h3>
            <p className="text-xs text-gray-500 mt-0.5">Danh sách mã giảm giá bạn đã lưu và chưa sử dụng</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200/50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-4 space-y-3 flex-grow">
          {loading ? (
            <div className="p-8 text-center text-xs text-gray-500">Đang tải kho voucher...</div>
          ) : savedVouchers.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500">
              Ví của bạn hiện chưa có mã giảm giá nào. Hãy xem trong Hộp thư thông báo để lưu các mã được gửi tặng nhé!
            </div>
          ) : (
            savedVouchers.map((item) => {
              const v = item.voucher_details;
              if (!v) return null;

              const isExpired = new Date() > new Date(v.end_date);
              const isLimitReached = v.usage_limit !== null && v.used_count >= v.usage_limit;
              const isValueEligible = !v.min_order_value || (currentOrderValue >= v.min_order_value);
              const isEligible = !isExpired && !isLimitReached && isValueEligible;
              const isCurrentlyUsed = appliedVoucherCode && v.code === appliedVoucherCode;

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                    isCurrentlyUsed
                      ? 'border-emerald-300 bg-emerald-50/40 shadow-sm'
                      : isEligible
                      ? 'border-red-200 bg-gradient-to-r from-white via-red-50/20 to-white shadow-sm hover:shadow'
                      : 'border-gray-200 bg-gray-50 opacity-60'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-red-600 bg-red-50 px-2.5 py-0.5 rounded border border-red-100 uppercase tracking-wide">
                        {v.code}
                      </span>
                      {v.discount_percent ? (
                        <span className="font-bold text-gray-800 text-sm">
                          Giảm {v.discount_percent}% {v.max_discount ? `(Tối đa ${formatCurrency(v.max_discount)})` : ''}
                        </span>
                      ) : (
                        <span className="font-bold text-gray-800 text-sm">
                          Giảm {formatCurrency(v.discount_amount)}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-gray-600">
                      Đơn tối thiểu: <strong className="text-gray-800">{v.min_order_value ? formatCurrency(v.min_order_value) : '0đ'}</strong> • HSD: {formatDate(v.end_date)}
                    </div>

                    {!isValueEligible && (
                      <div className="text-[11px] text-red-600 font-medium">
                        * Cần mua thêm {formatCurrency(v.min_order_value - currentOrderValue)} để đủ điều kiện áp dụng
                      </div>
                    )}
                    {isExpired && <div className="text-[11px] text-red-600 font-medium">* Mã ưu đãi đã hết hạn sử dụng</div>}
                  </div>

                  {isCurrentlyUsed ? (
                    <span className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 flex-shrink-0">
                      <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Đang dùng</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        if (isEligible) {
                          onSelectVoucher(v.code);
                          onClose();
                        }
                      }}
                      disabled={!isEligible}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex-shrink-0 ${
                        isEligible
                          ? 'bg-red-600 hover:bg-red-700 active:scale-95 text-white shadow-sm'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Chọn mã này
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default SavedVouchersModal;
