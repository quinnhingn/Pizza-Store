import { createContext, useState, useEffect, useCallback, useContext } from 'react';
import notificationsAPI from '../api/notificationsAPI';
import { AuthContext } from './AuthContext';
import { useWebSocket } from './WebSocketContext';

export const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext) || {};
  const { latestMessage } = useWebSocket() || {};
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchNotifications = useCallback(async (isQuiet = false) => {
    if (!isAuthenticated) return;
    if (!isQuiet) setLoading(true);
    try {
      const res = await notificationsAPI.getMyNotifications();
      const list = Array.isArray(res) ? res : (res.data || []);
      setNotifications(list);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      if (!isQuiet) setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      // Remove polling as we use WebSocket now
    } else {
      setNotifications([]);
      setToastMessage(null);
    }
  }, [isAuthenticated, fetchNotifications]);

  useEffect(() => {
    if (latestMessage) {
      fetchNotifications(true);
      setToastMessage(latestMessage.message);
      const timer = setTimeout(() => setToastMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [latestMessage, fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, is_read: true } : item))
      );
      await notificationsAPI.markAsRead(id);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      fetchNotifications(true);
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
      await notificationsAPI.markAllAsRead();
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      fetchNotifications(true);
    }
  };

  const unreadCount = notifications.filter((item) => !item.is_read).length;

  const value = {
    notifications,
    loading,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {/* Global Toast for WebSocket Notifications */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[9999] animate-fade-in-up">
          <div className="bg-gray-900 text-white px-5 py-3.5 rounded-xl shadow-2xl border border-gray-800 flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
            </span>
            <span className="text-sm font-medium">{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="ml-2 text-gray-400 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};
