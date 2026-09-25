import { fetchJson, fetchFormData } from './client';
import type { Category, Subcategory } from './categories';

export interface ProductImage {
  id: number;
  url: string;
  order: number;
  productId: number;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  active: boolean;
  images?: ProductImage[];
  subcategoryId?: number;
  subcategory?: Subcategory & {
    category?: Category;
  };
  productPromotions?: Array<{
    promotion: {
      id: number;
      type: string;
      rules: any;
      isActive: boolean;
      startDate: string | null;
      endDate: string | null;
    };
  }>;
}

export type ProductFormData = Omit<Product, 'id' | 'subcategory'> & {
  subcategoryId?: number | null;
};

export interface ProductFilters {
  categoryId?: number;
  subcategoryId?: number;
}

export const getAllProducts = async (filters?: ProductFilters): Promise<Product[]> => {
  const params = new URLSearchParams();
  if (filters?.categoryId) params.append('categoryId', filters.categoryId.toString());
  if (filters?.subcategoryId) params.append('subcategoryId', filters.subcategoryId.toString());

  const query = params.toString();
  return fetchJson(`/products${query ? `?${query}` : ''}`);
};

export const getProductById = async (id: string): Promise<Product> => {
  return fetchJson(`/products/${id}`);
};

export const createProduct = async (data: ProductFormData): Promise<Product> => {
  return fetchJson('/products', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateProduct = async (id: string, data: Partial<ProductFormData>): Promise<Product> => {
  return fetchJson(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteProduct = async (id: string): Promise<void> => {
  return fetchJson(`/products/${id}`, {
    method: 'DELETE',
  });
};

// Product Images API
export const addProductImage = async (productId: string, file: File): Promise<ProductImage> => {
  const formData = new FormData();
  formData.append('image', file);
  return fetchFormData(`/products/${productId}/images`, {
    method: 'POST',
    body: formData,
  });
};

export const removeProductImage = async (productId: string, imageId: number): Promise<void> => {
  return fetchJson(`/products/${productId}/images/${imageId}`, {
    method: 'DELETE',
  });
};

export const reorderProductImages = async (productId: string, imageIds: number[]): Promise<ProductImage[]> => {
  return fetchJson(`/products/${productId}/images/reorder`, {
    method: 'PUT',
    body: JSON.stringify({ imageIds }),
  });
};

// Fait appel à ta route backend : router.get('/', getAllSubcategories)
export const getAllSubcategories = async (): Promise<Subcategory[]> => {
  // ⚠️ Attention au chemin : s'il est monté sur /api/subcategories dans ton app.ts,
  // mets simplement '/subcategories' si ton client de fetch gère déjà l'URL de base.
  return fetchJson('/subcategories');
};