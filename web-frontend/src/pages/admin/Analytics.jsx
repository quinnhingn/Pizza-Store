import React, { useState, useEffect } from 'react';
import useAuth from '../../hooks/useAuth';
import adminDashboardAPI from '../../api/adminDashboardAPI';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { 
  Calendar, Download, TrendingUp, ShoppingBag, DollarSign, Activity
} from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { vi } from 'date-fns/locale';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'];
const STATUS_COLORS = {
  completed: '#10b981',
  cancelled: '#ef4444',
  pending: '#f59e0b',
  shipping: '#8b5cf6',
  processing: '#3b82f6'
};

const STATUS_LABELS = {
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
  pending: 'Chờ xác nhận',
  shipping: 'Đang giao',
  processing: 'Đang chuẩn bị'
};

const Analytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('7days'); // 7days, 30days, thisMonth, thisYear
  
  const fetchAnalytics = async (range) => {
    try {
      setLoading(true);
      const today = new Date();
      let start, end;
      
      switch(range) {
        case '7days':
          start = subDays(today, 6);
          end = today;
          break;
        case '30days':
          start = subDays(today, 29);
          end = today;
          break;
        case 'thisMonth':
          start = startOfMonth(today);
          end = endOfMonth(today);
          break;
        case 'thisYear':
          start = startOfYear(today);
          end = endOfYear(today);
          break;
        default:
          start = subDays(today, 6);
          end = today;
      }
      
      // ISO strings
      const startStr = start.toISOString();
      const endStr = end.toISOString();
      
      const res = await adminDashboardAPI.getAnalytics(startStr, endStr);
      setData(res.data || res);
      setError(null);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu phân tích:', err);
      setError('Không thể tải dữ liệu thống kê. Có thể do lỗi máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(dateRange);
  }, [dateRange]);

  const exportData = () => {
    // In a real app, this would trigger an API call to download CSV/Excel
    alert('Tính năng xuất báo cáo đang được cập nhật!');
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Đang tổng hợp dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-gray-100 m-6">
        <div className="w-12 h-12 text-red-500 mx-auto mb-4"><Activity className="w-full h-full" /></div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Đã xảy ra lỗi</h3>
        <p className="text-gray-500">{error}</p>
        <button onClick={() => fetchAnalytics(dateRange)} className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition">
          Thử lại
        </button>
      </div>
    );
  }

  if (!data) return null;

  const statusChartData = Object.entries(data.status_distribution).map(([key, value]) => ({
    name: STATUS_LABELS[key] || key,
    value: value,
    color: STATUS_COLORS[key] || '#9ca3af'
  }));

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Thống Kê & Báo Cáo</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="pl-9 pr-8 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent text-sm font-medium text-gray-700 bg-white appearance-none cursor-pointer shadow-sm"
            >
              <option value="7days">7 ngày qua</option>
              <option value="30days">30 ngày qua</option>
              <option value="thisMonth">Tháng này</option>
              <option value="thisYear">Năm nay</option>
            </select>
          </div>
          <button 
            onClick={exportData}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition shadow-sm"
          >
            <Download size={16} />
            <span>Xuất Excel</span>
          </button>
        </div>
      </div>

      {/* 4 Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <DollarSign size={24} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Doanh thu trong kỳ</p>
            <p className="text-2xl text-gray-900">{formatCurrency(data.total_revenue)}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <ShoppingBag size={24} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Đơn thành công</p>
            <p className="text-2xl text-gray-900">{data.total_orders}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <Activity size={24} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Giá trị TB/Đơn (AOV)</p>
            <p className="text-2xl text-gray-900">{formatCurrency(data.avg_order_value)}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0">
            <TrendingUp size={24} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Tỷ lệ thành công</p>
            <p className="text-2xl text-gray-900">{data.completion_rate.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Line Chart */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900">Biểu đồ Doanh Thu</h3>
            <p className="text-sm text-gray-500">Doanh thu theo ngày trong khoảng thời gian đã chọn</p>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenue_chart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
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
                <RechartsTooltip 
                  formatter={(value) => [formatCurrency(value), 'Doanh thu']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Pie Chart */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="mb-2">
            <h3 className="text-lg font-bold text-gray-900">Tỷ lệ Trạng thái Đơn</h3>
            <p className="text-sm text-gray-500">Phân bổ trạng thái</p>
          </div>
          <div className="h-[240px] w-full flex-1">
            {statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value) => [`${value} đơn`, 'Số lượng']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
               <div className="h-full flex items-center justify-center text-gray-400">Không có dữ liệu</div>
            )}
          </div>
        </div>
      </div>

      {/* Top Products Bar Chart */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
         <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900">Top 5 Sản phẩm Bán chạy</h3>
            <p className="text-sm text-gray-500">Dựa trên số lượng đã bán</p>
         </div>
         <div className="h-[300px] w-full">
            {data.top_products.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.top_products} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 12, fontWeight: 500}} width={150} />
                  <RechartsTooltip 
                    formatter={(value, name) => {
                      if (name === 'revenue') return [formatCurrency(value), 'Doanh thu'];
                      return [`${value} phần`, 'Đã bán'];
                    }}
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Legend />
                  <Bar dataKey="total_sold" name="Số lượng bán" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
               <div className="h-full flex items-center justify-center text-gray-400">Không có dữ liệu</div>
            )}
         </div>
      </div>
    </div>
  );
};

export default Analytics;
