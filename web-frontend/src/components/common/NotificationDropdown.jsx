import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Package, ShoppingBag, Gift, Info } from 'lucide-react';
import useNotifications from '../../hooks/useNotifications';
import vouchersAPI from '../../api/vouchersAPI';

const NotificationDropdown = ({ isAdmin = false, isDarkBg = false }) => {
  const { notifications = [], unreadCount = 0, markAsRead, markAllAsRead } = useNotifications() || {};
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (item) => {
    if (!item.is_read) {
      await markAsRead(item.id);
    }
    setIsOpen(false);

    if (isAdmin) {
      if (item.type === 'new_order' || item.type === 'order_received' || item.reference_code) {
        navigate('/admin/orders');
      }
    } else {
      if (item.type === 'order_shipping' || item.type === 'order_received' || item.reference_code) {
        if (item.type !== 'voucher_gift') {
           navigate('/orders');
        } else {
           navigate('/profile');
        }
      }
    }
  };

  const handleSaveVoucher = async (e, item) => {
    e.stopPropagation(); // Ngăn sự kiện click của div cha (tránh gọi handleNotificationClick ngay)
    if (!item.is_read) {
      await markAsRead(item.id);
    }
    try {
      await vouchersAPI.saveUserVoucher(item.reference_code, item.id);
      alert('Đã lưu mã giảm giá thành công!');
      // Có thể chuyển hướng đến trang ví voucher nếu cần
      // navigate('/profile'); 
      // setIsOpen(false);
    } catch (err) {
      alert(err.response?.data?.detail || 'Lưu mã giảm giá thất bại. Mã có thể đã được lưu hoặc không hợp lệ.');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'new_order':
        return <ShoppingBag className="w-4 h-4 text-amber-600" />;
      case 'order_shipping':
      case 'order_received':
        return <Package className="w-4 h-4 text-indigo-600" />;
      case 'voucher_gift':
        return <Gift className="w-4 h-4 text-emerald-600" />;
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    try {
      const date = new Date(timeStr);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins} phút trước`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} giờ trước`;
      return date.toLocaleDateString('vi-VN');
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-full transition-all duration-200 cursor-pointer focus:outline-hidden flex items-center justify-center ${
          isDarkBg
            ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        }`}
        title="Thông báo"
      >
        <Bell className="w-5 h-5" strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white/95 backdrop-blur-md shadow-xl border border-gray-100 ring-1 ring-black/5 z-50 overflow-hidden transition-all duration-200 origin-top-right">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900">Thông báo</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-rose-100 text-rose-700 rounded-full">
                  {unreadCount} mới
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Đọc tất cả
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">
                Chưa có thông báo nào
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3.5 hover:bg-gray-50 transition-colors cursor-pointer flex gap-3 items-start ${
                    !item.is_read ? 'bg-indigo-50/40' : ''
                  }`}
                >
                  <div className="mt-0.5 p-2 rounded-xl bg-white border border-gray-100 shadow-2xs flex-shrink-0">
                    {getIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs font-medium truncate ${!item.is_read ? 'text-gray-900 font-semibold' : 'text-gray-700'}`}>
                        {item.title}
                      </p>
                      <span className="text-[10px] text-gray-400 flex-shrink-0">
                        {formatTime(item.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>
                    {item.type === 'voucher_gift' && item.reference_code && (
                      <div className="mt-2.5">
                        <button
                          onClick={(e) => handleSaveVoucher(e, item)}
                          className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[11px] font-bold rounded-lg transition-colors cursor-pointer w-auto"
                        >
                          Lưu ngay
                        </button>
                      </div>
                    )}
                  </div>
                  {!item.is_read && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600 flex-shrink-0 mt-2" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
