import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import useAuth from '../hooks/useAuth';

const WebSocketContext = createContext();

export const WebSocketProvider = ({ children }) => {
  const { isAuthenticated, user, token } = useAuth();
  const [latestMessage, setLatestMessage] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const ws = useRef(null);

  useEffect(() => {
    if (isAuthenticated && token) {
      let reconnectTimer = null;
      
      const connectWebSocket = () => {
        const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
        const wsBaseURL = baseURL.replace(/^http/, 'ws');
        ws.current = new WebSocket(`${wsBaseURL}/ws?token=${token}`);

        ws.current.onopen = () => {
          console.log('WebSocket Connected');
        };

        ws.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setLatestMessage(data);
            
            setNotifications(prev => [data, ...prev]);
            setUnreadCount(prev => prev + 1);
          } catch (error) {
            console.error("Failed to parse websocket message:", error);
          }
        };

        ws.current.onclose = (event) => {
          console.log('WebSocket Disconnected', event);
          // Try to reconnect in 3 seconds if not intentionally closed by cleanup
          if (event.code !== 1000) {
            reconnectTimer = setTimeout(() => {
              console.log('Attempting to reconnect WebSocket...');
              connectWebSocket();
            }, 3000);
          }
        };
      };

      connectWebSocket();

      return () => {
        if (reconnectTimer) clearTimeout(reconnectTimer);
        if (ws.current) {
          ws.current.close(1000); // 1000 = Normal Closure
        }
      };
    } else {
      setLatestMessage(null);
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, token]);

  const markAllAsRead = () => {
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return (
    <WebSocketContext.Provider value={{
      latestMessage,
      unreadCount,
      notifications,
      markAllAsRead,
      clearNotifications
    }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
