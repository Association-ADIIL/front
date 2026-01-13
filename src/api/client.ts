import { ApiError, NetworkError } from '../types/errors';
import { logger } from '../utils/logger';

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

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

/**
 * Get the authentication token from storage
 * Used as fallback during migration to HttpOnly cookies
 */
const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

/**
 * Get CSRF token from cookie
 */
const getCsrfToken = (): string | null => {
  const match = document.cookie.match(/csrf_token=([^;]+)/);
  return match ? match[1] : null;
};

/**
 * Parse error response from API
 */
const parseErrorResponse = async (response: Response): Promise<{ message: string; code?: string }> => {
  try {
    const errorBody = await response.json();
    return {
      message: errorBody.message || `Erreur ${response.status}`,
      code: errorBody.code,
    };
  } catch {
    return { message: 'Une erreur est survenue' };
  }
};

/**
 * Handle common error responses
 */
const handleErrorResponse = (response: Response, errorMessage: string, errorCode?: string): never => {
  // Handle unauthorized
  if (response.status === 401 || response.status === 403) {
    if (onUnauthorized) {
      onUnauthorized();
    }
  }

  // Notify about 404 errors
  if (onError && response.status === 404) {
    onError(response.status, errorMessage);
  }

  throw new ApiError(errorMessage, response.status, errorCode);
};

/**
 * Main fetch function with authentication and error handling
 * Uses HttpOnly cookies for authentication (with localStorage fallback during migration)
 */
export const fetchJson = async <T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const token = getAuthToken();
  const csrfToken = getCsrfToken();

  // Build headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    // Include Authorization header as fallback during migration
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    // Include CSRF token for state-changing requests
    ...(csrfToken && options.method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method)
      ? { 'X-CSRF-Token': csrfToken }
      : {}),
    ...options.headers,
  };

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      // Include credentials to send HttpOnly cookies
      credentials: 'include',
    });
  } catch (error) {
    logger.apiError(endpoint, 0, error);
    throw new NetworkError('Impossible de contacter le serveur. Vérifiez votre connexion.');
  }

  if (!response.ok) {
    const { message, code } = await parseErrorResponse(response);
    logger.apiError(endpoint, response.status, message);
    handleErrorResponse(response, message, code);
  }

  try {
    return await response.json() as T;
  } catch {
    // Empty response is valid for some endpoints
    return {} as T;
  }
};

/**
 * Upload a file using multipart/form-data
 */
export const uploadFile = async (
  endpoint: string,
  file: File,
  folder?: string
): Promise<{ url: string; thumbnailUrl: string }> => {
  const token = getAuthToken();
  const csrfToken = getCsrfToken();

  const formData = new FormData();
  formData.append('image', file);

  const url = new URL(`${API_BASE_URL}${endpoint}`);
  if (folder) {
    url.searchParams.append('folder', folder);
  }

  let response: Response;

  try {
    response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
      },
      body: formData,
      credentials: 'include',
    });
  } catch (error) {
    logger.apiError(endpoint, 0, error);
    throw new NetworkError('Impossible de contacter le serveur pour l\'upload.');
  }

  if (!response.ok) {
    const { message, code } = await parseErrorResponse(response);
    logger.apiError(endpoint, response.status, message);
    handleErrorResponse(response, message, code);
  }

  return response.json();
};

/**
 * Delete an uploaded image
 */
export const deleteUploadedImage = async (imageUrl: string): Promise<void> => {
  const token = getAuthToken();
  const csrfToken = getCsrfToken();

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
      },
      body: JSON.stringify({ url: imageUrl }),
      credentials: 'include',
    });
  } catch (error) {
    logger.apiError('/upload', 0, error);
    throw new NetworkError('Impossible de contacter le serveur pour la suppression.');
  }

  if (!response.ok) {
    const { message, code } = await parseErrorResponse(response);
    logger.apiError('/upload', response.status, message);
    handleErrorResponse(response, message, code);
  }
};

/**
 * Fetch CSRF token from server
 * Call this after login or when needed
 */
export const fetchCsrfToken = async (): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/auth/csrf-token`, {
    credentials: 'include',
  });
  const data = await response.json();
  return data.csrfToken;
};
