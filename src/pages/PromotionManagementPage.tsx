import React, { useEffect, useState, useRef } from 'react';
import { logger } from '../utils/logger';
import {
  getAllPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
  getPromotionStats,
  createProductPromotion,
  updateProductPromotion,
  getPromotionWithProducts,
  type Promotion,
  type PromotionType,
  type PromotionStats,
  type BalanceRechargeTier,
  type DiscountTier,
} from '../api/promotions';
import { getAllProducts, getAllSubcategories, type Product } from '../api/products';
import {
  Plus,
  Edit2,
  Trash2,
  Tag,
  Calendar,
  ToggleLeft,
  ToggleRight,
  BarChart3,
  X,
  Gift,

  Search,
  Check,
} from 'lucide-react';
import Modal from '../components/Modal';
import ImageUpload from '../components/ImageUpload';
import { deleteImage } from '../api/upload';
import { useNotification } from '../context/NotificationContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useConfirmNavigation } from '../hooks/useConfirmNavigation';

const PROMOTION_TYPES: { value: PromotionType; label: string; description: string }[] = [
  { value: 'BALANCE_RECHARGE_BONUS', label: 'Bonus recharge', description: 'Bonus sur les recharges de solde' },
  { value: 'PERCENTAGE_DISCOUNT', label: 'Réduction %', description: 'Réduction en pourcentage sur commandes' },
  { value: 'FIXED_DISCOUNT', label: 'Réduction fixe', description: 'Réduction fixe sur commandes' },
  { value: 'PRODUCT_DISCOUNT', label: 'Promo produit', description: 'Réduction sur des produits spécifiques' },
  { value: 'BUNDLE_DISCOUNT', label: 'Bundle', description: 'Réduction sur un panier groupé de produits' },
];

interface BundleGroup {
  label: string;
  productIds: number[];
  subcategoryId: string;
  quantity: number;
}

interface PromotionFormData {
  name: string;
  description: string;
  type: PromotionType;
  displayTitle: string;
  displayMessage: string;
  imageUrl?: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
  maxUsage: string;
  maxUsagePerUser: string;
  tiers: BalanceRechargeTier[];
  firstRechargeOnly: boolean;
  discountTiers: DiscountTier[];
  firstOrderOnly: boolean;
  discountPercent: string;
  selectedProductIds: number[];
  bundleGroups: BundleGroup[];
  bundleDiscountType: 'fixed' | 'percentage';
  bundleDiscountValue: string;
}

const defaultFormData: PromotionFormData = {
  name: '',
  description: '',
  type: 'BALANCE_RECHARGE_BONUS',
  displayTitle: '',
  displayMessage: '',
  imageUrl: '',
  isActive: true,
  startDate: '',
  endDate: '',
  maxUsage: '',
  maxUsagePerUser: '',
  tiers: [{ minAmount: 10, maxAmount: 20, bonusPercent: 10 }],
  firstRechargeOnly: true,
  discountTiers: [{ minOrderAmount: 10, maxOrderAmount: null, discountValue: 10 }],
  firstOrderOnly: false,
  discountPercent: '10',
  selectedProductIds: [],
  bundleGroups: [{ label: 'Groupe 1', productIds: [], subcategoryId: '', quantity: 1 }],
  bundleDiscountType: 'fixed',
  bundleDiscountValue: '0.50',
};

const PromotionManagementPage: React.FC = () => {
  useDocumentTitle('Admin - Promotions');
  const { addNotification } = useNotification();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  const uploadedImagesRef = useRef<string[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPromotion, setCurrentPromotion] = useState<Promotion | null>(null);
  const [formData, setFormData] = useState<PromotionFormData>(defaultFormData);
  const initialFormDataRef = useRef<PromotionFormData | null>(null);

  // isDirty et useConfirmNavigation doivent être appelés avant tout `return`
  // conditionnel (ex: `if (loading) return ...` plus bas) pour respecter les
  // Rules of Hooks et éviter "Rendered more hooks than during the previous render".
  const isDirty = initialFormDataRef.current !== null &&
    JSON.stringify(formData) !== JSON.stringify(initialFormDataRef.current);
  useConfirmNavigation(isModalOpen && isDirty);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [promotionToDelete, setPromotionToDelete] = useState<Promotion | null>(null);

  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [statsPromotion, setStatsPromotion] = useState<Promotion | null>(null);
  const [stats, setStats] = useState<PromotionStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [subcategories, setSubcategories] = useState<{ id: number; name: string }[]>([]);

  const fetchPromotions = async () => {
    try {
      const data = await getAllPromotions();
      setPromotions(data);
    } catch (error) {
      logger.error('Failed to fetch promotions', error);
      addNotification('error', 'Erreur lors du chargement des promotions.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProductsAndSubcategories = async () => {
    try {
      const data = await getAllProducts();
      setProducts(data.filter(p => p.active));
    } catch (error) {
      logger.error('Failed to fetch products', error);
    }

    try {
      const data = await getAllSubcategories();
      setSubcategories(data);
    } catch (error) {
      logger.error('Failed to fetch subcategories', error);
    }
  };

  useEffect(() => {
    fetchPromotions();
    fetchProductsAndSubcategories();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleImageCleanup = (imageUrl: string) => {
    uploadedImagesRef.current.push(imageUrl);
  };

  const handleCloseModal = async () => {
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

  const handleOpenCreate = () => {
    uploadedImagesRef.current = [];
    setCurrentPromotion(null);
    setFormData(defaultFormData);
    initialFormDataRef.current = defaultFormData;
    setProductSearch('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (promotion: Promotion) => {
    uploadedImagesRef.current = [];
    setCurrentPromotion(promotion);
    const rules = promotion.rules as any;

    let selectedProductIds: number[] = [];

    if (promotion.type === 'PRODUCT_DISCOUNT') {
      try {
        const promoWithProducts = await getPromotionWithProducts(promotion.id);
        selectedProductIds = promoWithProducts.productPromotions?.map((pp: any) => pp.productId) || [];
      } catch (error) {
        logger.error('Failed to fetch promotion products', error);
      }
    }

    const editFormData: PromotionFormData = {
      name: promotion.name,
      description: promotion.description || '',
      type: promotion.type,
      displayTitle: promotion.displayTitle,
      displayMessage: promotion.displayMessage,
      imageUrl: (promotion as any).imageUrl || '',
      isActive: promotion.isActive,
      startDate: promotion.startDate ? promotion.startDate.split('T')[0] : '',
      endDate: promotion.endDate ? promotion.endDate.split('T')[0] : '',
      maxUsage: promotion.maxUsage?.toString() || '',
      maxUsagePerUser: rules?.maxUsagePerUser?.toString() || '',
      tiers: rules?.tiers || [{ minAmount: 10, maxAmount: 20, bonusPercent: 10 }],
      firstRechargeOnly: rules?.firstRechargeOnly ?? true,
      discountTiers: rules?.tiers || [{ minOrderAmount: 10, maxOrderAmount: null, discountValue: 10 }],
      firstOrderOnly: rules?.firstOrderOnly ?? false,
      discountPercent: rules?.discountPercent?.toString() || '10',
      selectedProductIds,
      bundleGroups: rules?.groups?.map((g: any) => ({
        label: g.label,
        productIds: g.productIds || [],
        subcategoryId: g.subcategoryId?.toString() || '',
        quantity: g.quantity,
      })) || [{ label: 'Groupe 1', productIds: [], subcategoryId: '', quantity: 1 }],
      bundleDiscountType: rules?.discountType || 'fixed',
      bundleDiscountValue: rules?.discountValue?.toString() || '0.50',
    };

    setFormData(editFormData);
    initialFormDataRef.current = editFormData;
    setProductSearch('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (formData.type === 'PRODUCT_DISCOUNT') {
        if (formData.selectedProductIds.length === 0) {
          addNotification('error', 'Veuillez sélectionner au moins un produit.');
          return;
        }

        const productPayload = {
          name: formData.name,
          description: formData.description || undefined,
          displayTitle: formData.displayTitle,
          displayMessage: formData.displayMessage,
          discountPercent: parseFloat(formData.discountPercent) || 10,
          productIds: formData.selectedProductIds,
          isActive: formData.isActive,
          startDate: formData.startDate || undefined,
          endDate: formData.endDate || undefined,
          maxUsage: formData.maxUsage ? parseInt(formData.maxUsage) : undefined,
        };

        if (currentPromotion) {
          await updateProductPromotion(currentPromotion.id, productPayload);
          addNotification('success', 'Promotion modifiée avec succès !');
        } else {
          await createProductPromotion(productPayload);
          addNotification('success', 'Promotion créée avec succès !');
        }
      } else {
        const maxUsagePerUser = formData.maxUsagePerUser ? parseInt(formData.maxUsagePerUser) : undefined;
        let rules: any = {};

        if (formData.type === 'BUNDLE_DISCOUNT') {
          rules = {
            groups: formData.bundleGroups.map((g) => ({
              label: g.label,
              ...(g.subcategoryId ? { subcategoryId: parseInt(g.subcategoryId) } : {}),
              ...(g.productIds.length > 0 ? { productIds: g.productIds } : {}),
              quantity: g.quantity,
            })),
            discountType: formData.bundleDiscountType,
            discountValue: parseFloat(formData.bundleDiscountValue) || 0,
          };
        } else if (formData.type === 'BALANCE_RECHARGE_BONUS') {
          rules = {
            tiers: formData.tiers,
            firstRechargeOnly: maxUsagePerUser ? false : formData.firstRechargeOnly,
            maxUsagePerUser,
          };
        } else if (formData.type === 'PERCENTAGE_DISCOUNT' || formData.type === 'FIXED_DISCOUNT') {
          rules = {
            tiers: formData.discountTiers,
            firstOrderOnly: maxUsagePerUser ? false : formData.firstOrderOnly,
            maxUsagePerUser,
          };
        }

        const payload = {
          name: formData.name,
          description: formData.description || undefined,
          type: formData.type,
          displayTitle: formData.displayTitle,
          displayMessage: formData.displayMessage,
          imageUrl: formData.imageUrl || undefined,
          rules,
          isActive: formData.isActive,
          startDate: formData.startDate || undefined,
          endDate: formData.endDate || undefined,
          maxUsage: formData.maxUsage ? parseInt(formData.maxUsage) : undefined,
        };

        if (currentPromotion) {
          await updatePromotion(currentPromotion.id, payload);
          addNotification('success', 'Promotion modifiée avec succès !');
        } else {
          await createPromotion(payload);
          addNotification('success', 'Promotion créée avec succès !');
        }
      }

      uploadedImagesRef.current = [];
      setIsModalOpen(false);
      fetchPromotions();
    } catch (error) {
      logger.error('Failed to save promotion', error);
      addNotification('error', (error as any).message || "Erreur lors de l'enregistrement.");
    }
  };

  const handleDelete = async () => {
    if (!promotionToDelete) return;

    try {
      await deletePromotion(promotionToDelete.id);
      addNotification('success', 'Promotion supprimée avec succès !');
      setIsDeleteModalOpen(false);
      setPromotionToDelete(null);
      fetchPromotions();
    } catch (error) {
      logger.error('Failed to delete promotion', error);
      addNotification('error', (error as any).message || 'Erreur lors de la suppression.');
    }
  };

  const handleToggleActive = async (promotion: Promotion) => {
    try {
      await updatePromotion(promotion.id, { isActive: !promotion.isActive });
      addNotification('success', `Promotion ${!promotion.isActive ? 'activée' : 'désactivée'} !`);
      fetchPromotions();
    } catch (error) {
      addNotification('error', (error as any).message || 'Erreur lors de la mise à jour.');
    }
  };

  const handleOpenStats = async (promotion: Promotion) => {
    setStatsPromotion(promotion);
    setIsStatsModalOpen(true);
    setLoadingStats(true);

    try {
      const data = await getPromotionStats(promotion.id);
      setStats(data);
    } catch (error) {
      logger.error('Failed to fetch stats', error);
      addNotification('error', 'Erreur lors du chargement des statistiques.');
    } finally {
      setLoadingStats(false);
    }
  };

  const addTier = () => {
    const lastTier = formData.tiers[formData.tiers.length - 1];
    setFormData({
      ...formData,
      tiers: [
        ...formData.tiers,
        {
          minAmount: lastTier?.maxAmount || 0,
          maxAmount: null,
          bonusPercent: (lastTier?.bonusPercent || 0) + 5,
        },
      ],
    });
  };

  const removeTier = (index: number) => {
    setFormData({
      ...formData,
      tiers: formData.tiers.filter((_, i) => i !== index),
    });
  };

  const updateTier = (index: number, field: keyof BalanceRechargeTier, value: number | null) => {
    const newTiers = [...formData.tiers];
    newTiers[index] = { ...newTiers[index], [field]: value } as any;
    setFormData({ ...formData, tiers: newTiers });
  };

  const addDiscountTier = () => {
    const lastTier = formData.discountTiers[formData.discountTiers.length - 1];
    setFormData({
      ...formData,
      discountTiers: [
        ...formData.discountTiers,
        {
          minOrderAmount: lastTier?.maxOrderAmount || 0,
          maxOrderAmount: null,
          discountValue: formData.type === 'FIXED_DISCOUNT' ? 5 : (lastTier?.discountValue || 0) + 5,
        },
      ],
    });
  };

  const removeDiscountTier = (index: number) => {
    setFormData({
      ...formData,
      discountTiers: formData.discountTiers.filter((_, i) => i !== index),
    });
  };

  const updateDiscountTier = (index: number, field: keyof DiscountTier, value: number | null) => {
    const newTiers = [...formData.discountTiers];
    newTiers[index] = { ...newTiers[index], [field]: value } as any;
    setFormData({ ...formData, discountTiers: newTiers });
  };

  const getTypeLabel = (type: PromotionType) => {
    return PROMOTION_TYPES.find((t) => t.value === type)?.label || type;
  };

  const toggleProductSelection = (productId: number) => {
    setFormData((prev) => ({
      ...prev,
      selectedProductIds: prev.selectedProductIds.includes(productId)
        ? prev.selectedProductIds.filter((id) => id !== productId)
        : [...prev.selectedProductIds, productId],
    }));
  };

  const selectAllProducts = () => {
    const matched = products.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()));
    setFormData((prev) => ({
      ...prev,
      selectedProductIds: [...new Set([...prev.selectedProductIds, ...matched.map((p) => parseInt(p.id))])],
    }));
  };

  const deselectAllProducts = () => {
    setFormData((prev) => ({ ...prev, selectedProductIds: [] }));
  };

  const filteredProducts = products.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()));

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-2 border-rose-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-1 h-12 bg-rose-500 rounded-full hidden sm:block" />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 text-[10px] font-bold rounded-full uppercase tracking-wide">Gestion</span>
              <span className="text-xs text-gray-500">{promotions.length} promotion(s)</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-koulen text-white">PROMOTIONS</h1>
          </div>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-rose-500 hover:bg-rose-400 text-white font-bold py-2.5 px-5 rounded-xl transition-all flex items-center gap-2 hover:shadow-lg hover:shadow-rose-500/20"
        >
          <Plus size={18} />
          Nouvelle
        </button>
      </div>

      {promotions.length === 0 ? (
        <div className="bg-darker-bg rounded-xl border border-gray-800 p-8 text-center">
          <Gift size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">Aucune promotion pour le moment</p>
          <button onClick={handleOpenCreate} className="mt-4 text-rose-400 hover:underline">
            Créer une promotion
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {promotions.map((promotion) => (
            <div
              key={promotion.id}
              className={`bg-darker-bg rounded-xl border ${promotion.isActive ? 'border-rose-400/30' : 'border-gray-800'} p-5`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-0.5 text-xs font-bold rounded ${promotion.isActive ? 'bg-rose-400/20 text-rose-400' : 'bg-gray-700 text-gray-400'}`}>
                      {promotion.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs font-bold rounded">
                      {getTypeLabel(promotion.type)}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1">{promotion.name}</h3>
                  <p className="text-rose-400 font-medium mb-1">{promotion.displayTitle}</p>
                  <p className="text-gray-400 text-sm">{promotion.displayMessage}</p>

                  <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Tag size={12} />
                      {promotion.usageCount} utilisation(s)
                    </span>
                    {promotion.maxUsage && <span>Max: {promotion.maxUsage}</span>}
                    {promotion.startDate && (
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        Début: {new Date(promotion.startDate).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                    {promotion.endDate && <span>Fin: {new Date(promotion.endDate).toLocaleDateString('fr-FR')}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => handleToggleActive(promotion)} className="p-2 hover:bg-dark-bg rounded-lg transition-colors">
                    {promotion.isActive ? <ToggleRight size={20} className="text-rose-400" /> : <ToggleLeft size={20} className="text-gray-500" />}
                  </button>
                  <button onClick={() => handleOpenStats(promotion)} className="p-2 hover:bg-dark-bg rounded-lg transition-colors text-gray-400 hover:text-white">
                    <BarChart3 size={18} />
                  </button>
                  <button onClick={() => handleOpenEdit(promotion)} className="p-2 hover:bg-dark-bg rounded-lg transition-colors text-gray-400 hover:text-white">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => { setPromotionToDelete(promotion); setIsDeleteModalOpen(true); }} className="p-2 hover:bg-dark-bg rounded-lg transition-colors text-gray-400 hover:text-red-400">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={currentPromotion ? 'Modifier la promotion' : 'Nouvelle promotion'}
        footer={
          <div className="flex gap-3">
            <button type="button" onClick={handleCloseModal} className="flex-1 py-2.5 bg-dark-bg border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800">Annuler</button>
            <button type="submit" form="promotion-form" className="flex-1 py-2.5 bg-rose-400 text-dark-bg font-bold rounded-lg hover:bg-rose-400/90">
              {currentPromotion ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        }
      >
        <form id="promotion-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1">Nom interne *</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 bg-dark-bg border border-gray-700 rounded-lg text-white focus:border-rose-400 focus:outline-none" required />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Type *</label>
              <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as PromotionType })} className="w-full px-3 py-2 bg-dark-bg border border-gray-700 rounded-lg text-white focus:border-rose-400 focus:outline-none">
                {PROMOTION_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-1">Description interne</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} className="w-full px-3 py-2 bg-dark-bg border border-gray-700 rounded-lg text-white focus:border-rose-400 focus:outline-none" />
          </div>

          <div className="border-t border-gray-700 pt-4">
            <h3 className="text-white font-bold mb-3">Affichage</h3>

            {formData.type === 'BUNDLE_DISCOUNT' && (
              <div className="mb-4">
                <ImageUpload
                  value={formData.imageUrl || ''}
                  onChange={(url) => setFormData(prev => ({ ...prev, imageUrl: url || '' }))}
                  folder="promotions"
                  label="Image du Bundle (Optionnelle)"
                  aspectRatio="16:9"
                  onCleanup={handleImageCleanup}
                  accentColor="rose"
                />
              </div>
            )}

            <div>
              <label className="block text-gray-400 text-sm mb-1">Titre affiché *</label>
              <input type="text" value={formData.displayTitle} onChange={(e) => setFormData({ ...formData, displayTitle: e.target.value })} placeholder="ex: Bonus Premier Versement !" className="w-full px-3 py-2 bg-dark-bg border border-gray-700 rounded-lg text-white focus:border-rose-400 focus:outline-none" required />
            </div>
            <div className="mt-3">
              <label className="block text-gray-400 text-sm mb-1">Message affiché *</label>
              <textarea value={formData.displayMessage} onChange={(e) => setFormData({ ...formData, displayMessage: e.target.value })} placeholder="ex: +10% offerts !" rows={2} className="w-full px-3 py-2 bg-dark-bg border border-gray-700 rounded-lg text-white focus:border-rose-400 focus:outline-none" required />
            </div>
          </div>

          {formData.type === 'BALANCE_RECHARGE_BONUS' && (
            <div className="border-t border-gray-700 pt-4">
              <h3 className="text-white font-bold mb-3">Règles du bonus</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <label className={`flex items-center gap-2 cursor-pointer ${formData.maxUsagePerUser ? 'opacity-50' : ''}`}>
                  <input type="checkbox" checked={formData.firstRechargeOnly} onChange={(e) => setFormData({ ...formData, firstRechargeOnly: e.target.checked })} disabled={!!formData.maxUsagePerUser} className="w-4 h-4 rounded border-gray-600 bg-dark-bg text-rose-400 focus:ring-rose-400" />
                  <span className="text-gray-300 text-sm">Premier versement uniquement</span>
                </label>
                <div>
                  <label className="block text-gray-500 text-xs mb-1">Max par utilisateur (0 = illimité)</label>
                  <input type="number" value={formData.maxUsagePerUser} onChange={(e) => setFormData({ ...formData, maxUsagePerUser: e.target.value })} min="0" className="w-full px-2 py-1.5 bg-dark-bg border border-gray-700 rounded text-white text-sm" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Paliers de bonus</span>
                  <button type="button" onClick={addTier} className="text-rose-400 text-sm hover:underline">+ Ajouter un palier</button>
                </div>
                {formData.tiers.map((tier, index) => (
                  <div key={index} className="bg-dark-bg rounded-lg p-3 flex items-center gap-3">
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <input type="number" value={tier.minAmount} onChange={(e) => updateTier(index, 'minAmount', parseFloat(e.target.value) || 0)} className="px-2 py-1.5 bg-darker-bg border border-gray-700 rounded text-white text-sm" />
                      <input type="number" value={tier.maxAmount ?? ''} onChange={(e) => updateTier(index, 'maxAmount', e.target.value ? parseFloat(e.target.value) : null)} placeholder="Illimité" className="px-2 py-1.5 bg-darker-bg border border-gray-700 rounded text-white text-sm" />
                      <input type="number" value={tier.bonusPercent} onChange={(e) => updateTier(index, 'bonusPercent', parseFloat(e.target.value) || 0)} className="px-2 py-1.5 bg-darker-bg border border-gray-700 rounded text-white text-sm" />
                    </div>
                    {formData.tiers.length > 1 && <button type="button" onClick={() => removeTier(index)} className="text-red-400"><X size={16} /></button>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(formData.type === 'PERCENTAGE_DISCOUNT' || formData.type === 'FIXED_DISCOUNT') && (
            <div className="border-t border-gray-700 pt-4">
              <h3 className="text-white font-bold mb-3">Règles de la réduction</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.firstOrderOnly} onChange={(e) => setFormData({ ...formData, firstOrderOnly: e.target.checked })} disabled={!!formData.maxUsagePerUser} className="w-4 h-4 rounded border-gray-600 bg-dark-bg text-rose-400" />
                  <span className="text-gray-300 text-sm">Première commande uniquement</span>
                </label>
                <input type="number" value={formData.maxUsagePerUser} onChange={(e) => setFormData({ ...formData, maxUsagePerUser: e.target.value })} placeholder="0" min="0" className="w-full px-2 py-1.5 bg-dark-bg border border-gray-700 rounded text-white text-sm" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Paliers de réduction</span>
                  <button type="button" onClick={addDiscountTier} className="text-rose-400 text-sm hover:underline">+ Ajouter un palier</button>
                </div>
                {formData.discountTiers.map((tier, index) => (
                  <div key={index} className="bg-dark-bg rounded-lg p-3 flex items-center gap-3">
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <input type="number" value={tier.minOrderAmount} onChange={(e) => updateDiscountTier(index, 'minOrderAmount', parseFloat(e.target.value) || 0)} className="px-2 py-1.5 bg-darker-bg border border-gray-700 rounded text-white text-sm" />
                      <input type="number" value={tier.maxOrderAmount ?? ''} onChange={(e) => updateDiscountTier(index, 'maxOrderAmount', e.target.value ? parseFloat(e.target.value) : null)} placeholder="Illimité" className="px-2 py-1.5 bg-darker-bg border border-gray-700 rounded text-white text-sm" />
                      <input type="number" value={tier.discountValue} onChange={(e) => updateDiscountTier(index, 'discountValue', parseFloat(e.target.value) || 0)} className="px-2 py-1.5 bg-darker-bg border border-gray-700 rounded text-white text-sm" />
                    </div>
                    {formData.discountTiers.length > 1 && <button type="button" onClick={() => removeDiscountTier(index)} className="text-red-400"><X size={16} /></button>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {formData.type === 'PRODUCT_DISCOUNT' && (
            <div className="border-t border-gray-700 pt-4">
              <h3 className="text-white font-bold mb-3">Règles de la promotion produit</h3>
              <div className="mb-4">
                <label className="block text-gray-400 text-sm mb-1">Réduction (%)</label>
                <input type="number" value={formData.discountPercent} onChange={(e) => setFormData({ ...formData, discountPercent: e.target.value })} min="1" max="100" className="w-32 px-3 py-2 bg-dark-bg border border-gray-700 rounded-lg text-white" />
              </div>
              <div className="relative mb-3">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="text" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Rechercher un produit..." className="w-full pl-9 pr-3 py-2 bg-dark-bg border border-gray-700 rounded-lg text-white text-sm" />
              </div>
              <div className="flex gap-3 mb-3 text-xs">
                <button type="button" onClick={selectAllProducts} className="text-rose-400 hover:underline">Tout sélectionner</button>
                <button type="button" onClick={deselectAllProducts} className="text-gray-400 hover:underline">Tout désélectionner</button>
              </div>
              <div className="max-h-60 overflow-y-auto bg-dark-bg rounded-lg border border-gray-700 divide-y divide-gray-800">
                {filteredProducts.map((product) => {
                  const isSelected = formData.selectedProductIds.includes(parseInt(product.id));
                  return (
                    <div key={product.id} onClick={() => toggleProductSelection(parseInt(product.id))} className={`flex items-center gap-3 p-3 cursor-pointer ${isSelected ? 'bg-rose-400/10' : ''}`}>
                      <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-rose-400 border-rose-400' : 'border-gray-600'}`}>
                        {isSelected && <Check size={14} className="text-dark-bg" />}
                      </div>
                      <span className="flex-1 text-sm text-white truncate">{product.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {formData.type === 'BUNDLE_DISCOUNT' && (
            <div className="border-t border-gray-700 pt-4">
              <h3 className="text-white font-bold mb-1">Règles du bundle</h3>
              <div className="grid grid-cols-2 gap-4 mb-5">
                <select value={formData.bundleDiscountType} onChange={(e) => setFormData({ ...formData, bundleDiscountType: e.target.value as 'fixed' | 'percentage' })} className="px-3 py-2 bg-dark-bg border border-gray-700 rounded-lg text-white">
                  <option value="fixed">Montant fixe (€)</option>
                  <option value="percentage">Pourcentage (%)</option>
                </select>
                <input type="number" value={formData.bundleDiscountValue} onChange={(e) => setFormData({ ...formData, bundleDiscountValue: e.target.value })} min="0" step="0.01" className="px-3 py-2 bg-dark-bg border border-gray-700 rounded-lg text-white" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Groupes du bundle</span>
                  <button type="button" onClick={() => setFormData({ ...formData, bundleGroups: [...formData.bundleGroups, { label: `Groupe ${formData.bundleGroups.length + 1}`, productIds: [], subcategoryId: '', quantity: 1 }] })} className="text-rose-400 text-sm hover:underline">+ Ajouter un groupe</button>
                </div>
                {formData.bundleGroups.map((group, index) => (
                  <div key={index} className="bg-dark-bg rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm font-medium">Groupe {index + 1}</span>
                      {formData.bundleGroups.length > 1 && <button type="button" onClick={() => setFormData({ ...formData, bundleGroups: formData.bundleGroups.filter((_, i) => i !== index) })} className="text-red-400"><X size={15} /></button>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" value={group.label} onChange={(e) => { const updated = [...formData.bundleGroups]; updated[index].label = e.target.value; setFormData({ ...formData, bundleGroups: updated }); }} className="px-2 py-1.5 bg-darker-bg border border-gray-700 rounded text-white text-sm" />
                      <input type="number" value={group.quantity} min="1" onChange={(e) => { const updated = [...formData.bundleGroups]; updated[index].quantity = parseInt(e.target.value) || 1; setFormData({ ...formData, bundleGroups: updated }); }} className="px-2 py-1.5 bg-darker-bg border border-gray-700 rounded text-white text-sm" />
                    </div>
                    <select value={group.subcategoryId} onChange={(e) => { const updated = [...formData.bundleGroups]; updated[index].subcategoryId = e.target.value; updated[index].productIds = []; setFormData({ ...formData, bundleGroups: updated }); }} className="w-full px-2 py-1.5 bg-darker-bg border border-gray-700 rounded text-white text-sm">
                      <option value="">— Choisir par produits individuels —</option>
                      {subcategories?.map((sub) => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
                    </select>

                    {!group.subcategoryId && (
                      <div className="max-h-40 overflow-y-auto bg-darker-bg rounded border border-gray-700 divide-y divide-gray-800">
                        {filteredProducts.map((p) => {
                          const isSelected = group.productIds.includes(parseInt(p.id));
                          return (
                            <div key={p.id} onClick={() => { const updated = [...formData.bundleGroups]; const ids = updated[index].productIds; updated[index].productIds = isSelected ? ids.filter(id => id !== parseInt(p.id)) : [...ids, parseInt(p.id)]; setFormData({ ...formData, bundleGroups: updated }); }} className="flex items-center gap-2 p-2 cursor-pointer text-sm">
                              <div className={`w-4 h-4 border flex items-center justify-center ${isSelected ? 'bg-rose-400 border-rose-400' : 'border-gray-600'}`}>{isSelected && <Check size={11} className="text-dark-bg" />}</div>
                              <span className="text-white">{p.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-gray-700 pt-4">
            <h3 className="text-white font-bold mb-3">Activation</h3>
            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4 rounded border-gray-600 bg-dark-bg text-rose-400" />
              <span className="text-gray-300 text-sm">Promotion active</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="px-3 py-2 bg-dark-bg border border-gray-700 rounded-lg text-white" />
              <input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="px-3 py-2 bg-dark-bg border border-gray-700 rounded-lg text-white" />
              <input type="number" value={formData.maxUsage} onChange={(e) => setFormData({ ...formData, maxUsage: e.target.value })} placeholder="0" className="px-3 py-2 bg-dark-bg border border-gray-700 rounded-lg text-white" />
            </div>
          </div>


        </form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Supprimer la promotion">
        <p className="text-gray-400 mb-6">Êtes-vous sûr de vouloir supprimer la promotion "{promotionToDelete?.name}" ? Cette action est irréversible.</p>
        <div className="flex gap-3">
          <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-2.5 bg-dark-bg border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800">Annuler</button>
          <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600">Supprimer</button>
        </div>
      </Modal>

      <Modal isOpen={isStatsModalOpen} onClose={() => setIsStatsModalOpen(false)} title={`Statistiques - ${statsPromotion?.name || ''}`}>
        {loadingStats ? (
          <div className="flex justify-center py-8"><div className="w-8 h-8 border-2 border-rose-400 border-t-transparent rounded-full animate-spin"></div></div>
        ) : stats ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-dark-bg rounded-lg p-4 text-center"><p className="text-2xl font-koulen text-rose-400">{stats.totalUsages}</p><p className="text-gray-400 text-sm">Utilisations</p></div>
              <div className="bg-dark-bg rounded-lg p-4 text-center"><p className="text-2xl font-koulen text-green-400">{stats.totalOriginalAmount.toFixed(2)}€</p><p className="text-gray-400 text-sm">Montant total</p></div>
              <div className="bg-dark-bg rounded-lg p-4 text-center"><p className="text-2xl font-koulen text-purple-400">{stats.totalBonusGiven.toFixed(2)}€</p><p className="text-gray-400 text-sm">Bonus donnés</p></div>
            </div>
          </div>
        ) : <p className="text-gray-400 text-center py-4">Aucune donnée disponible</p>}
        <button onClick={() => setIsStatsModalOpen(false)} className="w-full mt-4 py-2.5 bg-dark-bg border border-gray-700 text-gray-300 rounded-lg">Fermer</button>
      </Modal>
    </div>
  );
};

export default PromotionManagementPage;