import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { useWebSocket } from '../../contexts/WebSocketContext';
import adminDashboardAPI from '../../api/adminDashboardAPI';
import { 
  DollarSign, ShoppingBag, Users, Clock, AlertCircle
} from 'lucide-react';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString('vi-VN');
};

const Dashboard = () => {
  const { user } = useAuth();
  const { latestMessage } = useWebSocket();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await adminDashboardAPI.getTodayStats();
      setStats(res.data || res);
      setError(null);
    } catch (err) {
      console.error('Lỗi khi tải thống kê hôm nay:', err);
      setError('Không thể tải dữ liệu bảng điều khiển. Có thể do lỗi máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (latestMessage) {
      const { type } = latestMessage;
      if (type === 'new_order' || type === 'order_status_updated' || type === 'order_updated' || type === 'order_update') {
        fetchStats();
      }
    }
  }, [latestMessage]);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Đang tải bảng điều khiển...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-gray-100 m-6">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-900 mb-2">Đã xảy ra lỗi</h3>
        <p className="text-gray-500">{error}</p>
        <button onClick={fetchStats} className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition">
          Thử lại
        </button>
      </div>
    );
  }

  if (!stats) return null;

  const summaryCards = [
    { 
      label: 'Doanh Thu Hôm Nay', 
      value: formatCurrency(stats.revenue_today), 
      icon: DollarSign,
      color: 'text-white',
      bg: 'bg-red-600',
      shadow: 'shadow-red-500/20'
    },
    { 
      label: 'Số Đơn Hôm Nay', 
      value: stats.orders_today, 
      icon: ShoppingBag,
      color: 'text-red-600',
      bg: 'bg-red-50',
      shadow: 'shadow-gray-200/50'
    },
    { 
      label: 'Khách Mới Hôm Nay', 
      value: stats.new_customers_today, 
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      shadow: 'shadow-gray-200/50'
    },
    { 
      label: 'Đơn Đang Chờ Xử Lý', 
      value: stats.pending_orders, 
      icon: Clock,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      shadow: 'shadow-orange-200/50',
      alert: stats.pending_orders > 0
    }
  ];

  const getStatusBadge = (status) => {
    const badges = {
      pending: <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 flex items-center gap-1 w-fit"><AlertCircle size={12}/>Chờ xác nhận</span>,
      confirmed: <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Đã xác nhận</span>,
      processing: <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">Đang chuẩn bị</span>,
      shipping: <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">Đang giao</span>,
    };
    return badges[status] || <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Vận hành hôm nay</h2>
        </div>
        <div className="flex gap-2">
           <Link to="/admin/orders" className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition shadow-sm">
             Xử lý đơn hàng
           </Link>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className={`bg-white border ${card.alert ? 'border-orange-300' : 'border-gray-100'} rounded-2xl p-6 shadow-sm transition-transform hover:-translate-y-1 duration-300`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">{card.label}</div>
                  <div className={`text-3xl ${card.alert ? 'text-orange-600' : 'text-gray-900'}`}>{card.value}</div>
                </div>
                <div className={`p-3 rounded-xl ${card.bg} ${card.color}`}>
                  <Icon size={24} strokeWidth={2.5} />
                </div>
              </div>
              {card.alert && (
                <div className="mt-3 text-xs font-bold text-orange-600 flex items-center gap-1">
                  Cần xử lý ngay!
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Recent Active Orders */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Đơn Hàng Cần Chú Ý</h3>
          </div>
          <button onClick={fetchStats} className="text-sm font-medium text-blue-600 hover:text-blue-700 underline cursor-pointer">
            Làm mới
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Mã Đơn</th>
                <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Khách Hàng</th>
                <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Trạng Thái</th>
                <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Thời Gian Đặt</th>
                <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Tổng Tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats.recent_orders.length > 0 ? (
                stats.recent_orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 text-sm font-bold text-gray-900">{order.order_code}</td>
                    <td className="py-4 text-sm font-medium text-gray-700">{order.customer_name}</td>
                    <td className="py-4">{getStatusBadge(order.status)}</td>
                    <td className="py-4 text-sm text-gray-500">{formatDate(order.created_at)}</td>
                    <td className="py-4 text-sm text-gray-900 text-right">{formatCurrency(order.total_amount)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-gray-500 text-sm">
                    Không có đơn hàng nào đang chờ xử lý.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
