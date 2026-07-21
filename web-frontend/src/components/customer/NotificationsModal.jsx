import { useState, useEffect } from 'react';
import notificationsAPI from '../../api/notificationsAPI';
import vouchersAPI from '../../api/vouchersAPI';

const NotificationsModal = ({ isOpen, onClose, onRefreshCount }) => {
  const [notifications, setNotifications] = useState([]);
  const [savedCodes, setSavedCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingCode, setSavingCode] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [notifRes, walletRes] = await Promise.all([
        notificationsAPI.getMyNotifications(),
        vouchersAPI.getMySavedVouchers()
      ]);
      const notifList = Array.isArray(notifRes) ? notifRes : (notifRes.data || []);
      const walletList = Array.isArray(walletRes) ? walletRes : (walletRes.data || []);
      setNotifications(notifList);
      setSavedCodes(walletList.map((item) => item.voucher_code));
    } catch (err) {
      console.error('Failed to load notifications/wallet:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      loadData();
      if (onRefreshCount) onRefreshCount();
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleMarkSingleRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      loadData();
      if (onRefreshCount) onRefreshCount();
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleSaveVoucher = async (code, notifId) => {
    try {
      setSavingCode(code);
      const res = await vouchersAPI.saveUserVoucher(code, notifId);
      alert(res?.message || res?.data?.message || 'Đã lưu mã ưu đãi thành công!');
      loadData();
      if (onRefreshCount) onRefreshCount();
    } catch (err) {
      alert(err.response?.data?.detail || 'Không thể lưu mã giảm giá.');
    } finally {
      setSavingCode(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 bg-black/40 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[85vh] mt-12">
        {/* Modal Header */}
        <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-black text-gray-900 text-base">Hộp thư thông báo</h3>
            <p className="text-xs text-gray-500">Ưu đãi, quà tặng và tin tức từ Pizza Store</p>
          </div>
          <div className="flex items-center gap-2">
            {notifications.some((n) => !n.is_read) && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-red-600 hover:text-red-700 px-2.5 py-1 rounded-lg hover:bg-red-50 transition-colors"
              >
                Đánh dấu đã đọc
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200/50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto flex-grow divide-y divide-gray-100">
          {loading ? (
            <div className="p-8 text-center text-xs text-gray-500">Đang tải thông báo...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500">
              Bạn chưa có thông báo nào.
            </div>
          ) : (
            notifications.map((n) => {
              const isSaved = n.reference_code && savedCodes.includes(n.reference_code);
              return (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && handleMarkSingleRead(n.id)}
                  className={`p-4 transition-colors cursor-pointer ${
                    !n.is_read ? 'bg-red-50/40 hover:bg-red-50/70 border-l-4 border-red-600' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <h4 className={`text-sm font-bold ${!n.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                      {n.title}
                    </h4>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-red-600 flex-shrink-0 mt-1"></span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{n.message}</p>

                  {n.reference_code && (
                    <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between gap-2">
                      <div className="text-xs font-semibold text-gray-800">
                        Mã: <span className="font-black text-red-600 tracking-wider">{n.reference_code}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isSaved) handleSaveVoucher(n.reference_code, n.id);
                        }}
                        disabled={isSaved || savingCode === n.reference_code}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          isSaved
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed border border-gray-200'
                            : 'bg-red-600 hover:bg-red-700 active:scale-95 text-white shadow-sm hover:shadow'
                        }`}
                      >
                        {isSaved ? 'Đã lưu trong ví' : savingCode === n.reference_code ? 'Đang lưu...' : 'Lưu mã vào ví'}
                      </button>
                    </div>
                  )}

                  <div className="mt-2 text-[10px] text-gray-400 text-right">
                    {n.created_at ? new Date(n.created_at).toLocaleString('vi-VN') : ''}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsModal;
