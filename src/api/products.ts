import { fetchJson, fetchFormData } from './client';
import type { Category, Subcategory } from './categories';

export interface ProductVariant {
  id: number;
  name: string;
  priceModifier: number; // Price difference from base price (can be 0)
  stock?: number;
}

// New: Variant category system for multiple option types (e.g., Size AND Color)
export interface VariantOption {
  id: number;
  name: string;
  priceModifier: number;
}


export interface VariantCategory {
  id: number;
  name: string;
  options: VariantOption[];
}

// Selected option for cart/orders
export interface SelectedOption {
  categoryId: number;
  categoryName: string;
  optionId: number;
  optionName: string;
  priceModifier: number;
}

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
  variants?: ProductVariant[]; // Legacy: single-level variants
  variantCategories?: VariantCategory[]; // New: multi-level variant categories
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
  variants?: ProductVariant[];
  variantCategories?: VariantCategory[];
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