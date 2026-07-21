import React, { useState, useEffect } from 'react';
import ordersAPI from '../../api/ordersAPI';

const STATUS_MAP = {
  pending: { label: 'Chờ xác nhận', badgeClass: 'bg-amber-100 text-amber-800 border border-amber-300' },
  confirmed: { label: 'Đã xác nhận', badgeClass: 'bg-blue-100 text-blue-800 border border-blue-300' },
  shipping: { label: 'Đang giao hàng', badgeClass: 'bg-indigo-100 text-indigo-800 border border-indigo-300' },
  completed: { label: 'Hoàn thành', badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-300' },
  cancelled: { label: 'Đã hủy', badgeClass: 'bg-rose-100 text-rose-800 border border-rose-300' }
};

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'shipping', label: 'Đang giao hàng' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Đã hủy' }
];

const FILTER_TABS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'pending', label: 'Chờ xác nhận' },
  { id: 'confirmed', label: 'Đã xác nhận' },
  { id: 'shipping', label: 'Đang giao' },
  { id: 'completed', label: 'Hoàn thành' },
  { id: 'cancelled', label: 'Đã hủy' }
];

const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

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

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setUpdatingStatusId(orderId);
      await ordersAPI.updateOrderStatus(orderId, newStatus);
      // Cập nhật state local ngay lập tức để trải nghiệm mượt mà
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      alert(err.response?.data?.detail || 'Không thể cập nhật trạng thái đơn hàng.');
      console.error('Update status error:', err);
    } finally {
      setUpdatingStatusId(null);
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

  // Search & Filter
  const filteredOrders = orders.filter((o) => {
    const matchesTab = activeTab === 'all' || o.status === activeTab;
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !term ||
      (o.order_code && o.order_code.toLowerCase().includes(term)) ||
      (o.shipping_full_name && o.shipping_full_name.toLowerCase().includes(term)) ||
      (o.shipping_phone && o.shipping_phone.includes(term));
    return matchesTab && matchesSearch;
  });

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Quản Lý Đơn Hàng
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Theo dõi tiến độ, rà soát chi tiết và cập nhật trạng thái các đơn đặt bánh trên toàn hệ thống.
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold rounded-xl transition shadow-sm self-start sm:self-auto"
        >
          Làm mới dữ liệu
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Tổng đơn hàng</span>
          <p className="text-3xl font-extrabold text-gray-900 mt-2">{totalOrdersCount}</p>
          <span className="text-xs font-semibold text-gray-500 mt-1">Toàn bộ thời gian</span>
        </div>
        <div className="bg-amber-50/60 p-5 rounded-2xl border border-amber-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Chờ xác nhận</span>
          <p className="text-3xl font-extrabold text-amber-900 mt-2">{pendingOrdersCount}</p>
          <span className="text-xs font-semibold text-amber-700 mt-1">Cần xử lý ngay</span>
        </div>
        <div className="bg-indigo-50/60 p-5 rounded-2xl border border-indigo-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">Đang giao hàng</span>
          <p className="text-3xl font-extrabold text-indigo-900 mt-2">{shippingOrdersCount}</p>
          <span className="text-xs font-semibold text-indigo-700 mt-1">Shipper đang trên đường</span>
        </div>
        <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-200 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Doanh thu hoàn thành</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-900 mt-2">{formatPrice(completedRevenue)}</p>
          <span className="text-xs font-semibold text-emerald-700 mt-1">Từ các đơn thành công</span>
        </div>
      </div>

      {/* Search Bar & Filter Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Tìm theo Mã đơn (ORD-...), Tên hoặc SĐT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent text-sm font-medium placeholder-gray-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-xs font-bold text-gray-400 hover:text-gray-600 px-1.5 py-0.5"
              >
                Xóa
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div className="flex space-x-1 overflow-x-auto pb-1 md:pb-0">
            {FILTER_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const count = tab.id === 'all'
                ? orders.length
                : orders.filter((o) => o.status === tab.id).length;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                    isActive ? 'bg-red-700 text-white' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Orders Table Section */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center shadow-sm">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full mb-3" />
          <p className="text-gray-500 font-medium">Đang tải toàn bộ danh sách đơn hàng...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-700">
          <p className="font-bold mb-2">{error}</p>
          <button
            onClick={fetchOrders}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 transition"
          >
            Thử lại ngay
          </button>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center shadow-sm">
          <p className="text-gray-600 text-lg font-semibold mb-1">Không tìm thấy đơn hàng phù hợp</p>
          <p className="text-gray-400 text-sm">Thử thay đổi từ khóa tìm kiếm hoặc chọn bộ lọc trạng thái khác.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-extrabold">
                  <th className="py-4 px-6">Mã đơn & Thời gian</th>
                  <th className="py-4 px-6">Khách hàng</th>
                  <th className="py-4 px-6 text-right">Tổng tiền</th>
                  <th className="py-4 px-6">Trạng thái</th>
                  <th className="py-4 px-6 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredOrders.map((order) => {
                  const statusInfo = STATUS_MAP[order.status] || {
                    label: order.status,
                    badgeClass: 'bg-gray-100 text-gray-700 border border-gray-300'
                  };
                  const isUpdating = updatingStatusId === order.id;

                  return (
                    <tr key={order.id} className="hover:bg-gray-50/70 transition">
                      {/* Code & Date */}
                      <td className="py-4 px-6">
                        <span className="font-extrabold text-gray-900 block tracking-wide">
                          {order.order_code}
                        </span>
                        <span className="text-xs text-gray-400 font-medium mt-0.5 block">
                          {formatDate(order.created_at)}
                        </span>
                      </td>

                      {/* Customer Info */}
                      <td className="py-4 px-6">
                        <p className="font-bold text-gray-900">{order.shipping_full_name}</p>
                        <p className="text-xs text-gray-500 font-medium">{order.shipping_phone}</p>
                        <p className="text-xs text-gray-400 line-clamp-1 max-w-xs mt-0.5" title={order.shipping_address}>
                          {order.shipping_address}
                        </p>
                      </td>

                      {/* Total Amount */}
                      <td className="py-4 px-6 text-right font-extrabold text-red-600 whitespace-nowrap">
                        {formatPrice(order.total_amount)}
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="relative inline-block">
                          <select
                            value={order.status}
                            disabled={isUpdating}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg border appearance-none pr-8 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-900 transition ${statusInfo.badgeClass} ${
                              isUpdating ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value} className="bg-white text-gray-900 font-semibold">
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] font-bold opacity-70">
                            ▼
                          </span>
                        </div>
                      </td>

                      {/* Action Button */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold rounded-lg text-xs transition"
                        >
                          Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
              {/* Status Update Banner */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="font-bold text-gray-700 block text-xs uppercase tracking-wider">Trạng thái đơn hàng</span>
                  <p className="text-xs text-gray-500 mt-0.5">Thay đổi tiến độ xử lý và giao bánh cho đơn hàng này.</p>
                </div>
                <div className="relative inline-block">
                  <select
                    value={selectedOrder.status}
                    disabled={updatingStatusId === selectedOrder.id}
                    onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                    className={`text-xs font-bold px-4 py-2 rounded-xl border pr-8 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-900 transition ${
                      (STATUS_MAP[selectedOrder.status] || {}).badgeClass || 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-white text-gray-900 font-semibold">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] font-bold opacity-70">
                    ▼
                  </span>
                </div>
              </div>

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
                className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl transition text-sm shadow-sm"
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
