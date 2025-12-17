import { API_BASE_URL } from './client';

// ============ PUBLIC BUCKET (for images) ============

export const uploadImage = async (file: File, folder: string): Promise<{ imageUrl: string }> => {
  const formData = new FormData();
  formData.append('image', file);

  const token = localStorage.getItem('token');

  // Use query parameter to support folder paths with slashes
  const response = await fetch(`${API_BASE_URL}/upload/image?folder=${encodeURIComponent(folder)}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Upload failed' }));
    throw new Error(error.message || 'Failed to upload image');
  }

  return response.json();
};

export const deleteImage = async (imageUrl: string): Promise<void> => {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE_URL}/upload/delete`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ imageUrl }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Delete failed' }));
    throw new Error(error.message || 'Failed to delete image');
  }
};

// ============ PRIVATE BUCKET (for documents) ============

export const uploadPrivateFile = async (file: File, folder: string): Promise<{ fileKey: string; fileId: number; fileName: string }> => {
  const formData = new FormData();
  formData.append('file', file);

  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE_URL}/upload/private?folder=${encodeURIComponent(folder)}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Upload failed' }));
    throw new Error(error.message || 'Failed to upload file');
  }

  return response.json();
};

export const getPrivateFileUrl = async (fileId: number, expiresIn?: number): Promise<{ url: string; expiresIn: number; fileName: string; mimeType: string }> => {
  const token = localStorage.getItem('token');
  const params = expiresIn ? `?expiresIn=${expiresIn}` : '';

  const response = await fetch(`${API_BASE_URL}/upload/private/${fileId}${params}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to get file URL' }));
    throw new Error(error.message || 'Failed to get file URL');
  }

  return response.json();
};

export const deletePrivateFile = async (fileId: number): Promise<void> => {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE_URL}/upload/private/${fileId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Delete failed' }));
    throw new Error(error.message || 'Failed to delete file');
  }
};

// ============ FILE RECORDS ============

export interface FileRecord {
  id: number;
  url: string;
  fileName: string;
  folder: string;
  mimeType: string | null;
  size: number | null;
  isPrivate: boolean;
  uploadedBy: number | null;
  uploader?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  // For private files, the backend generates a signed URL
  signedUrl?: string;
  urlExpiresIn?: number;
}

export const getFiles = async (folder?: string): Promise<FileRecord[]> => {
  const token = localStorage.getItem('token');
  const url = folder
    ? `${API_BASE_URL}/upload/files?folder=${encodeURIComponent(folder)}`
    : `${API_BASE_URL}/upload/files`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch files' }));
    throw new Error(error.message || 'Failed to fetch files');
  }

  const data = await response.json();
  return data.files;
};
