import { fetchJson } from './client';

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
}

export type ProductFormData = Omit<Product, 'id'> & {
  variants?: ProductVariant[];
};

export const getAllProducts = async (): Promise<Product[]> => {
  return fetchJson('/products');
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