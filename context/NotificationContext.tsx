import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

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
  addNotification: (title: string, message: string, icon?: string, iconColor?: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearReadNotifications: () => void;
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    title: 'Novo Recorde no Ranking!',
    message: 'Você subiu 2 posições na Liga Semanal de Saúde!',
    time: '10 min atrás',
    read: false,
    icon: 'emoji-events',
    iconColor: '#00E5FF',
  },
  {
    id: '2',
    title: 'Meta de Hidratação',
    message: 'Lembrete: Beba 500ml de água para manter seu combo ativo.',
    time: '1 hora atrás',
    read: false,
    icon: 'water-drop',
    iconColor: '#3B82F6',
  },
  {
    id: '3',
    title: 'Dispositivo Sincronizado',
    message: 'Seu smartwatch sincronizou!',
    time: '3 horas atrás',
    read: true,
    icon: 'watch',
    iconColor: '#10B981',
  },
  {
    id: '4',
    title: 'Recompensa Ganha!',
    message: 'Você ganhou +50 pts por completar o Desafio Diário.',
    time: 'Ontem',
    read: true,
    icon: 'card-giftcard',
    iconColor: '#F59E0B',
  },
];

const NotificationContext = createContext<NotificationContextData | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { userEmail } = useAuth();
  const activeEmail = userEmail || 'test@test.com';
  const storageKey = `@notifications_${activeEmail}`;

  const [notifications, setNotifications] = useState<NotificationItem[]>(DEFAULT_NOTIFICATIONS);

  // Load notifications from AsyncStorage on activeEmail change
  useEffect(() => {
    const loadStoredNotifications = async () => {
      try {
        const stored = await AsyncStorage.getItem(storageKey);
        if (stored) {
          setNotifications(JSON.parse(stored));
        } else {
          setNotifications(DEFAULT_NOTIFICATIONS);
        }
      } catch (e) {
        console.error('Error loading notifications:', e);
      }
    };
    loadStoredNotifications();
  }, [storageKey]);

  // Helper to save state
  const saveNotifications = async (updated: NotificationItem[]) => {
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving notifications:', e);
    }
  };

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

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

      setNotifications(prev => {
        const updated = [newItem, ...prev];
        saveNotifications(updated);
        return updated;
      });
    },
    [storageKey]
  );

  const markAsRead = useCallback(
    (id: string) => {
      setNotifications(prev => {
        const updated = prev.map(n => (n.id === id ? { ...n, read: true } : n));
        saveNotifications(updated);
        return updated;
      });
    },
    [storageKey]
  );

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      saveNotifications(updated);
      return updated;
    });
  }, [storageKey]);

  const deleteNotification = useCallback(
    (id: string) => {
      setNotifications(prev => {
        const updated = prev.filter(n => n.id !== id);
        saveNotifications(updated);
        return updated;
      });
    },
    [storageKey]
  );

  const clearReadNotifications = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.filter(n => !n.read);
      saveNotifications(updated);
      return updated;
    });
  }, [storageKey]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearReadNotifications,
    }),
    [
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearReadNotifications,
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
