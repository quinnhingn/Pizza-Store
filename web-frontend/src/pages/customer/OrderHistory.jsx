import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ordersAPI from '../../api/ordersAPI';
import useAuth from '../../hooks/useAuth';
import { useWebSocket } from '../../contexts/WebSocketContext';

const STATUS_MAP = {
  pending: { label: 'Chờ xác nhận', badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200' },
  confirmed: { label: 'Đã xác nhận', badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200' },
  shipping: { label: 'Đang giao hàng', badgeClass: 'bg-indigo-50 text-indigo-700 border border-indigo-200' },
  completed: { label: 'Hoàn thành', badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  cancelled: { label: 'Đã hủy', badgeClass: 'bg-rose-50 text-rose-700 border border-rose-200' }
};

const TABS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'pending', label: 'Chờ xác nhận' },
  { id: 'confirmed', label: 'Đã xác nhận' },
  { id: 'shipping', label: 'Đang giao hàng' },
  { id: 'completed', label: 'Hoàn thành' },
  { id: 'cancelled', label: 'Đã hủy' }
];

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const { latestMessage } = useWebSocket() || {};
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchMyOrders();
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (latestMessage && (latestMessage.type === 'order_update' || latestMessage.type === 'new_order')) {
      fetchMyOrders(true);
    }
  }, [latestMessage]);

  const fetchMyOrders = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await ordersAPI.getMyOrders();
      const list = Array.isArray(res) ? res : (res.data || []);
      setOrders(list);
      setError(null);
    } catch (err) {
      setError('Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.');
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) return;
    try {
      setActionLoading(true);
      await ordersAPI.cancelOrder(orderId);
      alert('Đã hủy đơn hàng thành công.');
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, status: 'cancelled' }));
      }
      await fetchMyOrders();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Có lỗi xảy ra khi hủy đơn hàng.';
      alert(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReceived = async (orderId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Bạn xác nhận đã nhận được đầy đủ món ăn và hải lòng với đơn hàng?')) return;
    try {
      setActionLoading(true);
      const res = await ordersAPI.confirmReceived(orderId);
      alert('Cảm ơn bạn đã xác nhận nhận hàng!');
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, customer_confirmed: true }));
      }
      await fetchMyOrders();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Có lỗi xảy ra khi xác nhận nhận hàng.';
      alert(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'all') return true;
    return o.status === activeTab;
  });

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

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Lịch Sử & Theo Dõi Đơn Hàng
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Xem tiến độ giao bánh và lịch sử đặt hàng của bạn tại Pizza Store.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 p-1.5 shadow-sm mb-6 overflow-x-auto flex space-x-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const count = tab.id === 'all' 
              ? orders.length 
              : orders.filter((o) => o.status === tab.id).length;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                  isActive
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  isActive ? 'bg-red-700 text-white' : 'bg-gray-200 text-gray-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
            <div className="inline-block animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full mb-3" />
            <p className="text-gray-500 font-medium">Đang tải dữ liệu đơn hàng...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
            <p className="font-bold mb-2">{error}</p>
            <button
              onClick={fetchMyOrders}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 transition"
            >
              Thử lại
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
            <p className="text-gray-600 text-lg font-semibold mb-2">
              Không có đơn hàng nào trong mục này.
            </p>
            <p className="text-gray-400 text-sm mb-6">
              Khám phá thực đơn phong phú của chúng tôi và đặt chiếc bánh pizza nóng hổi ngay nhé!
            </p>
            <Link
              to="/"
              className="inline-block px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition shadow-md hover:shadow-lg"
            >
              Xem thực đơn & Đặt bánh
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const statusInfo = STATUS_MAP[order.status] || {
                label: order.status,
                badgeClass: 'bg-gray-100 text-gray-700 border border-gray-300'
              };
              const itemsCount = order.items?.length || 0;
              const displayItems = order.items?.slice(0, 2) || [];
              const remainingCount = itemsCount > 2 ? itemsCount - 2 : 0;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between"
                >
                  {/* Order Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <span className="text-base font-extrabold text-gray-900 tracking-wide">
                        {order.order_code}
                      </span>
                      <span className="text-xs font-semibold text-gray-400">
                        • {formatDate(order.created_at)}
                      </span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusInfo.badgeClass}`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* Order Items Preview */}
                  <div className="py-4 space-y-3">
                    {displayItems.map((item) => {
                      const toppingsList = Array.isArray(item.toppings) ? item.toppings : [];
                      return (
                        <div key={item.id} className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="w-14 h-14 rounded-xl bg-gray-100 border border-gray-200 flex-shrink-0 overflow-hidden flex items-center justify-center">
                              {item.product?.image_url ? (
                                <img
                                  src={item.product.image_url}
                                  alt={item.product?.name || 'Pizza'}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-xs font-bold text-gray-400">Pizza</span>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-sm sm:text-base">
                                {item.product?.name || 'Món ăn'} <span className="text-red-600 font-semibold">(x{item.quantity})</span>
                              </p>
                              {item.size_name && (
                                <p className="text-xs text-gray-500 font-medium mt-0.5">
                                  Kích cỡ: <span className="text-gray-700 font-semibold">{item.size_name}</span>
                                </p>
                              )}
                              {toppingsList.length > 0 && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                  Topping: {toppingsList.map(t => typeof t === 'string' ? t : t.name).join(', ')}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-gray-900 text-sm">
                              {formatPrice(item.unit_price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    {remainingCount > 0 && (
                      <p className="text-xs font-bold text-gray-500 italic pl-1">
                        + và {remainingCount} món khác trong đơn hàng...
                      </p>
                    )}
                  </div>

                  {/* Order Bottom Bar */}
                  <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
                    <div className="text-xs text-gray-600">
                      <p className="font-semibold text-gray-800">Giao đến: {order.shipping_full_name} ({order.shipping_phone})</p>
                      <p className="text-gray-500 line-clamp-1 mt-0.5">{order.shipping_address}</p>
                    </div>
                    <div className="flex items-center gap-6 ml-auto">
                      <div className="text-right">
                        {order.discount_amount > 0 && (
                          <p className="text-xs text-emerald-600 font-semibold">
                            Giảm giá voucher: -{formatPrice(order.discount_amount)}
                          </p>
                        )}
                        <p className="text-sm text-gray-600">
                          Tổng thanh toán: <span className="text-lg font-extrabold text-red-600">{formatPrice(order.total_amount)}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {order.status === 'pending' && (
                          <button
                            disabled={actionLoading}
                            onClick={(e) => handleCancelOrder(order.id, e)}
                            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition disabled:opacity-50 cursor-pointer"
                          >
                            Hủy đơn
                          </button>
                        )}
                        {order.status === 'shipping' && (
                          order.customer_confirmed ? (
                            <span className="px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl flex items-center gap-1">
                              ✓ Đã xác nhận nhận hàng
                            </span>
                          ) : (
                            <button
                              disabled={actionLoading}
                              onClick={(e) => handleConfirmReceived(order.id, e)}
                              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs disabled:opacity-50 cursor-pointer"
                            >
                              Đã nhận hàng
                            </button>
                          )
                        )}
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
                        >
                          Xem chi tiết
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
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
              {/* Status Banner */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                <span className="font-bold text-gray-700">Trạng thái hiện tại:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${(STATUS_MAP[selectedOrder.status] || {}).badgeClass || 'bg-gray-200 text-gray-700'}`}>
                  {(STATUS_MAP[selectedOrder.status] || {}).label || selectedOrder.status}
                </span>
              </div>

              {/* Shipping Info */}
              <div>
                <h4 className="font-extrabold text-gray-900 mb-2 uppercase text-xs tracking-wider">
                  Thông tin nhận hàng
                </h4>
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-1.5 text-gray-700">
                  <p><span className="font-bold text-gray-900">Người nhận:</span> {selectedOrder.shipping_full_name}</p>
                  <p><span className="font-bold text-gray-900">Số điện thoại:</span> {selectedOrder.shipping_phone}</p>
                  <p><span className="font-bold text-gray-900">Địa chỉ giao:</span> {selectedOrder.shipping_address}</p>
                  {selectedOrder.note && (
                    <p><span className="font-bold text-gray-900">Ghi chú:</span> {selectedOrder.note}</p>
                  )}
                </div>
              </div>

              {/* Full Items List */}
              <div>
                <h4 className="font-extrabold text-gray-900 mb-3 uppercase text-xs tracking-wider">
                  Danh sách món ăn ({selectedOrder.items?.length || 0})
                </h4>
                <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl overflow-hidden">
                  {selectedOrder.items?.map((item) => {
                    const toppingsList = Array.isArray(item.toppings) ? item.toppings : [];
                    return (
                      <div key={item.id} className="p-4 bg-white flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                            {item.product?.image_url ? (
                              <img src={item.product.image_url} alt={item.product?.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs font-bold text-gray-400">Pizza</span>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">
                              {item.product?.name || 'Bánh Pizza'} <span className="text-red-600 font-semibold">(x{item.quantity})</span>
                            </p>
                            {item.size_name && (
                              <p className="text-xs text-gray-500 font-medium">Size: {item.size_name}</p>
                            )}
                            {toppingsList.length > 0 && (
                              <p className="text-xs text-gray-500">
                                Topping: {toppingsList.map(t => typeof t === 'string' ? t : t.name).join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                        <p className="font-bold text-gray-900">
                          {formatPrice(item.unit_price * item.quantity)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Payment Summary */}
              <div>
                <h4 className="font-extrabold text-gray-900 mb-2 uppercase text-xs tracking-wider">
                  Chi tiết thanh toán
                </h4>
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Tạm tính</span>
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
                  <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                    <span className="font-bold text-gray-900">Tổng thanh toán</span>
                    <span className="text-xl font-extrabold text-red-600">
                      {formatPrice(selectedOrder.total_amount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                {selectedOrder.status === 'pending' && (
                  <button
                    disabled={actionLoading}
                    onClick={() => handleCancelOrder(selectedOrder.id)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl transition disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    Hủy đơn hàng
                  </button>
                )}
                {selectedOrder.status === 'shipping' && (
                  selectedOrder.customer_confirmed ? (
                    <span className="px-4 py-2 bg-emerald-100 text-emerald-800 text-sm font-bold rounded-xl flex items-center gap-1.5">
                      ✓ Bạn đã xác nhận nhận hàng
                    </span>
                  ) : (
                    <button
                      disabled={actionLoading}
                      onClick={() => handleConfirmReceived(selectedOrder.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition disabled:opacity-50 cursor-pointer shadow-sm"
                    >
                      Xác nhận đã nhận hàng
                    </button>
                  )
                )}
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl transition text-sm cursor-pointer"
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

export default OrderHistory;
