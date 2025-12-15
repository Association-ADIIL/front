import React, { useEffect, useState } from 'react';
import { getAllOrders, updateOrderStatus, updatePaymentStatus, refundOrderItems, type Order } from '../api/orders';
import { getAllInscriptions, updateInscriptionPaymentStatus, refundInscription, type Inscription } from '../api/inscriptions';
import { getAllEvents, type Event } from '../api/events';
import { Edit2, ShoppingBag, Calendar, CheckSquare, Square, Eye } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import MultiSelect from '../components/MultiSelect';
import { useNotification } from '../context/NotificationContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

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

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const fetchOrders = async () => {
    try {
      const data = await getAllOrders();
      setOrders(data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    }
  };

  const fetchInscriptions = async () => {
    try {
      const filters: any = {};
      const data = await getAllInscriptions(filters);
      setInscriptions(data);
    } catch (error) {
      console.error("Failed to fetch inscriptions:", error);
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
        console.error("Failed to fetch events:", error);
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
  const filteredOrders = orders.filter(order => {
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

  // Filter inscriptions logic
  const filteredInscriptions = inscriptions.filter(inscription => {
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
      console.error("Failed to update order status:", error);
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
      console.error("Failed to update payment status:", error);
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
      console.error("Failed to update inscription payment status:", error);
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
        } catch (error: any) {
          console.error("Failed to refund inscription:", error);
          addNotification('error', `Erreur lors du remboursement: ${error.message || 'Une erreur est survenue'}`);
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
      const isFullRefundAttempt = currentOrder.items.every(item => {
          const totalRefundedForThisItem = (item.refundedQuantity || 0) + (refundSelection[item.id] || 0);
          return totalRefundedForThisItem >= item.quantity;
      });

      if (isHelloAsso && !isFullRefundAttempt) {
          addNotification('error', 'Pour les paiements HelloAsso, seul un remboursement complet est possible via l\'API.');
          return;
      }

      setConfirmDialog({
          isOpen: true,
          title: 'Confirmer le remboursement', 
          message: `Vous allez rembourser un montant total de ${(currentOrder.items.reduce((sum, item) => sum + (refundSelection[item.id] || 0) * item.price, 0)).toFixed(2)} €. Cette action est irréversible.`, 
          onConfirm: async () => {
              try {
                  await refundOrderItems(currentOrder.id, itemsToRefund);
                  addNotification('success', 'Remboursement effectué avec succès'); 
                  setIsModalOpen(false);
                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                  fetchOrders();
              } catch (error: any) {
                  console.error("Refund failed:", error);
                  addNotification('error', error.message || 'Échec du remboursement');
              }
          }
      });
  };

  // Determine if full refund attempt for button disable state
  const isFullRefundAttemptForButton = currentOrder?.items.every(item => {
      const availableRefund = item.quantity - (item.refundedQuantity || 0);
      return (refundSelection[item.id] || 0) === availableRefund;
  }) || false;

  if (loading) return <div className="text-center p-8">Chargement...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-accent-mint font-koulen">GESTION DES COMMANDES & INSCRIPTIONS</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setViewMode('orders')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ${ 
            viewMode === 'orders'
              ? 'bg-accent-mint text-darker-bg'
              : 'bg-darker-bg text-gray-400 hover:bg-gray-800 border border-gray-700'
          }`}
        >
          <ShoppingBag size={20} />
          Commandes Boutique
        </button>
        <button
          onClick={() => setViewMode('inscriptions')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ${ 
            viewMode === 'inscriptions'
              ? 'bg-accent-mint text-darker-bg'
              : 'bg-darker-bg text-gray-400 hover:bg-gray-800 border border-gray-700'
          }`}
        >
          <Calendar size={20} />
          Inscriptions Événements
        </button>
      </div>

      {/* Filters for orders */}
      {viewMode === 'orders' && (
        <div className="bg-darker-bg border border-gray-700 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="text-gray-400 font-bold block mb-2 text-sm">Rechercher (ID, Nom, Email):</label>
              <input
                type="text"
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
                placeholder="Rechercher..."
                className="w-full bg-dark-bg border border-gray-600 rounded px-4 py-2 text-white focus:border-accent-mint outline-none min-h-[42px]"
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
        <>
          <div className="bg-darker-bg border border-gray-700 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Filter */}
            <div>
              <label className="text-gray-400 font-bold block mb-2 text-sm">Rechercher (ID, Nom, Email, Événement):</label>
              <input
                type="text"
                value={inscriptionSearchQuery}
                onChange={(e) => setInscriptionSearchQuery(e.target.value)}
                placeholder="Rechercher..."
                className="w-full bg-dark-bg border border-gray-600 rounded px-4 py-2 text-white focus:border-accent-mint outline-none min-h-[42px]"
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
                label="Méthode de paiement:"
                options={PAYMENT_METHOD_OPTIONS}
                selectedValues={paymentMethodFilter}
                onChange={setPaymentMethodFilter}
              />
            </div>
          </div>
        </div>
        </>
      )}

      {viewMode === 'orders' ? (
        <div className="bg-darker-bg border border-gray-700 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-dark-bg">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Paiement</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Méthode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Montant</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    Aucune commande trouvée
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-darker-bg/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">
                      #{order.id.toString().padStart(6, '0')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        {order.user ? `${order.user.firstName} ${order.user.lastName}` : 'Utilisateur inconnu'}
                      </div>
                      <div className="text-xs text-gray-500">{order.user?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        order.paymentStatus === 'PAID' ? 'bg-green-900/50 text-green-200' :
                        order.paymentStatus === 'REFUNDED' ? 'bg-purple-900/50 text-purple-200' :
                        'bg-red-900/50 text-red-200'
                      }`}>
                        {order.paymentStatus === 'PENDING' ? 'Non Payé' :
                         order.paymentStatus === 'PAID' ? 'Payé' : 'Remboursé'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {order.paymentMethod === 'HELLOASSO' ? 'HelloAsso' :
                       order.paymentMethod === 'PAYPAL' ? 'PayPal' :
                       order.paymentMethod === 'CASH_CB' ? 'Espèces/CB' :
                       order.paymentMethod === 'FREE' ? 'Gratuit' :
                       order.paymentMethod === 'BALANCE' ? 'Solde' : order.paymentMethod}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-accent-mint">
                      {order.totalPrice.toFixed(2)} €
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleOpenEditOrder(order)}
                        className="text-accent-mint hover:text-white transition-colors"
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
      ) : (
        <div className="bg-darker-bg border border-gray-700 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-dark-bg">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Événement</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Participant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Places</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Montant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Paiement</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Méthode</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {filteredInscriptions.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                  Aucune inscription trouvée
                </td>
              </tr>
            ) : (
              filteredInscriptions.map((inscription) => (
                <tr key={inscription.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    #{inscription.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">
                      {inscription.event?.title || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {inscription.event?.date ? new Date(inscription.event.date).toLocaleDateString('fr-FR') : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">
                      {inscription.user ? `${inscription.user.firstName} ${inscription.user.lastName}` : 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500">{inscription.user?.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {new Date(inscription.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {inscription.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">
                    {inscription.totalPrice === 0 ? 'Gratuit' : `${inscription.totalPrice} €`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ 
                      inscription.paymentStatus === 'PAID' ? 'bg-green-900/50 text-green-200' :
                      inscription.paymentStatus === 'REFUNDED' ? 'bg-purple-900/50 text-purple-200' :
                      'bg-red-900/50 text-red-200'
                    }`}>
                      {inscription.paymentStatus === 'PENDING' ? 'En attente' :
                       inscription.paymentStatus === 'PAID' ? 'Payé' : 'Remboursé'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {inscription.paymentMethod === 'HELLOASSO' ? 'HelloAsso' :
                     inscription.paymentMethod === 'PAYPAL' ? 'PayPal' :
                     inscription.paymentMethod === 'CASH_CB' ? 'Espèces/CB' : 'Gratuit'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleOpenEditInscription(inscription)} className="text-accent-mint hover:text-white">
                      <Edit2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
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
                            className={`py-2 px-4 rounded border ${currentOrder?.orderStatus === status ? 'bg-accent-mint text-darker-bg border-accent-mint font-bold' : 'bg-dark-bg border-gray-600 text-gray-400 hover:bg-gray-700'}`}
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
                            className={`py-2 px-4 rounded border ${currentOrder?.paymentStatus === status ? 'bg-accent-mint text-darker-bg border-accent-mint font-bold' : 'bg-dark-bg border-gray-600 text-gray-400 hover:bg-gray-700'}`}
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
                        {currentOrder.items.map((item) => (
                            <li key={item.id} className="flex justify-between items-start pb-3 border-b border-gray-700 last:border-0 last:pb-0">
                                <div className="flex-1">
                                    <div className="text-white font-medium">
                                        {item.product.name}
                                    </div>
                                    {item.variantId && item.product.variants && (
                                        <div className="text-accent-mint text-sm mt-1">
                                            {(item.product.variants as any[]).find((v: any) => v.id === item.variantId)?.name}
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
                                        Prix unitaire: {item.price.toFixed(2)} €
                                    </div>
                                </div>
                                <div className="text-right ml-4">
                                    <div className="text-white font-bold">
                                        {(item.price * item.quantity).toFixed(2)} €
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between items-center">
                        <span className="text-gray-400 font-medium">Total de la commande:</span>
                        <span className="text-accent-mint font-bold text-xl">{currentOrder.totalPrice.toFixed(2)} €</span>
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

                                    // Find variant info if variantId exists
                                    const variantInfo = item.variantId && item.product.variants ?
                                        (item.product.variants as any[]).find((v: any) => v.id === item.variantId) : null;

                                    return (
                                        <tr key={item.id} className="border-b border-gray-700 last:border-0">
                                            <td className="py-2">
                                                {item.product.name}
                                                {variantInfo && (
                                                    <span className="ml-2 text-xs text-accent-mint">
                                                        ({variantInfo.name})
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-2">{item.price} €</td>
                                            <td className="py-2 text-center">{item.quantity}</td>
                                            <td className="py-2 text-center">{item.refundedQuantity || 0}</td>
                                            <td className="py-2 text-right flex items-center justify-end gap-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={availableRefund}
                                                    value={refundSelection[item.id] || 0}
                                                    onChange={(e) => updateRefundQuantity(item.id, parseInt(e.target.value) || 0, availableRefund)}
                                                    className="w-16 bg-dark-bg border border-gray-600 rounded px-2 py-1 text-right text-white"
                                                />
                                                <button
                                                    onClick={() => toggleRefundItem(item.id, availableRefund)}
                                                    className={`p-1 rounded ${refundSelection[item.id] > 0 ? 'text-accent-mint' : 'text-gray-500'}`}
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
                            className={`py-2 px-4 rounded border ${currentInscription?.paymentStatus === status ? 'bg-accent-mint text-darker-bg border-accent-mint font-bold' : 'bg-dark-bg border-gray-600 text-gray-400 hover:bg-gray-700'}`}
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
                              <span className="text-accent-mint font-bold">
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
    </div>
  );
};

export default OrderManagementPage;