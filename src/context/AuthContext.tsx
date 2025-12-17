import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { type User, type LoginCredentials, login as apiLogin, register as apiRegister, getMe, type RegisterData } from '../api/auth';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // On mount, check if we have a token and user in localStorage
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await apiLogin(credentials);
      setToken(response.token);
      setUser(response.user);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      navigate('/my-account');
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      await apiRegister(data);
      // Auto-login after register? Or redirect to login? 
      // For now, let's redirect to login
      navigate('/login');
    } catch (error) {
       console.error("Register failed:", error);
       throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Refresh user data from server (for permission updates)
  const refreshUser = useCallback(async () => {
    if (!token) return;

    try {
      const response = await getMe();
      setUser(response.user);
      localStorage.setItem('user', JSON.stringify(response.user));
    } catch (error) {
      console.error('Failed to refresh user:', error);
      // If token is invalid, log out
      if ((error as any)?.message?.includes('401') || (error as any)?.message?.includes('Unauthorized')) {
        logout();
      }
    }
  }, [token]);

  // Refresh user permissions when window gains focus
  useEffect(() => {
    const handleFocus = () => {
      if (token) {
        refreshUser();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [token, refreshUser]);

  const isAdmin = user?.type === 'ADMIN_BDE' || user?.type === 'ADMIN_PROF';

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};