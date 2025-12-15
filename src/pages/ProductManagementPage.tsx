import React, { useEffect, useState, useRef } from 'react';
import { getAllProducts, deleteProduct, createProduct, updateProduct, type Product, type ProductFormData, type ProductVariant } from '../api/products';
import { Edit2, Trash2, Plus, X } from 'lucide-react';
import Modal from '../components/Modal';
import ImageUpload from '../components/ImageUpload';
import { deleteImage } from '../api/upload';
import { useNotification } from '../context/NotificationContext';

const ProductManagementPage: React.FC = () => {
  const { addNotification } = useNotification();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const uploadedImagesRef = useRef<string[]>([]);

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: 0,
    imageUrl: '',
    active: true,
    variants: []
  });

  const [newVariant, setNewVariant] = useState<Omit<ProductVariant, 'id'>>({
    name: '',
    priceModifier: 0,
    stock: undefined
  });

  const fetchProducts = async () => {
    try {
      const data = await getAllProducts();
      setProducts(data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenCreate = () => {
    setCurrentProduct(null);
    uploadedImagesRef.current = [];
    setFormData({
      name: '',
      description: '',
      price: 0,
      imageUrl: '',
      active: true,
      variants: []
    });
    setNewVariant({
      name: '',
      priceModifier: 0,
      stock: undefined
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setCurrentProduct(product);
    uploadedImagesRef.current = [];
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      imageUrl: product.imageUrl || '',
      active: product.active,
      variants: product.variants || []
    });
    setNewVariant({
      name: '',
      priceModifier: 0,
      stock: undefined
    });
    setIsModalOpen(true);
  };

  const handleOpenDelete = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
  };

  const handleCloseModal = async () => {
    // Clean up uploaded images if modal is closed without saving
    for (const imageUrl of uploadedImagesRef.current) {
      try {
        await deleteImage(imageUrl);
      } catch (error) {
        console.error('Failed to delete image:', error);
      }
    }
    uploadedImagesRef.current = [];
    setIsModalOpen(false);
  };

  const handleImageCleanup = (imageUrl: string) => {
    uploadedImagesRef.current.push(imageUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentProduct) {
        await updateProduct(currentProduct.id, formData);
        addNotification('success', 'Produit modifié avec succès !');
      } else {
        await createProduct(formData);
        addNotification('success', 'Produit créé avec succès !');
      }

      // Clear uploaded images list since they're now saved
      uploadedImagesRef.current = [];
      setIsModalOpen(false);
      fetchProducts();
    } catch (error) {
      console.error("Failed to save product:", error);
      addNotification('error', "Erreur lors de l'enregistrement du produit.");
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    try {
      await deleteProduct(productToDelete.id);
      addNotification('success', 'Produit supprimé avec succès !');
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (error) {
      console.error("Failed to delete product:", error);
      addNotification('error', "Erreur lors de la suppression.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : name === 'active' ? value === 'true' : value
    }));
  };

  const handleAddVariant = () => {
    if (!newVariant.name.trim()) {
      alert('Le nom de la variante est requis');
      return;
    }

    const variant: ProductVariant = {
      id: Date.now(), // Temporary ID for frontend
      ...newVariant
    };

    setFormData(prev => ({
      ...prev,
      variants: [...(prev.variants || []), variant]
    }));

    // Reset new variant
    setNewVariant({
      name: '',
      priceModifier: 0,
      stock: undefined
    });
  };

  const handleRemoveVariant = (variantId: number) => {
    setFormData(prev => ({
      ...prev,
      variants: (prev.variants || []).filter(v => v.id !== variantId)
    }));
  };

  if (loading) return <div className="text-center p-8">Chargement...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-accent-mint font-koulen">GESTION DES PRODUITS</h1>
        <button onClick={handleOpenCreate} className="bg-accent-mint text-darker-bg font-bold py-2 px-4 rounded hover:bg-white transition-colors flex items-center">
          <Plus size={20} className="mr-2" /> Ajouter un produit
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product.id} className={`bg-darker-bg border border-gray-800 rounded-2xl p-6 flex flex-col relative group hover:border-gray-700 transition-colors ${!product.active ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between mb-4">
                 <div className="w-16 h-16 rounded bg-dark-bg flex items-center justify-center overflow-hidden">
                     <img 
                        src={product.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=1E1E1E&color=fff&size=64`} 
                        alt={product.name} 
                        className="w-full h-full object-cover" 
                     />
                 </div>
                 <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity bg-darker-bg p-1 rounded absolute top-4 right-4 shadow-lg">
                    <button onClick={() => handleOpenEdit(product)} className="p-2 text-blue-400 hover:bg-blue-900/20 rounded"><Edit2 size={18} /></button>
                    <button onClick={() => handleOpenDelete(product)} className="p-2 text-red-400 hover:bg-red-900/20 rounded"><Trash2 size={18} /></button>
                 </div>
            </div>

            <h3 className="text-xl font-bold mb-1">{product.name}</h3>
            <p className="text-sm text-gray-400 mb-3 line-clamp-2">{product.description}</p>
            <p className="text-lg font-bold text-accent-mint mb-2">{product.price} €</p>

            <div className="mt-auto pt-4 border-t border-gray-800 space-y-2">
                <div>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${product.active ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                      {product.active ? 'Disponible' : 'Indisponible'}
                  </span>
                </div>
                {product.variants && (product.variants as any[]).length > 0 && (
                  <div className="text-xs text-accent-mint flex items-center gap-1">
                    <span className="font-bold">{(product.variants as any[]).length}</span> variante(s)
                  </div>
                )}
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={currentProduct ? "Modifier le produit" : "Ajouter un produit"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
                <label className="block text-gray-400 mb-1">Nom</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full bg-dark-bg border border-gray-600 rounded p-2 text-white" />
            </div>
            <div>
                <label className="block text-gray-400 mb-1">Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} required className="w-full bg-dark-bg border border-gray-600 rounded p-2 text-white h-24" />
            </div>
            <div>
                <label className="block text-gray-400 mb-1">Prix (€)</label>
                <input type="number" step="0.01" name="price" value={formData.price} onChange={handleChange} required className="w-full bg-dark-bg border border-gray-600 rounded p-2 text-white" />
            </div>
            <div>
                <label className="block text-gray-400 mb-1">Disponibilité</label>
                <select name="active" value={String(formData.active)} onChange={handleChange} className="w-full bg-dark-bg border border-gray-600 rounded p-2 text-white">
                    <option value="true">Disponible</option>
                    <option value="false">Indisponible</option>
                </select>
            </div>
            <div>
                <ImageUpload
                  value={formData.imageUrl || ''}
                  onChange={(url) => setFormData(prev => ({ ...prev, imageUrl: url || '' }))}
                  folder="products"
                  label="Image du produit"
                  aspectRatio="16:9"
                  onCleanup={handleImageCleanup}
                />
            </div>

            {/* Product Variants Section */}
            <div className="border-t border-gray-700 pt-4 mt-4">
              <h3 className="text-lg font-bold text-white mb-3">Variantes / Formats</h3>
              <p className="text-sm text-gray-400 mb-4">Ajoutez des variantes pour ce produit (ex: tailles S, M, L, XL ou formats Petit/Grand)</p>

              {/* Existing variants */}
              {formData.variants && formData.variants.length > 0 && (
                <div className="space-y-2 mb-4">
                  {formData.variants.map((variant) => {
                    const finalPrice = formData.price + variant.priceModifier;
                    return (
                      <div key={variant.id} className="flex items-center justify-between bg-dark-bg p-3 rounded border border-gray-700">
                        <div className="flex-grow">
                          <p className="text-white font-medium">{variant.name}</p>
                          <p className="text-xs text-gray-400">
                            Prix: {finalPrice.toFixed(2)} €
                            {variant.priceModifier !== 0 && ` (${variant.priceModifier > 0 ? '+' : ''}${variant.priceModifier.toFixed(2)} €)`}
                            {variant.stock !== undefined && ` • Stock: ${variant.stock}`}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(variant.id)}
                          className="text-red-400 hover:text-red-300 ml-2"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add new variant */}
              <div className="bg-darker-bg p-4 rounded border border-gray-700">
                <p className="text-sm font-bold text-white mb-3">Ajouter une nouvelle variante</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Nom de la variante</label>
                    <input
                      type="text"
                      value={newVariant.name}
                      onChange={(e) => setNewVariant(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: S, M, L ou Petit, Grand"
                      className="w-full bg-dark-bg border border-gray-600 rounded p-2 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Modificateur de prix (€)
                      <span className="text-[10px] block text-gray-500">Difference par rapport au prix de base</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newVariant.priceModifier}
                      onChange={(e) => setNewVariant(prev => ({ ...prev, priceModifier: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                      className="w-full bg-dark-bg border border-gray-600 rounded p-2 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Stock (optionnel)
                      <span className="text-[10px] block text-gray-500">Laissez vide si illimite</span>
                    </label>
                    <input
                      type="number"
                      value={newVariant.stock || ''}
                      onChange={(e) => setNewVariant(prev => ({ ...prev, stock: e.target.value ? parseInt(e.target.value) : undefined }))}
                      placeholder="Illimite"
                      className="w-full bg-dark-bg border border-gray-600 rounded p-2 text-white text-sm"
                    />
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-400 bg-dark-bg p-2 rounded">
                  Apercu: {newVariant.name || '[Nom]'} - {(formData.price + newVariant.priceModifier).toFixed(2)} €
                </div>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="mt-3 bg-accent-mint text-darker-bg font-bold py-2 px-4 rounded hover:bg-white transition-colors text-sm"
                >
                  Ajouter cette variante
                </button>
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-4">
              <button type="button" onClick={handleCloseModal} className="mr-4 px-4 py-2 text-gray-300 hover:text-white">Annuler</button>
              <button type="submit" className="bg-accent-mint text-darker-bg font-bold py-2 px-6 rounded hover:bg-white transition-colors">Enregistrer</button>
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
            <p className="mb-6 text-lg">Êtes-vous sûr de vouloir supprimer le produit <span className="font-bold text-accent-mint">{productToDelete?.name}</span> ?</p>
            <div className="flex justify-center space-x-4">
                <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500">Annuler</button>
                <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500">Supprimer</button>
            </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProductManagementPage;