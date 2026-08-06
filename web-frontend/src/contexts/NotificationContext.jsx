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
    }
  }, [isAuthenticated, fetchNotifications]);

  useEffect(() => {
    if (latestMessage && isAuthenticated) {
      fetchNotifications(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestMessage]);

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

  const generalNotifications = notifications.filter((item) => item.type !== 'voucher_gift');
  const voucherNotifications = notifications.filter((item) => item.type === 'voucher_gift');

  const unreadCount = notifications.filter((item) => !item.is_read).length;
  const generalUnreadCount = generalNotifications.filter((item) => !item.is_read).length;
  const voucherUnreadCount = voucherNotifications.filter((item) => !item.is_read).length;

  const value = {
    notifications,
    generalNotifications,
    voucherNotifications,
    loading,
    unreadCount,
    generalUnreadCount,
    voucherUnreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
