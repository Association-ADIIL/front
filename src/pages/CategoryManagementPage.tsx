import React, { useEffect, useState } from 'react';
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  type Category,
  type Subcategory,
  type CategoryFormData,
  type SubcategoryFormData,
} from '../api/categories';
import { Edit2, Trash2, Plus, ChevronDown, ChevronRight, Folder, FolderOpen } from 'lucide-react';
import Modal from '../components/Modal';
import { useNotification } from '../context/NotificationContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const CategoryManagementPage: React.FC = () => {
  useDocumentTitle('Admin - Categories');
  const { addNotification } = useNotification();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

  // Category modal state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [categoryFormData, setCategoryFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    order: 0,
  });

  // Subcategory modal state
  const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = useState(false);
  const [currentSubcategory, setCurrentSubcategory] = useState<Subcategory | null>(null);
  const [subcategoryFormData, setSubcategoryFormData] = useState<SubcategoryFormData>({
    name: '',
    description: '',
    order: 0,
    categoryId: 0,
  });

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'category' | 'subcategory'; item: Category | Subcategory } | null>(null);

  const fetchCategories = async () => {
    try {
      const data = await getAllCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      addNotification('error', 'Erreur lors du chargement des categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  // Category handlers
  const handleOpenCreateCategory = () => {
    setCurrentCategory(null);
    setCategoryFormData({ name: '', description: '', order: categories.length });
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (category: Category) => {
    setCurrentCategory(category);
    setCategoryFormData({
      name: category.name,
      description: category.description || '',
      order: category.order,
    });
    setIsCategoryModalOpen(true);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentCategory) {
        await updateCategory(currentCategory.id, categoryFormData);
        addNotification('success', 'Categorie modifiee avec succes !');
      } else {
        await createCategory(categoryFormData);
        addNotification('success', 'Categorie creee avec succes !');
      }
      setIsCategoryModalOpen(false);
      fetchCategories();
    } catch (error: any) {
      console.error('Failed to save category:', error);
      addNotification('error', error.message || "Erreur lors de l'enregistrement.");
    }
  };

  // Subcategory handlers
  const handleOpenCreateSubcategory = (categoryId: number) => {
    setCurrentSubcategory(null);
    const category = categories.find((c) => c.id === categoryId);
    setSubcategoryFormData({
      name: '',
      description: '',
      order: category?.subcategories?.length || 0,
      categoryId,
    });
    setIsSubcategoryModalOpen(true);
  };

  const handleOpenEditSubcategory = (subcategory: Subcategory) => {
    setCurrentSubcategory(subcategory);
    setSubcategoryFormData({
      name: subcategory.name,
      description: subcategory.description || '',
      order: subcategory.order,
      categoryId: subcategory.categoryId,
    });
    setIsSubcategoryModalOpen(true);
  };

  const handleSubcategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentSubcategory) {
        await updateSubcategory(currentSubcategory.id, subcategoryFormData);
        addNotification('success', 'Sous-categorie modifiee avec succes !');
      } else {
        await createSubcategory(subcategoryFormData);
        addNotification('success', 'Sous-categorie creee avec succes !');
      }
      setIsSubcategoryModalOpen(false);
      fetchCategories();
    } catch (error: any) {
      console.error('Failed to save subcategory:', error);
      addNotification('error', error.message || "Erreur lors de l'enregistrement.");
    }
  };

  // Delete handlers
  const handleOpenDelete = (type: 'category' | 'subcategory', item: Category | Subcategory) => {
    setItemToDelete({ type, item });
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      if (itemToDelete.type === 'category') {
        await deleteCategory(itemToDelete.item.id);
        addNotification('success', 'Categorie supprimee avec succes !');
      } else {
        await deleteSubcategory(itemToDelete.item.id);
        addNotification('success', 'Sous-categorie supprimee avec succes !');
      }
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      fetchCategories();
    } catch (error: any) {
      console.error('Failed to delete:', error);
      addNotification('error', error.message || 'Erreur lors de la suppression.');
    }
  };

  if (loading) return <div className="text-center p-8">Chargement...</div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-4xl font-bold text-accent-mint font-koulen">GESTION DES CATEGORIES</h1>
        <button
          onClick={handleOpenCreateCategory}
          className="bg-accent-mint text-darker-bg font-bold py-2 px-4 rounded hover:bg-white transition-colors flex items-center whitespace-nowrap"
        >
          <Plus size={20} className="mr-2" /> <span className="hidden sm:inline">Ajouter une categorie</span><span className="sm:hidden">Ajouter</span>
        </button>
      </div>

      <div className="space-y-4">
        {categories.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            Aucune categorie. Cliquez sur "Ajouter une categorie" pour commencer.
          </div>
        ) : (
          categories.map((category) => {
            const isExpanded = expandedCategories.has(category.id);
            return (
              <div
                key={category.id}
                className="bg-darker-bg border border-gray-800 rounded-2xl overflow-hidden"
              >
                {/* Category header */}
                <div
                  className="flex items-center justify-between p-3 sm:p-4 cursor-pointer hover:bg-dark-bg transition-colors"
                  onClick={() => toggleCategory(category.id)}
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    {isExpanded ? (
                      <ChevronDown size={18} className="text-gray-400 flex-shrink-0 sm:w-5 sm:h-5" />
                    ) : (
                      <ChevronRight size={18} className="text-gray-400 flex-shrink-0 sm:w-5 sm:h-5" />
                    )}
                    {isExpanded ? (
                      <FolderOpen size={20} className="text-accent-mint flex-shrink-0 sm:w-6 sm:h-6" />
                    ) : (
                      <Folder size={20} className="text-accent-mint flex-shrink-0 sm:w-6 sm:h-6" />
                    )}
                    <div className="min-w-0">
                      <h3 className="text-base sm:text-xl font-bold text-white truncate">{category.name}</h3>
                      {category.description && (
                        <p className="text-xs sm:text-sm text-gray-400 truncate">{category.description}</p>
                      )}
                      <span className="text-xs text-gray-500 sm:hidden">
                        {category.subcategories?.length || 0} sous-cat.
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                    <span className="text-sm text-gray-400 hidden sm:inline">
                      {category.subcategories?.length || 0} sous-categorie(s)
                    </span>
                    <div
                      className="flex space-x-1 sm:space-x-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handleOpenEditCategory(category)}
                        className="p-1.5 sm:p-2 text-blue-400 hover:bg-blue-900/20 rounded"
                      >
                        <Edit2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                      </button>
                      <button
                        onClick={() => handleOpenDelete('category', category)}
                        className="p-1.5 sm:p-2 text-red-400 hover:bg-red-900/20 rounded"
                      >
                        <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Subcategories */}
                {isExpanded && (
                  <div className="border-t border-gray-800 bg-dark-bg">
                    <div className="p-3 sm:p-4 space-y-2">
                      {category.subcategories && category.subcategories.length > 0 ? (
                        category.subcategories.map((subcategory) => (
                          <div
                            key={subcategory.id}
                            className="flex items-center justify-between p-2 sm:p-3 bg-darker-bg rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
                          >
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-accent-mint/20 flex items-center justify-center flex-shrink-0">
                                <span className="text-accent-mint font-bold text-xs sm:text-sm">
                                  {subcategory.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-white text-sm sm:text-base truncate">{subcategory.name}</p>
                                {subcategory.description && (
                                  <p className="text-xs text-gray-400 truncate">{subcategory.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex space-x-1 sm:space-x-2 flex-shrink-0">
                              <button
                                onClick={() => handleOpenEditSubcategory(subcategory)}
                                className="p-1.5 sm:p-2 text-blue-400 hover:bg-blue-900/20 rounded"
                              >
                                <Edit2 size={14} className="sm:w-4 sm:h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenDelete('subcategory', subcategory)}
                                className="p-1.5 sm:p-2 text-red-400 hover:bg-red-900/20 rounded"
                              >
                                <Trash2 size={14} className="sm:w-4 sm:h-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-400 text-sm text-center py-2">
                          Aucune sous-categorie
                        </p>
                      )}
                      <button
                        onClick={() => handleOpenCreateSubcategory(category.id)}
                        className="w-full py-2 border border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-accent-mint hover:text-accent-mint transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                      >
                        <Plus size={16} /> <span className="hidden sm:inline">Ajouter une sous-categorie</span><span className="sm:hidden">Ajouter</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Category Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={currentCategory ? 'Modifier la categorie' : 'Ajouter une categorie'}
      >
        <form onSubmit={handleCategorySubmit} className="space-y-4">
          <div>
            <label className="block text-gray-400 mb-1">Nom</label>
            <input
              type="text"
              value={categoryFormData.name}
              onChange={(e) => setCategoryFormData((prev) => ({ ...prev, name: e.target.value }))}
              required
              className="w-full bg-dark-bg border border-gray-600 rounded p-2 text-white"
              placeholder="Ex: Boissons, Snacks"
            />
          </div>
          <div>
            <label className="block text-gray-400 mb-1">Description (optionnel)</label>
            <textarea
              value={categoryFormData.description || ''}
              onChange={(e) =>
                setCategoryFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              className="w-full bg-dark-bg border border-gray-600 rounded p-2 text-white h-24"
              placeholder="Description de la categorie..."
            />
          </div>
          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(false)}
              className="mr-4 px-4 py-2 text-gray-300 hover:text-white"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="bg-accent-mint text-darker-bg font-bold py-2 px-6 rounded hover:bg-white transition-colors"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </Modal>

      {/* Subcategory Modal */}
      <Modal
        isOpen={isSubcategoryModalOpen}
        onClose={() => setIsSubcategoryModalOpen(false)}
        title={currentSubcategory ? 'Modifier la sous-categorie' : 'Ajouter une sous-categorie'}
      >
        <form onSubmit={handleSubcategorySubmit} className="space-y-4">
          <div>
            <label className="block text-gray-400 mb-1">Categorie parente</label>
            <select
              value={subcategoryFormData.categoryId}
              onChange={(e) =>
                setSubcategoryFormData((prev) => ({ ...prev, categoryId: parseInt(e.target.value) }))
              }
              required
              className="w-full bg-dark-bg border border-gray-600 rounded p-2 text-white"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-400 mb-1">Nom</label>
            <input
              type="text"
              value={subcategoryFormData.name}
              onChange={(e) =>
                setSubcategoryFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
              className="w-full bg-dark-bg border border-gray-600 rounded p-2 text-white"
              placeholder="Ex: Coca-Cola, Red Bull, Chips"
            />
          </div>
          <div>
            <label className="block text-gray-400 mb-1">Description (optionnel)</label>
            <textarea
              value={subcategoryFormData.description || ''}
              onChange={(e) =>
                setSubcategoryFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              className="w-full bg-dark-bg border border-gray-600 rounded p-2 text-white h-24"
              placeholder="Description de la sous-categorie..."
            />
          </div>
          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={() => setIsSubcategoryModalOpen(false)}
              className="mr-4 px-4 py-2 text-gray-300 hover:text-white"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="bg-accent-mint text-darker-bg font-bold py-2 px-6 rounded hover:bg-white transition-colors"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmer la suppression"
      >
        <div className="text-center">
          <p className="mb-6 text-lg">
            Etes-vous sur de vouloir supprimer {itemToDelete?.type === 'category' ? 'la categorie' : 'la sous-categorie'}{' '}
            <span className="font-bold text-accent-mint">{itemToDelete?.item.name}</span> ?
          </p>
          {itemToDelete?.type === 'category' && (
            <p className="text-sm text-yellow-400 mb-4">
              Attention: Vous devez d'abord supprimer toutes les sous-categories de cette categorie.
            </p>
          )}
          {itemToDelete?.type === 'subcategory' && (
            <p className="text-sm text-yellow-400 mb-4">
              Attention: Vous devez d'abord retirer tous les produits de cette sous-categorie.
            </p>
          )}
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
            >
              Annuler
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500"
            >
              Supprimer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CategoryManagementPage;
