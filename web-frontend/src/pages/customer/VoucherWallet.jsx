import React, { useState, useEffect } from 'react';
import vouchersAPI from '../../api/vouchersAPI';
import { Ticket, History, Clock, CheckCircle, Search, AlertCircle } from 'lucide-react';

const VoucherWallet = () => {
  const [activeTab, setActiveTab] = useState('active'); // active, history
  const [historySubTab, setHistorySubTab] = useState('used'); // used, expired
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchVouchers(activeTab);
  }, [activeTab]);

  const fetchVouchers = async (tab) => {
    try {
      setLoading(true);
      setError(null);
      const res = await vouchersAPI.getMySavedVouchers(tab);
      const list = Array.isArray(res) ? res : (res.data || []);
      setVouchers(list);
    } catch (err) {
      console.error('Failed to load vouchers:', err);
      setError('Không thể tải danh sách voucher. Vui lòng thử lại sau.');
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
      year: 'numeric'
    });
  };

  const getFilteredVouchers = () => {
    let filtered = vouchers;

    // Filter by sub-tab if in history
    if (activeTab === 'history') {
      if (historySubTab === 'used') {
        filtered = filtered.filter(v => v.is_used === true);
      } else if (historySubTab === 'expired') {
        filtered = filtered.filter(v => v.is_used === false);
      }
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(v => 
        v.voucher_code.toLowerCase().includes(term) || 
        (v.voucher_details?.discount_amount?.toString().includes(term))
      );
    }

    return filtered;
  };

  const displayedVouchers = getFilteredVouchers();

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 p-5 sm:p-8 flex flex-col h-full min-h-[600px]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-gray-100">
        <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
          <Ticket className="w-6 h-6 text-red-600" />
          Kho Voucher Của Tôi
        </h2>

        {/* Tab Switcher */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'active' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Sẵn sàng sử dụng
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'history' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <History className="w-4 h-4" />
            Lịch sử
          </button>
        </div>
      </div>

      {/* History Sub Tabs & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        {activeTab === 'history' ? (
          <div className="flex gap-2">
            <button
              onClick={() => setHistorySubTab('used')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                historySubTab === 'used'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              Đã sử dụng
            </button>
            <button
              onClick={() => setHistorySubTab('expired')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                historySubTab === 'expired'
                  ? 'bg-gray-100 text-gray-700 border-gray-300'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              Hết hiệu lực
            </button>
          </div>
        ) : (
          <div className="text-sm text-gray-600 font-medium">
            Bạn có <span className="font-extrabold text-red-600">{vouchers.length}</span> mã giảm giá có thể sử dụng
          </div>
        )}

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm mã voucher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent text-sm font-medium"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
            <div className="inline-block animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center justify-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium text-sm">{error}</span>
          </div>
        ) : displayedVouchers.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
            <Ticket className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-sm font-medium">
              {searchTerm 
                ? 'Không tìm thấy mã giảm giá nào phù hợp' 
                : activeTab === 'active' 
                  ? 'Bạn chưa có mã giảm giá nào trong kho.'
                  : historySubTab === 'used' ? 'Bạn chưa sử dụng mã giảm giá nào.' : 'Không có mã giảm giá nào hết hạn.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-max">
            {displayedVouchers.map((item) => {
              const details = item.voucher_details || {};
              const isExpired = activeTab === 'history' && historySubTab === 'expired';
              const isUsed = activeTab === 'history' && historySubTab === 'used';

              return (
                <div 
                  key={item.id} 
                  className={`flex border rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md ${
                    isExpired ? 'border-gray-200 bg-gray-50 opacity-80' : 
                    isUsed ? 'border-emerald-200 bg-emerald-50/30' : 
                    'border-red-100 bg-white shadow-xs'
                  }`}
                >
                  {/* Left Edge: Decorative */}
                  <div className={`w-3 border-r border-dashed flex flex-col justify-between ${
                    isExpired ? 'bg-gray-300 border-gray-300' :
                    isUsed ? 'bg-emerald-400 border-emerald-300' :
                    'bg-red-500 border-red-200'
                  }`}>
                    <div className="w-3 h-3 bg-white rounded-full -ml-1.5 -mt-1.5"></div>
                    <div className="w-3 h-3 bg-white rounded-full -ml-1.5 -mb-1.5"></div>
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-widest ${
                          isExpired ? 'bg-gray-200 text-gray-600' :
                          isUsed ? 'bg-emerald-100 text-emerald-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {item.voucher_code}
                        </span>
                        
                        {/* Status Badge */}
                        {isUsed ? (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                            <CheckCircle className="w-3.5 h-3.5" /> Đã dùng
                          </span>
                        ) : isExpired ? (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-gray-500">
                            <Clock className="w-3.5 h-3.5" /> Hết hạn
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-orange-600">
                            <Clock className="w-3.5 h-3.5" /> HSD: {formatDate(details.end_date)}
                          </span>
                        )}
                      </div>

                      <h3 className={`text-lg font-black mb-1 ${
                        isExpired ? 'text-gray-500' : 'text-gray-900'
                      }`}>
                        Giảm {details.discount_percent ? `${details.discount_percent}%` : formatPrice(details.discount_amount)}
                      </h3>
                      
                      <p className="text-xs text-gray-500 leading-relaxed font-medium line-clamp-2">
                        Đơn tối thiểu {formatPrice(details.min_order_value)}
                        {details.max_discount && details.discount_percent ? `. Giảm tối đa ${formatPrice(details.max_discount)}` : ''}
                      </p>
                    </div>

                    {!isUsed && !isExpired && (
                      <div className="mt-4 pt-3 border-t border-gray-100 border-dashed">
                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                          Đã lưu ngày: {formatDate(item.saved_at)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default VoucherWallet;
