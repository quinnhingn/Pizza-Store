import React, { useState, useEffect } from 'react';
import ordersAPI from '../../api/ordersAPI';
import { RefreshCw, Search, X } from 'lucide-react';

const STATUS_MAP = {
  pending: {
    label: 'Chờ xác nhận',
    badgeClass: 'bg-amber-50 text-amber-800 border border-amber-200',
    nextStatus: 'confirmed',
    nextLabel: 'Xác nhận đơn',
    nextBtnClass: 'bg-blue-600 hover:bg-blue-700 text-white'
  },
  confirmed: {
    label: 'Đã xác nhận',
    badgeClass: 'bg-blue-50 text-blue-800 border border-blue-200',
    nextStatus: 'shipping',
    nextLabel: 'Bắt đầu giao',
    nextBtnClass: 'bg-indigo-600 hover:bg-indigo-700 text-white'
  },
  shipping: {
    label: 'Đang giao hàng',
    badgeClass: 'bg-indigo-50 text-indigo-800 border border-indigo-200',
    nextStatus: 'completed',
    nextLabel: 'Hoàn thành đơn',
    nextBtnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white'
  },
  completed: {
    label: 'Hoàn thành',
    badgeClass: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    nextStatus: null,
    nextLabel: null
  },
  cancelled: {
    label: 'Đã hủy',
    badgeClass: 'bg-rose-50 text-rose-800 border border-rose-200',
    nextStatus: null,
    nextLabel: null
  }
};

const KANBAN_COLUMNS = [
  { id: 'pending', label: 'Chờ xác nhận', dotClass: 'bg-amber-500' },
  { id: 'confirmed', label: 'Đã xác nhận', dotClass: 'bg-blue-600' },
  { id: 'shipping', label: 'Đang giao hàng', dotClass: 'bg-indigo-600' },
  { id: 'completed', label: 'Hoàn thành', dotClass: 'bg-emerald-600' },
  { id: 'cancelled', label: 'Đã hủy', dotClass: 'bg-rose-600' }
];

const CANCEL_REASONS = [
  'Khách hàng yêu cầu hủy',
  'Tạm hết nguyên liệu / loại bánh này',
  'Không thể liên lạc xác nhận với khách',
  'Địa chỉ nằm ngoài vùng phục vụ giao hàng',
  'Lý do khác'
];

const STEPPER_STAGES = [
  { key: 'pending', label: 'Đặt hàng' },
  { key: 'confirmed', label: 'Xác nhận bếp' },
  { key: 'shipping', label: 'Đang giao hàng' },
  { key: 'completed', label: 'Hoàn thành' }
];

const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Modal Confirm State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    order: null,
    targetStatus: '',
    actionLabel: '',
    reason: CANCEL_REASONS[0],
    customReason: ''
  });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await ordersAPI.getAllOrdersAdmin();
      const list = Array.isArray(res) ? res : (res.data || []);
      setOrders(list);
      setError(null);
    } catch (err) {
      setError('Không thể tải danh sách đơn hàng. Vui lòng kiểm tra lại kết nối.');
      console.error('Failed to load admin orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const openConfirmModal = (order, targetStatus, actionLabel) => {
    setConfirmModal({
      isOpen: true,
      order,
      targetStatus,
      actionLabel,
      reason: CANCEL_REASONS[0],
      customReason: ''
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal({
      isOpen: false,
      order: null,
      targetStatus: '',
      actionLabel: '',
      reason: CANCEL_REASONS[0],
      customReason: ''
    });
  };

  const executeStatusUpdate = async () => {
    const { order, targetStatus, reason, customReason } = confirmModal;
    if (!order || !targetStatus) return;

    try {
      setUpdating(true);
      await ordersAPI.updateOrderStatus(order.id, targetStatus);

      // Fast optimistic state update
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: targetStatus } : o))
      );

      if (selectedOrder && selectedOrder.id === order.id) {
        setSelectedOrder((prev) => ({ ...prev, status: targetStatus }));
      }

      closeConfirmModal();
    } catch (err) {
      alert(err.response?.data?.detail || 'Có lỗi xảy ra khi cập nhật trạng thái đơn hàng.');
      console.error('Update status error:', err);
    } finally {
      setUpdating(false);
    }
  };

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

  // Stats Calculations
  const totalOrdersCount = orders.length;
  const pendingOrdersCount = orders.filter((o) => o.status === 'pending').length;
  const shippingOrdersCount = orders.filter((o) => o.status === 'shipping').length;
  const completedRevenue = orders
    .filter((o) => o.status === 'completed')
    .reduce((acc, curr) => acc + (curr.total_amount || 0), 0);

  // Search filter
  const filteredOrders = orders.filter((o) => {
    const term = searchTerm.trim().toLowerCase();
    return (
      !term ||
      (o.order_code && o.order_code.toLowerCase().includes(term)) ||
      (o.shipping_full_name && o.shipping_full_name.toLowerCase().includes(term)) ||
      (o.shipping_phone && o.shipping_phone.includes(term))
    );
  });

  const getStepProgressIndex = (status) => {
    if (status === 'cancelled') return -1;
    const idx = STEPPER_STAGES.findIndex((s) => s.key === status);
    return idx >= 0 ? idx : 0;
  };

  return (
    <div className="space-y-4">
      {/* Top Controls & Metrics Bar */}
      <div className="bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-2xs flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        {/* 4 Stats Items */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-5 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 text-sm flex-1">
          <div className="flex items-center gap-2.5 py-0.5">
            <span className="w-2 h-2 rounded-full bg-gray-400" />
            <div>
              <span className="text-[11px] font-bold uppercase text-gray-400 block">Tổng đơn</span>
              <span className="text-base font-extrabold text-gray-900">{totalOrdersCount}</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 sm:pl-5 py-0.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <div>
              <span className="text-[11px] font-bold uppercase text-amber-700 block">Chờ xác nhận</span>
              <span className="text-base font-extrabold text-amber-900">{pendingOrdersCount}</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 sm:pl-5 py-0.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <div>
              <span className="text-[11px] font-bold uppercase text-indigo-700 block">Đang giao</span>
              <span className="text-base font-extrabold text-indigo-900">{shippingOrdersCount}</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 sm:pl-5 py-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <div>
              <span className="text-[11px] font-bold uppercase text-emerald-700 block">Doanh thu hoàn thành</span>
              <span className="text-base font-extrabold text-emerald-900">{formatPrice(completedRevenue)}</span>
            </div>
          </div>
        </div>

        {/* Search Input & Refresh Icon Button */}
        <div className="flex items-center gap-2 pt-2 xl:pt-0 border-t xl:border-t-0 border-gray-100">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm mã đơn, tên, SĐT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent text-xs font-medium placeholder-gray-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={fetchOrders}
            disabled={loading}
            title="Làm mới dữ liệu"
            className="p-1.5 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-700 rounded-lg transition font-bold flex items-center justify-center disabled:opacity-50 cursor-pointer shadow-2xs border border-gray-200"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-red-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Kanban Board Grid */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center shadow-xs">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full mb-3" />
          <p className="text-gray-500 font-medium">Đang tải danh sách đơn hàng...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-700">
          <p className="font-bold mb-2">{error}</p>
          <button
            onClick={fetchOrders}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 transition"
          >
            Thử lại
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 items-start">
          {KANBAN_COLUMNS.map((col) => {
            const colOrders = filteredOrders.filter((o) => o.status === col.id);
            return (
              <div
                key={col.id}
                className="bg-gray-100/90 rounded-xl border border-gray-200 flex flex-col max-h-[calc(100vh-165px)] overflow-hidden shadow-2xs"
              >
                {/* Column Header */}
                <div className="px-3 py-2.5 border-b border-gray-200 bg-white/95 backdrop-blur-xs flex items-center justify-between sticky top-0 z-10">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${col.dotClass}`} />
                    <h3 className="font-extrabold text-xs uppercase tracking-wider text-gray-900">
                      {col.label}
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-gray-200 text-gray-700">
                    {colOrders.length}
                  </span>
                </div>

                {/* Column Cards Container */}
                <div className="p-2 overflow-y-auto space-y-2.5 flex-1 custom-scrollbar">
                  {colOrders.length === 0 ? (
                    <div className="py-6 text-center border border-dashed border-gray-200 rounded-lg m-0.5 bg-white/40">
                      <p className="text-xs font-semibold text-gray-400">Trống</p>
                    </div>
                  ) : (
                    colOrders.map((order) => {
                      const statusInfo = STATUS_MAP[order.status] || {
                        nextStatus: null,
                        nextLabel: null
                      };

                      return (
                        <div
                          key={order.id}
                          className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs hover:shadow-md transition space-y-2.5 flex flex-col justify-between"
                        >
                          <div>
                            {/* Card Top: Code & Price */}
                            <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-2 mb-2">
                              <div>
                                <span className="font-extrabold text-gray-900 text-xs block tracking-wide">
                                  {order.order_code}
                                </span>
                                <span className="text-[10px] text-gray-400 font-medium block mt-0.5">
                                  {formatDate(order.created_at)}
                                </span>
                              </div>
                              <span className="font-extrabold text-red-600 text-xs whitespace-nowrap">
                                {formatPrice(order.total_amount)}
                              </span>
                            </div>

                            {/* Customer Info */}
                            <div className="text-xs space-y-0.5">
                              <p className="font-bold text-gray-800 line-clamp-1">
                                {order.shipping_full_name}
                              </p>
                              <p className="text-gray-500 font-medium text-[11px]">
                                {order.shipping_phone}
                              </p>
                              <p
                                className="text-gray-400 line-clamp-2 text-[11px] mt-1 leading-relaxed"
                                title={order.shipping_address}
                              >
                                {order.shipping_address}
                              </p>
                            </div>
                          </div>

                          {/* Action Buttons inside Card */}
                          <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-1.5">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg text-[11px] transition cursor-pointer"
                            >
                              Chi tiết
                            </button>

                            <div className="flex items-center gap-1.5 ml-auto">
                              {/* Primary Step Transition Button */}
                              {statusInfo.nextStatus && (
                                order.status === 'shipping' && !order.customer_confirmed ? (
                                  <button
                                    disabled
                                    title="Khách hàng chưa bấm 'Đã nhận hàng' trên ứng dụng"
                                    className="px-2 py-1 font-bold rounded-lg text-[11px] bg-gray-200 text-gray-500 cursor-not-allowed border border-gray-300 flex items-center gap-1"
                                  >
                                    🔒 Chờ khách
                                  </button>
                                ) : (
                                  <button
                                    onClick={() =>
                                      openConfirmModal(order, statusInfo.nextStatus, statusInfo.nextLabel)
                                    }
                                    className={`px-2.5 py-1 font-bold rounded-lg text-[11px] transition shadow-2xs ${statusInfo.nextBtnClass} cursor-pointer`}
                                  >
                                    {statusInfo.nextLabel}
                                  </button>
                                )
                              )}

                              {/* Secondary Cancel Button (ONLY for pending) */}
                              {order.status === 'pending' && (
                                <button
                                  onClick={() => openConfirmModal(order, 'cancelled', 'Hủy đơn')}
                                  className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-[11px] transition border border-rose-200 cursor-pointer"
                                >
                                  Hủy
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && confirmModal.order && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-lg font-extrabold text-gray-900">
                Xác Nhận Chuyển Trạng Thái
              </h3>
              <button
                onClick={closeConfirmModal}
                disabled={updating}
                className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-sm transition flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-sm">
              {/* Target Order Summary */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-1">
                <div className="flex justify-between font-bold text-gray-900">
                  <span>Mã đơn: {confirmModal.order.order_code}</span>
                  <span className="text-red-600">{formatPrice(confirmModal.order.total_amount)}</span>
                </div>
                <p className="text-xs text-gray-600">
                  Khách hàng: <span className="font-semibold text-gray-800">{confirmModal.order.shipping_full_name}</span> ({confirmModal.order.shipping_phone})
                </p>
              </div>

              {/* Status Transition Arrow Box */}
              <div className="p-4 rounded-2xl bg-white border border-gray-200 flex items-center justify-around text-center shadow-xs">
                <div>
                  <span className="text-[11px] font-bold text-gray-400 block uppercase mb-1">Hiện tại</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${(STATUS_MAP[confirmModal.order.status] || {}).badgeClass}`}>
                    {(STATUS_MAP[confirmModal.order.status] || {}).label}
                  </span>
                </div>
                <div className="text-lg font-extrabold text-gray-400">➔</div>
                <div>
                  <span className="text-[11px] font-bold text-gray-400 block uppercase mb-1">Chuyển sang</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${(STATUS_MAP[confirmModal.targetStatus] || {}).badgeClass}`}>
                    {(STATUS_MAP[confirmModal.targetStatus] || {}).label}
                  </span>
                </div>
              </div>

              {/* Cancellation Reason Selector (If cancelling) */}
              {confirmModal.targetStatus === 'cancelled' && (
                <div className="space-y-3 pt-2">
                  <label className="block font-bold text-gray-900 text-xs uppercase tracking-wider">
                    Lý do hủy đơn hàng
                  </label>
                  <div className="space-y-2">
                    {CANCEL_REASONS.map((r, idx) => (
                      <label key={idx} className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer font-medium">
                        <input
                          type="radio"
                          name="cancel_reason"
                          value={r}
                          checked={confirmModal.reason === r}
                          onChange={(e) => setConfirmModal((prev) => ({ ...prev, reason: e.target.value }))}
                          className="text-red-600 focus:ring-red-500"
                        />
                        <span>{r}</span>
                      </label>
                    ))}
                  </div>
                  {confirmModal.reason === 'Lý do khác' && (
                    <textarea
                      rows={2}
                      placeholder="Nhập cụ thể lý do hủy..."
                      value={confirmModal.customReason}
                      onChange={(e) => setConfirmModal((prev) => ({ ...prev, customReason: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-red-600 focus:outline-none"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
              <button
                onClick={closeConfirmModal}
                disabled={updating}
                className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl text-xs transition"
              >
                Hủy bỏ
              </button>
              <button
                onClick={executeStatusUpdate}
                disabled={updating}
                className={`px-5 py-2.5 font-bold text-white rounded-xl text-xs transition shadow-sm flex items-center gap-2 cursor-pointer ${
                  confirmModal.targetStatus === 'cancelled'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {updating ? 'Đang cập nhật...' : confirmModal.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="text-xl font-extrabold text-gray-900">
                  Chi Tiết Đơn Hàng {selectedOrder.order_code}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Thời gian đặt: {formatDate(selectedOrder.created_at)}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-9 h-9 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 flex items-center justify-center font-bold text-sm transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-grow text-sm">
              {/* Order Timeline Stepper */}
              {selectedOrder.status !== 'cancelled' ? (
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
                        width: `${(getStepProgressIndex(selectedOrder.status) / (STEPPER_STAGES.length - 1)) * 90}%`
                      }}
                    />

                    {STEPPER_STAGES.map((step, idx) => {
                      const currentIdx = getStepProgressIndex(selectedOrder.status);
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
                  <span className="font-bold">Đơn hàng này đã bị hủy bỏ.</span>
                  <span className="px-3 py-1 bg-rose-100 rounded-full text-xs font-bold">Đã hủy</span>
                </div>
              )}

              {/* Customer Confirmation Info Banner (when order is in shipping or completed) */}
              {(selectedOrder.status === 'shipping' || selectedOrder.status === 'completed') && (
                <div className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs font-semibold ${
                  selectedOrder.customer_confirmed
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="text-base">{selectedOrder.customer_confirmed ? '✓' : '⏳'}</span>
                    <span>
                      {selectedOrder.customer_confirmed
                        ? 'Khách hàng đã bấm xác nhận "Đã nhận hàng" trên ứng dụng.'
                        : 'Khách hàng chưa xác nhận nhận hàng (Admin cần đợi khách bấm xác nhận mới có thể hoàn thành đơn).'}
                    </span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                    selectedOrder.customer_confirmed ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
                  }`}>
                    {selectedOrder.customer_confirmed ? 'Đã xác nhận' : 'Chờ xác nhận'}
                  </span>
                </div>
              )}

              {/* Action Banner inside Detail Modal */}
              {selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
                <div className="p-4 rounded-2xl bg-white border border-gray-200 flex items-center justify-between gap-4 shadow-xs">
                  <div>
                    <span className="font-bold text-gray-900 block text-xs uppercase tracking-wider">Cập nhật tiến độ tiếp theo</span>
                    <p className="text-xs text-gray-500 mt-0.5">Chuyển sang bước kế tiếp sau khi hoàn tất chế biến/giao bánh.</p>
                  </div>
                  <div className="flex gap-2">
                    {STATUS_MAP[selectedOrder.status]?.nextStatus && (
                      selectedOrder.status === 'shipping' && !selectedOrder.customer_confirmed ? (
                        <button
                          disabled
                          title="Khách hàng chưa bấm 'Đã nhận hàng' trên ứng dụng"
                          className="px-4 py-2 font-bold rounded-xl text-xs bg-gray-200 text-gray-500 cursor-not-allowed border border-gray-300 flex items-center gap-1.5"
                        >
                          🔒 Chờ khách nhận hàng
                        </button>
                      ) : (
                        <button
                          onClick={() => openConfirmModal(selectedOrder, STATUS_MAP[selectedOrder.status].nextStatus, STATUS_MAP[selectedOrder.status].nextLabel)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${STATUS_MAP[selectedOrder.status].nextBtnClass} cursor-pointer`}
                        >
                          {STATUS_MAP[selectedOrder.status].nextLabel}
                        </button>
                      )
                    )}
                    {selectedOrder.status === 'pending' && (
                      <button
                        onClick={() => openConfirmModal(selectedOrder, 'cancelled', 'Hủy đơn')}
                        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition border border-rose-200 cursor-pointer"
                      >
                        Hủy đơn
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Shipping & Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-1.5 text-gray-700">
                  <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-wider mb-2">Người mua / Nhận hàng</h4>
                  <p><span className="font-bold text-gray-900">Họ tên:</span> {selectedOrder.shipping_full_name}</p>
                  <p><span className="font-bold text-gray-900">Điện thoại:</span> {selectedOrder.shipping_phone}</p>
                  <p><span className="font-bold text-gray-900">Địa chỉ:</span> {selectedOrder.shipping_address}</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-1.5 text-gray-700">
                  <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-wider mb-2">Ghi chú & Khuyến mãi</h4>
                  <p><span className="font-bold text-gray-900">Ghi chú từ khách:</span> {selectedOrder.note || 'Không có ghi chú'}</p>
                  <p><span className="font-bold text-gray-900">Mã voucher đã dùng:</span> {selectedOrder.voucher_code || 'Không sử dụng'}</p>
                </div>
              </div>

              {/* Order Items List */}
              <div>
                <h4 className="font-extrabold text-gray-900 mb-3 uppercase text-xs tracking-wider">
                  Danh sách món ăn đặt mua ({selectedOrder.items?.length || 0})
                </h4>
                <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl overflow-hidden">
                  {selectedOrder.items?.map((item) => {
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
                    {formatPrice((selectedOrder.total_amount || 0) + (selectedOrder.discount_amount || 0))}
                  </span>
                </div>
                {selectedOrder.discount_amount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Voucher giảm giá {selectedOrder.voucher_code ? `(${selectedOrder.voucher_code})` : ''}</span>
                    <span className="font-bold">-{formatPrice(selectedOrder.discount_amount)}</span>
                  </div>
                )}
                <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                  <span className="font-extrabold text-gray-900 text-base">Tổng thanh toán đơn hàng</span>
                  <span className="text-2xl font-extrabold text-red-600">
                    {formatPrice(selectedOrder.total_amount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl transition text-sm shadow-sm cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersManagement;
