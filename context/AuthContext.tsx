import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearSession, getValidToken, onSessionExpired, api } from '../services/api';

interface AuthContextData {
  userEmail: string | null;
  userRole: string | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.getMe();
      if (res.success && res.data?.role) {
        setUserRole(res.data.role);
        await AsyncStorage.setItem('@user_role', res.data.role);
      }
    } catch {}
  }, []);

  useEffect(() => {
    // Load persisted user session on mount
    const loadSession = async () => {
      try {
        const [storedEmail, storedRole, token] = await Promise.all([
          AsyncStorage.getItem('@user_email'),
          AsyncStorage.getItem('@user_role'),
          getValidToken(),
        ]);
        if (storedEmail && token) {
          setUserEmail(storedEmail);
          const defaultRole = storedRole || (storedEmail.toLowerCase().includes('admin') ? 'admin' : 'user');
          setUserRole(defaultRole);
          // Verify role from backend
          api.getMe().then((res) => {
            if (res.success && res.data?.role) {
              setUserRole(res.data.role);
              AsyncStorage.setItem('@user_role', res.data.role);
            }
          }).catch(() => {});
        }
      } catch (error) {
        console.error('Failed to load session:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSession();
  }, []);

  const login = useCallback(async (email: string, role?: string) => {
    try {
      const determinedRole = role || (email.toLowerCase().includes('admin') ? 'admin' : 'user');
      await AsyncStorage.setItem('@user_email', email);
      await AsyncStorage.setItem('@user_role', determinedRole);
      setUserEmail(email);
      setUserRole(determinedRole);
      api.getMe().then((res) => {
        if (res.success && res.data?.role) {
          setUserRole(res.data.role);
          AsyncStorage.setItem('@user_role', res.data.role);
        }
      }).catch(() => {});
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Only remove auth-related keys; avoid wiping unrelated app data.
      await clearSession();
      await AsyncStorage.multiRemove(['@user_email', '@user_role']);
      setUserEmail(null);
      setUserRole(null);
    } catch (error) {
      console.error('Failed to clear cache on logout:', error);
    }
  }, []);

  useEffect(
    () =>
      onSessionExpired(() => {
        void logout();
      }),
    [logout]
  );

  const isAdmin = useMemo(
    () => userRole === 'admin' || (userEmail ? userEmail.toLowerCase().includes('admin') : false),
    [userRole, userEmail]
  );

  const value = useMemo(
    () => ({ userEmail, userRole, isAdmin, isLoading, login, logout, refreshUser }),
    [userEmail, userRole, isAdmin, isLoading, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
