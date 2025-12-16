import { fetchJson } from './client';
import type { Category, Subcategory } from './categories';

export interface ProductVariant {
  id: number;
  name: string;
  priceModifier: number; // Price difference from base price (can be 0)
  stock?: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  active: boolean;
  variants?: ProductVariant[];
  subcategoryId?: number;
  subcategory?: Subcategory & {
    category?: Category;
  };
}

export type ProductFormData = Omit<Product, 'id' | 'subcategory'> & {
  variants?: ProductVariant[];
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