import React, { useEffect, useState, useMemo } from 'react';
import { logger } from '../utils/logger';
import { getAllOrders, updateOrderStatus, updatePaymentStatus, refundOrderItems, type Order } from '../api/orders';
import { getAllInscriptions, updateInscriptionPaymentStatus, refundInscription, type Inscription } from '../api/inscriptions';
import { getAllEvents, type Event } from '../api/events';
import { Edit2, ShoppingBag, Calendar, CheckSquare, Square, Eye, Gift } from 'lucide-react';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import ConfirmDialog from '../components/ConfirmDialog';
import MultiSelect from '../components/MultiSelect';
import NumberInput from '../components/NumberInput';
import { useNotification } from '../context/NotificationContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const ITEMS_PER_PAGE = 50;

type ViewMode = 'orders' | 'inscriptions';

const PAYMENT_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'En attente' },
  { value: 'PAID', label: 'Payé' },
  { value: 'REFUNDED', label: 'Remboursé' },
];

const ORDER_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'En attente' },
  { value: 'PAID', label: 'Payée' },
  { value: 'COLLECTED', label: 'Récupérée' },
  { value: 'CANCELLED', label: 'Annulée' },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: 'HELLOASSO', label: 'HelloAsso' },
  { value: 'PAYPAL', label: 'PayPal' },
  { value: 'CASH_CB', label: 'Espèces/CB' },
  { value: 'FREE', label: 'Gratuit' },
];

const OrderManagementPage: React.FC = () => {
  useDocumentTitle('Admin - Commandes');
  const { addNotification } = useNotification();
  const [viewMode, setViewMode] = useState<ViewMode>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [currentInscription, setCurrentInscription] = useState<Inscription | null>(null);

  // Partial refund state
  const [refundSelection, setRefundSelection] = useState<{ [key: number]: number }>({});

  // Filters
  const [paymentFilter, setPaymentFilter] = useState<string[]>([]);
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string[]>([]);
  const [inscriptionSearchQuery, setInscriptionSearchQuery] = useState('');
  const [, setEvents] = useState<Event[]>([]);
  
  // Order specific filters
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string[]>([]);

  // Pagination
  const [ordersPage, setOrdersPage] = useState(1);
  const [inscriptionsPage, setInscriptionsPage] = useState(1);

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Cash refund choice modal state
  const [cashRefundModal, setCashRefundModal] = useState<{
    isOpen: boolean;
    itemsToRefund: { orderItemId: number; quantity: number }[];
    refundAmount: number;
  }>({
    isOpen: false,
    itemsToRefund: [],
    refundAmount: 0,
  });

  const fetchOrders = async () => {
    try {
      const data = await getAllOrders();
      setOrders(data);
    } catch (error) {
      logger.error('Failed to fetch orders', error);
    }
  };

  const fetchInscriptions = async () => {
    try {
      const filters: any = {};
      const data = await getAllInscriptions(filters);
      setInscriptions(data);
    } catch (error) {
      logger.error('Failed to fetch inscriptions', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    if (viewMode === 'orders') {
      await fetchOrders();
    } else {
      await fetchInscriptions();
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [viewMode]);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const eventsData = await getAllEvents();
        setEvents(eventsData);
      } catch (error) {
        logger.error('Failed to fetch events', error);
      }
    };
    loadEvents();
  }, []);

  useEffect(() => {
    if (viewMode === 'inscriptions') {
      fetchInscriptions();
    }
  }, []); // Removed deps

  // Filtered Orders Logic
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = orderSearchQuery === '' ||
          order.id.toString().includes(orderSearchQuery) ||
          (order.user && (
              order.user.firstName.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
              order.user.lastName.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
              order.user.email.toLowerCase().includes(orderSearchQuery.toLowerCase())
          ));

      const matchesStatus = orderStatusFilter.length === 0 || orderStatusFilter.includes(order.orderStatus);
      const matchesPayment = paymentFilter.length === 0 || paymentFilter.includes(order.paymentStatus);

      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [orders, orderSearchQuery, orderStatusFilter, paymentFilter]);

  // Filter inscriptions logic
  const filteredInscriptions = useMemo(() => {
    return inscriptions.filter(inscription => {
      if (paymentFilter.length > 0 && !paymentFilter.includes(inscription.paymentStatus)) return false;
      if (paymentMethodFilter.length > 0 && !paymentMethodFilter.includes(inscription.paymentMethod)) return false;

      if (inscriptionSearchQuery !== '') {
          const query = inscriptionSearchQuery.toLowerCase();
          const matchesId = inscription.id.toString().includes(query);
          const matchesUser = inscription.user && (
              inscription.user.firstName.toLowerCase().includes(query) ||
              inscription.user.lastName.toLowerCase().includes(query) ||
              inscription.user.email.toLowerCase().includes(query)
          );
          const matchesEvent = inscription.event && inscription.event.title.toLowerCase().includes(query);

          if (!matchesId && !matchesUser && !matchesEvent) return false;
      }

      return true;
    });
  }, [inscriptions, paymentFilter, paymentMethodFilter, inscriptionSearchQuery]);

  // Reset pagination when filters change
  useEffect(() => {
    setOrdersPage(1);
  }, [orderSearchQuery, orderStatusFilter, paymentFilter]);

  useEffect(() => {
    setInscriptionsPage(1);
  }, [inscriptionSearchQuery, paymentFilter, paymentMethodFilter]);

  // Pagination
  const ordersTotalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = useMemo(() => {
    const start = (ordersPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOrders, ordersPage]);

  const inscriptionsTotalPages = Math.ceil(filteredInscriptions.length / ITEMS_PER_PAGE);
  const paginatedInscriptions = useMemo(() => {
    const start = (inscriptionsPage - 1) * ITEMS_PER_PAGE;
    return filteredInscriptions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredInscriptions, inscriptionsPage]);

  const handleOpenEditOrder = (order: Order) => {
    setCurrentOrder(order);
    setCurrentInscription(null);
    setRefundSelection({});
    setIsModalOpen(true);
  };

  const handleOpenEditInscription = (inscription: Inscription) => {
    setCurrentInscription(inscription);
    setCurrentOrder(null);
    setIsModalOpen(true);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!currentOrder) return;
    try {
      await updateOrderStatus(currentOrder.id, newStatus);
      setIsModalOpen(false);
      fetchOrders();
      addNotification('success', 'Statut mis à jour avec succès');
    } catch (error) {
      logger.error('Failed to update order status', error);
      addNotification('error', 'Erreur lors de la mise à jour du statut');
    }
  };

  const handlePaymentStatusChange = async (newStatus: string) => {
    if (!currentOrder) return;
    try {
      await updatePaymentStatus(currentOrder.id, newStatus);
      setIsModalOpen(false);
      fetchOrders();
      addNotification('success', 'Statut de paiement mis à jour');
    } catch (error) {
      logger.error('Failed to update payment status', error);
      addNotification('error', 'Erreur lors de la mise à jour du statut de paiement');
    }
  };

  const handleInscriptionPaymentStatusChange = async (newStatus: string) => {
    if (!currentInscription) return;
    try {
      await updateInscriptionPaymentStatus(currentInscription.id, newStatus);
      setIsModalOpen(false);
      fetchInscriptions();
      addNotification('success', 'Statut de paiement mis à jour');
    } catch (error) {
      logger.error('Failed to update inscription payment status', error);
      addNotification('error', 'Erreur lors de la mise à jour du statut de paiement');
    }
  };

  const handleRefundInscription = () => {
    if (!currentInscription) return;

    const confirmMessage = `Êtes-vous sûr de vouloir rembourser cette inscription ?\n\nParticipant : ${currentInscription.user?.firstName} ${currentInscription.user?.lastName}\nMontant : ${currentInscription.totalPrice} €\nMéthode : ${currentInscription.paymentMethod}\n\nCette action va :\n- Rembourser le paiement via ${currentInscription.paymentMethod === 'PAYPAL' ? 'PayPal' : 'HelloAsso'}\n- Marquer l'inscription comme REMBOURSÉE\n- Libérer la place pour cet événement`;

    setConfirmDialog({
      isOpen: true,
      title: 'Confirmer le remboursement',
      message: confirmMessage,
      onConfirm: async () => {
        try {
          await refundInscription(currentInscription.id);
          addNotification('success', 'Inscription remboursée avec succès. La place a été libérée.');
          setIsModalOpen(false);
          fetchInscriptions();
        } catch (error) {
          logger.error('Failed to refund inscription', error);
          addNotification('error', `Erreur lors du remboursement: ${(error as any).message || 'Une erreur est survenue'}`);
        }
      },
    });
  };

  // Partial Refund Logic
  const toggleRefundItem = (itemId: number, maxQuantity: number) => {
    setRefundSelection(prev => {
      const current = prev[itemId] || 0;
      if (current > 0) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: maxQuantity }; // Default to max refund
    });
  };

  const updateRefundQuantity = (itemId: number, quantity: number, maxQuantity: number) => {
    if (quantity < 0) quantity = 0;
    if (quantity > maxQuantity) quantity = maxQuantity;

    setRefundSelection(prev => {
        if (quantity === 0) {
            const { [itemId]: _, ...rest } = prev;
            return rest;
        }
        return { ...prev, [itemId]: quantity };
    });
  };

  // Calculate actual refund amount considering discounts
  const calculateRefundAmount = (order: Order, selection: { [key: number]: number }): { itemPricesTotal: number; actualAmount: number; hasCartDiscount: boolean } => {
    // Calculate the total price after product discounts (sum of all item prices)
    const totalPriceAfterProductDiscounts = order.items.reduce(
      (sum, item) => sum + (item.price * item.quantity),
      0
    );

    // Calculate cart discount ratio
    const hasCartDiscount = (order.cartDiscountAmount || 0) > 0 && totalPriceAfterProductDiscounts > 0;
    const cartDiscountRatio = hasCartDiscount
      ? (order.cartDiscountAmount || 0) / totalPriceAfterProductDiscounts
      : 0;

    // Calculate refund amount based on item prices (already after product discount)
    const itemPricesTotal = order.items.reduce((sum, item) => {
      return sum + (selection[item.id] || 0) * item.price;
    }, 0);

    // Apply cart discount ratio to get actual refund amount
    const actualAmount = itemPricesTotal * (1 - cartDiscountRatio);

    return { itemPricesTotal, actualAmount, hasCartDiscount };
  };

  const handleProcessPartialRefund = () => {
      if (!currentOrder) return;

      const itemsToRefund = Object.entries(refundSelection).map(([itemId, quantity]) => ({
          orderItemId: parseInt(itemId),
          quantity
      }));

      if (itemsToRefund.length === 0) {
          addNotification('info', 'Aucun article sélectionné pour le remboursement');
          return;
      }

      const isHelloAsso = currentOrder.paymentMethod === 'HELLOASSO';
      const isCashCB = currentOrder.paymentMethod === 'CASH_CB';
      const isFullRefundAttempt = currentOrder.items.every(item => {
          const totalRefundedForThisItem = (item.refundedQuantity || 0) + (refundSelection[item.id] || 0);
          return totalRefundedForThisItem >= item.quantity;
      });

      if (isHelloAsso && !isFullRefundAttempt) {
          addNotification('error', 'Pour les paiements HelloAsso, seul un remboursement complet est possible via l\'API.');
          return;
      }

      // Calculate refund amount considering discounts
      const refundCalc = calculateRefundAmount(currentOrder, refundSelection);

      // For CASH_CB orders, show special modal with cancel/refund choice
      if (isCashCB) {
          setCashRefundModal({
              isOpen: true,
              itemsToRefund,
              refundAmount: refundCalc.actualAmount,
          });
          return;
      }

      // For other payment methods, show normal confirm dialog
      let confirmMessage = `Vous allez rembourser un montant de ${refundCalc.actualAmount.toFixed(2)} €.`;
      if (refundCalc.hasCartDiscount) {
        confirmMessage += `\n\n(Avant réduction panier: ${refundCalc.itemPricesTotal.toFixed(2)} €)`;
      }
      confirmMessage += '\n\nCette action est irréversible.';

      setConfirmDialog({
          isOpen: true,
          title: 'Confirmer le remboursement',
          message: confirmMessage,
          onConfirm: async () => {
              try {
                  await refundOrderItems(currentOrder.id, itemsToRefund);
                  addNotification('success', 'Remboursement effectué avec succès');
                  setIsModalOpen(false);
                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                  fetchOrders();
              } catch (error) {
                  logger.error('Refund failed', error);
                  addNotification('error', (error as any).message || 'Échec du remboursement');
              }
          }
      });
  };

  // Handle cash refund with choice (cancel only or refund to balance)
  const handleCashRefund = async (refundToBalance: boolean) => {
      if (!currentOrder) return;

      try {
          await refundOrderItems(currentOrder.id, cashRefundModal.itemsToRefund, {
              refundToBalance,
              cancelOnly: !refundToBalance,
          });
          const message = refundToBalance
              ? 'Remboursement effectué sur le solde ADIIL'
              : 'Commande annulée avec succès';
          addNotification('success', message);
          setIsModalOpen(false);
          setCashRefundModal({ isOpen: false, itemsToRefund: [], refundAmount: 0 });
          fetchOrders();
      } catch (error) {
          logger.error('Refund failed', error);
          addNotification('error', (error as any).message || 'Échec de l\'opération');
      }
  };

  // Determine if full refund attempt for button disable state
  const isFullRefundAttemptForButton = currentOrder?.items.every(item => {
      const availableRefund = item.quantity - (item.refundedQuantity || 0);
      return (refundSelection[item.id] || 0) === availableRefund;
  }) || false;

  if (loading) return <div className="text-center p-8">Chargement...</div>;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-1 h-12 bg-green-500 rounded-full hidden sm:block" />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-bold rounded-full uppercase tracking-wide">Gestion</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold text-white font-koulen">COMMANDES & INSCRIPTIONS</h1>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-darker-bg p-1.5 rounded-xl border border-gray-800 w-fit">
        <button
          onClick={() => setViewMode('orders')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold transition-all text-sm ${
            viewMode === 'orders'
              ? 'bg-green-500 text-darker-bg shadow-lg shadow-green-500/20'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <ShoppingBag size={16} />
          <span className="hidden sm:inline">Commandes</span>
          <span className="sm:hidden">Cmd</span>
        </button>
        <button
          onClick={() => setViewMode('inscriptions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold transition-all text-sm ${
            viewMode === 'inscriptions'
              ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Calendar size={16} />
          <span className="hidden sm:inline">Inscriptions</span>
          <span className="sm:hidden">Insc</span>
        </button>
      </div>

      {/* Filters for orders */}
      {viewMode === 'orders' && (
        <div className="bg-darker-bg border border-gray-800 rounded-2xl p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="text-gray-500 font-medium block mb-2 text-xs uppercase tracking-wide">Rechercher</label>
              <input
                type="text"
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
                placeholder="ID, Nom, Email..."
                className="w-full bg-dark-bg border border-gray-800 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:border-green-500/50 outline-none transition-colors"
              />
            </div>

            {/* Payment Status Filter */}
            <div>
              <MultiSelect
                label="Statut de paiement:"
                options={PAYMENT_STATUS_OPTIONS}
                selectedValues={paymentFilter}
                onChange={setPaymentFilter}
              />
            </div>

            {/* Order Status Filter */}
            <div>
              <MultiSelect
                label="Statut de la commande:"
                options={ORDER_STATUS_OPTIONS}
                selectedValues={orderStatusFilter}
                onChange={setOrderStatusFilter}
              />
            </div>
          </div>
        </div>
      )}

      {/* Filters for inscriptions */}
      {viewMode === 'inscriptions' && (
        <div className="bg-darker-bg border border-gray-800 rounded-2xl p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Filter */}
            <div>
              <label className="text-gray-500 font-medium block mb-2 text-xs uppercase tracking-wide">Rechercher</label>
              <input
                type="text"
                value={inscriptionSearchQuery}
                onChange={(e) => setInscriptionSearchQuery(e.target.value)}
                placeholder="ID, Nom, Email, Evenement..."
                className="w-full bg-dark-bg border border-gray-800 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:border-purple-500/50 outline-none transition-colors"
              />
            </div>

            {/* Payment Status Filter */}
            <div>
              <MultiSelect
                label="Statut de paiement:"
                options={PAYMENT_STATUS_OPTIONS}
                selectedValues={paymentFilter}
                onChange={setPaymentFilter}
              />
            </div>

            {/* Payment Method Filter */}
            <div>
              <MultiSelect
                label="Methode de paiement:"
                options={PAYMENT_METHOD_OPTIONS}
                selectedValues={paymentMethodFilter}
                onChange={setPaymentMethodFilter}
              />
            </div>
          </div>
        </div>
      )}

      {viewMode === 'orders' ? (
        <>
        <div className="bg-darker-bg border border-gray-700 rounded-lg overflow-hidden overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-dark-bg">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Client</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden md:table-cell">Date</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Paiement</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden sm:table-cell">Statut</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden lg:table-cell">Méthode</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Montant</th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 sm:px-6 py-8 text-center text-gray-500">
                    Aucune commande trouvée
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-darker-bg/50">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-bold text-white">
                      #{order.id.toString().padStart(6, '0')}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        {order.user ? `${order.user.firstName} ${order.user.lastName}` : 'Utilisateur inconnu'}
                      </div>
                      <div className="text-xs text-gray-500 hidden sm:block">{order.user?.email}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-300 hidden md:table-cell">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        order.paymentStatus === 'PAID' ? 'bg-green-900/50 text-green-200' :
                        order.paymentStatus === 'REFUNDED' ? 'bg-purple-900/50 text-purple-200' :
                        'bg-red-900/50 text-red-200'
                      }`}>
                        {order.paymentStatus === 'PENDING' ? 'Non Payé' :
                         order.paymentStatus === 'PAID' ? 'Payé' : 'Remboursé'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        order.orderStatus === 'COLLECTED' ? 'bg-green-900/50 text-green-200' :
                        order.orderStatus === 'CANCELLED' ? 'bg-red-900/50 text-red-200' :
                        'bg-yellow-900/50 text-yellow-200'
                      }`}>
                        {order.orderStatus === 'PENDING' ? 'En attente' :
                         order.orderStatus === 'PAID' ? 'Payée' :
                         order.orderStatus === 'COLLECTED' ? 'Récupérée' : 'Annulée'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-300 hidden lg:table-cell">
                      {order.paymentMethod === 'HELLOASSO' ? 'HelloAsso' :
                       order.paymentMethod === 'PAYPAL' ? 'PayPal' :
                       order.paymentMethod === 'CASH_CB' ? 'Espèces/CB' :
                       order.paymentMethod === 'FREE' ? 'Gratuit' :
                       order.paymentMethod === 'BALANCE' ? 'Solde ADIIL' : order.paymentMethod}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm">
                      {order.discountAmount > 0 && order.originalPrice ? (
                        <div>
                          <span className="text-gray-500 line-through text-xs block">{order.originalPrice.toFixed(2)} €</span>
                          <span className="font-bold text-green-400">{order.totalPrice.toFixed(2)} €</span>
                          <div className="text-xs mt-0.5 space-y-0.5">
                            {order.productDiscountAmount && order.productDiscountAmount > 0 && (
                              <span className="text-red-400 flex items-center gap-1">
                                <Gift size={10} />
                                Articles: -{order.productDiscountAmount.toFixed(2)}€
                              </span>
                            )}
                            {order.cartDiscountAmount && order.cartDiscountAmount > 0 && (
                              <span className="text-green-400 flex items-center gap-1">
                                <Gift size={10} />
                                Panier: -{order.cartDiscountAmount.toFixed(2)}€
                              </span>
                            )}
                            {(!order.productDiscountAmount || order.productDiscountAmount === 0) &&
                             (!order.cartDiscountAmount || order.cartDiscountAmount === 0) && (
                              <span className="text-green-400 flex items-center gap-1">
                                <Gift size={10} />
                                -{order.discountAmount.toFixed(2)}€
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="font-bold text-green-400">{order.totalPrice.toFixed(2)} €</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleOpenEditOrder(order)}
                        className="text-green-400 hover:text-white transition-colors"
                        title="Voir les détails"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={ordersPage}
          totalPages={ordersTotalPages}
          totalItems={filteredOrders.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setOrdersPage}
        />
        </>
      ) : (
        <>
        <div className="bg-darker-bg border border-gray-700 rounded-lg overflow-hidden overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-dark-bg">
            <tr>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Événement</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden sm:table-cell">Participant</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden lg:table-cell">Date</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden md:table-cell">Places</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Montant</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Paiement</th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden lg:table-cell">Méthode</th>
              <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {paginatedInscriptions.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 sm:px-6 py-8 text-center text-gray-500">
                  Aucune inscription trouvée
                </td>
              </tr>
            ) : (
              paginatedInscriptions.map((inscription) => (
                <tr key={inscription.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-300">
                    #{inscription.id}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">
                      {inscription.event?.title || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500 hidden sm:block">
                      {inscription.event?.date ? new Date(inscription.event.date).toLocaleDateString('fr-FR') : 'N/A'}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                    <div className="text-sm font-medium text-white">
                      {inscription.user ? `${inscription.user.firstName} ${inscription.user.lastName}` : 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500">{inscription.user?.email}</div>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-400 hidden lg:table-cell">
                    {new Date(inscription.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-white hidden md:table-cell">
                    {inscription.quantity}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-bold text-white">
                    {inscription.totalPrice === 0 ? 'Gratuit' : `${inscription.totalPrice} €`}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      inscription.paymentStatus === 'PAID' ? 'bg-green-900/50 text-green-200' :
                      inscription.paymentStatus === 'REFUNDED' ? 'bg-purple-900/50 text-purple-200' :
                      'bg-red-900/50 text-red-200'
                    }`}>
                      {inscription.paymentStatus === 'PENDING' ? 'En attente' :
                       inscription.paymentStatus === 'PAID' ? 'Payé' : 'Remboursé'}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-400 hidden lg:table-cell">
                    {inscription.paymentMethod === 'HELLOASSO' ? 'HelloAsso' :
                     inscription.paymentMethod === 'PAYPAL' ? 'PayPal' :
                     inscription.paymentMethod === 'CASH_CB' ? 'Espèces/CB' : 'Gratuit'}
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleOpenEditInscription(inscription)} className="text-green-400 hover:text-white">
                      <Edit2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>

        <Pagination
          currentPage={inscriptionsPage}
          totalPages={inscriptionsTotalPages}
          totalItems={filteredInscriptions.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setInscriptionsPage}
        />
        </>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentOrder ? `Modifier la commande #${currentOrder.id.toString()}` : `Modifier l\'inscription #${currentInscription?.id}`}
      >
        <div className="space-y-6">
          {currentOrder ? (
            <>
            {/* Order Edit */}
            <div>
                <h3 className="text-lg font-bold mb-2 text-gray-300">Statut de la commande</h3>
                <div className="grid grid-cols-2 gap-2">
                    {['PENDING', 'PAID', 'COLLECTED', 'CANCELLED'].map((status) => (
                        <button
                            key={status}
                            onClick={() => handleStatusChange(status)}
                            className={`py-2 px-4 rounded border ${currentOrder?.orderStatus === status ? 'bg-green-400 text-darker-bg border-green-400 font-bold' : 'bg-dark-bg border-gray-600 text-gray-400 hover:bg-gray-700'}`}
                        >
                            {status === 'PENDING' ? 'En attente' :
                             status === 'PAID' ? 'Payée' :
                             status === 'COLLECTED' ? 'Récupérée' : 'Annulée'}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-lg font-bold mb-2 text-gray-300">Statut du paiement</h3>
                <div className="grid grid-cols-3 gap-2">
                    {['PENDING', 'PAID', 'REFUNDED'].map((status) => (
                        <button
                            key={status}
                            onClick={() => handlePaymentStatusChange(status)}
                            className={`py-2 px-4 rounded border ${currentOrder?.paymentStatus === status ? 'bg-green-400 text-darker-bg border-green-400 font-bold' : 'bg-dark-bg border-gray-600 text-gray-400 hover:bg-gray-700'}`}
                        >
                             {status === 'PENDING' ? 'Non Payé' :
                              status === 'PAID' ? 'Payé' : 'Remboursé'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Order Details Section */}
            <div className="border-t border-gray-700 pt-4 mt-4">
                <h3 className="text-lg font-bold mb-3 text-gray-300">Détails de la commande</h3>
                <div className="bg-darker-bg p-4 rounded border border-gray-700">
                    <ul className="space-y-3">
                        {currentOrder.items.map((item) => {
                            // Calculate cart discount ratio
                            const totalAfterProductDiscount = currentOrder.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
                            const hasCartDiscount = (currentOrder.cartDiscountAmount || 0) > 0 && totalAfterProductDiscount > 0;
                            const cartDiscountRatio = hasCartDiscount ? (currentOrder.cartDiscountAmount || 0) / totalAfterProductDiscount : 0;
                            const effectivePrice = item.price * (1 - cartDiscountRatio);
                            const hasProductDiscount = item.originalPrice && item.originalPrice > item.price;
                            const originalTotal = hasProductDiscount ? item.originalPrice! * item.quantity : item.price * item.quantity;
                            const effectiveTotal = effectivePrice * item.quantity;

                            return (
                                <li key={item.id} className="flex justify-between items-start pb-3 border-b border-gray-700 last:border-0 last:pb-0">
                                    <div className="flex-1">
                                        <div className="text-white font-medium">
                                            {item.product.name}
                                        </div>
                                        {item.variantId && item.product.variants && (
                                            <div className="text-green-400 text-sm mt-1">
                                                {(item.product.variants as any[]).find((v: any) => String(v.id) === String(item.variantId))?.name}
                                            </div>
                                        )}
                                        <div className="text-gray-400 text-sm mt-1">
                                            Quantité: {item.quantity}
                                            {item.refundedQuantity > 0 && (
                                                <span className="text-red-400 ml-2">
                                                    (dont {item.refundedQuantity} remboursé{item.refundedQuantity > 1 ? 's' : ''})
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-gray-400 text-sm">
                                            Prix unitaire: {hasProductDiscount && (
                                                <span className="line-through text-gray-500 mr-1">{item.originalPrice!.toFixed(2)} €</span>
                                            )}
                                            {hasProductDiscount ? (
                                                <span className="text-red-400">{item.price.toFixed(2)} €</span>
                                            ) : (
                                                <span>{item.price.toFixed(2)} €</span>
                                            )}
                                            {hasProductDiscount && <span className="text-red-400 text-xs ml-1">(promo article)</span>}
                                        </div>
                                    </div>
                                    <div className="text-right ml-4">
                                        {(hasProductDiscount || hasCartDiscount) ? (
                                            <div>
                                                <div className="text-gray-500 line-through text-sm">
                                                    {originalTotal.toFixed(2)} €
                                                </div>
                                                <div className="text-green-400 font-bold">
                                                    {effectiveTotal.toFixed(2)} €
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-white font-bold">
                                                {effectiveTotal.toFixed(2)} €
                                            </div>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                    {/* Discount info */}
                    {currentOrder.discountAmount > 0 && (
                        <div className="mt-4 p-3 bg-green-400/10 border border-green-400/20 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <Gift size={16} className="text-green-400" />
                                <span className="text-green-400 font-bold">Réductions appliquées</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Prix original:</span>
                                <span className="text-gray-300">{currentOrder.originalPrice?.toFixed(2)} €</span>
                            </div>
                            {currentOrder.productDiscountAmount && currentOrder.productDiscountAmount > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Réductions articles:</span>
                                    <span className="text-red-400">-{currentOrder.productDiscountAmount.toFixed(2)} €</span>
                                </div>
                            )}
                            {currentOrder.cartDiscountAmount && currentOrder.cartDiscountAmount > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Réduction panier{currentOrder.promotion ? ` (${currentOrder.promotion.name})` : ''}:</span>
                                    <span className="text-green-400">-{currentOrder.cartDiscountAmount.toFixed(2)} €</span>
                                </div>
                            )}
                            {currentOrder.productDiscountAmount && currentOrder.productDiscountAmount > 0 &&
                             currentOrder.cartDiscountAmount && currentOrder.cartDiscountAmount > 0 && (
                                <div className="flex justify-between text-sm mt-1 pt-1 border-t border-green-400/20">
                                    <span className="text-gray-400">Total réductions:</span>
                                    <span className="text-green-400 font-bold">-{currentOrder.discountAmount.toFixed(2)} €</span>
                                </div>
                            )}
                        </div>
                    )}
                    <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between items-center">
                        <span className="text-gray-400 font-medium">Total {currentOrder.discountAmount > 0 ? 'après réduction' : 'de la commande'}:</span>
                        <span className="text-green-400 font-bold text-xl">{currentOrder.totalPrice.toFixed(2)} €</span>
                    </div>
                    {currentOrder.refundedAmount > 0 && (
                        <div className="mt-2 flex justify-between items-center text-sm">
                            <span className="text-gray-400">Montant remboursé:</span>
                            <span className="text-red-400 font-bold">-{currentOrder.refundedAmount.toFixed(2)} €</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Partial Refund Section */}
            {currentOrder.paymentStatus === 'PAID' && (
                <div className="border-t border-gray-700 pt-4 mt-4">
                    <h3 className="text-lg font-bold mb-2 text-gray-300">Remboursement</h3>
                    {currentOrder.paymentMethod === 'HELLOASSO' && (
                        <p className="text-yellow-400 text-sm mb-4">
                            Note: Pour les paiements HelloAsso, seul un remboursement complet de la commande possible.
                        </p>
                    )}
                    <div className="bg-darker-bg p-4 rounded border border-gray-700 max-h-60 overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-400 border-b border-gray-700">
                                    <th className="pb-2">Article</th>
                                    <th className="pb-2">Prix</th>
                                    <th className="pb-2 text-center">Qté. Achetée</th>
                                    <th className="pb-2 text-center">Déjà Remb.</th>
                                    <th className="pb-2 text-right">Rembourser</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentOrder.items.map(item => {
                                    const availableRefund = item.quantity - (item.refundedQuantity || 0);
                                    if (availableRefund <= 0) return null;

                                    // Find variant info if variantId exists (compare as strings to handle type mismatch)
                                    const variantInfo = item.variantId && item.product.variants ?
                                        (item.product.variants as any[]).find((v: any) => String(v.id) === String(item.variantId)) : null;

                                    return (
                                        <tr key={item.id} className="border-b border-gray-700 last:border-0">
                                            <td className="py-2">
                                                {item.product.name}
                                                {variantInfo && (
                                                    <span className="ml-2 text-xs text-green-400">
                                                        ({variantInfo.name})
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-2">
                                                {(() => {
                                                    // Calculate cart discount ratio
                                                    const totalAfterProductDiscount = currentOrder.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
                                                    const hasCartDiscount = (currentOrder.cartDiscountAmount || 0) > 0 && totalAfterProductDiscount > 0;
                                                    const cartDiscountRatio = hasCartDiscount ? (currentOrder.cartDiscountAmount || 0) / totalAfterProductDiscount : 0;
                                                    const effectivePrice = item.price * (1 - cartDiscountRatio);
                                                    const hasProductDiscount = item.originalPrice && item.originalPrice > item.price;

                                                    if (hasProductDiscount || hasCartDiscount) {
                                                        return (
                                                            <div>
                                                                {hasProductDiscount && (
                                                                    <span className="text-gray-500 line-through text-xs mr-1">{item.originalPrice!.toFixed(2)} €</span>
                                                                )}
                                                                {hasCartDiscount ? (
                                                                    <>
                                                                        {hasProductDiscount && <span className="text-red-400 line-through text-xs mr-1">{item.price.toFixed(2)} €</span>}
                                                                        {!hasProductDiscount && <span className="text-gray-500 line-through text-xs mr-1">{item.price.toFixed(2)} €</span>}
                                                                        <span className="text-green-400">{effectivePrice.toFixed(2)} €</span>
                                                                    </>
                                                                ) : (
                                                                    <span className="text-red-400">{item.price.toFixed(2)} €</span>
                                                                )}
                                                            </div>
                                                        );
                                                    }
                                                    return <span>{item.price.toFixed(2)} €</span>;
                                                })()}
                                            </td>
                                            <td className="py-2 text-center">{item.quantity}</td>
                                            <td className="py-2 text-center">{item.refundedQuantity || 0}</td>
                                            <td className="py-2 text-right flex items-center justify-end gap-2">
                                                <NumberInput
                                                    value={refundSelection[item.id] || 0}
                                                    onChange={(val) => updateRefundQuantity(item.id, Math.min(parseInt(val) || 0, availableRefund), availableRefund)}
                                                    allowDecimals={false}
                                                    className="w-16 bg-dark-bg border border-gray-600 rounded px-2 py-1 text-right text-white"
                                                />
                                                <button
                                                    onClick={() => toggleRefundItem(item.id, availableRefund)}
                                                    className={`p-1 rounded ${refundSelection[item.id] > 0 ? 'text-green-400' : 'text-gray-500'}`}
                                                >
                                                    {refundSelection[item.id] > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Refund summary */}
                    {Object.keys(refundSelection).length > 0 && (() => {
                        const refundCalc = calculateRefundAmount(currentOrder, refundSelection);
                        return (
                            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <span className="text-red-400 font-medium">Montant à rembourser:</span>
                                    <div className="text-right">
                                        {refundCalc.hasCartDiscount && (
                                            <span className="text-gray-500 line-through text-sm mr-2">{refundCalc.itemPricesTotal.toFixed(2)} €</span>
                                        )}
                                        <span className="text-red-400 font-bold text-lg">{refundCalc.actualAmount.toFixed(2)} €</span>
                                    </div>
                                </div>
                                {refundCalc.hasCartDiscount && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Le montant reflète la réduction panier appliquée à la commande
                                    </p>
                                )}
                            </div>
                        );
                    })()}

                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={handleProcessPartialRefund}
                            disabled={Object.keys(refundSelection).length === 0 || (currentOrder.paymentMethod === 'HELLOASSO' && !isFullRefundAttemptForButton)}
                            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded transition-colors"
                        >
                            Confirmer Remboursement
                        </button>
                    </div>
                </div>
            )}

             <div className="flex justify-end pt-4 border-t border-gray-700">
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-300 hover:text-white">Fermer</button>
            </div>
            </>
          ) : currentInscription ? (
            <>
            {/* Inscription Edit */}
            <div>
                <h3 className="text-lg font-bold mb-2 text-gray-300">Statut du paiement</h3>
                <div className="grid grid-cols-3 gap-2">
                    {['PENDING', 'PAID', 'REFUNDED'].map((status) => (
                        <button
                            key={status}
                            onClick={() => handleInscriptionPaymentStatusChange(status)}
                            className={`py-2 px-4 rounded border ${currentInscription?.paymentStatus === status ? 'bg-green-400 text-darker-bg border-green-400 font-bold' : 'bg-dark-bg border-gray-600 text-gray-400 hover:bg-gray-700'}`}
                        >
                             {status === 'PENDING' ? 'En attente' :
                              status === 'PAID' ? 'Payé' : 'Remboursé'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Display selected options and form responses */}
            {((currentInscription.options && (currentInscription.options as any[]).length > 0) ||
              currentInscription.formResponses) && (
              <div className="border-t border-gray-700 pt-4 mt-4">
                <h3 className="text-lg font-bold mb-3 text-gray-300">Détails de l'inscription</h3>

                {/* Display selected options */}
                {currentInscription.options && (currentInscription.options as any[]).length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-bold text-gray-400 mb-2">Options sélectionnées:</h4>
                    <div className="space-y-2">
                      {(currentInscription.options as any[]).map((option: any, index: number) => {
                        // Find the option details from the event
                        const eventOption = currentInscription.event?.options?.find(
                          (opt: any) => opt.id === option.id
                        );

                        return (
                          <div
                            key={index}
                            className="bg-darker-bg border border-gray-700 rounded p-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-white font-medium">
                                {eventOption?.name || option.name || 'Option'}
                              </span>
                              <span className="text-green-400 font-bold">
                                {option.price > 0 ? `+${option.price} €` : 'Gratuit'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Display form responses */}
                {currentInscription.formResponses && Object.keys(currentInscription.formResponses as any).length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-gray-400 mb-2">Réponses au formulaire:</h4>
                    <div className="space-y-2">
                      {Object.entries(currentInscription.formResponses as any).map(([fieldId, response]: [string, any]) => {
                        // Find the field details from the event
                        // Try both string comparison and number comparison
                        const formField = currentInscription.event?.formFields?.find(
                          (field: any) => String(field.id) === String(fieldId)
                        );

                        // Extract value from response (handle both object and primitive values)
                        let displayValue = response;
                        if (response && typeof response === 'object' && !Array.isArray(response)) {
                          displayValue = response.value !== undefined ? response.value : JSON.stringify(response);
                        }

                        return (
                          <div
                            key={fieldId}
                            className="bg-darker-bg border border-gray-700 rounded p-3"
                          >
                            <div className="text-xs text-gray-400 mb-1">
                              {formField?.label || `Question #${fieldId}`}
                              {formField?.required && <span className="text-red-400 ml-1">*</span>}
                            </div>
                            <div className="text-white">
                              {typeof displayValue === 'boolean'
                                ? (displayValue ? 'Oui' : 'Non')
                                : (displayValue || 'N/A')}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Refund Button - Only for PAID inscriptions with PAYPAL or HELLOASSO */}
            {currentInscription.paymentStatus === 'PAID' &&
             (currentInscription.paymentMethod === 'PAYPAL' || currentInscription.paymentMethod === 'HELLOASSO') && (
              <div className="pt-4 border-t border-gray-700">
                <h3 className="text-lg font-bold mb-3 text-gray-300">Remboursement</h3>
                <button
                  onClick={handleRefundInscription}
                  className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
                >
                  Rembourser via {currentInscription.paymentMethod === 'PAYPAL' ? 'PayPal' : 'HelloAsso'}
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  Le remboursement sera traité automatiquement et la place sera libérée.
                </p>
              </div>
            )}

             <div className="flex justify-end pt-4 border-t border-gray-700">
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-300 hover:text-white">Fermer</button>
            </div>
            </>
          ) : null}
        </div>
      </Modal>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Rembourser"
        cancelText="Annuler"
        variant="danger"
      />

      {/* Cash Refund Choice Modal */}
      <Modal
        isOpen={cashRefundModal.isOpen}
        onClose={() => setCashRefundModal({ isOpen: false, itemsToRefund: [], refundAmount: 0 })}
        title="Annulation / Remboursement"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            Cette commande a été payée en espèces/CB. Que souhaitez-vous faire ?
          </p>
          <p className="text-lg font-bold text-white">
            Montant : {cashRefundModal.refundAmount.toFixed(2)} €
          </p>

          <div className="space-y-3 pt-4">
            <button
              onClick={() => handleCashRefund(false)}
              className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg transition-colors"
            >
              Annuler la commande
            </button>
            <p className="text-xs text-gray-500 text-center">
              La commande sera annulée sans remboursement sur le solde ADIIL.
              Utilisez cette option si le client n'a pas encore payé ou si vous lui rendez l'argent en main propre.
            </p>

            <div className="border-t border-gray-700 pt-3">
              <button
                onClick={() => handleCashRefund(true)}
                className="w-full py-3 px-4 bg-green-400 hover:bg-white text-darker-bg font-bold rounded-lg transition-colors"
              >
                Rembourser sur le solde ADIIL
              </button>
              <p className="text-xs text-gray-500 text-center mt-2">
                Le montant sera crédité sur le solde ADIIL du client.
                Utilisez cette option s'il y a eu un problème et que le client a déjà payé.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-700">
            <button
              onClick={() => setCashRefundModal({ isOpen: false, itemsToRefund: [], refundAmount: 0 })}
              className="px-4 py-2 text-gray-300 hover:text-white"
            >
              Annuler
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OrderManagementPage;