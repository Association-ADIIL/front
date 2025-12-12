export const API_BASE_URL = 'https://localhost:5173/api';

type UnauthorizedCallback = () => void;
type ErrorCallback = (status: number, message: string) => void;

let onUnauthorized: UnauthorizedCallback | null = null;
let onError: ErrorCallback | null = null;

export const setUnauthorizedCallback = (cb: UnauthorizedCallback) => {
  onUnauthorized = cb;
};

export const setErrorCallback = (cb: ErrorCallback) => {
  onError = cb;
};

export const fetchJson = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    if (onUnauthorized) {
      onUnauthorized();
    }
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: 'Une erreur est survenue' }));
    
    // Notify about the error
    if (onError && (response.status === 403 || response.status === 404)) {
       // We can choose to suppress 401 here if we only want logout, but showing a message "Session expired" is good too.
       // Let's pass it.
       onError(response.status, errorBody.message || `Erreur ${response.status}`);
    }
    
    throw new Error(errorBody.message || `Erreur ${response.status}`);
  }

  return response.json();
};