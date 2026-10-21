import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon: string;
  iconColor: string;
}

interface NotificationContextData {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  addNotification: (title: string, message: string, icon?: string, iconColor?: string) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearReadNotifications: () => Promise<void>;
  refresh: () => Promise<void>;
}

/** Map a raw API notification object to the local NotificationItem shape. */
function mapApiNotification(n: any): NotificationItem {
  return {
    id: String(n.id),
    title: n.title || '',
    message: n.message || n.body || '',
    time: n.created_at
      ? new Date(n.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
      : 'Agora mesmo',
    read: Boolean(n.read || n.is_read),
    icon: n.icon_name || n.icon || 'notifications',
    iconColor: n.icon_color || '#00E5FF',
  };
}

const NotificationContext = createContext<NotificationContextData | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { userEmail } = useAuth();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!userEmail) {
      setNotifications([]);
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.getNotifications();
      if (res.success && Array.isArray(res.data)) {
        setNotifications(res.data.map(mapApiNotification));
      }
    } catch (e) {
      console.error('Error fetching notifications:', e);
    } finally {
      setIsLoading(false);
    }
  }, [userEmail]);

  // Reload whenever the logged-in user changes
  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchNotifications();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchNotifications]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  /** Optimistically adds a local-only notification (e.g. for in-app events). */
  const addNotification = useCallback(
    (title: string, message: string, icon = 'notifications', iconColor = '#00E5FF') => {
      const newItem: NotificationItem = {
        id: Date.now().toString(),
        title,
        message,
        time: 'Agora mesmo',
        read: false,
        icon,
        iconColor,
      };
      setNotifications((prev) => [newItem, ...prev]);
    },
    []
  );

  const markAsRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await api.markNotificationRead(id);
    } catch (e) {
      console.error('Error marking notification as read:', e);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await api.markAllNotificationsRead();
    } catch (e) {
      console.error('Error marking all notifications as read:', e);
    }
  }, []);

  const deleteNotification = useCallback(
    async (id: string) => {
      // Optimistic update
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      try {
        await api.deleteNotification(id);
      } catch (e) {
        console.error('Error deleting notification:', e);
        // Re-fetch to restore correct state on failure
        fetchNotifications();
      }
    },
    [fetchNotifications]
  );

  const clearReadNotifications = useCallback(async () => {
    // Optimistic update
    setNotifications((prev) => prev.filter((n) => !n.read));
    try {
      await api.clearReadNotifications();
    } catch (e) {
      console.error('Error clearing read notifications:', e);
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      isLoading,
      addNotification,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearReadNotifications,
      refresh: fetchNotifications,
    }),
    [
      notifications,
      unreadCount,
      isLoading,
      addNotification,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearReadNotifications,
      fetchNotifications,
    ]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
