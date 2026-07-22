import { createContext, useState, useEffect, useCallback, useContext } from 'react';
import notificationsAPI from '../api/notificationsAPI';
import { AuthContext } from './AuthContext';

export const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext) || {};
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
      const interval = setInterval(() => {
        fetchNotifications(true);
      }, 20000); // Polling mỗi 20s
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
    }
  }, [isAuthenticated, fetchNotifications]);

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

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};
