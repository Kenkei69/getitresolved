import React, { createContext, useContext, useState, useEffect } from 'react';
import { SafeUser } from '../../../shared/types';
import { api } from '../services/api';
import { LoginInput, RegisterInput } from '../../../shared/schemas';

interface AuthContextType {
  user: SafeUser | null;
  loading: boolean;
  enableDemoAccounts: boolean;
  login: (input: LoginInput) => Promise<SafeUser>;
  register: (input: RegisterInput) => Promise<SafeUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [enableDemoAccounts, setEnableDemoAccounts] = useState(true);

  const refreshUser = async () => {
    try {
      const data = await api.getMe();
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
    api.getConfig()
      .then((cfg) => {
        if (cfg && typeof cfg.enableDemoAccounts === 'boolean') {
          setEnableDemoAccounts(cfg.enableDemoAccounts);
        }
      })
      .catch(() => {});
  }, []);

  const login = async (input: LoginInput) => {
    const data = await api.login(input);
    setUser(data.user);
    return data.user;
  };

  const register = async (input: RegisterInput) => {
    const data = await api.register(input);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, enableDemoAccounts, login, register, logout, refreshUser }}
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
