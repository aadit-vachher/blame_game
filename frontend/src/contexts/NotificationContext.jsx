import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { useAuth } from './AuthContext';
import * as notificationsApi from '../api/notifications';
import toast from 'react-hot-toast';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const lastCheckedRef = useRef(null);

  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const response = await notificationsApi.getUnreadNotificationsCount();
      if (response.success) {
        setUnreadCount(response.data.count);
      }
    } catch (err) {
      console.error('Failed to fetch unread notification count:', err);
    }
  };

  const fetchNotifications = async (page = 1, limit = 20) => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await notificationsApi.listNotifications({ page, limit });
      if (response.success) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      const response = await notificationsApi.markNotificationRead(id);
      if (response.success) {
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await notificationsApi.markAllNotificationsRead();
      if (response.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        toast.success('All notifications marked as read');
      }
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      toast.error('Failed to mark all as read');
    }
  };

  // Poll for new notifications and unread counts
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Initial fetch
    fetchUnreadCount();
    fetchNotifications();

    const interval = setInterval(async () => {
      try {
        const response = await notificationsApi.getUnreadNotificationsCount();
        if (response.success) {
          const newCount = response.data.count;
          if (newCount > unreadCount) {
            // Unread count increased, fetch latest
            fetchNotifications();
          } else {
            setUnreadCount(newCount);
          }
        }
      } catch (err) {
        console.error('Failed to poll notifications:', err);
      }
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [user]);

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
