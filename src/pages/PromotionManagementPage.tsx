import React, { useEffect, useState } from 'react';
import {
  getAllPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
  getPromotionStats,
  type Promotion,
  type PromotionType,
  type PromotionStats,
  type BalanceRechargeTier,
  type DiscountTier,
} from '../api/promotions';
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
} from 'lucide-react';
import Modal from '../components/Modal';
import { useNotification } from '../context/NotificationContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const PROMOTION_TYPES: { value: PromotionType; label: string; description: string }[] = [
  { value: 'BALANCE_RECHARGE_BONUS', label: 'Bonus recharge', description: 'Bonus sur les recharges de solde' },
  { value: 'PERCENTAGE_DISCOUNT', label: 'Reduction %', description: 'Reduction en pourcentage sur commandes' },
  { value: 'FIXED_DISCOUNT', label: 'Reduction fixe', description: 'Reduction fixe sur commandes' },
];

interface PromotionFormData {
  name: string;
  description: string;
  type: PromotionType;
  displayTitle: string;
  displayMessage: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
  maxUsage: string;
  maxUsagePerUser: string;
  // For BALANCE_RECHARGE_BONUS
  tiers: BalanceRechargeTier[];
  firstRechargeOnly: boolean;
  // For PERCENTAGE_DISCOUNT and FIXED_DISCOUNT
  discountTiers: DiscountTier[];
  firstOrderOnly: boolean;
}

const defaultFormData: PromotionFormData = {
  name: '',
  description: '',
  type: 'BALANCE_RECHARGE_BONUS',
  displayTitle: '',
  displayMessage: '',
  isActive: true,
  startDate: '',
  endDate: '',
  maxUsage: '',
  maxUsagePerUser: '',
  tiers: [{ minAmount: 10, maxAmount: 20, bonusPercent: 10 }],
  firstRechargeOnly: true,
  discountTiers: [{ minOrderAmount: 10, maxOrderAmount: null, discountValue: 10 }],
  firstOrderOnly: false,
};

const PromotionManagementPage: React.FC = () => {
  useDocumentTitle('Admin - Promotions');
  const { addNotification } = useNotification();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPromotion, setCurrentPromotion] = useState<Promotion | null>(null);
  const [formData, setFormData] = useState<PromotionFormData>(defaultFormData);

  // Delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [promotionToDelete, setPromotionToDelete] = useState<Promotion | null>(null);

  // Stats modal
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [statsPromotion, setStatsPromotion] = useState<Promotion | null>(null);
  const [stats, setStats] = useState<PromotionStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const fetchPromotions = async () => {
    try {
      const data = await getAllPromotions();
      setPromotions(data);
    } catch (error) {
      console.error('Failed to fetch promotions:', error);
      addNotification('error', 'Erreur lors du chargement des promotions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleOpenCreate = () => {
    setCurrentPromotion(null);
    setFormData(defaultFormData);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (promotion: Promotion) => {
    setCurrentPromotion(promotion);
    const rules = promotion.rules as any;

    setFormData({
      name: promotion.name,
      description: promotion.description || '',
      type: promotion.type,
      displayTitle: promotion.displayTitle,
      displayMessage: promotion.displayMessage,
      isActive: promotion.isActive,
      startDate: promotion.startDate ? promotion.startDate.split('T')[0] : '',
      endDate: promotion.endDate ? promotion.endDate.split('T')[0] : '',
      maxUsage: promotion.maxUsage?.toString() || '',
      maxUsagePerUser: rules?.maxUsagePerUser?.toString() || '',
      tiers: rules?.tiers || [{ minAmount: 10, maxAmount: 20, bonusPercent: 10 }],
      firstRechargeOnly: rules?.firstRechargeOnly ?? true,
      discountTiers: rules?.tiers || [{ minOrderAmount: 10, maxOrderAmount: null, discountValue: 10 }],
      firstOrderOnly: rules?.firstOrderOnly ?? false,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Build rules based on type
    const maxUsagePerUser = formData.maxUsagePerUser ? parseInt(formData.maxUsagePerUser) : undefined;
    let rules: any = {};
    if (formData.type === 'BALANCE_RECHARGE_BONUS') {
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
      rules,
      isActive: formData.isActive,
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined,
      maxUsage: formData.maxUsage ? parseInt(formData.maxUsage) : undefined,
    };

    try {
      if (currentPromotion) {
        await updatePromotion(currentPromotion.id, payload);
        addNotification('success', 'Promotion modifiee avec succes !');
      } else {
        await createPromotion(payload);
        addNotification('success', 'Promotion creee avec succes !');
      }
      setIsModalOpen(false);
      fetchPromotions();
    } catch (error: any) {
      console.error('Failed to save promotion:', error);
      addNotification('error', error.message || "Erreur lors de l'enregistrement.");
    }
  };

  const handleDelete = async () => {
    if (!promotionToDelete) return;

    try {
      await deletePromotion(promotionToDelete.id);
      addNotification('success', 'Promotion supprimee avec succes !');
      setIsDeleteModalOpen(false);
      setPromotionToDelete(null);
      fetchPromotions();
    } catch (error: any) {
      console.error('Failed to delete promotion:', error);
      addNotification('error', error.message || 'Erreur lors de la suppression.');
    }
  };

  const handleToggleActive = async (promotion: Promotion) => {
    try {
      await updatePromotion(promotion.id, { isActive: !promotion.isActive });
      addNotification('success', `Promotion ${!promotion.isActive ? 'activee' : 'desactivee'} !`);
      fetchPromotions();
    } catch (error: any) {
      addNotification('error', error.message || 'Erreur lors de la mise a jour.');
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
      console.error('Failed to fetch stats:', error);
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
    newTiers[index] = { ...newTiers[index], [field]: value };
    setFormData({ ...formData, tiers: newTiers });
  };

  // Discount tier helpers
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
    newTiers[index] = { ...newTiers[index], [field]: value };
    setFormData({ ...formData, discountTiers: newTiers });
  };

  const getTypeLabel = (type: PromotionType) => {
    return PROMOTION_TYPES.find((t) => t.value === type)?.label || type;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-2 border-accent-mint border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-koulen text-white">PROMOTIONS</h1>
          <p className="text-gray-400 text-sm">{promotions.length} promotion(s)</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-accent-mint text-dark-bg font-bold rounded-lg hover:bg-accent-mint/90 transition-colors"
        >
          <Plus size={18} />
          Nouvelle promotion
        </button>
      </div>

      {/* Promotions List */}
      {promotions.length === 0 ? (
        <div className="bg-darker-bg rounded-xl border border-gray-800 p-8 text-center">
          <Gift size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">Aucune promotion pour le moment</p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 text-accent-mint hover:underline"
          >
            Creer une promotion
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {promotions.map((promotion) => (
            <div
              key={promotion.id}
              className={`bg-darker-bg rounded-xl border ${
                promotion.isActive ? 'border-accent-mint/30' : 'border-gray-800'
              } p-5`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`px-2 py-0.5 text-xs font-bold rounded ${
                        promotion.isActive
                          ? 'bg-accent-mint/20 text-accent-mint'
                          : 'bg-gray-700 text-gray-400'
                      }`}
                    >
                      {promotion.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs font-bold rounded">
                      {getTypeLabel(promotion.type)}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1">{promotion.name}</h3>
                  <p className="text-accent-mint font-medium mb-1">{promotion.displayTitle}</p>
                  <p className="text-gray-400 text-sm">{promotion.displayMessage}</p>

                  <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Tag size={12} />
                      {promotion.usageCount} utilisation(s)
                    </span>
                    {promotion.maxUsage && (
                      <span>Max: {promotion.maxUsage}</span>
                    )}
                    {promotion.startDate && (
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        Debut: {new Date(promotion.startDate).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                    {promotion.endDate && (
                      <span>
                        Fin: {new Date(promotion.endDate).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(promotion)}
                    className="p-2 hover:bg-dark-bg rounded-lg transition-colors"
                    title={promotion.isActive ? 'Desactiver' : 'Activer'}
                  >
                    {promotion.isActive ? (
                      <ToggleRight size={20} className="text-accent-mint" />
                    ) : (
                      <ToggleLeft size={20} className="text-gray-500" />
                    )}
                  </button>
                  <button
                    onClick={() => handleOpenStats(promotion)}
                    className="p-2 hover:bg-dark-bg rounded-lg transition-colors text-gray-400 hover:text-white"
                    title="Statistiques"
                  >
                    <BarChart3 size={18} />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(promotion)}
                    className="p-2 hover:bg-dark-bg rounded-lg transition-colors text-gray-400 hover:text-white"
                    title="Modifier"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => {
                      setPromotionToDelete(promotion);
                      setIsDeleteModalOpen(true);
                    }}
                    className="p-2 hover:bg-dark-bg rounded-lg transition-colors text-gray-400 hover:text-red-400"
                    title="Supprimer"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentPromotion ? 'Modifier la promotion' : 'Nouvelle promotion'}
      >

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1">Nom interne *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-dark-bg border border-gray-700 rounded-lg text-white focus:border-accent-mint focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as PromotionType })}
                className="w-full px-3 py-2 bg-dark-bg border border-gray-700 rounded-lg text-white focus:border-accent-mint focus:outline-none"
              >
                {PROMOTION_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-1">Description interne</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 bg-dark-bg border border-gray-700 rounded-lg text-white focus:border-accent-mint focus:outline-none"
            />
          </div>

          {/* Display Settings */}
          <div className="border-t border-gray-700 pt-4">
            <h3 className="text-white font-bold mb-3">Affichage</h3>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Titre affiche *</label>
              <input
                type="text"
                value={formData.displayTitle}
                onChange={(e) => setFormData({ ...formData, displayTitle: e.target.value })}
                placeholder="ex: Bonus Premier Versement !"
                className="w-full px-3 py-2 bg-dark-bg border border-gray-700 rounded-lg text-white focus:border-accent-mint focus:outline-none"
                required
              />
            </div>
            <div className="mt-3">
              <label className="block text-gray-400 text-sm mb-1">Message affiche *</label>
              <textarea
                value={formData.displayMessage}
                onChange={(e) => setFormData({ ...formData, displayMessage: e.target.value })}
                placeholder="ex: +10% offerts de 10 a 20€ et +15% au-dela de 20€ !"
                rows={2}
                className="w-full px-3 py-2 bg-dark-bg border border-gray-700 rounded-lg text-white focus:border-accent-mint focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Rules - Balance Recharge Bonus */}
          {formData.type === 'BALANCE_RECHARGE_BONUS' && (
            <div className="border-t border-gray-700 pt-4">
              <h3 className="text-white font-bold mb-3">Regles du bonus</h3>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <label className={`flex items-center gap-2 cursor-pointer ${formData.maxUsagePerUser ? 'opacity-50' : ''}`}>
                  <input
                    type="checkbox"
                    checked={formData.firstRechargeOnly}
                    onChange={(e) => setFormData({ ...formData, firstRechargeOnly: e.target.checked })}
                    disabled={!!formData.maxUsagePerUser}
                    className="w-4 h-4 rounded border-gray-600 bg-dark-bg text-accent-mint focus:ring-accent-mint disabled:opacity-50"
                  />
                  <span className="text-gray-300 text-sm">Premier versement uniquement</span>
                </label>
                <div>
                  <label className="block text-gray-500 text-xs mb-1">Max par utilisateur (0 = illimite)</label>
                  <input
                    type="number"
                    value={formData.maxUsagePerUser}
                    onChange={(e) => setFormData({ ...formData, maxUsagePerUser: e.target.value })}
                    placeholder="0"
                    min="0"
                    className="w-full px-2 py-1.5 bg-dark-bg border border-gray-700 rounded text-white text-sm focus:border-accent-mint focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Paliers de bonus</span>
                  <button
                    type="button"
                    onClick={addTier}
                    className="text-accent-mint text-sm hover:underline"
                  >
                    + Ajouter un palier
                  </button>
                </div>

                {formData.tiers.map((tier, index) => (
                  <div key={index} className="bg-dark-bg rounded-lg p-3 flex items-center gap-3">
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-gray-500 text-xs mb-1">Min (€)</label>
                        <input
                          type="number"
                          value={tier.minAmount}
                          onChange={(e) => updateTier(index, 'minAmount', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 bg-darker-bg border border-gray-700 rounded text-white text-sm focus:border-accent-mint focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-500 text-xs mb-1">Max (€)</label>
                        <input
                          type="number"
                          value={tier.maxAmount ?? ''}
                          onChange={(e) =>
                            updateTier(index, 'maxAmount', e.target.value ? parseFloat(e.target.value) : null)
                          }
                          placeholder="Illimite"
                          className="w-full px-2 py-1.5 bg-darker-bg border border-gray-700 rounded text-white text-sm focus:border-accent-mint focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-500 text-xs mb-1">Bonus (%)</label>
                        <input
                          type="number"
                          value={tier.bonusPercent}
                          onChange={(e) => updateTier(index, 'bonusPercent', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 bg-darker-bg border border-gray-700 rounded text-white text-sm focus:border-accent-mint focus:outline-none"
                        />
                      </div>
                    </div>
                    {formData.tiers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTier(index)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rules - Percentage/Fixed Discount */}
          {(formData.type === 'PERCENTAGE_DISCOUNT' || formData.type === 'FIXED_DISCOUNT') && (
            <div className="border-t border-gray-700 pt-4">
              <h3 className="text-white font-bold mb-3">Regles de la reduction</h3>

              <p className="text-gray-500 text-xs mb-4">
                S'applique uniquement sur les commandes boutique (produits)
              </p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <label className={`flex items-center gap-2 cursor-pointer ${formData.maxUsagePerUser ? 'opacity-50' : ''}`}>
                  <input
                    type="checkbox"
                    checked={formData.firstOrderOnly}
                    onChange={(e) => setFormData({ ...formData, firstOrderOnly: e.target.checked })}
                    disabled={!!formData.maxUsagePerUser}
                    className="w-4 h-4 rounded border-gray-600 bg-dark-bg text-accent-mint focus:ring-accent-mint disabled:opacity-50"
                  />
                  <span className="text-gray-300 text-sm">Premiere commande uniquement</span>
                </label>
                <div>
                  <label className="block text-gray-500 text-xs mb-1">Max par utilisateur (0 = illimite)</label>
                  <input
                    type="number"
                    value={formData.maxUsagePerUser}
                    onChange={(e) => setFormData({ ...formData, maxUsagePerUser: e.target.value })}
                    placeholder="0"
                    min="0"
                    className="w-full px-2 py-1.5 bg-dark-bg border border-gray-700 rounded text-white text-sm focus:border-accent-mint focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Paliers de reduction</span>
                  <button
                    type="button"
                    onClick={addDiscountTier}
                    className="text-accent-mint text-sm hover:underline"
                  >
                    + Ajouter un palier
                  </button>
                </div>

                {formData.discountTiers.map((tier, index) => (
                  <div key={index} className="bg-dark-bg rounded-lg p-3 flex items-center gap-3">
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-gray-500 text-xs mb-1">Panier min (€)</label>
                        <input
                          type="number"
                          value={tier.minOrderAmount}
                          onChange={(e) => updateDiscountTier(index, 'minOrderAmount', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 bg-darker-bg border border-gray-700 rounded text-white text-sm focus:border-accent-mint focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-500 text-xs mb-1">Panier max (€)</label>
                        <input
                          type="number"
                          value={tier.maxOrderAmount ?? ''}
                          onChange={(e) =>
                            updateDiscountTier(index, 'maxOrderAmount', e.target.value ? parseFloat(e.target.value) : null)
                          }
                          placeholder="Illimite"
                          className="w-full px-2 py-1.5 bg-darker-bg border border-gray-700 rounded text-white text-sm focus:border-accent-mint focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-500 text-xs mb-1">
                          {formData.type === 'PERCENTAGE_DISCOUNT' ? 'Reduction (%)' : 'Reduction (€)'}
                        </label>
                        <input
                          type="number"
                          value={tier.discountValue}
                          onChange={(e) => updateDiscountTier(index, 'discountValue', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 bg-darker-bg border border-gray-700 rounded text-white text-sm focus:border-accent-mint focus:outline-none"
                        />
                      </div>
                    </div>
                    {formData.discountTiers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDiscountTier(index)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activation Settings */}
          <div className="border-t border-gray-700 pt-4">
            <h3 className="text-white font-bold mb-3">Activation</h3>

            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 rounded border-gray-600 bg-dark-bg text-accent-mint focus:ring-accent-mint"
              />
              <span className="text-gray-300 text-sm">Promotion active</span>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Date de debut</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-bg border border-gray-700 rounded-lg text-white focus:border-accent-mint focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Date de fin</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-bg border border-gray-700 rounded-lg text-white focus:border-accent-mint focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Utilisations max (total, 0 = illimite)</label>
                <input
                  type="number"
                  value={formData.maxUsage}
                  onChange={(e) => setFormData({ ...formData, maxUsage: e.target.value })}
                  placeholder="0"
                  min="0"
                  className="w-full px-3 py-2 bg-dark-bg border border-gray-700 rounded-lg text-white focus:border-accent-mint focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 py-2.5 bg-dark-bg border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-accent-mint text-dark-bg font-bold rounded-lg hover:bg-accent-mint/90 transition-colors"
            >
              {currentPromotion ? 'Enregistrer' : 'Creer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Supprimer la promotion">
        <p className="text-gray-400 mb-6">
          Etes-vous sur de vouloir supprimer la promotion "{promotionToDelete?.name}" ? Cette action est irreversible.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setIsDeleteModalOpen(false)}
            className="flex-1 py-2.5 bg-dark-bg border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleDelete}
            className="flex-1 py-2.5 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition-colors"
          >
            Supprimer
          </button>
        </div>
      </Modal>

      {/* Stats Modal */}
      <Modal isOpen={isStatsModalOpen} onClose={() => setIsStatsModalOpen(false)} title={`Statistiques - ${statsPromotion?.name || ''}`}>
        {loadingStats ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-accent-mint border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : stats ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-dark-bg rounded-lg p-4 text-center">
                <p className="text-2xl font-koulen text-accent-mint">{stats.totalUsages}</p>
                <p className="text-gray-400 text-sm">Utilisations</p>
              </div>
              <div className="bg-dark-bg rounded-lg p-4 text-center">
                <p className="text-2xl font-koulen text-green-400">{stats.totalOriginalAmount.toFixed(2)}€</p>
                <p className="text-gray-400 text-sm">Montant total</p>
              </div>
              <div className="bg-dark-bg rounded-lg p-4 text-center">
                <p className="text-2xl font-koulen text-purple-400">{stats.totalBonusGiven.toFixed(2)}€</p>
                <p className="text-gray-400 text-sm">Bonus donnes</p>
              </div>
            </div>

            {stats.recentUsages.length > 0 && (
              <div>
                <h3 className="text-white font-bold mb-2">Dernieres utilisations</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {stats.recentUsages.map((usage) => (
                    <div key={usage.id} className="bg-dark-bg rounded-lg p-3 flex justify-between items-center text-sm">
                      <span className="text-gray-400">
                        {new Date(usage.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                      <span className="text-white">{usage.originalAmount.toFixed(2)}€</span>
                      <span className="text-accent-mint">+{usage.bonusAmount.toFixed(2)}€</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-4">Aucune donnee disponible</p>
        )}

        <button
          onClick={() => setIsStatsModalOpen(false)}
          className="w-full mt-4 py-2.5 bg-dark-bg border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
        >
          Fermer
        </button>
      </Modal>
    </div>
  );
};

export default PromotionManagementPage;
