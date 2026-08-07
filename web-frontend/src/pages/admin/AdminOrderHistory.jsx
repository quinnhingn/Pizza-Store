import React, { useState, useEffect } from 'react';
import ordersAPI from '../../api/ordersAPI';
import { RefreshCw, Search, X, Filter } from 'lucide-react';
import OrderDetailModal from '../../components/admin/OrderDetailModal';
import { useWebSocket } from '../../contexts/WebSocketContext';

const AdminOrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, completed, cancelled
  const [selectedOrder, setSelectedOrder] = useState(null);
  const { latestMessage } = useWebSocket() || {};

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (latestMessage && (latestMessage.type === 'order_updated' || latestMessage.type === 'order_status_updated' || latestMessage.type === 'order_update' || latestMessage.type === 'new_order')) {
      fetchOrders();
    }
  }, [latestMessage]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await ordersAPI.getAllOrdersAdmin();
      const list = Array.isArray(res) ? res : (res.data || []);
      setOrders(list);
      setError(null);
    } catch (err) {
      setError('Không thể tải danh sách đơn hàng. Vui lòng kiểm tra lại kết nối.');
      console.error('Failed to load admin orders history:', err);
    } finally {
      setLoading(false);
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

  // Only consider history orders (completed and cancelled)
  const historyOrders = orders.filter(o => ['completed', 'cancelled'].includes(o.status));

  // Stats Calculations (History only)
  const completedOrdersCount = historyOrders.filter((o) => o.status === 'completed').length;
  const cancelledOrdersCount = historyOrders.filter((o) => o.status === 'cancelled').length;

  // Search and Status filter
  const filteredOrders = historyOrders.filter((o) => {
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    const term = searchTerm.trim().toLowerCase();
    const matchSearch =
      !term ||
      (o.order_code && o.order_code.toLowerCase().includes(term)) ||
      (o.shipping_full_name && o.shipping_full_name.toLowerCase().includes(term)) ||
      (o.shipping_phone && o.shipping_phone.includes(term));
      
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Lịch sử giao dịch</h2>
      </div>

      {/* Tầng 1: Stats Items */}
      <div className="bg-white px-4 py-4 rounded-xl border border-gray-200 shadow-2xs flex flex-wrap items-center gap-4 sm:gap-6 text-sm divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
        <div className="flex items-center gap-3 py-1 flex-1 min-w-[150px]">
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase text-gray-500 block">Đơn Hoàn Thành</span>
            <span className="text-xl text-gray-900">{completedOrdersCount}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:pl-6 py-1 flex-1 min-w-[150px]">
          <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center border border-rose-100">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase text-gray-500 block">Đơn Đã Hủy</span>
            <span className="text-xl text-gray-900">{cancelledOrdersCount}</span>
          </div>
        </div>
      </div>

      {/* Tầng 2: Toolbar (Search & Filter) */}
      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="pl-2 flex items-center gap-2">
          <span className="text-gray-500 font-medium text-xs px-2 py-0.5 bg-gray-100 rounded-full">
            {filteredOrders.length} kết quả
          </span>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-2">
          {/* Status Filter */}
          <div className="relative w-full sm:w-48">
            <Filter className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent text-xs font-medium text-gray-700 bg-white appearance-none cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="completed">Chỉ Hoàn thành</option>
              <option value="cancelled">Chỉ Đã hủy</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
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

          {/* Refresh Button */}
          <button
            onClick={fetchOrders}
            disabled={loading}
            title="Làm mới dữ liệu"
            className="p-1.5 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-700 rounded-lg transition font-bold flex items-center justify-center disabled:opacity-50 cursor-pointer shadow-sm border border-gray-200 h-[34px] w-[34px]"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-red-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tầng 3: Data Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center shadow-xs">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full mb-3" />
          <p className="text-gray-500 text-sm font-medium">Đang tải lịch sử đơn hàng...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
          <p className="font-bold mb-2">{error}</p>
          <button
            onClick={fetchOrders}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 transition cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/75 border-b border-gray-200 text-xs uppercase font-extrabold text-gray-700">
                <tr>
                  <th className="px-5 py-3.5 whitespace-nowrap">Mã đơn / Ngày</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Khách hàng</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Sản phẩm (SL)</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Tổng thanh toán</th>
                  <th className="px-5 py-3.5 whitespace-nowrap">Trạng thái</th>
                  <th className="px-5 py-3.5 whitespace-nowrap text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-5 py-10 text-center text-gray-500 font-medium">
                      Không tìm thấy lịch sử đơn hàng nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-gray-900 text-sm">{order.order_code}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{formatDate(order.created_at)}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-gray-800 text-sm">{order.shipping_full_name}</div>
                        <div className="text-xs text-gray-500">{order.shipping_phone}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md text-xs font-bold border border-gray-200">
                          {order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0} món
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-900">
                        {formatPrice(order.total_amount)}
                      </td>
                      <td className="px-5 py-3.5">
                        {order.status === 'completed' ? (
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-xs font-bold inline-block">
                            Hoàn thành
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-xs font-bold inline-block" title={order.cancel_reason}>
                            Đã hủy
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-lg transition shadow-sm cursor-pointer"
                        >
                          Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Chi Tiết */}
      <OrderDetailModal
        isOpen={!!selectedOrder}
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        hideActions={true} // In History page, we don't allow changing statuses
      />
    </div>
  );
};

export default AdminOrderHistory;
