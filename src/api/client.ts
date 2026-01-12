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

  if (response.status === 401 || response.status === 403) {
    if (onUnauthorized) {
      onUnauthorized();
    }
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: 'Une erreur est survenue' }));
    
    // Notify about the error (not 401/403 which are handled by onUnauthorized)
    if (onError && response.status === 404) {
       onError(response.status, errorBody.message || `Erreur ${response.status}`);
    }
    
    throw new Error(errorBody.message || `Erreur ${response.status}`);
  }

  return response.json();
};

/**
 * Upload a file using multipart/form-data
 */
export const uploadFile = async (
  endpoint: string,
  file: File,
  folder?: string
): Promise<{ url: string; thumbnailUrl: string }> => {
  const token = localStorage.getItem('token');

  const formData = new FormData();
  formData.append('image', file);

  const url = new URL(`${API_BASE_URL}${endpoint}`);
  if (folder) {
    url.searchParams.append('folder', folder);
  }

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      // Don't set Content-Type - browser sets it automatically with boundary
    },
    body: formData,
  });

  if (response.status === 401 || response.status === 403) {
    if (onUnauthorized) {
      onUnauthorized();
    }
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({
      message: 'Erreur lors de l\'upload'
    }));

    if (onError && response.status === 404) {
      onError(response.status, errorBody.message);
    }

    throw new Error(errorBody.message || `Erreur ${response.status}`);
  }

  return response.json();
};

/**
 * Delete an uploaded image
 */
export const deleteUploadedImage = async (imageUrl: string): Promise<void> => {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ url: imageUrl }),
  });

  if (response.status === 401 || response.status === 403) {
    if (onUnauthorized) {
      onUnauthorized();
    }
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({
      message: 'Erreur lors de la suppression'
    }));

    if (onError && response.status === 404) {
      onError(response.status, errorBody.message);
    }

    throw new Error(errorBody.message || `Erreur ${response.status}`);
  }
};