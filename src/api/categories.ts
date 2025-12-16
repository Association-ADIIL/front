import { fetchJson } from './client';

export interface Category {
  id: number;
  name: string;
  description?: string;
  order: number;
  subcategories?: Subcategory[];
}

export interface Subcategory {
  id: number;
  name: string;
  description?: string;
  order: number;
  categoryId: number;
  category?: Category;
}

export type CategoryFormData = Omit<Category, 'id' | 'subcategories'>;
export type SubcategoryFormData = Omit<Subcategory, 'id' | 'category'>;

// Categories
export const getAllCategories = async (): Promise<Category[]> => {
  return fetchJson('/categories');
};

export const getCategoryById = async (id: number): Promise<Category> => {
  return fetchJson(`/categories/${id}`);
};

export const createCategory = async (data: CategoryFormData): Promise<Category> => {
  return fetchJson('/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateCategory = async (id: number, data: Partial<CategoryFormData>): Promise<Category> => {
  return fetchJson(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteCategory = async (id: number): Promise<void> => {
  return fetchJson(`/categories/${id}`, {
    method: 'DELETE',
  });
};

export const reorderCategories = async (orderedIds: number[]): Promise<Category[]> => {
  return fetchJson('/categories/reorder', {
    method: 'PUT',
    body: JSON.stringify({ orderedIds }),
  });
};

// Subcategories
export const getAllSubcategories = async (): Promise<Subcategory[]> => {
  return fetchJson('/subcategories');
};

export const getSubcategoriesByCategory = async (categoryId: number): Promise<Subcategory[]> => {
  return fetchJson(`/subcategories/category/${categoryId}`);
};

export const getSubcategoryById = async (id: number): Promise<Subcategory> => {
  return fetchJson(`/subcategories/${id}`);
};

export const createSubcategory = async (data: SubcategoryFormData): Promise<Subcategory> => {
  return fetchJson('/subcategories', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateSubcategory = async (id: number, data: Partial<SubcategoryFormData>): Promise<Subcategory> => {
  return fetchJson(`/subcategories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteSubcategory = async (id: number): Promise<void> => {
  return fetchJson(`/subcategories/${id}`, {
    method: 'DELETE',
  });
};

export const reorderSubcategories = async (categoryId: number, orderedIds: number[]): Promise<Subcategory[]> => {
  return fetchJson(`/subcategories/reorder/${categoryId}`, {
    method: 'PUT',
    body: JSON.stringify({ orderedIds }),
  });
};
