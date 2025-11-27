import React, { createContext, useState, useContext, ReactNode } from 'react';

interface AuthContextData {
  userEmail: string | null;
  login: (email: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextData | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const login = (email: string) => {
    setUserEmail(email);
  };

  const logout = () => {
    setUserEmail(null);
  };

  return <AuthContext.Provider value={{ userEmail, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};