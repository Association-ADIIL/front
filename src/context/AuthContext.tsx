import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { type User, type LoginCredentials, login as apiLogin, register as apiRegister, getMe, logout as apiLogout, type RegisterData } from '../api/auth';
import { useNavigate } from 'react-router-dom';
import { logger } from '../utils/logger';
import { isUnauthorizedError } from '../types/errors';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Token storage utilities
 * Centralized to make it easier to migrate to httpOnly cookies later
 */
const TokenStorage = {
  get: (): string | null => localStorage.getItem('token'),
  set: (token: string): void => localStorage.setItem('token', token),
  remove: (): void => localStorage.removeItem('token'),
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(TokenStorage.get());
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch user data from server on mount if we have a token
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = TokenStorage.get();

      if (storedToken) {
        setToken(storedToken);
        try {
          // Always fetch fresh user data from server instead of localStorage
          const response = await getMe();
          setUser(response.user);
          logger.auth('refresh', true);
        } catch (error) {
          // Token is invalid, clear it
          logger.error('Failed to fetch user on init', error);
          TokenStorage.remove();
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await apiLogin(credentials);
      setToken(response.token);
      setUser(response.user);
      TokenStorage.set(response.token);
      logger.auth('login', true);
      navigate('/my-account');
    } catch (error) {
      logger.error('Login failed', error);
      logger.auth('login', false);
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      await apiRegister(data);
      logger.auth('register', true);
      navigate('/login');
    } catch (error) {
      logger.error('Register failed', error);
      logger.auth('register', false);
      throw error;
    }
  };

  const logout = useCallback(async () => {
    try {
      // Call API to clear HttpOnly cookie on server
      await apiLogout();
    } catch (error) {
      // Log but don't block logout if API call fails
      logger.error('Logout API call failed', error);
    }
    setToken(null);
    setUser(null);
    TokenStorage.remove();
    logger.auth('logout', true);
    navigate('/login');
  }, [navigate]);

  // Refresh user data from server (for permission updates)
  const refreshUser = useCallback(async () => {
    if (!token) return;

    try {
      const response = await getMe();
      setUser(response.user);
      logger.auth('refresh', true);
    } catch (error) {
      logger.error('Failed to refresh user', error);
      // If token is invalid, log out
      if (isUnauthorizedError(error)) {
        logout();
      }
    }
  }, [token, logout]);

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
