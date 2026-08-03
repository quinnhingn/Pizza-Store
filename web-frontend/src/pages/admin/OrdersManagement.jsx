import React, { useState, useEffect } from 'react';
import ordersAPI from '../../api/ordersAPI';
import { RefreshCw, Search, X } from 'lucide-react';
import { useWebSocket } from '../../contexts/WebSocketContext';
import OrderDetailModal from '../../components/admin/OrderDetailModal';

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
  { id: 'shipping', label: 'Đang giao hàng', dotClass: 'bg-indigo-600' }
];

const CANCEL_REASONS = [
  'Khách hàng yêu cầu hủy',
  'Tạm hết nguyên liệu / loại bánh này',
  'Không thể liên lạc xác nhận với khách',
  'Địa chỉ nằm ngoài vùng phục vụ giao hàng',
  'Lý do khác'
];

const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    order: null,
    targetStatus: '',
    actionLabel: '',
    reason: CANCEL_REASONS[0],
    customReason: ''
  });
  const [updating, setUpdating] = useState(false);
  
  const { latestMessage } = useWebSocket() || {};

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (latestMessage && (latestMessage.type === 'new_order' || latestMessage.type === 'order_update')) {
      fetchOrders(true);
    }
  }, [latestMessage]);

  const fetchOrders = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
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
      if (targetStatus === 'cancelled') {
        const cancelReason = reason === 'Lý do khác' ? customReason : reason;
        await ordersAPI.cancelOrder(order.id, cancelReason);
      } else {
        await ordersAPI.updateOrderStatus(order.id, targetStatus);
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: targetStatus } : o))
      );

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

  const activeOrders = orders.filter(o => ['pending', 'confirmed', 'shipping'].includes(o.status));

  const totalActiveCount = activeOrders.length;
  const pendingOrdersCount = activeOrders.filter((o) => o.status === 'pending').length;
  const confirmedOrdersCount = activeOrders.filter((o) => o.status === 'confirmed').length;
  const shippingOrdersCount = activeOrders.filter((o) => o.status === 'shipping').length;

  const filteredOrders = activeOrders.filter((o) => {
    const term = searchTerm.trim().toLowerCase();
    return (
      !term ||
      (o.order_code && o.order_code.toLowerCase().includes(term)) ||
      (o.shipping_full_name && o.shipping_full_name.toLowerCase().includes(term)) ||
      (o.shipping_phone && o.shipping_phone.includes(term))
    );
  });

  return (
    <div className="space-y-4">
      <div className="bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-2xs flex flex-wrap items-center gap-4 sm:gap-6 text-sm divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
        <div className="flex items-center gap-2.5 py-0.5 flex-1 min-w-[150px]">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <div>
            <span className="text-[11px] font-bold uppercase text-gray-500 block">Đơn đang xử lý</span>
            <span className="text-xl font-extrabold text-gray-900">{totalActiveCount}</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5 sm:pl-6 py-0.5 flex-1 min-w-[150px]">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
          <div>
            <span className="text-[11px] font-bold uppercase text-amber-700 block">Chờ xác nhận</span>
            <span className="text-xl font-extrabold text-amber-900">{pendingOrdersCount}</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5 sm:pl-6 py-0.5 flex-1 min-w-[150px]">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
          <div>
            <span className="text-[11px] font-bold uppercase text-blue-700 block">Đã xác nhận (Bếp)</span>
            <span className="text-xl font-extrabold text-blue-900">{confirmedOrdersCount}</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5 sm:pl-6 py-0.5 flex-1 min-w-[150px]">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
          <div>
            <span className="text-[11px] font-bold uppercase text-indigo-700 block">Đang giao hàng</span>
            <span className="text-xl font-extrabold text-indigo-900">{shippingOrdersCount}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <h2 className="text-lg font-bold text-gray-900 tracking-tight">
          Bảng theo dõi tiến độ <span className="text-gray-500 font-medium text-sm ml-1">({filteredOrders.length} đơn)</span>
        </h2>
        
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm mã đơn, tên, SĐT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent text-xs font-medium placeholder-gray-400 bg-white"
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
            className="p-1.5 bg-white hover:bg-gray-50 active:scale-95 text-gray-700 rounded-lg transition font-bold flex items-center justify-center disabled:opacity-50 cursor-pointer shadow-2xs border border-gray-200 h-[34px] w-[34px]"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-red-600' : ''}`} />
          </button>
        </div>
      </div>

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
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 transition cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          {KANBAN_COLUMNS.map((col) => {
            const colOrders = filteredOrders.filter((o) => o.status === col.id);
            return (
              <div
                key={col.id}
                className="bg-gray-100/90 rounded-xl border border-gray-200 flex flex-col max-h-[calc(100vh-210px)] overflow-hidden shadow-2xs"
              >
                <div className="px-4 py-3 border-b border-gray-200 bg-white/95 backdrop-blur-xs flex items-center justify-between sticky top-0 z-10">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.dotClass}`} />
                    <h3 className="font-extrabold text-xs uppercase tracking-wider text-gray-900">
                      {col.label}
                    </h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-gray-200 text-gray-700">
                    {colOrders.length}
                  </span>
                </div>

                <div className="p-3 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
                  {colOrders.length === 0 ? (
                    <div className="py-8 text-center border border-dashed border-gray-300 rounded-lg m-1 bg-white/50">
                      <p className="text-sm font-semibold text-gray-400">Trống</p>
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
                          className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition space-y-3 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-2.5 mb-2.5">
                              <div>
                                <span className="font-extrabold text-gray-900 text-sm block tracking-wide">
                                  {order.order_code}
                                </span>
                                <span className="text-[11px] text-gray-500 font-medium block mt-0.5">
                                  {formatDate(order.created_at)}
                                </span>
                              </div>
                              <span className="font-extrabold text-red-600 text-sm whitespace-nowrap">
                                {formatPrice(order.total_amount)}
                              </span>
                            </div>

                            <div className="text-sm space-y-1">
                              <p className="font-bold text-gray-800 line-clamp-1">
                                {order.shipping_full_name}
                              </p>
                              <p className="text-gray-500 font-medium text-xs">
                                {order.shipping_phone}
                              </p>
                              <p
                                className="text-gray-500 line-clamp-2 text-xs mt-1.5 leading-relaxed bg-gray-50 p-1.5 rounded-md border border-gray-100"
                                title={order.shipping_address}
                              >
                                {order.shipping_address}
                              </p>
                            </div>
                          </div>

                          <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between gap-2">
                            {order.status === 'pending' ? (
                              <button
                                onClick={() => setSelectedOrder(order)}
                                className="w-full px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs rounded-lg transition shadow-sm cursor-pointer text-center"
                              >
                                Xem đơn đặt hàng
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => setSelectedOrder(order)}
                                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-lg transition cursor-pointer"
                                >
                                  Chi tiết
                                </button>
                                
                                <div className="flex items-center gap-1.5">
                                  {statusInfo.nextStatus && (
                                    order.status === 'shipping' && !order.customer_confirmed ? (
                                      <button
                                        disabled
                                        title="Khách hàng chưa bấm 'Đã nhận hàng' trên ứng dụng"
                                        className="px-3 py-1.5 font-bold rounded-lg text-xs bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                                      >
                                        🔒 Chờ khách
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => openConfirmModal(order, statusInfo.nextStatus, statusInfo.nextLabel)}
                                        className={`px-3 py-1.5 font-bold text-white rounded-lg text-xs transition shadow-sm ${statusInfo.nextBtnClass} cursor-pointer`}
                                      >
                                        {statusInfo.nextLabel}
                                      </button>
                                    )
                                  )}
                                </div>
                              </>
                            )}
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

      {confirmModal.isOpen && confirmModal.order && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden flex flex-col shadow-2xl scale-in-center">
            <div className={`px-6 py-4 border-b flex items-center gap-3 ${
              confirmModal.targetStatus === 'cancelled' ? 'border-rose-100 bg-rose-50' : 'border-red-100 bg-red-50'
            }`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                confirmModal.targetStatus === 'cancelled' ? 'bg-rose-200 text-rose-700' : 'bg-red-200 text-red-700'
              }`}>
                <span className="font-bold text-lg">!</span>
              </div>
              <div>
                <h3 className={`text-lg font-extrabold ${
                  confirmModal.targetStatus === 'cancelled' ? 'text-rose-900' : 'text-red-900'
                }`}>
                  {confirmModal.targetStatus === 'cancelled' ? 'Xác nhận hủy đơn' : 'Xác nhận chuyển trạng thái'}
                </h3>
              </div>
            </div>

            <div className="p-6 text-sm text-gray-600 space-y-4">
              <p>
                Bạn có chắc chắn muốn <strong className="text-gray-900">{confirmModal.actionLabel.toLowerCase()}</strong> đối với đơn hàng <strong className="text-gray-900">{confirmModal.order.order_code}</strong> không?
              </p>

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

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
              <button
                onClick={closeConfirmModal}
                disabled={updating}
                className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl text-xs transition cursor-pointer"
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
      <OrderDetailModal
        isOpen={!!selectedOrder}
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onActionClick={(targetStatus, actionLabel) => openConfirmModal(selectedOrder, targetStatus, actionLabel)}
      />
    </div>
  );
};

export default OrdersManagement;
