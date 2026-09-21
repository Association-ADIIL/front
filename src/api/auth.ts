import { fetchJson } from './client';

export type Filiere = 'INFO' | 'MMI' | 'TC' | 'BIO' | 'AUTRES';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  type: 'STUDENT' | 'PROFESSOR' | 'EXTERNAL' | 'ADMIN_BDE' | 'ADMIN_PROF';
  filiere?: Filiere | null;
  emailOnOrder?: boolean;
  emailOnRecharge?: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
  isNewUser?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  type: string;
  studentGroup?: string;
  filiere: Filiere;
}

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  return fetchJson('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
    skipUnauthorizedCallback: true, // Don't trigger "session expired" on failed login
  });
};

export const register = async (data: RegisterData): Promise<{ message: string; user: User }> => {
  return fetchJson('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// Get current user info (for refreshing permissions)
export const getMe = async (): Promise<{ user: User }> => {
  return fetchJson('/auth/me');
};

// Delete own account (soft delete)
export const deleteAccount = async (): Promise<{ message: string }> => {
  return fetchJson('/auth/me', {
    method: 'DELETE',
  });
};

export const loginWithGoogle = async (googleToken: string): Promise<AuthResponse> => {
  return fetchJson('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ token: googleToken }),
  });
};

// Logout (clears HttpOnly cookie on server)
export const logout = async (): Promise<{ message: string }> => {
  return fetchJson('/auth/logout', {
    method: 'POST',
  });
};

// Update own profile
export const updateProfile = async (data: {
  studentGroup?: string | null;
  filiere?: string | null;
  emailOnOrder?: boolean;
  emailOnRecharge?: boolean;
}): Promise<{ message: string; user: User }> => {
  return fetchJson('/auth/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

// Request password reset
export const forgotPassword = async (email: string): Promise<{ message: string }> => {
  return fetchJson('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
};

// Reset password with token
export const resetPassword = async (token: string, password: string): Promise<{ message: string }> => {
  return fetchJson('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });
};