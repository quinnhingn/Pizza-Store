import React, { useState, useEffect } from 'react';
import useAuth from '../../hooks/useAuth';
import adminDashboardAPI from '../../api/adminDashboardAPI';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  DollarSign, ShoppingBag, Users, TrendingUp, TrendingDown, Clock, Activity, ArrowUpRight
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await adminDashboardAPI.getStats();
        setStats(res.data || res);
      } catch (err) {
        console.error('Lỗi khi tải thống kê:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Đang tải bảng điều khiển...</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const renderTrend = (value) => {
    const isPositive = value >= 0;
    const TrendIcon = isPositive ? TrendingUp : TrendingDown;
    const colorClass = isPositive ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50';
    
    return (
      <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold ${colorClass}`}>
        <TrendIcon size={14} />
        <span>{isPositive ? '+' : ''}{value}%</span>
      </div>
    );
  };

  const summaryCards = [
    { 
      label: 'Tổng Doanh Thu', 
      value: formatCurrency(stats.total_revenue), 
      trend: stats.revenue_trend,
      icon: DollarSign,
      color: 'text-white',
      bg: 'bg-red-600',
      shadow: 'shadow-red-500/20'
    },
    { 
      label: 'Tổng Đơn Hàng', 
      value: stats.total_orders, 
      trend: stats.orders_trend,
      icon: ShoppingBag,
      color: 'text-red-600',
      bg: 'bg-red-50',
      shadow: 'shadow-gray-200/50'
    },
    { 
      label: 'Đơn Đang Xử Lý', 
      value: stats.active_orders, 
      trend: null, // Không dùng trend cho số đơn đang chờ
      subtext: 'Đang chạy (Running)',
      icon: Activity,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      shadow: 'shadow-gray-200/50'
    },
    { 
      label: 'Khách Hàng', 
      value: stats.total_customers, 
      trend: stats.customers_trend,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      shadow: 'shadow-gray-200/50'
    }
  ];

  const getStatusBadge = (status) => {
    const badges = {
      pending: <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">Chờ xác nhận</span>,
      processing: <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Đang chuẩn bị</span>,
      shipping: <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">Đang giao</span>,
      completed: <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Hoàn thành</span>,
      cancelled: <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Đã hủy</span>,
    };
    return badges[status] || <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h2>
          <p className="text-sm text-gray-500 mt-1">
            Chào mừng <span className="font-semibold text-gray-700">{user?.full_name}</span>. Tổng quan hoạt động kinh doanh.
          </p>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className={`bg-white border border-gray-100 rounded-2xl p-6 shadow-xl ${card.shadow} transition-transform hover:-translate-y-1 duration-300`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">{card.label}</div>
                  <div className="text-2xl font-bold text-gray-900">{card.value}</div>
                </div>
                <div className={`p-3 rounded-xl ${card.bg} ${card.color}`}>
                  <Icon size={24} strokeWidth={2.5} />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                {card.trend !== null ? (
                  <>
                    {renderTrend(card.trend)}
                    <span className="text-xs text-gray-400">so với tuần trước</span>
                  </>
                ) : (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{card.subtext}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Area Chart */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Doanh thu & Đơn hàng</h3>
              <p className="text-sm text-gray-500">Hiệu suất 7 ngày gần nhất</p>
            </div>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.revenue_chart} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={(val) => val >= 1000000 ? `${(val/1000000).toFixed(1)}M` : val === 0 ? '0' : `${val/1000}K`}
                  tick={{fill: '#94a3b8', fontSize: 12}}
                />
                <Tooltip 
                  formatter={(value) => [formatCurrency(value), 'Doanh thu']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#ef4444" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#ef4444' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Món Bán Chạy Nhất</h3>
            <button className="text-gray-400 hover:text-red-600 transition-colors">
              <ArrowUpRight size={20} />
            </button>
          </div>
          <div className="space-y-5 flex-1">
            {stats.top_products.length > 0 ? (
              stats.top_products.map((product, index) => (
                <div key={product.id} className="flex items-center gap-4 group">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                    index === 0 ? 'bg-yellow-100 text-yellow-600' :
                    index === 1 ? 'bg-gray-100 text-gray-600' :
                    index === 2 ? 'bg-orange-100 text-orange-600' : 'bg-gray-50 text-gray-400'
                  }`}>
                    #{index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 truncate group-hover:text-red-600 transition-colors">{product.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{product.total_sold} đơn hàng</div>
                  </div>
                  <div className="font-bold text-gray-900 text-sm whitespace-nowrap">
                    {formatCurrency(product.revenue)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">Chưa có dữ liệu</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">Đơn Hàng Gần Đây</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Mã Đơn</th>
                <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Khách Hàng</th>
                <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Tổng Tiền</th>
                <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">Trạng Thái</th>
                <th className="pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Thời Gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats.recent_orders.length > 0 ? (
                stats.recent_orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 font-medium text-gray-900">#{order.order_code}</td>
                    <td className="py-4 text-gray-600">{order.customer_name}</td>
                    <td className="py-4 text-right font-semibold text-gray-900">{formatCurrency(order.total_amount)}</td>
                    <td className="py-4 text-center">{getStatusBadge(order.status)}</td>
                    <td className="py-4 text-right text-sm text-gray-500">
                      <div className="flex items-center justify-end gap-1">
                        <Clock size={14} className="text-gray-400" />
                        {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: vi })}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-gray-500">Chưa có đơn hàng nào</td>
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
