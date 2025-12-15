import { API_BASE_URL } from './client';

export const uploadImage = async (file: File, folder: string): Promise<{ imageUrl: string }> => {
  const formData = new FormData();
  formData.append('image', file);

  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE_URL}/upload/${folder}/image`, {
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
