import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface AuthContextType {
  user: TelegramUser | null;
  isLoggedIn: boolean;
  login: (user: TelegramUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<TelegramUser | null>(() => {
    const saved = localStorage.getItem('metricgram_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (userData: TelegramUser) => {
    setUser(userData);
    localStorage.setItem('metricgram_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('metricgram_user');
  };

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'metricgram_user') {
        setUser(e.newValue ? JSON.parse(e.newValue) : null);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
