import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { type User, type LoginCredentials, login as apiLogin, register as apiRegister, getMe, logout as apiLogout, type RegisterData, loginWithGoogle as apiLoginWithGoogle } from '../api/auth';
import { useNavigate } from 'react-router-dom';
import { logger } from '../utils/logger';
import { isUnauthorizedError } from '../types/errors';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithGoogle: (googleToken: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

  // Redirige vers la dernière page visitée (hors pages d'auth), sinon vers `fallback`.
  // `consume: false` permet de garder l'info pour une étape suivante du parcours
  // (ex: register -> login -> destination finale).
  const redirectAfterAuth = useCallback((fallback: string, consume: boolean = true) => {
    const redirectTo = sessionStorage.getItem('lastVisitedPage');
    if (redirectTo) {
      if (consume) sessionStorage.removeItem('lastVisitedPage');
      navigate(redirectTo);
    } else {
      navigate(fallback);
    }
  }, [navigate]);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = TokenStorage.get();

      if (storedToken) {
        setToken(storedToken);
        try {
          const response = await getMe();
          setUser(response.user);
          logger.auth('refresh', true);
        } catch (error) {
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
      redirectAfterAuth('/my-account');
    } catch (error) {
      logger.error('Login failed', error);
      logger.auth('login', false);
      throw error;
    }
  };

  const loginWithGoogle = async (googleToken: string) => {
    try {
      const response = await apiLoginWithGoogle(googleToken);
      setToken(response.token);
      setUser(response.user);
      TokenStorage.set(response.token);
      logger.auth('login_google', true);

      if (response.isNewUser) {
        redirectAfterAuth('/complete-profile');
      } else {
        redirectAfterAuth('/my-account');
      }
    } catch (error) {
      logger.error('Google login failed', error);
      logger.auth('login_google', false);
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      await apiRegister(data);
      logger.auth('register', true);
      // consume: false -> on garde l'info pour la redirection après le login qui suit
      redirectAfterAuth('/login', false);
    } catch (error) {
      logger.error('Register failed', error);
      logger.auth('register', false);
      throw error;
    }
  };

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch (error) {
      logger.error('Logout API call failed', error);
    }
    setToken(null);
    setUser(null);
    TokenStorage.remove();
    logger.auth('logout', true);
    navigate('/login');
  }, [navigate]);

  const refreshUser = useCallback(async () => {
    if (!token) return;

    try {
      const response = await getMe();
      setUser(response.user);
      logger.auth('refresh', true);
    } catch (error) {
      logger.error('Failed to refresh user', error);
      if (isUnauthorizedError(error)) {
        logout();
      }
    }
  }, [token, logout]);

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
    <AuthContext.Provider value={{ user, token, loading, login, loginWithGoogle, register, logout, refreshUser, isAdmin }}>
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