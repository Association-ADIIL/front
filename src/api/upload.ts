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

// ============ FILE SHARING ============

export interface FileShare {
  id: number;
  token: string;
  fileId: number;
  expiresAt: string;
  createdBy: number | null;
  accessCount: number;
  maxAccess: number | null;
  lastAccessAt: string | null;
  createdAt: string;
}

export interface CreateShareResponse {
  shareId: number;
  shareUrl: string;
  token: string;
  expiresAt: string;
  maxAccess: number | null;
}

/**
 * Create a shareable link for a file
 * @param fileId - The ID of the file to share
 * @param expiresIn - Expiration time in seconds (default: 24 hours)
 * @param maxAccess - Maximum number of accesses (optional)
 */
export const createFileShare = async (
  fileId: number,
  expiresIn: number = 86400,
  maxAccess?: number
): Promise<CreateShareResponse> => {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE_URL}/upload/share/${fileId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ expiresIn, maxAccess }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to create share link' }));
    throw new Error(error.message || 'Failed to create share link');
  }

  return response.json();
};

/**
 * Get all share links for a file
 */
export const getFileShares = async (fileId: number): Promise<FileShare[]> => {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE_URL}/upload/share/${fileId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch shares' }));
    throw new Error(error.message || 'Failed to fetch shares');
  }

  const data = await response.json();
  return data.shares;
};

/**
 * Delete a share link
 */
export const deleteFileShare = async (shareId: number): Promise<void> => {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE_URL}/upload/share/${shareId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to delete share' }));
    throw new Error(error.message || 'Failed to delete share');
  }
};
