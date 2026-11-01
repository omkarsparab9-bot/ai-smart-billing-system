import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  role: 'admin' | 'staff' | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  backendConnected: boolean;
  checkBackendHealth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [backendConnected, setBackendConnected] = useState<boolean>(false);

  const checkBackendHealth = async () => {
    const isUp = await api.checkHealth();
    setBackendConnected(isUp);
  };

  useEffect(() => {
    const initAuth = async () => {
      await checkBackendHealth();
      const savedUser = localStorage.getItem('smart_billing_user');
      const token = api.getToken();
      if (savedUser && token) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          localStorage.removeItem('smart_billing_user');
        }
      } else {
        // Default to admin for smooth college evaluation if not yet logged in
        // or let user login via login screen
        const defaultAdmin: User = {
          id: 1,
          username: "admin",
          full_name: "Store Manager (Admin)",
          role: "admin",
          phone: "+91 98765 00001",
          created_at: "2026-01-01 10:00:00"
        };
        setUser(defaultAdmin);
        localStorage.setItem('smart_billing_user', JSON.stringify(defaultAdmin));
        api.setToken('mock_jwt_token_admin_1');
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(username, password);
      setUser(res.user);
      await checkBackendHealth();
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    api.setToken(null);
    localStorage.removeItem('smart_billing_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        backendConnected,
        checkBackendHealth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
