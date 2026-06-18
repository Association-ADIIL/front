import React, { useEffect, useState, useRef } from 'react';
import { logger } from '../utils/logger';
import { getAllProducts, deleteProduct, createProduct, updateProduct, type Product, type ProductFormData, type ProductVariant, type ProductImage, type VariantCategory, type VariantOption } from '../api/products';
import { getAllOrders, type Order } from '../api/orders';
import { getAllCategories, type Category } from '../api/categories';
import { Edit2, Trash2, Plus, X, Search, Images, Download } from 'lucide-react';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import ImageUpload from '../components/ImageUpload';
import ProductImageGallery from '../components/ProductImageGallery';
import NumberInput from '../components/NumberInput';
import { deleteImage } from '../api/upload';
import { useNotification } from '../context/NotificationContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

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
    variants: [],
    subcategoryId: undefined
  });

  const [newVariant, setNewVariant] = useState<Omit<ProductVariant, 'id'>>({
    name: '',
    priceModifier: 0,
    stock: undefined
  });

  const [editingVariantId, setEditingVariantId] = useState<number | null>(null);
  const [galleryImages, setGalleryImages] = useState<ProductImage[]>([]);

  // Variant categories state
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newOptionForCategory, setNewOptionForCategory] = useState<{ [categoryId: number]: { name: string; priceModifier: number } }>({});
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editingOptionId, setEditingOptionId] = useState<{ categoryId: number; optionId: number } | null>(null);

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

  const handleOpenCreate = () => {
      setCurrentProduct(null);
      uploadedImagesRef.current = [];
      const initialData: ProductFormData = {
        name: '',
        description: '',
        price: 0,
        imageUrl: '',
        active: true,
        variants: [],
        variantCategories: [],
        subcategoryId: undefined
      };
      setFormData(initialData);
      initialFormDataRef.current = initialData;
    setNewVariant({
      name: '',
      priceModifier: 0,
      stock: undefined
    });
    setEditingVariantId(null);
    setGalleryImages([]);
    setNewCategoryName('');
    setNewOptionForCategory({});
    setEditingCategoryId(null);
    setEditingOptionId(null);
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
      variants: product.variants || [],
      variantCategories: product.variantCategories || [],
      subcategoryId: product.subcategoryId || undefined
    };
    setFormData(initialData);
    initialFormDataRef.current = initialData;
    setNewVariant({
      name: '',
      priceModifier: 0,
      stock: undefined
    });
    setEditingVariantId(null);
    setGalleryImages(product.images || []);
    setNewCategoryName('');
    setNewOptionForCategory({});
    setEditingCategoryId(null);
    setEditingOptionId(null);
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

  const handleAddVariant = () => {
    if (!newVariant.name.trim()) {
      alert('Le nom de la variante est requis');
      return;
    }

    const variant: ProductVariant = {
      id: Date.now(),
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

  const handleUpdateVariant = (variantId: number, field: keyof Omit<ProductVariant, 'id'>, value: string | number | undefined) => {
    setFormData(prev => ({
      ...prev,
      variants: (prev.variants || []).map(v =>
        v.id === variantId ? { ...v, [field]: value } : v
      )
    }));
  };

  // Variant Category handlers
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      alert('Le nom de la catégorie est requis');
      return;
    }

    const newCategory: VariantCategory = {
      id: Date.now(),
      name: newCategoryName.trim(),
      options: []
    };

    setFormData(prev => ({
      ...prev,
      variantCategories: [...(prev.variantCategories || []), newCategory]
    }));
    setNewCategoryName('');
  };

  const handleRemoveCategory = (categoryId: number) => {
    setFormData(prev => ({
      ...prev,
      variantCategories: (prev.variantCategories || []).filter(c => c.id !== categoryId)
    }));
  };

  const handleUpdateCategoryName = (categoryId: number, name: string) => {
    setFormData(prev => ({
      ...prev,
      variantCategories: (prev.variantCategories || []).map(c =>
        c.id === categoryId ? { ...c, name } : c
      )
    }));
  };

  const handleAddOption = (categoryId: number) => {
    const optionData = newOptionForCategory[categoryId];
    if (!optionData?.name?.trim()) {
      alert("Le nom de l'option est requis");
      return;
    }

    const newOption: VariantOption = {
      id: Date.now(),
      name: optionData.name.trim(),
      priceModifier: optionData.priceModifier || 0
    };

    setFormData(prev => ({
      ...prev,
      variantCategories: (prev.variantCategories || []).map(c =>
        c.id === categoryId ? { ...c, options: [...c.options, newOption] } : c
      )
    }));

    // Reset the input for this category
    setNewOptionForCategory(prev => ({
      ...prev,
      [categoryId]: { name: '', priceModifier: 0 }
    }));
  };

  const handleRemoveOption = (categoryId: number, optionId: number) => {
    setFormData(prev => ({
      ...prev,
      variantCategories: (prev.variantCategories || []).map(c =>
        c.id === categoryId ? { ...c, options: c.options.filter(o => o.id !== optionId) } : c
      )
    }));
  };

  const handleUpdateOption = (categoryId: number, optionId: number, field: keyof Omit<VariantOption, 'id'>, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      variantCategories: (prev.variantCategories || []).map(c =>
        c.id === categoryId ? {
          ...c,
          options: c.options.map(o =>
            o.id === optionId ? { ...o, [field]: value } : o
          )
        } : c
      )
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
      'Options/Variantes',
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
        // Format variant/options
        let variantText = '';
        if (item.variantSelection && (item.variantSelection as any[]).length > 0) {
          variantText = (item.variantSelection as any[])
            .map((opt: any) => `${opt.categoryName}: ${opt.optionName}`)
            .join(' | ');
        } else if (item.variantId && item.product.variants) {
          const variant = item.product.variants.find(v => v.id === item.variantId);
          if (variant) {
            variantText = variant.name;
          }
        }

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
          variantText,
          item.quantity.toString(),
          item.originalPrice ? item.originalPrice.toFixed(2) : item.price.toFixed(2),
          effectivePrice.toFixed(2),
          (effectivePrice * item.quantity).toFixed(2),
          order.paymentMethod === 'HELLOASSO' ? 'HelloAsso' :
            order.paymentMethod === 'PAYPAL' ? 'PayPal' :
            order.paymentMethod === 'CASH_CB' ? 'Espèces/CB' :
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

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const isDirty = initialFormDataRef.current !== null &&
      JSON.stringify(formData) !== JSON.stringify(initialFormDataRef.current);

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
          <div key={product.id} className={`bg-darker-bg border border-gray-800 rounded-2xl overflow-hidden flex flex-col relative group hover:border-orange-500/30 hover:-translate-y-1 transition-all hover:shadow-lg hover:shadow-orange-500/5 ${!product.active ? 'opacity-60' : ''}`}>
            {/* Image Section */}
            <div className="h-32 bg-dark-bg relative overflow-hidden">
              <img
                src={product.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=1E1E1E&color=fff&size=256`}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
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
                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${product.active ? 'bg-green-500/20 text-green-400 backdrop-blur' : 'bg-red-500/20 text-red-400 backdrop-blur'}`}>
                  {product.active ? 'Disponible' : 'Indisponible'}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 flex-1 flex flex-col">
              <h3 className="font-bold text-white mb-1 group-hover:text-orange-400 transition-colors">{product.name}</h3>
              <p className="text-xs text-gray-500 mb-3 line-clamp-2">{product.description}</p>

              <div className="mt-auto pt-3 border-t border-gray-800/50 flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {product.subcategory && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">
                      {product.subcategory.name}
                    </span>
                  )}
                  {product.variantCategories && (product.variantCategories as any[]).length > 0 && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400">
                      {(product.variantCategories as any[]).length} cat.
                    </span>
                  )}
                  {product.variants && (product.variants as any[]).length > 0 && !(product.variantCategories && (product.variantCategories as any[]).length > 0) && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400">
                      {(product.variants as any[]).length} var.
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
        totalItems={filteredProducts.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
      />

      {/* Create/Edit Modal */}

      <Modal
      isOpen={isModalOpen}
      onClose={handleCloseModal}
      title={currentProduct ? "Modifier le produit" : "Ajouter un produit"}
      isDirty={isDirty}
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

            {/* Variant Categories Section (New multi-level system) */}
            <div className="border-t border-gray-700 pt-4 mt-4">
              <h3 className="text-lg font-bold text-white mb-3">Catégories de Variantes</h3>
              <p className="text-sm text-gray-400 mb-4">Créez des catégories d'options (ex: Taille ET Couleur) avec modificateurs de prix</p>

              {/* Existing categories */}
              {formData.variantCategories && formData.variantCategories.length > 0 && (
                <div className="space-y-4 mb-4">
                  {formData.variantCategories.map((category) => (
                    <div key={category.id} className="bg-dark-bg p-4 rounded-lg border border-gray-700">
                      {/* Category header */}
                      <div className="flex items-center justify-between mb-3">
                        {editingCategoryId === category.id ? (
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              type="text"
                              value={category.name}
                              onChange={(e) => handleUpdateCategoryName(category.id, e.target.value)}
                              className="flex-1 bg-darker-bg border border-gray-600 rounded px-3 py-1.5 text-white"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => setEditingCategoryId(null)}
                              className="text-orange-400 hover:text-white text-sm font-medium"
                            >
                              OK
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-orange-400">{category.name}</span>
                            <span className="text-xs text-gray-500">({category.options.length} options)</span>
                            <button
                              type="button"
                              onClick={() => setEditingCategoryId(category.id)}
                              className="text-blue-400 hover:text-blue-300 ml-2"
                            >
                              <Edit2 size={14} />
                            </button>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveCategory(category.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X size={18} />
                        </button>
                      </div>

                      {/* Options list */}
                      {category.options.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {category.options.map((option) => {
                            const isEditing = editingOptionId?.categoryId === category.id && editingOptionId?.optionId === option.id;
                            const finalPrice = formData.price + option.priceModifier;
                            return (
                              <div key={option.id} className="bg-darker-bg p-2 rounded border border-gray-700 flex items-center justify-between">
                                {isEditing ? (
                                  <div className="flex-1 grid grid-cols-2 gap-2">
                                    <input
                                      type="text"
                                      value={option.name}
                                      onChange={(e) => handleUpdateOption(category.id, option.id, 'name', e.target.value)}
                                      className="bg-dark-bg border border-gray-600 rounded px-2 py-1 text-white text-sm"
                                    />
                                    <NumberInput
                                      value={option.priceModifier}
                                      onChange={(val) => handleUpdateOption(category.id, option.id, 'priceModifier', parseFloat(val) || 0)}
                                      className="bg-dark-bg border border-gray-600 rounded px-2 py-1 text-white text-sm"
                                    />
                                  </div>
                                ) : (
                                  <div className="flex-1">
                                    <span className="text-white">{option.name}</span>
                                    <span className="text-gray-400 text-sm ml-2">
                                      {option.priceModifier !== 0 && `(${option.priceModifier > 0 ? '+' : ''}${option.priceModifier.toFixed(2)} €)`}
                                      <span className="text-gray-500 ml-1">→ {finalPrice.toFixed(2)} €</span>
                                    </span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1 ml-2">
                                  <button
                                    type="button"
                                    onClick={() => setEditingOptionId(isEditing ? null : { categoryId: category.id, optionId: option.id })}
                                    className="text-blue-400 hover:text-blue-300 p-1"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveOption(category.id, option.id)}
                                    className="text-red-400 hover:text-red-300 p-1"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Add new option to category */}
                      <div className="flex gap-2 items-end">
                        <div className="flex-1">
                          <label className="block text-xs text-gray-400 mb-1">Nouvelle option</label>
                          <input
                            type="text"
                            value={newOptionForCategory[category.id]?.name || ''}
                            onChange={(e) => setNewOptionForCategory(prev => ({
                              ...prev,
                              [category.id]: { ...prev[category.id], name: e.target.value }
                            }))}
                            placeholder="Ex: S, M, L ou Rouge, Bleu"
                            className="w-full bg-darker-bg border border-gray-600 rounded px-3 py-1.5 text-white text-sm"
                          />
                        </div>
                        <div className="w-28">
                          <label className="block text-xs text-gray-400 mb-1">Prix +/-</label>
                          <NumberInput
                            value={newOptionForCategory[category.id]?.priceModifier || 0}
                            onChange={(val) => setNewOptionForCategory(prev => ({
                              ...prev,
                              [category.id]: { ...prev[category.id], priceModifier: parseFloat(val) || 0 }
                            }))}
                            className="w-full bg-darker-bg border border-gray-600 rounded px-3 py-1.5 text-white text-sm"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddOption(category.id)}
                          className="px-3 py-1.5 bg-orange-400 text-darker-bg font-bold rounded hover:bg-white transition-colors text-sm"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new category */}
              <div className="bg-darker-bg p-4 rounded border border-gray-700">
                <p className="text-sm font-bold text-white mb-3">Ajouter une catégorie</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Ex: Taille, Couleur, Format"
                    className="flex-1 bg-dark-bg border border-gray-600 rounded p-2 text-white text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="bg-orange-400 text-darker-bg font-bold py-2 px-4 rounded hover:bg-white transition-colors text-sm flex items-center gap-1"
                  >
                    <Plus size={16} /> Ajouter
                  </button>
                </div>
              </div>
            </div>

            {/* Product Variants Section (Legacy) */}
            <div className="border-t border-gray-700 pt-4 mt-4">
              <h3 className="text-lg font-bold text-white mb-3">Variantes Simples (ancien système)</h3>
              <p className="text-sm text-gray-400 mb-4">Pour une seule dimension de variantes (ex: tailles S, M, L, XL uniquement)</p>

              {/* Existing variants */}
              {formData.variants && formData.variants.length > 0 && (
                <div className="space-y-2 mb-4">
                  {formData.variants.map((variant) => {
                    const finalPrice = formData.price + variant.priceModifier;
                    const isEditing = editingVariantId === variant.id;
                    return (
                      <div key={variant.id} className="bg-dark-bg p-3 rounded border border-gray-700">
                        {isEditing ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">Nom</label>
                                <input
                                  type="text"
                                  value={variant.name}
                                  onChange={(e) => handleUpdateVariant(variant.id, 'name', e.target.value)}
                                  className="w-full bg-darker-bg border border-gray-600 rounded p-2 text-white text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">Modificateur (€)</label>
                                <NumberInput
                                  value={variant.priceModifier}
                                  onChange={(val) => handleUpdateVariant(variant.id, 'priceModifier', parseFloat(val) || 0)}
                                  className="w-full bg-darker-bg border border-gray-600 rounded p-2 text-white text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">Stock</label>
                                <NumberInput
                                  value={variant.stock ?? ''}
                                  onChange={(val) => handleUpdateVariant(variant.id, 'stock', val ? parseInt(val) : undefined)}
                                  allowDecimals={false}
                                  placeholder="Illimite"
                                  className="w-full bg-darker-bg border border-gray-600 rounded p-2 text-white text-sm"
                                />
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-400">
                                Prix final: {finalPrice.toFixed(2)} €
                              </span>
                              <button
                                type="button"
                                onClick={() => setEditingVariantId(null)}
                                className="text-orange-400 hover:text-white text-sm font-medium"
                              >
                                Terminer
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex-grow">
                              <p className="text-white font-medium">{variant.name}</p>
                              <p className="text-xs text-gray-400">
                                Prix: {finalPrice.toFixed(2)} €
                                {variant.priceModifier !== 0 && ` (${variant.priceModifier > 0 ? '+' : ''}${variant.priceModifier.toFixed(2)} €)`}
                                {variant.stock !== undefined && ` • Stock: ${variant.stock}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingVariantId(variant.id)}
                                className="text-blue-400 hover:text-blue-300"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveVariant(variant.id)}
                                className="text-red-400 hover:text-red-300"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          </div>
                        )}
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
                    <NumberInput
                      value={newVariant.priceModifier}
                      onChange={(val) => setNewVariant(prev => ({ ...prev, priceModifier: parseFloat(val) || 0 }))}
                      placeholder="0.00"
                      className="w-full bg-dark-bg border border-gray-600 rounded p-2 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Stock (optionnel)
                      <span className="text-[10px] block text-gray-500">Laissez vide si illimite</span>
                    </label>
                    <NumberInput
                      value={newVariant.stock || ''}
                      onChange={(val) => setNewVariant(prev => ({ ...prev, stock: val ? parseInt(val) : undefined }))}
                      allowDecimals={false}
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
                  className="mt-3 bg-orange-400 text-darker-bg font-bold py-2 px-4 rounded hover:bg-white transition-colors text-sm"
                >
                  Ajouter cette variante
                </button>
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-4">
              <button type="button" onClick={handleCloseModal} className="mr-4 px-4 py-2 text-gray-300 hover:text-white">Annuler</button>
              <button type="submit" className="bg-orange-400 text-darker-bg font-bold py-2 px-6 rounded hover:bg-white transition-colors">Enregistrer</button>
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