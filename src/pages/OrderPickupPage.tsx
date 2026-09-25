import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getOrderPickupInfo, confirmOrderPickup, refundOrderItems, type OrderPickupInfo } from '../api/orders';
import { useNotification } from '../context/NotificationContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import {
  Package,
  User,
  CreditCard,
  ShoppingBag,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  X,
  Banknote,
  RotateCcw,
  Minus,
  Plus,
  Gift
} from 'lucide-react';

const OrderPickupPage: React.FC = () => {
  useDocumentTitle('Retrait commande');
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const { addNotification } = useNotification();
  const [orderInfo, setOrderInfo] = useState<OrderPickupInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundQuantities, setRefundQuantities] = useState<Record<number, number>>({});
  const [refunding, setRefunding] = useState(false);

  const isAdmin = user?.type === 'ADMIN_BDE' || user?.type === 'ADMIN_PROF';

  useEffect(() => {
    const fetchOrderInfo = async () => {
      if (!id) {
        setError('ID de commande manquant');
        setLoading(false);
        return;
      }

      try {
        const data = await getOrderPickupInfo(parseInt(id));
        setOrderInfo(data);
      } catch (err: any) {
        setError(err.message || 'Erreur lors du chargement de la commande');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderInfo();
  }, [id]);

  const handleConfirmPickup = async () => {
    if (!id || !orderInfo) return;

    setConfirming(true);
    try {
      await confirmOrderPickup(parseInt(id));
      setOrderInfo({ ...orderInfo, orderStatus: 'COLLECTED' });
      addNotification('success', 'Commande marquee comme recuperee !');
      setShowConfirmModal(false);
    } catch (err: any) {
      addNotification('error', err.message || 'Erreur lors de la confirmation');
    } finally {
      setConfirming(false);
    }
  };

  const openRefundModal = () => {
    // Initialize refund quantities to 0
    const initialQuantities: Record<number, number> = {};
    orderInfo?.items.forEach(item => {
      initialQuantities[item.id] = 0;
    });
    setRefundQuantities(initialQuantities);
    setShowRefundModal(true);
  };

  const updateRefundQuantity = (itemId: number, delta: number) => {
    const item = orderInfo?.items.find(i => i.id === itemId);
    if (!item) return;

    const maxRefundable = item.quantity - item.refundedQuantity;
    const newQuantity = Math.max(0, Math.min(maxRefundable, (refundQuantities[itemId] || 0) + delta));
    setRefundQuantities(prev => ({ ...prev, [itemId]: newQuantity }));
  };

  const calculateRefundTotal = (): {
    itemPricesTotal: number; // Sum of item prices (after product discount)
    actualAmount: number; // Amount to refund (after cart discount)
    hasCartDiscount: boolean;
  } => {
    if (!orderInfo) return { itemPricesTotal: 0, actualAmount: 0, hasCartDiscount: false };

    // Calculate the total price after product discounts (sum of all item prices)
    const totalPriceAfterProductDiscounts = orderInfo.items.reduce(
      (sum, item) => sum + (item.price * item.quantity),
      0
    );

    // Calculate cart discount ratio
    const hasCartDiscount = orderInfo.cartDiscountAmount > 0 && totalPriceAfterProductDiscounts > 0;
    const cartDiscountRatio = hasCartDiscount
      ? orderInfo.cartDiscountAmount / totalPriceAfterProductDiscounts
      : 0;

    // Calculate refund amount based on item prices (already after product discount)
    const itemPricesTotal = orderInfo.items.reduce((total, item) => {
      return total + (refundQuantities[item.id] || 0) * item.price;
    }, 0);

    // Apply cart discount ratio to get actual refund amount
    const actualAmount = itemPricesTotal * (1 - cartDiscountRatio);

    return { itemPricesTotal, actualAmount, hasCartDiscount };
  };

  const hasItemsToRefund = () => {
    return Object.values(refundQuantities).some(qty => qty > 0);
  };

  const handleRefund = async () => {
    if (!id || !orderInfo || !hasItemsToRefund()) return;

    const itemsToRefund = orderInfo.items
      .filter(item => (refundQuantities[item.id] || 0) > 0)
      .map(item => ({
        orderItemId: item.id,
        quantity: refundQuantities[item.id]
      }));

    setRefunding(true);
    try {
      await refundOrderItems(parseInt(id), itemsToRefund);

      // Refresh order info
      const updatedInfo = await getOrderPickupInfo(parseInt(id));
      setOrderInfo(updatedInfo);

      addNotification('success', `Remboursement de ${calculateRefundTotal().actualAmount.toFixed(2)}€ effectue !`);
      setShowRefundModal(false);
    } catch (err: any) {
      addNotification('error', err.message || 'Erreur lors du remboursement');
    } finally {
      setRefunding(false);
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'CB': return 'Paiement sur place';
      case 'CASH': return 'Paiement sur place';
      case 'HELLOASSO': return 'HelloAsso';
      case 'BALANCE': return 'Solde ADIIL';
      case 'FREE': return 'Gratuit';
      default: return method;
    }
  };

  const getStatusBadge = (orderInfo: OrderPickupInfo) => {
    const { paymentStatus, orderStatus } = orderInfo;

    // Commande récupérée
    if (orderStatus === 'COLLECTED') {
      return (
        <span className="flex items-center gap-1 px-3 py-1.5 bg-accent-mint/20 text-accent-mint text-sm font-bold rounded-full">
          <CheckCircle size={14} /> Recuperee
        </span>
      );
    }

    // Commande annulée
    if (orderStatus === 'CANCELLED') {
      return (
        <span className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 text-red-400 text-sm font-bold rounded-full">
          <XCircle size={14} /> Annulee
        </span>
      );
    }

    // Remboursée
    if (paymentStatus === 'REFUNDED') {
      return (
        <span className="flex items-center gap-1 px-3 py-1.5 bg-purple-500/20 text-purple-400 text-sm font-bold rounded-full">
          <AlertCircle size={14} /> Remboursee
        </span>
      );
    }

    // Payée et prête à récupérer
    if (paymentStatus === 'PAID' && orderStatus === 'PAID') {
      return (
        <span className="flex items-center gap-1 px-3 py-1.5 bg-green-500/20 text-green-400 text-sm font-bold rounded-full">
          <Package size={14} /> Prete a recuperer
        </span>
      );
    }

    // En attente (paiement ou autre)
    return (
      <span className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500/20 text-yellow-400 text-sm font-bold rounded-full">
        <Clock size={14} /> En attente de paiement
      </span>
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-darker-bg">
        <div className="w-12 h-12 border-2 border-accent-mint border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Only admins can access this page
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-darker-bg">
        <div className="bg-dark-bg rounded-2xl border border-red-500/30 p-8 max-w-md text-center">
          <XCircle size={48} className="mx-auto text-red-400 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Acces refuse</h2>
          <p className="text-gray-400">Seuls les administrateurs peuvent acceder a cette page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-darker-bg">
        <div className="w-12 h-12 border-2 border-accent-mint border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-darker-bg">
        <div className="bg-dark-bg rounded-2xl border border-red-500/30 p-8 max-w-md text-center">
          <XCircle size={48} className="mx-auto text-red-400 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Erreur</h2>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!orderInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-darker-bg">
        <div className="bg-dark-bg rounded-2xl border border-gray-800 p-8 max-w-md text-center">
          <Package size={48} className="mx-auto text-gray-600 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Commande introuvable</h2>
          <p className="text-gray-400">Cette commande n'existe pas.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark-bg min-h-screen">
      {/* Header Section */}
      <section className="bg-darker-bg py-8 border-b border-gray-800">
        <div className="container mx-auto px-4">
          <span className="text-accent-mint text-sm font-bold uppercase tracking-wider">Retrait boutique</span>
          <h1 className="text-4xl md:text-5xl font-koulen text-white mt-2">
            COMMANDE #{orderInfo.id.toString().padStart(6, '0')}
          </h1>
        </div>
      </section>

      {/* Content */}
      <section className="py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Cash Payment Banner - only show if not yet collected */}
          {(orderInfo.paymentMethod === 'CASH' || orderInfo.paymentMethod === 'CB') && orderInfo.paymentStatus === 'PENDING' && orderInfo.orderStatus !== 'COLLECTED' && (
            <div className="bg-orange-500/20 border-2 border-orange-500 rounded-2xl p-5 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Banknote size={28} className="text-white" />
                </div>
                <div>
                  <h3 className="text-orange-400 font-bold text-lg">PAIEMENT SUR PLACE</h3>
                  <p className="text-orange-300 text-sm">
                    Le client doit payer {orderInfo.totalPrice.toFixed(2)}€ avant de recuperer sa commande
                    {orderInfo.discountAmount > 0 && orderInfo.originalPrice && (
                      <span className="block text-xs mt-1 text-orange-400">
                        (Prix original: {orderInfo.originalPrice.toFixed(2)}€, Réduction: -{orderInfo.discountAmount.toFixed(2)}€)
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Customer Info Card */}
          <div className="bg-darker-bg rounded-2xl border border-gray-800 p-6 mb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-accent-mint/10 rounded-xl flex items-center justify-center">
                <User size={28} className="text-accent-mint" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Client</p>
                <h2 className="text-2xl font-bold text-white">{orderInfo.customerName}</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`rounded-xl p-4 ${(orderInfo.paymentMethod === 'CASH' || orderInfo.paymentMethod === 'CB') ? 'bg-orange-500/10 border border-orange-500/30' : 'bg-dark-bg'}`}>
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                  <CreditCard size={14} />
                  Mode de paiement
                </div>
                <p className={`font-bold ${(orderInfo.paymentMethod === 'CASH' || orderInfo.paymentMethod === 'CB') ? 'text-orange-400' : 'text-white'}`}>
                  {getPaymentMethodLabel(orderInfo.paymentMethod)}
                </p>
              </div>
              <div className="bg-dark-bg rounded-xl p-4">
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                  <Clock size={14} />
                  Date de commande
                </div>
                <p className="text-white font-bold">
                  {new Date(orderInfo.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Status Card */}
          <div className="bg-darker-bg rounded-2xl border border-gray-800 p-6 mb-6">
            <h3 className="text-lg font-bold text-white mb-4">Statut</h3>
            <div className="flex flex-wrap gap-3">
              {getStatusBadge(orderInfo)}
            </div>
          </div>

          {/* Order Items Card */}
          <div className="bg-darker-bg rounded-2xl border border-gray-800 p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <ShoppingBag size={20} className="text-accent-mint" />
              <h3 className="text-lg font-bold text-white">Contenu de la commande</h3>
            </div>

            <div className="space-y-3">
              {orderInfo.items.map((item, index) => {
                // Check if item had a product discount
                const hasProductDiscount = item.originalPrice && item.originalPrice > item.price;
                const originalTotal = hasProductDiscount ? item.originalPrice! * item.quantity : null;
                const itemTotal = item.price * item.quantity;

                return (
                  <div key={index} className="bg-dark-bg rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <p className="text-white font-medium">{item.productName}</p>
                      <p className="text-gray-400 text-sm">
                        Quantite: {item.quantity}
                        {item.refundedQuantity > 0 && (
                          <span className="text-red-400 ml-1">({item.refundedQuantity} remb.)</span>
                        )}
                      </p>
                      {hasProductDiscount && (
                        <p className="text-red-400 text-xs mt-1">
                          Prix unitaire: <span className="line-through text-gray-500">{item.originalPrice!.toFixed(2)}€</span> → {item.price.toFixed(2)}€
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      {hasProductDiscount && (
                        <p className="text-gray-500 line-through text-sm">
                          {originalTotal!.toFixed(2)}€
                        </p>
                      )}
                      <p className={`font-koulen text-lg ${hasProductDiscount ? 'text-red-400' : 'text-accent-mint'}`}>
                        {itemTotal.toFixed(2)}€
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-700 space-y-2">
              {/* Discount Info */}
              {orderInfo.discountAmount > 0 && orderInfo.originalPrice && (
                <div className="bg-accent-mint/10 border border-accent-mint/20 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift size={16} className="text-accent-mint" />
                    <span className="text-accent-mint font-bold text-sm">Réductions appliquées</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Prix original:</span>
                    <span className="text-gray-300">{orderInfo.originalPrice.toFixed(2)}€</span>
                  </div>
                  {orderInfo.productDiscountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Réductions articles:</span>
                      <span className="text-accent-mint">-{orderInfo.productDiscountAmount.toFixed(2)}€</span>
                    </div>
                  )}
                  {orderInfo.cartDiscountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Réduction panier{orderInfo.promotion ? ` (${orderInfo.promotion.name})` : ''}:</span>
                      <span className="text-accent-mint">-{orderInfo.cartDiscountAmount.toFixed(2)}€</span>
                    </div>
                  )}
                  {orderInfo.productDiscountAmount > 0 && orderInfo.cartDiscountAmount > 0 && (
                    <div className="flex justify-between text-sm mt-1 pt-1 border-t border-accent-mint/20">
                      <span className="text-gray-400">Total réductions:</span>
                      <span className="text-accent-mint font-bold">-{orderInfo.discountAmount.toFixed(2)}€</span>
                    </div>
                  )}
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-medium">Total{orderInfo.discountAmount > 0 ? ' après réduction' : ''}</span>
                <span className="text-accent-mint font-koulen text-2xl">{orderInfo.totalPrice.toFixed(2)}€</span>
              </div>
              {orderInfo.refundedAmount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-red-400 text-sm">Rembourse</span>
                  <span className="text-red-400 font-bold">-{orderInfo.refundedAmount.toFixed(2)}€</span>
                </div>
              )}
            </div>
          </div>

          {/* Admin Action Buttons - Only show when NOT collected */}
          {isAdmin && orderInfo.orderStatus !== 'CANCELLED' && orderInfo.orderStatus !== 'COLLECTED' && orderInfo.paymentStatus !== 'REFUNDED' && (
            <div className="space-y-3">
              {/* Confirm Pickup Button */}
              <button
                onClick={() => setShowConfirmModal(true)}
                className="w-full py-4 bg-accent-mint text-dark-bg font-bold rounded-xl hover:bg-accent-mint/90 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle size={20} />
                Confirmer la recuperation
              </button>

              {/* Refund Button - only if there are items to refund */}
              {orderInfo.items.some(item => item.quantity > item.refundedQuantity) && (
                <button
                  onClick={openRefundModal}
                  className="w-full py-4 bg-red-500/10 border border-red-500/30 text-red-400 font-bold rounded-xl hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw size={20} />
                  Rembourser des articles
                </button>
              )}
            </div>
          )}

          {orderInfo.orderStatus === 'COLLECTED' && (
            <div className="space-y-3">
              <div className="bg-yellow-500/20 border-2 border-yellow-500 rounded-xl p-6 text-center">
                <AlertCircle size={48} className="mx-auto text-yellow-400 mb-3" />
                <p className="text-yellow-400 font-bold text-xl mb-2">COMMANDE DEJA RECUPEREE</p>
                <p className="text-yellow-300/80 text-sm">
                  Cette commande a deja ete remise au client.
                </p>
                <p className="text-yellow-300/60 text-xs mt-2">
                  Si le client presente ce QR code a nouveau, ne pas remettre les articles.
                </p>
              </div>
              {/* Refund button even after collection */}
              {isAdmin && orderInfo.paymentStatus !== 'REFUNDED' && orderInfo.items.some(item => item.quantity > item.refundedQuantity) && (
                <button
                  onClick={openRefundModal}
                  className="w-full py-3 bg-red-500/10 border border-red-500/30 text-red-400 font-medium rounded-xl hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw size={18} />
                  Rembourser des articles
                </button>
              )}
            </div>
          )}

          {orderInfo.orderStatus === 'CANCELLED' && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
              <XCircle size={32} className="mx-auto text-red-400 mb-2" />
              <p className="text-red-400 font-bold">Commande annulee</p>
            </div>
          )}

          {orderInfo.paymentStatus === 'REFUNDED' && orderInfo.orderStatus !== 'CANCELLED' && (
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 text-center">
              <RotateCcw size={32} className="mx-auto text-purple-400 mb-2" />
              <p className="text-purple-400 font-bold">Commande entierement remboursee</p>
            </div>
          )}
        </div>
      </section>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
          <div className="bg-darker-bg rounded-2xl border border-gray-800 w-full max-w-md animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent-mint/10 rounded-xl flex items-center justify-center">
                  <CheckCircle size={20} className="text-accent-mint" />
                </div>
                <h3 className="font-bold text-white">Confirmer la recuperation</h3>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={confirming}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-dark-bg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5">
              <p className="text-gray-400 text-sm mb-4">
                Etes-vous sur de vouloir marquer cette commande comme recuperee ?
              </p>

              <div className="bg-dark-bg rounded-xl p-4 mb-5 border border-gray-800/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-500 text-sm">Client</span>
                  <span className="text-white font-bold">{orderInfo.customerName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Total</span>
                  <span className="text-accent-mint font-koulen text-xl">{orderInfo.totalPrice.toFixed(2)}€</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  disabled={confirming}
                  className="flex-1 py-2.5 bg-dark-bg border border-gray-800 text-gray-300 font-medium rounded-xl hover:bg-gray-800 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmPickup}
                  disabled={confirming}
                  className="flex-1 py-2.5 bg-accent-mint text-dark-bg font-bold rounded-xl hover:bg-accent-mint/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {confirming ? (
                    <span className="w-5 h-5 border-2 border-dark-bg border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      Confirmer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && orderInfo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
          <div className="bg-darker-bg rounded-2xl border border-gray-800 w-full max-w-lg animate-fadeIn flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-800 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                  <RotateCcw size={20} className="text-red-400" />
                </div>
                <h3 className="font-bold text-white">Rembourser des articles</h3>
              </div>
              <button
                onClick={() => setShowRefundModal(false)}
                disabled={refunding}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-dark-bg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
              <p className="text-gray-400 mb-4 text-sm">
                Selectionnez les articles et quantites a rembourser pour la commande de <span className="text-white font-bold">{orderInfo.customerName}</span>
              </p>

              {/* HelloAsso Warning */}
              {orderInfo.paymentMethod === 'HELLOASSO' && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={20} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-yellow-400 font-bold text-sm">Attention - HelloAsso</p>
                      <p className="text-yellow-300/80 text-xs mt-1">
                        HelloAsso ne permet que les remboursements complets. Le remboursement partiel sera enregistre dans le systeme mais devra etre effectue manuellement sur HelloAsso ou par un autre moyen.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3 mb-5">
                {orderInfo.items.map((item) => {
                  const maxRefundable = item.quantity - item.refundedQuantity;
                  const currentRefund = refundQuantities[item.id] || 0;

                  // Calculate the total price after product discounts for cart discount ratio
                  const totalPriceAfterProductDiscounts = orderInfo.items.reduce(
                    (sum, i) => sum + (i.price * i.quantity),
                    0
                  );

                  // Calculate cart discount ratio and effective price per item
                  const hasCartDiscount = orderInfo.cartDiscountAmount > 0 && totalPriceAfterProductDiscounts > 0;
                  const cartDiscountRatio = hasCartDiscount
                    ? orderInfo.cartDiscountAmount / totalPriceAfterProductDiscounts
                    : 0;

                  // item.price is already after product discount, apply cart discount to get effective price
                  const effectivePrice = item.price * (1 - cartDiscountRatio);
                  const hasProductDiscount = item.originalPrice && item.originalPrice > item.price;

                  return (
                    <div key={item.id} className="bg-dark-bg rounded-xl p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-white font-medium">{item.productName}</p>
                          <p className="text-gray-400 text-xs mt-1">
                            {hasProductDiscount && (
                              <span className="line-through mr-1">{item.originalPrice!.toFixed(2)}€</span>
                            )}
                            {hasCartDiscount ? (
                              <>
                                {!hasProductDiscount && <span className="line-through mr-1">{item.price.toFixed(2)}€</span>}
                                {hasProductDiscount && <span className="line-through mr-1">{item.price.toFixed(2)}€</span>}
                                <span className="text-accent-mint">{effectivePrice.toFixed(2)}€</span>/unite
                              </>
                            ) : hasProductDiscount ? (
                              <><span className="text-accent-mint">{item.price.toFixed(2)}€</span>/unite</>
                            ) : (
                              <>{item.price.toFixed(2)}€/unite</>
                            )} - {item.quantity} achete{item.quantity > 1 ? 's' : ''}
                            {item.refundedQuantity > 0 && (
                              <span className="text-red-400"> ({item.refundedQuantity} deja remb.)</span>
                            )}
                          </p>
                        </div>
                        <p className="text-accent-mint font-koulen">
                          {(effectivePrice * item.quantity).toFixed(2)}€
                        </p>
                      </div>

                      {maxRefundable > 0 ? (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-sm">A rembourser:</span>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => updateRefundQuantity(item.id, -1)}
                              disabled={currentRefund === 0}
                              className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center text-white hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                              <Minus size={16} />
                            </button>
                            <span className="text-white font-bold w-8 text-center">{currentRefund}</span>
                            <button
                              onClick={() => updateRefundQuantity(item.id, 1)}
                              disabled={currentRefund >= maxRefundable}
                              className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center text-white hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                              <Plus size={16} />
                            </button>
                            <span className="text-gray-500 text-sm">/ {maxRefundable}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-red-400 text-sm text-center">Entierement rembourse</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Refund Total */}
              {(() => {
                const refundCalc = calculateRefundTotal();
                return (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-5">
                    <div className="flex justify-between items-center">
                      <span className="text-red-400 font-medium">Montant a rembourser</span>
                      <div className="text-right">
                        {refundCalc.hasCartDiscount && (
                          <span className="text-gray-500 line-through text-sm mr-2">{refundCalc.itemPricesTotal.toFixed(2)}€</span>
                        )}
                        <span className="text-red-400 font-koulen text-2xl">{refundCalc.actualAmount.toFixed(2)}€</span>
                      </div>
                    </div>
                    {refundCalc.hasCartDiscount && (
                      <p className="text-xs text-gray-500 mt-2">
                        Le montant reflète la réduction panier appliquée à la commande
                      </p>
                    )}
                  </div>
                );
              })()}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowRefundModal(false)}
                  disabled={refunding}
                  className="flex-1 py-2.5 bg-dark-bg border border-gray-800 text-gray-300 font-medium rounded-xl hover:bg-gray-800 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Annuler
                </button>
                <button
                  onClick={handleRefund}
                  disabled={refunding || !hasItemsToRefund()}
                  className="flex-1 py-2.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {refunding ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <RotateCcw size={18} />
                      Rembourser
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

export default OrderPickupPage;