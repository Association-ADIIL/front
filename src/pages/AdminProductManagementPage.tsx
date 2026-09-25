import React, { useEffect, useState, useRef } from 'react';
import { logger } from '../utils/logger';
import { getAllProducts, deleteProduct, createProduct, updateProduct, type Product, type ProductFormData, type ProductImage } from '../api/products';
import { getAllOrders, type Order } from '../api/orders';
import { getAllCategories, type Category } from '../api/categories';
import { Edit2, Trash2, Plus, Search, Images, Download, Ban } from 'lucide-react';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import ImageUpload from '../components/ImageUpload';
import ProductImageGallery from '../components/ProductImageGallery';
import NumberInput from '../components/NumberInput';
import { deleteImage } from '../api/upload';
import { useNotification } from '../context/NotificationContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useConfirmNavigation } from '../hooks/useConfirmNavigation';

const ITEMS_PER_PAGE = 50;

const ProductManagementPage: React.FC = () => {
  useDocumentTitle('Admin - Produits');
  const { addNotification } = useNotification();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
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
    subcategoryId: undefined
  });

  const [galleryImages, setGalleryImages] = useState<ProductImage[]>([]);

  const fetchProducts = async () => {
    try {
      const data = await getAllProducts();
      setProducts(data);
    } catch (error) {
      logger.error('Failed to fetch products', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await getAllCategories();
      setCategories(data);
    } catch (error) {
      logger.error('Failed to fetch categories', error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const initialFormDataRef = useRef<ProductFormData | null>(null);

  // isDirty et useConfirmNavigation doivent être appelés avant tout `return`
  // conditionnel (ex: `if (loading) return ...` plus bas) pour respecter les
  // Rules of Hooks et éviter "Rendered more hooks than during the previous render".
  const isDirty = initialFormDataRef.current !== null &&
    JSON.stringify(formData) !== JSON.stringify(initialFormDataRef.current);
  useConfirmNavigation(isModalOpen && isDirty);

  const handleOpenCreate = () => {
    setCurrentProduct(null);
    uploadedImagesRef.current = [];
    const initialData: ProductFormData = {
      name: '',
      description: '',
      price: 0,
      imageUrl: '',
      active: true,
      subcategoryId: undefined
    };
    setFormData(initialData);
    initialFormDataRef.current = initialData;
    setGalleryImages([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setCurrentProduct(product);
    uploadedImagesRef.current = [];
    const initialData: ProductFormData = {
      name: product.name,
      description: product.description,
      price: product.price,
      imageUrl: product.imageUrl || '',
      active: product.active,
      subcategoryId: product.subcategoryId || undefined
    };
    setFormData(initialData);
    initialFormDataRef.current = initialData;
    setGalleryImages(product.images || []);
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
        logger.error('Failed to delete image', error);
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
      logger.error('Failed to save product', error);
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
      logger.error('Failed to delete product', error);
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

  const [currentPage, setCurrentPage] = useState(1);
  const [orders, setOrders] = useState<Order[]>([]);
  const [exportingProductId, setExportingProductId] = useState<string | null>(null);

  // Fetch orders for export functionality
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await getAllOrders();
        setOrders(data);
      } catch (error) {
        logger.error('Failed to fetch orders', error);
      }
    };
    fetchOrders();
  }, []);

  // Export purchases for a specific product
  const exportProductPurchases = (product: Product) => {
    setExportingProductId(product.id);

    // Filter orders that contain this product
    const productOrders = orders.filter(order =>
      order.items.some(item => String(item.productId) === String(product.id))
    );

    if (productOrders.length === 0) {
      addNotification('info', `Aucun achat trouvé pour "${product.name}"`);
      setExportingProductId(null);
      return;
    }

    // CSV header
    const headers = [
      'ID Commande',
      'Date',
      'Client Prénom',
      'Client Nom',
      'Email',
      'Quantité',
      'Prix unitaire original',
      'Prix unitaire final',
      'Prix ligne',
      'Méthode paiement',
      'Statut paiement',
      'Statut commande'
    ];

    const rows: string[][] = [];

    productOrders.forEach(order => {
      // Only include items for this specific product
      const productItems = order.items.filter(item => String(item.productId) === String(product.id));

      productItems.forEach(item => {
        // Calculate effective price with cart discount
        const totalAfterProductDiscount = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
        const hasCartDiscount = (order.cartDiscountAmount || 0) > 0 && totalAfterProductDiscount > 0;
        const cartDiscountRatio = hasCartDiscount ? (order.cartDiscountAmount || 0) / totalAfterProductDiscount : 0;
        const effectivePrice = item.price * (1 - cartDiscountRatio);

        const row = [
          order.id.toString(),
          new Date(order.createdAt).toLocaleDateString('fr-FR') + ' ' + new Date(order.createdAt).toLocaleTimeString('fr-FR'),
          order.user?.firstName || '',
          order.user?.lastName || '',
          order.user?.email || '',
          item.quantity.toString(),
          item.originalPrice ? item.originalPrice.toFixed(2) : item.price.toFixed(2),
          effectivePrice.toFixed(2),
          (effectivePrice * item.quantity).toFixed(2),
          order.paymentMethod === 'HELLOASSO' ? 'HelloAsso' :
            order.paymentMethod === 'CASH' ? 'Espèces' :
            order.paymentMethod === 'CB' ? 'CB' :
            order.paymentMethod === 'FREE' ? 'Gratuit' :
            order.paymentMethod === 'BALANCE' ? 'Solde ADIIL' : order.paymentMethod,
          order.paymentStatus === 'PENDING' ? 'En attente' :
            order.paymentStatus === 'PAID' ? 'Payé' : 'Remboursé',
          order.orderStatus === 'PENDING' ? 'En attente' :
            order.orderStatus === 'PAID' ? 'Payée' :
            order.orderStatus === 'COLLECTED' ? 'Récupérée' : 'Annulée'
        ];

        rows.push(row);
      });
    });

    // Escape CSV values
    const escapeCSV = (value: string) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    // Build CSV content
    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n');

    // Add BOM for Excel UTF-8 compatibility
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    // Sanitize product name for filename
    const safeName = product.name.replace(/[^a-zA-Z0-9àâäéèêëïîôùûüç\s-]/gi, '').replace(/\s+/g, '_');
    link.download = `achats_${safeName}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addNotification('success', `${rows.length} achat(s) exporté(s) pour "${product.name}"`);
    setExportingProductId(null);
  };

  // Reset pagination when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  if (loading) return <div className="text-center p-8">Chargement...</div>;

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    return a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });
  });

  const totalPages = Math.ceil(sortedProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-1 h-12 bg-orange-500 rounded-full hidden sm:block" />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-[10px] font-bold rounded-full uppercase tracking-wide">Gestion</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold text-white font-koulen">PRODUITS</h1>
          </div>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-orange-500 hover:bg-orange-400 text-white font-bold py-2.5 px-5 rounded-xl transition-all flex items-center gap-2 hover:shadow-lg hover:shadow-orange-500/20"
        >
          <Plus size={18} /> Ajouter
        </button>
      </div>

      {/* Search bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-darker-bg border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:border-orange-500/50 focus:outline-none transition-colors"
          />
        </div>
        {searchQuery && (
          <p className="text-xs text-gray-500 mt-2 ml-1">
            <span className="text-orange-400 font-bold">{filteredProducts.length}</span> produit(s) trouve(s)
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedProducts.map((product) => (
          <div
            key={product.id}
            className={`bg-darker-bg rounded-2xl overflow-hidden flex flex-col relative group transition-all hover:-translate-y-1 hover:shadow-lg
              ${product.active
                ? 'border border-gray-800 hover:border-orange-500/30 hover:shadow-orange-500/5'
                : 'border border-red-500/35 hover:border-red-500/60 hover:shadow-red-500/5'
              }`}
          >
            {/* Image Section */}
            <div className="h-32 bg-dark-bg relative overflow-hidden">
              <img
                src={product.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=1E1E1E&color=fff&size=256`}
                alt={product.name}
                className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300
                  ${!product.active ? 'grayscale brightness-50' : ''}`}
              />

              {/* Unavailable overlays */}
              {!product.active && (
                <>
                  {/* Diagonal stripes pattern */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage: 'repeating-linear-gradient(135deg, rgba(239,68,68,0.10) 0px, rgba(239,68,68,0.10) 4px, transparent 4px, transparent 20px)'
                    }}
                  />
                  {/* Watermark text */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[28deg] pointer-events-none text-red-500/40 text-[11px] font-black tracking-[0.18em] uppercase border border-red-500/25 px-3 py-1 rounded whitespace-nowrap select-none">
                    Indisponible
                  </div>
                </>
              )}

              {/* Action buttons overlay */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => exportProductPurchases(product)}
                  disabled={exportingProductId === product.id}
                  className="p-2 bg-darker-bg/90 backdrop-blur text-green-400 hover:bg-green-500/20 rounded-lg transition-colors disabled:opacity-50"
                  title="Exporter les achats"
                >
                  {exportingProductId === product.id ? (
                    <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Download size={16} />
                  )}
                </button>
                <button onClick={() => handleOpenEdit(product)} className="p-2 bg-darker-bg/90 backdrop-blur text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"><Edit2 size={16} /></button>
                <button onClick={() => handleOpenDelete(product)} className="p-2 bg-darker-bg/90 backdrop-blur text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"><Trash2 size={16} /></button>
              </div>

              {/* Status badge */}
              <div className="absolute bottom-2 left-2">
                {product.active ? (
                  <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-green-500/20 text-green-400 backdrop-blur">
                    Disponible
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-red-500/30 text-red-400 backdrop-blur border border-red-500/20">
                    <Ban size={12} />
                    Indisponible
                  </span>
                )}
              </div>
            </div>

            {/* Content */}
            <div className={`p-4 flex-1 flex flex-col ${!product.active ? 'opacity-60' : ''}`}>
              <h3 className={`font-bold text-white mb-1 transition-colors ${product.active ? 'group-hover:text-orange-400' : 'group-hover:text-red-400'}`}>
                {product.name}
              </h3>
              <p className="text-xs text-gray-500 mb-3 line-clamp-2">{product.description}</p>

              <div className="mt-auto pt-3 border-t border-gray-800/50 flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {product.subcategory && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">
                      {product.subcategory.name}
                    </span>
                  )}
                  {product.images && product.images.length > 0 && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center gap-1">
                      <Images size={10} />
                      {product.images.length}
                    </span>
                  )}
                </div>
                <span className="text-lg font-koulen text-orange-400">{product.price}€</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={sortedProducts.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
      />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={currentProduct ? "Modifier le produit" : "Ajouter un produit"}
        isDirty={isDirty}
        footer={
          <div className="flex justify-end gap-3">
            <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-gray-300 hover:text-white">Annuler</button>
            <button type="submit" form="product-form" className="bg-orange-400 text-darker-bg font-bold py-2 px-6 rounded hover:bg-white transition-colors">Enregistrer</button>
          </div>
        }
      >
        <form id="product-form" onSubmit={handleSubmit} className="space-y-4">
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
              <NumberInput value={formData.price} onChange={(val) => setFormData(prev => ({ ...prev, price: parseFloat(val) || 0 }))} required className="w-full bg-dark-bg border border-gray-600 rounded p-2 text-white" />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Disponibilité</label>
              <select name="active" value={String(formData.active)} onChange={handleChange} className="w-full bg-dark-bg border border-gray-600 rounded p-2 text-white">
                <option value="true">Disponible</option>
                <option value="false">Indisponible</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Sous-categorie (optionnel)</label>
              <select
                value={formData.subcategoryId || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, subcategoryId: e.target.value ? parseInt(e.target.value) : undefined }))}
                className="w-full bg-dark-bg border border-gray-600 rounded p-2 text-white"
              >
                <option value="">-- Aucune sous-categorie --</option>
                {categories.map(category => (
                  <optgroup key={category.id} label={category.name}>
                    {category.subcategories?.map(subcategory => (
                      <option key={subcategory.id} value={subcategory.id}>
                        {subcategory.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <ImageUpload
                value={formData.imageUrl || ''}
                onChange={(url) => setFormData(prev => ({ ...prev, imageUrl: url || '' }))}
                folder="products"
                label="Image principale"
                aspectRatio="16:9"
                onCleanup={handleImageCleanup}
                accentColor="orange"
              />
            </div>

            {/* Gallery Images Section - Only for existing products */}
            {currentProduct && (
              <div className="border-t border-gray-700 pt-4 mt-4">
                <ProductImageGallery
                  productId={currentProduct.id}
                  images={galleryImages}
                  onImagesChange={setGalleryImages}
                  accentColor="orange"
                />
              </div>
            )}

            {!currentProduct && (
              <p className="text-xs text-gray-500 bg-dark-bg p-3 rounded-lg border border-gray-700">
                Enregistrez d'abord le produit pour pouvoir ajouter des images supplementaires a la galerie.
              </p>
            )}
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
          <p className="mb-6 text-lg">Êtes-vous sûr de vouloir supprimer le produit <span className="font-bold text-orange-400">{productToDelete?.name}</span> ?</p>
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