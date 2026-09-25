import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMyOrders, type Order } from '../api/orders';
import { getMyInscriptions, type Inscription } from '../api/inscriptions';
import { deleteAccount, updateProfile } from '../api/auth';
import { getPublicBattlePasses, getMyBattlePass, type BattlePass, type UserBattlePass } from '../api/battlePass';
import { Link, Navigate } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
  User,
  Mail,
  GraduationCap,
  LogOut,
  ShoppingBag,
  Calendar,
  MapPin,
  CreditCard,
  Package,
  Ticket,
  QrCode,
  X,
  Gift,
  Trash2,
  AlertTriangle,
  Edit2,
  Check,
  Loader2,
  Bell,
  Trophy,
  Lock
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import BalanceDisplay from '../components/BalanceDisplay';
import BonusBubble from '../components/BonusBubble';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useNotification } from '../context/NotificationContext';
import { logger } from '../utils/logger';
import { getErrorMessage } from '../types/errors';

const FILIERES = [
  { value: 'INFO', label: 'INFO' },
  { value: 'MMI', label: 'MMI' },
  { value: 'TC', label: 'TC' },
  { value: 'BIO', label: 'BIO' },
];

const MyAccountPage: React.FC = () => {
  useDocumentTitle('Mon Compte');
  const { user, token, loading: authLoading, logout, refreshUser } = useAuth();
  const { addNotification } = useNotification();
  const [orders, setOrders] = useState<Order[]>([]);
  const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingInscriptions, setLoadingInscriptions] = useState(true);
  const [isOrdersExpanded, setIsOrdersExpanded] = useState(false);
  const [isInscriptionsExpanded, setIsInscriptionsExpanded] = useState(false);
  const [qrCodeOrder, setQrCodeOrder] = useState<Order | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditingFiliere, setIsEditingFiliere] = useState(false);
  const [selectedFiliere, setSelectedFiliere] = useState<string>('INFO');
  const [isUpdatingFiliere, setIsUpdatingFiliere] = useState(false);
  const [emailOnOrder, setEmailOnOrder] = useState(true);
  const [emailOnRecharge, setEmailOnRecharge] = useState(true);
  const [isUpdatingEmailPrefs, setIsUpdatingEmailPrefs] = useState(false);
  const [isBattlePassExpanded, setIsBattlePassExpanded] = useState(false);
  const [battlePasses, setBattlePasses] = useState<BattlePass[]>([]);
  const [userPassMap, setUserPassMap] = useState<Record<number, UserBattlePass>>({});
  const [loadingBattlePass, setLoadingBattlePass] = useState(true);
  const [qrReward, setQrReward] = useState<{ bpId: number; bpName: string; level: number; tier: 'FREE' | 'PREMIUM'; label: string | null } | null>(null);

  const handleUpdateFiliere = async () => {
    console.log('selectedFiliere:', selectedFiliere);
    console.log('isUpdatingFiliere:', isUpdatingFiliere);

    if (!selectedFiliere) {
      console.log('BLOQUÉ: selectedFiliere vide');
      return;
    }

    setIsUpdatingFiliere(true);
    try {
      const result = await updateProfile({ filiere: selectedFiliere });
      console.log('updateProfile result:', result);
      await refreshUser();
      addNotification('success', 'Filière mise à jour');
      setIsEditingFiliere(false);
    } catch (error) {
      console.log('ERREUR:', error);
      addNotification('error', getErrorMessage(error));
    } finally {
      setIsUpdatingFiliere(false);
    }
  };

  const handleToggleEmailPreference = async (type: 'order' | 'recharge', value: boolean) => {
    setIsUpdatingEmailPrefs(true);
    try {
      if (type === 'order') {
        setEmailOnOrder(value);
        await updateProfile({ emailOnOrder: value });
      } else {
        setEmailOnRecharge(value);
        await updateProfile({ emailOnRecharge: value });
      }
      await refreshUser();
      addNotification('success', 'Préférences email mises à jour');
    } catch (error) {
      // Revert on error
      if (type === 'order') {
        setEmailOnOrder(!value);
      } else {
        setEmailOnRecharge(!value);
      }
      logger.error('Failed to update email preference', error);
      addNotification('error', getErrorMessage(error));
    } finally {
      setIsUpdatingEmailPrefs(false);
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      if (token) {
        try {
          const data = await getMyOrders();
          setOrders(data);
        } catch (error) {
          logger.error('Failed to fetch orders', error);
        } finally {
          setLoadingOrders(false);
        }
      }
    };

    const fetchInscriptions = async () => {
      if (token) {
        try {
          const data = await getMyInscriptions();
          setInscriptions(data);
        } catch (error) {
          logger.error('Failed to fetch inscriptions', error);
        } finally {
          setLoadingInscriptions(false);
        }
      }
    };

    const fetchBattlePasses = async () => {
      if (!token) return;
      try {
        const passes = await getPublicBattlePasses();
        const entries = await Promise.allSettled(passes.map(bp => getMyBattlePass(bp.id)));
        const map: Record<number, UserBattlePass> = {};
        entries.forEach((result, i) => {
          if (result.status === 'fulfilled' && result.value) {
            map[passes[i].id] = result.value;
          }
        });
        setBattlePasses(passes.filter(bp => map[bp.id] !== undefined));
        setUserPassMap(map);
      } catch (error) {
        logger.error('Failed to fetch battle passes', error);
      } finally {
        setLoadingBattlePass(false);
      }
    };

    fetchOrders();
    fetchInscriptions();
    fetchBattlePasses();

    // Re-fetch battle passes quand l'onglet redevient actif
    const handleVisibilityChange = () => fetchBattlePasses();
    window.addEventListener('focus', handleVisibilityChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleVisibilityChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, token, authLoading]);

  // Initialize email preferences from user data
  useEffect(() => {
    if (user) {
      setEmailOnOrder(user.emailOnOrder !== false);
      setEmailOnRecharge(user.emailOnRecharge !== false);
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-darker-bg">
        <div className="w-12 h-12 border-2 border-accent-mint border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;

  const getUserTypeLabel = () => {
    switch (user.type) {
      case 'STUDENT': return 'Étudiant';
      case 'PROFESSOR': return 'Professeur';
      case 'EXTERNAL': return 'Externe';
      case 'ADMIN_BDE': return 'Admin BDE';
      case 'ADMIN_PROF': return 'Admin Prof';
      default: return 'Utilisateur';
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'SUPPRIMER') return;

    setIsDeleting(true);
    try {
      await deleteAccount();
      addNotification('success', 'Votre compte a été supprimé avec succès.');
      logout();
    } catch (error) {
      addNotification('error', getErrorMessage(error));
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setDeleteConfirmText('');
    }
  };

  const getStatusBadge = (status: string, type: 'order' | 'inscription') => {
    if (type === 'order') {
      switch (status) {
        case 'PAID':
          return <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full">Payée</span>;
        case 'COLLECTED':
          return <span className="px-3 py-1 bg-accent-mint/20 text-accent-mint text-xs font-bold rounded-full">Récupérée</span>;
        case 'CANCELLED':
          return <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-full">Annulée</span>;
        default:
          return <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-full">En attente</span>;
      }
    } else {
      switch (status) {
        case 'PAID':
          return <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full">Payé</span>;
        case 'REFUNDED':
          return <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs font-bold rounded-full">Remboursé</span>;
        default:
          return <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-full">En attente</span>;
      }
    }
  };

  return (
    <div className="bg-dark-bg">
      {/* Header Section */}
      <section className="bg-darker-bg py-12 border-b border-gray-800 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-[400px] h-[400px] bg-accent-mint/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-1/3 w-[200px] h-[200px] bg-blue-500/5 rounded-full blur-[80px]" />
        </div>
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 40px,
            rgba(119,241,190,0.5) 40px,
            rgba(119,241,190,0.5) 41px
          )`
        }} />

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-1 h-14 bg-accent-mint rounded-full hidden sm:block" />
              <div>
                <span className="text-accent-mint text-sm font-bold uppercase tracking-wider">Espace personnel</span>
                <h1 className="text-5xl md:text-6xl font-koulen text-white mt-1">MON COMPTE</h1>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 font-medium rounded-xl hover:bg-red-500/20 transition-colors"
            >
              <LogOut size={18} />
              Deconnexion
            </button>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column - Profile & Balance */}
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="bg-darker-bg rounded-2xl border border-gray-800 p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-accent-mint/10 rounded-2xl flex items-center justify-center">
                    <User size={32} className="text-accent-mint" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white capitalize">
                      {user.firstName} {user.lastName}
                    </h2>
                    <span className="px-2 py-0.5 bg-accent-mint/20 text-accent-mint text-xs font-bold rounded-full">
                      {getUserTypeLabel()}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-gray-400">
                    <Mail size={18} className="text-accent-mint" />
                    <span className="text-sm font-montserrat">{user.email}</span>
                  </div>
                  {(user.type === 'STUDENT' || user.type === 'ADMIN_BDE') && (
                    <div className="flex items-center gap-3 text-gray-400">
                      <GraduationCap size={18} className="text-accent-mint" />
                      {isEditingFiliere ? (
                        <div className="flex items-center gap-2 flex-1">
                          <select
                            value={selectedFiliere}
                            onChange={(e) => setSelectedFiliere(e.target.value)}
                            className="flex-1 bg-dark-bg border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:border-accent-mint focus:outline-none"
                          >
                            <option value="">Choisir une filière</option>
                            {FILIERES.map((f) => (
                              <option key={f.value} value={f.value}>
                                {f.label}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={handleUpdateFiliere}
                            disabled={!selectedFiliere || isUpdatingFiliere}
                            className="p-1.5 bg-accent-mint text-darker-bg rounded-lg hover:bg-accent-mint/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isUpdatingFiliere ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Check size={16} />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setIsEditingFiliere(false);
                              setSelectedFiliere('');
                            }}
                            className="p-1.5 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-sm font-montserrat">
                            {user.filiere ? user.filiere : 'Aucune filière'}
                          </span>
                          <button
                            onClick={() => {
                              setSelectedFiliere(user.filiere || 'INFO');
                              setIsEditingFiliere(true);
                            }}
                            className="p-1 text-gray-500 hover:text-accent-mint transition-colors"
                            title="Modifier la filière"
                          >
                            <Edit2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Email Preferences Card */}
              <div className="bg-darker-bg rounded-2xl border border-gray-800 p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                    <Bell size={20} className="text-blue-400" />
                  </div>
                  <h2 className="text-lg font-bold text-white">Notifications email</h2>
                </div>

                <div className="space-y-4">
                  {/* Email on Order */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-medium">Confirmation de commande</p>
                      <p className="text-gray-500 text-xs">Recevoir un email à chaque commande</p>
                    </div>
                    <button
                      onClick={() => handleToggleEmailPreference('order', !emailOnOrder)}
                      disabled={isUpdatingEmailPrefs}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        emailOnOrder ? 'bg-accent-mint' : 'bg-gray-700'
                      } ${isUpdatingEmailPrefs ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          emailOnOrder ? 'left-7' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Email on Recharge */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-medium">Confirmation de rechargement</p>
                      <p className="text-gray-500 text-xs">Recevoir un email à chaque rechargement</p>
                    </div>
                    <button
                      onClick={() => handleToggleEmailPreference('recharge', !emailOnRecharge)}
                      disabled={isUpdatingEmailPrefs}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        emailOnRecharge ? 'bg-accent-mint' : 'bg-gray-700'
                      } ${isUpdatingEmailPrefs ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          emailOnRecharge ? 'left-7' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Balance Card */}
              <div className="relative overflow-visible">
                <BalanceDisplay variant="card" showRechargeButton={true} />
                <BonusBubble variant="overlay" className="-top-3 -right-3" />
              </div>

              {/* Danger Zone */}
              <div className="bg-darker-bg rounded-2xl border border-red-500/30 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                    <AlertTriangle size={20} className="text-red-400" />
                  </div>
                  <h2 className="text-lg font-bold text-red-400">Zone de danger</h2>
                </div>
                <p className="text-gray-400 text-sm mb-4">
                  La suppression de votre compte est irréversible. Vos informations personnelles seront effacées mais vos commandes et inscriptions resteront dans l'historique.
                </p>
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 font-medium rounded-xl hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 size={18} />
                  Supprimer mon compte
                </button>
              </div>
            </div>

            {/* Right column - Orders & Inscriptions */}
            <div className="lg:col-span-2 space-y-6">
              {/* Orders Section */}
              <div className="bg-darker-bg rounded-2xl border border-gray-800 overflow-hidden hover:border-gray-700 transition-colors">
                <button
                  onClick={() => setIsOrdersExpanded(!isOrdersExpanded)}
                  className="w-full flex items-center justify-between p-6 hover:bg-dark-bg/50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-accent-mint/10 rounded-xl flex items-center justify-center group-hover:bg-accent-mint/20 transition-colors">
                      <ShoppingBag size={22} className="text-accent-mint" />
                    </div>
                    <div className="text-left">
                      <h2 className="text-lg font-bold text-white">Mes commandes</h2>
                      <p className="text-sm text-gray-500">{orders.length} commande{orders.length > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-dark-bg flex items-center justify-center group-hover:bg-accent-mint/10 transition-colors">
                    {isOrdersExpanded ? <ChevronDown size={18} className="text-gray-500" /> : <ChevronRight size={18} className="text-gray-500" />}
                  </div>
                </button>

                {isOrdersExpanded && (
                  <div className="border-t border-gray-800">
                    {loadingOrders ? (
                      <div className="flex justify-center py-8">
                        <div className="w-8 h-8 border-2 border-accent-mint border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="p-8 text-center">
                        <div className="w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Package size={24} className="text-gray-600" />
                        </div>
                        <p className="text-gray-500 font-montserrat mb-3">Aucune commande pour le moment</p>
                        <Link to="/shop" className="inline-flex items-center gap-2 text-accent-mint text-sm hover:underline">
                          Decouvrir la boutique
                          <ChevronRight size={14} />
                        </Link>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-800/50">
                        {orders.map((order) => (
                          <div key={order.id} className="p-5 hover:bg-dark-bg/30 transition-colors">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs text-gray-500 font-mono bg-dark-bg px-2 py-0.5 rounded">
                                    #{order.id.toString().padStart(6, '0')}
                                  </span>
                                  {getStatusBadge(order.orderStatus, 'order')}
                                </div>
                                <p className="text-xs text-gray-500 font-montserrat">
                                  {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                              </div>
                              <div className="text-right">
                                {order.discountAmount > 0 && order.originalPrice ? (
                                  <>
                                    <p className="text-gray-500 line-through text-sm">{order.originalPrice.toFixed(2)}€</p>
                                    <p className="text-accent-mint font-koulen text-xl">{order.totalPrice.toFixed(2)}€</p>
                                  </>
                                ) : (
                                  <p className="text-accent-mint font-koulen text-xl">{order.totalPrice.toFixed(2)}€</p>
                                )}
                                {order.refundedAmount > 0 && (
                                  <p className="text-xs text-red-400">-{order.refundedAmount.toFixed(2)}€ rembourse</p>
                                )}
                              </div>
                            </div>

                            {/* Discount info */}
                            {order.discountAmount > 0 && (
                              <div className="mb-4 p-3 bg-accent-mint/5 border border-accent-mint/20 rounded-xl">
                                <div className="flex items-center gap-2 mb-2">
                                  <Gift size={14} className="text-accent-mint" />
                                  <span className="text-xs text-accent-mint font-bold">Reductions appliquees</span>
                                </div>
                                <div className="text-xs space-y-1 ml-5">
                                  {(order.productDiscountAmount ?? 0) > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-400">Articles en promo:</span>
                                      <span className="text-accent-mint font-medium">-{order.productDiscountAmount!.toFixed(2)}€</span>
                                    </div>
                                  )}
                                  {(order.cartDiscountAmount ?? 0) > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-400">Code promo{order.promotion && ` (${order.promotion.name})`}:</span>
                                      <span className="text-accent-mint font-medium">-{order.cartDiscountAmount!.toFixed(2)}€</span>
                                    </div>
                                  )}
                                  {(order.productDiscountAmount ?? 0) === 0 && (order.cartDiscountAmount ?? 0) === 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-400">Reduction:</span>
                                      <span className="text-accent-mint font-medium">-{order.discountAmount.toFixed(2)}€</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="bg-dark-bg rounded-xl p-4 border border-gray-800/50">
                              <div className="space-y-2">
                                {order.items.map((item) => {
                                  // Check if item had a product discount
                                  const hasProductDiscount = item.originalPrice && item.originalPrice > item.price;
                                  const originalTotal = hasProductDiscount ? item.originalPrice! * item.quantity : null;
                                  const itemTotal = item.price * item.quantity;

                                  return (
                                    <div key={item.id} className="flex justify-between text-sm py-1">
                                      <span className="text-gray-300">
                                        <span className="text-accent-mint font-medium">{item.quantity}x</span> {item.product.name}
                                        {item.refundedQuantity > 0 && (
                                          <span className="text-red-400 ml-1 text-xs">
                                            ({item.refundedQuantity} remb.)
                                          </span>
                                        )}
                                      </span>
                                      <span className="text-right font-medium">
                                        {hasProductDiscount ? (
                                          <>
                                            <span className="text-gray-500 line-through text-xs mr-1">
                                              {originalTotal!.toFixed(2)}€
                                            </span>
                                            <span className="text-red-400">{itemTotal.toFixed(2)}€</span>
                                          </>
                                        ) : (
                                          <span className="text-gray-300">{itemTotal.toFixed(2)}€</span>
                                        )}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* QR Code Button - only for orders that can be picked up */}
                            {/* Show QR if: PAID (for HA/PayPal/Balance) OR PENDING+CASH_CB */}
                            {/* Hide QR if: COLLECTED, CANCELLED, or REFUNDED */}
                            {order.orderStatus !== 'CANCELLED' &&
                             order.orderStatus !== 'COLLECTED' &&
                             order.paymentStatus !== 'REFUNDED' &&
                             (order.paymentStatus === 'PAID' ||
                              (order.paymentStatus === 'PENDING' && (order.paymentMethod === 'CASH' || order.paymentMethod === 'CB'))) && (
                              <button
                                onClick={() => setQrCodeOrder(order)}
                                className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-accent-mint/10 border border-accent-mint/30 text-accent-mint text-sm font-bold rounded-xl hover:bg-accent-mint/20 hover:border-accent-mint/50 transition-all"
                              >
                                <QrCode size={18} />
                                Afficher le QR Code
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Inscriptions Section */}
              <div className="bg-darker-bg rounded-2xl border border-gray-800 overflow-hidden hover:border-gray-700 transition-colors">
                <button
                  onClick={() => setIsInscriptionsExpanded(!isInscriptionsExpanded)}
                  className="w-full flex items-center justify-between p-6 hover:bg-dark-bg/50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                      <Ticket size={22} className="text-purple-400" />
                    </div>
                    <div className="text-left">
                      <h2 className="text-lg font-bold text-white">Mes inscriptions</h2>
                      <p className="text-sm text-gray-500">{inscriptions.length} evenement{inscriptions.length > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-dark-bg flex items-center justify-center group-hover:bg-purple-500/10 transition-colors">
                    {isInscriptionsExpanded ? <ChevronDown size={18} className="text-gray-500" /> : <ChevronRight size={18} className="text-gray-500" />}
                  </div>
                </button>

                {isInscriptionsExpanded && (
                  <div className="border-t border-gray-800">
                    {loadingInscriptions ? (
                      <div className="flex justify-center py-8">
                        <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : inscriptions.length === 0 ? (
                      <div className="p-8 text-center">
                        <div className="w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Calendar size={24} className="text-gray-600" />
                        </div>
                        <p className="text-gray-500 font-montserrat mb-3">Aucune inscription pour le moment</p>
                        <Link to="/events" className="inline-flex items-center gap-2 text-accent-mint text-sm hover:underline">
                          Voir les evenements
                          <ChevronRight size={14} />
                        </Link>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-800/50">
                        {inscriptions.map((inscription) => (
                          <div key={inscription.id} className="p-5 hover:bg-dark-bg/30 transition-colors">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <p className="font-bold text-white">{inscription.event?.title || 'Evenement inconnu'}</p>
                                  {getStatusBadge(inscription.paymentStatus, 'inscription')}
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                                  <span className="flex items-center gap-1.5 bg-dark-bg px-2 py-1 rounded-lg">
                                    <Calendar size={12} className="text-purple-400" />
                                    {inscription.event?.date
                                      ? new Date(inscription.event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                                      : 'N/A'
                                    }
                                  </span>
                                  <span className="flex items-center gap-1.5 bg-dark-bg px-2 py-1 rounded-lg">
                                    <MapPin size={12} className="text-purple-400" />
                                    {inscription.event?.location || 'N/A'}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-accent-mint font-koulen text-xl">
                                  {inscription.totalPrice === 0 ? 'GRATUIT' : `${inscription.totalPrice}€`}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-gray-500 bg-dark-bg rounded-xl p-3 border border-gray-800/50">
                              <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1.5">
                                  <Ticket size={12} className="text-purple-400" />
                                  {inscription.quantity} place{inscription.quantity > 1 ? 's' : ''}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <CreditCard size={12} className="text-gray-500" />
                                  {inscription.paymentMethod === 'HELLOASSO' ? 'HelloAsso' :
                                   inscription.paymentMethod === 'CASH' ? 'Sur place' :
                                   inscription.paymentMethod === 'CB' ? 'Sur place' :
                                   inscription.paymentMethod === 'BALANCE' ? 'Solde ADIIL' : 'Gratuit'}
                                </span>
                              </div>
                              <span>Inscrit le {new Date(inscription.createdAt).toLocaleDateString('fr-FR')}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Battle Pass Section */}
              <div className="bg-darker-bg rounded-2xl border border-gray-800 overflow-hidden hover:border-gray-700 transition-colors">
                <button
                  onClick={() => setIsBattlePassExpanded(!isBattlePassExpanded)}
                  className="w-full flex items-center justify-between p-6 hover:bg-dark-bg/50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                      <Trophy size={22} className="text-amber-400" />
                    </div>
                    <div className="text-left">
                      <h2 className="text-lg font-bold text-white">Battle Pass</h2>
                      <p className="text-sm text-gray-500">{battlePasses.length} pass{battlePasses.length > 1 ? 'es' : ''} actif{battlePasses.length > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-dark-bg flex items-center justify-center group-hover:bg-amber-500/10 transition-colors">
                    {isBattlePassExpanded ? <ChevronDown size={18} className="text-gray-500" /> : <ChevronRight size={18} className="text-gray-500" />}
                  </div>
                </button>

                {isBattlePassExpanded && (
                  <div className="border-t border-gray-800">
                    {loadingBattlePass ? (
                      <div className="flex justify-center py-8">
                        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : battlePasses.length === 0 ? (
                      <div className="p-8 text-center">
                        <div className="w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Trophy size={24} className="text-gray-600" />
                        </div>
                        <p className="text-gray-500 font-montserrat mb-3">Aucun pass actif pour le moment</p>
                        <Link to="/battle-pass" className="inline-flex items-center gap-2 text-amber-400 text-sm hover:underline">
                          Voir les passes de combat
                          <ChevronRight size={14} />
                        </Link>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-800/50">
                        {battlePasses.map(bp => {
                          const userPass = userPassMap[bp.id];
                          const currentSpend = userPass?.currentSpend ?? 0;
                          const maxRequired = bp.levels.length > 0 ? Math.max(...bp.levels.map(l => l.requiredSpend)) : 0;
                          const progress = maxRequired > 0 ? Math.min(100, (currentSpend / maxRequired) * 100) : 0;
                          const unlockedCount = bp.levels.filter(l => currentSpend >= l.requiredSpend).length;
                          const claimedFree = userPass?.claimedFreeRewards ?? [];
                          const claimedPremium = userPass?.claimedPremiumRewards ?? [];
                          const isExpired = new Date() > new Date(bp.endDate);

                          const getRewardIcon = (type: string | null) => {
                            if (type === 'BALANCE') return <CreditCard size={11} />;
                            if (type === 'PRODUCT') return <Package size={11} />;
                            return <Gift size={11} />;
                          };

                          return (
                            <div key={bp.id} className="p-5 hover:bg-dark-bg/30 transition-colors">
                              {/* Pass header */}
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h3 className="font-bold text-white">{bp.name}</h3>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    Du {new Date(bp.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} au {new Date(bp.endDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    {isExpired && <span className="ml-2 text-red-400 font-medium">Expiré</span>}
                                  </p>
                                </div>
                                {userPass?.hasPremium ? (
                                  <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-full">✦ PREMIUM</span>
                                ) : (
                                  <Link to="/battle-pass" className="px-2.5 py-1 bg-dark-bg text-gray-500 text-xs font-medium rounded-full border border-gray-700 hover:border-amber-500/50 hover:text-amber-400 transition-colors">
                                    Tier Free
                                  </Link>
                                )}
                              </div>

                              {/* Progress */}
                              <div className="mb-4 bg-dark-bg rounded-xl p-3 border border-gray-800/50">
                                <div className="flex items-center justify-between text-xs mb-2">
                                  <span className="text-gray-400">Progression</span>
                                  <span className="text-white font-medium">{currentSpend.toFixed(2)}€ <span className="text-gray-500">/ {maxRequired.toFixed(2)}€</span></span>
                                </div>
                                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                                </div>
                                <p className="text-xs text-gray-500 mt-1.5">Niveau {unlockedCount} / {bp.levels.length} débloqué{unlockedCount > 1 ? 's' : ''}</p>
                              </div>

                              {/* Levels */}
                              {bp.levels.length > 0 && (
                                <div className="space-y-1.5">
                                  {bp.levels.map(lvl => {
                                    const isUnlocked = currentSpend >= lvl.requiredSpend;
                                    const freeIsClaimed = claimedFree.includes(lvl.level);
                                    const premiumIsClaimed = claimedPremium.includes(lvl.level);

                                    return (
                                      <div key={lvl.level} className={`flex items-start gap-2.5 p-2.5 rounded-xl border ${isUnlocked ? 'bg-dark-bg border-gray-800/50' : 'bg-dark-bg/50 border-gray-800/30 opacity-60'}`}>
                                        {/* Level badge + spend (stacked) */}
                                        <div className="flex-shrink-0 flex flex-col items-center gap-0.5 pt-0.5 w-9">
                                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${isUnlocked ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-800 text-gray-600'}`}>
                                            {lvl.level}
                                          </div>
                                          <span className="text-[10px] text-gray-600 font-mono leading-none">{lvl.requiredSpend.toFixed(0)}€</span>
                                        </div>

                                        {/* Free + Premium stacked */}
                                        <div className="flex-1 min-w-0 space-y-1.5">
                                          {/* Free reward */}
                                          {lvl.freeRewardType ? (
                                            <div className="flex items-center justify-between gap-2">
                                              <div className="flex items-center gap-1.5 min-w-0">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                                                <span className="text-emerald-400 flex-shrink-0">{getRewardIcon(lvl.freeRewardType)}</span>
                                                <span className="text-xs text-gray-300 truncate">{lvl.freeRewardLabel || lvl.freeRewardType}</span>
                                                {lvl.freeRewardValue ? <span className="text-xs text-emerald-400 font-medium flex-shrink-0">{lvl.freeRewardValue}€</span> : null}
                                              </div>
                                              {isUnlocked && !isExpired ? (
                                                freeIsClaimed ? (
                                                  <span className="flex items-center gap-0.5 text-xs text-emerald-400 flex-shrink-0"><Check size={11} />Ok</span>
                                                ) : (
                                                  <button onClick={() => setQrReward({ bpId: bp.id, bpName: bp.name, level: lvl.level, tier: 'FREE', label: lvl.freeRewardLabel })} className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-md hover:bg-emerald-500/30 transition-colors flex-shrink-0 flex items-center gap-1">
                                                    <QrCode size={11} />QR
                                                  </button>
                                                )
                                              ) : null}
                                            </div>
                                          ) : null}

                                          {/* Premium reward */}
                                          {lvl.premiumRewardType ? (
                                            <div className="flex items-center justify-between gap-2">
                                              <div className="flex items-center gap-1.5 min-w-0">
                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                                                <span className="text-amber-400 flex-shrink-0">{getRewardIcon(lvl.premiumRewardType)}</span>
                                                <span className="text-xs text-gray-300 truncate">{lvl.premiumRewardLabel || lvl.premiumRewardType}</span>
                                                {lvl.premiumRewardValue ? <span className="text-xs text-amber-400 font-medium flex-shrink-0">{lvl.premiumRewardValue}€</span> : null}
                                              </div>
                                              {!userPass?.hasPremium ? (
                                                <span className="flex items-center gap-0.5 text-xs text-gray-600 flex-shrink-0"><Lock size={11} /></span>
                                              ) : isUnlocked && !isExpired ? (
                                                premiumIsClaimed ? (
                                                  <span className="flex items-center gap-0.5 text-xs text-amber-400 flex-shrink-0"><Check size={11} />Ok</span>
                                                ) : (
                                                  <button onClick={() => setQrReward({ bpId: bp.id, bpName: bp.name, level: lvl.level, tier: 'PREMIUM', label: lvl.premiumRewardLabel })} className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-md hover:bg-amber-500/30 transition-colors flex-shrink-0 flex items-center gap-1">
                                                    <QrCode size={11} />QR
                                                  </button>
                                                )
                                              ) : null}
                                            </div>
                                          ) : null}

                                          {!lvl.freeRewardType && !lvl.premiumRewardType && (
                                            <span className="text-xs text-gray-700">—</span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QR Code Modal */}
      {qrCodeOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
          <div className="bg-darker-bg rounded-2xl border border-gray-800 w-full max-w-sm animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent-mint/10 rounded-xl flex items-center justify-center">
                  <QrCode size={20} className="text-accent-mint" />
                </div>
                <h3 className="font-bold text-white">QR Code de retrait</h3>
              </div>
              <button
                onClick={() => setQrCodeOrder(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-dark-bg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5">
              <div className="bg-white rounded-xl p-4 mb-4">
                <QRCodeSVG
                  value={`${window.location.origin}/order-pickup/${qrCodeOrder.id}`}
                  size={250}
                  level="H"
                  className="w-full h-auto"
                />
              </div>

              <div className="text-center">
                <p className="text-gray-500 text-xs font-mono mb-2">
                  #{qrCodeOrder.id.toString().padStart(6, '0')}
                </p>
                {qrCodeOrder.discountAmount > 0 && qrCodeOrder.originalPrice ? (
                  <>
                    <p className="text-gray-500 line-through text-sm">{qrCodeOrder.originalPrice.toFixed(2)}€</p>
                    <p className="text-accent-mint font-koulen text-2xl">
                      {qrCodeOrder.totalPrice.toFixed(2)}€
                    </p>
                    <div className="flex items-center justify-center gap-1 mt-1 text-xs text-accent-mint">
                      <Gift size={12} />
                      <span>-{qrCodeOrder.discountAmount.toFixed(2)}€</span>
                    </div>
                  </>
                ) : (
                  <p className="text-accent-mint font-koulen text-2xl">
                    {qrCodeOrder.totalPrice.toFixed(2)}€
                  </p>
                )}
                <p className="text-gray-500 text-xs mt-4 bg-dark-bg rounded-lg px-3 py-2">
                  Presentez ce QR Code lors du retrait
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Battle Pass QR Code Modal */}
      {qrReward && user && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
          <div className="bg-darker-bg rounded-2xl border border-gray-800 w-full max-w-sm animate-fadeIn">
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                  <QrCode size={20} className="text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white">QR Code récompense</h3>
                  <p className="text-xs text-gray-500">{qrReward.bpName} — Niveau {qrReward.level}</p>
                </div>
              </div>
              <button onClick={() => setQrReward(null)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-dark-bg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              <div className="bg-white rounded-xl p-4 mb-4">
                <QRCodeSVG
                  value={`${window.location.origin}/battle-pass-claim/${qrReward.bpId}/${user.id}/${qrReward.level}/${qrReward.tier}`}
                  size={250}
                  level="H"
                  className="w-full h-auto"
                />
              </div>
              <div className="text-center space-y-2">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${qrReward.tier === 'PREMIUM' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  <Trophy size={12} />
                  Tier {qrReward.tier === 'PREMIUM' ? 'Premium' : 'Gratuit'} — {qrReward.label || 'Récompense'}
                </div>
                <p className="text-gray-500 text-xs mt-3 bg-dark-bg rounded-lg px-3 py-2">
                  Présentez ce QR Code au BDE pour valider la récupération
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
          <div className="bg-darker-bg rounded-2xl border border-gray-800 border-l-red-500/50 w-full max-w-md animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                  <AlertTriangle size={20} className="text-red-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Supprimer votre compte</h3>
                  <p className="text-red-400 text-xs">Cette action est irréversible</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteConfirmText('');
                }}
                disabled={isDeleting}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-dark-bg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5">
              <p className="text-gray-400 text-sm mb-4">
                Êtes-vous sûr de vouloir supprimer votre compte ? Cette action va :
              </p>
              <ul className="text-gray-400 text-sm space-y-2 mb-5">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  Supprimer vos informations personnelles (nom, email)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  Rendre impossible la connexion à ce compte
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  Conserver l'historique de vos commandes et inscriptions
                </li>
              </ul>

              <div className="mb-5">
                <label className="block text-gray-400 text-sm mb-2">
                  Pour confirmer, tapez <span className="font-bold text-red-400">SUPPRIMER</span> ci-dessous :
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="SUPPRIMER"
                  className="w-full bg-dark-bg border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setDeleteConfirmText('');
                  }}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 bg-dark-bg border border-gray-800 text-gray-300 font-medium rounded-xl hover:bg-gray-800 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'SUPPRIMER' || isDeleting}
                  className="flex-1 px-4 py-2.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Suppression...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Supprimer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAccountPage;