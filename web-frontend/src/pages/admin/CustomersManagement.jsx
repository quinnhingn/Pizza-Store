import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Search, User as UserIcon } from 'lucide-react';
import adminCustomersAPI from '../../api/adminCustomersAPI';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('vi-VN');
};

const CustomersManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await adminCustomersAPI.getCustomers();
      const data = Array.isArray(res) ? res : res?.data || [];
      setCustomers(data);
    } catch (err) {
      console.error('Lỗi khi tải danh sách khách hàng:', err);
      alert('Không thể tải dữ liệu khách hàng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleToggleStatus = async (customer) => {
    const action = customer.is_active ? 'KHÓA' : 'MỞ KHÓA';
    if (!window.confirm(`Bạn có chắc chắn muốn ${action} tài khoản của khách hàng "${customer.full_name}"?`)) {
      return;
    }
    
    try {
      const res = await adminCustomersAPI.toggleStatus(customer.id);
      const isActive = res?.data?.is_active ?? res?.is_active;
      
      setCustomers(customers.map(c => 
        c.id === customer.id ? { ...c, is_active: isActive } : c
      ));
    } catch (err) {
      console.error('Lỗi khi cập nhật trạng thái:', err);
      alert('Không thể cập nhật trạng thái khách hàng.');
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRankBadge = (rank) => {
    switch (rank) {
      case 'Platinum':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-900 text-slate-100 border border-slate-700">Platinum</span>;
      case 'Gold':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-300">Gold</span>;
      case 'Silver':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 border border-gray-300">Silver</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 border border-orange-200">Bronze</span>;
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Khách hàng thành viên</h2>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm tên, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 w-full sm:w-72 transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                <th className="px-6 py-4 font-semibold">Khách hàng</th>
                <th className="px-6 py-4 font-semibold text-center">Hạng thành viên</th>
                <th className="px-6 py-4 font-semibold text-center">Số đơn</th>
                <th className="px-6 py-4 font-semibold text-right">Tổng chi tiêu</th>
                <th className="px-6 py-4 font-semibold text-center">Trạng thái</th>
                <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    Không tìm thấy khách hàng nào.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
                          <UserIcon size={18} />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{customer.full_name}</div>
                          <div className="text-sm text-gray-500">{customer.email}</div>
                          <div className="text-xs text-gray-400 mt-0.5">Tham gia: {formatDate(customer.created_at)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getRankBadge(customer.rank)}
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-gray-700">
                      {customer.total_orders}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-900">
                      {formatCurrency(customer.total_spent)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        customer.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {customer.is_active ? 'Đang hoạt động' : 'Bị khóa'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(customer)}
                        className={`inline-flex items-center justify-center p-2 rounded-lg transition-colors ${
                          customer.is_active 
                            ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' 
                            : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                        }`}
                        title={customer.is_active ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                      >
                        {customer.is_active ? <Lock size={18} /> : <Unlock size={18} />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomersManagement;
