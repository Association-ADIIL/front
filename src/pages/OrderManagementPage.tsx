import React, { useEffect, useState } from 'react';
import { getAllOrders, updateOrderStatus, updatePaymentStatus, type Order } from '../api/orders';
import { getAllInscriptions, updateInscriptionPaymentStatus, type Inscription } from '../api/inscriptions';
import { Eye, Edit2, ShoppingBag, Calendar } from 'lucide-react';
import Modal from '../components/Modal';

type ViewMode = 'orders' | 'inscriptions';

const OrderManagementPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [currentInscription, setCurrentInscription] = useState<Inscription | null>(null);

  // Filters
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

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
      const data = await getAllInscriptions();
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

  const handleOpenEditOrder = (order: Order) => {
    setCurrentOrder(order);
    setCurrentInscription(null);
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
    } catch (error) {
      console.error("Failed to update order status:", error);
      alert("Erreur lors de la mise à jour du statut.");
    }
  };

  const handlePaymentStatusChange = async (newStatus: string) => {
    if (!currentOrder) return;
    try {
      await updatePaymentStatus(currentOrder.id, newStatus);
      setIsModalOpen(false);
      fetchOrders();
    } catch (error) {
      console.error("Failed to update payment status:", error);
      alert("Erreur lors de la mise à jour du statut de paiement.");
    }
  };

  const handleInscriptionPaymentStatusChange = async (newStatus: string) => {
    if (!currentInscription) return;
    try {
      await updateInscriptionPaymentStatus(currentInscription.id, newStatus);
      setIsModalOpen(false);
      fetchInscriptions();
    } catch (error) {
      console.error("Failed to update inscription payment status:", error);
      alert("Erreur lors de la mise à jour du statut de paiement.");
    }
  };

  // Filter inscriptions
  const filteredInscriptions = inscriptions.filter(inscription => {
    if (paymentFilter !== 'all' && inscription.paymentStatus !== paymentFilter) return false;
    return true;
  });

  if (loading) return <div className="text-center p-8">Chargement...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-accent-mint font-koulen">Gestion des Commandes & Inscriptions</h1>
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

      {/* Filters for inscriptions */}
      {viewMode === 'inscriptions' && (
        <div className="bg-darker-bg border border-gray-700 rounded-lg p-4 mb-4">
          <div className="flex gap-4 items-center">
            <label className="text-gray-400 font-bold">Statut de paiement:</label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="bg-dark-bg border border-gray-600 rounded px-4 py-2 text-white focus:border-accent-mint outline-none"
            >
              <option value="all">Tous</option>
              <option value="PENDING">En attente</option>
              <option value="PAID">Payé</option>
              <option value="REFUNDED">Remboursé</option>
            </select>
          </div>
        </div>
      )}

      {viewMode === 'orders' ? (
        <div className="bg-darker-bg border border-gray-700 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-dark-bg">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Montant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Statut</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Paiement</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-800/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  #{order.id.slice(0, 8)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                   <div className="text-sm font-medium text-white">
                       {order.user ? `${order.user.firstName} ${order.user.lastName}` : 'Utilisateur inconnu'}
                   </div>
                   <div className="text-xs text-gray-500">{order.user?.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {new Date(order.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">
                  {order.totalAmount} €
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    order.status === 'DELIVERED' ? 'bg-green-900/50 text-green-200' : 
                    order.status === 'CANCELLED' ? 'bg-red-900/50 text-red-200' : 
                    'bg-yellow-900/50 text-yellow-200'
                  }`}>
                    {order.status === 'PENDING' ? 'En attente' :
                     order.status === 'PAID' ? 'Payée' :
                     order.status === 'DELIVERED' ? 'Livrée' : 'Annulée'}
                  </span>
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
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleOpenEditOrder(order)} className="text-accent-mint hover:text-white"><Edit2 size={18} /></button>
                </td>
              </tr>
            ))}
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
        title={currentOrder ? `Modifier la commande #${currentOrder.id.slice(0, 8)}` : `Modifier l'inscription #${currentInscription?.id}`}
      >
        <div className="space-y-6">
          {currentOrder ? (
            <>
            {/* Order Edit */}
            <div>
                <h3 className="text-lg font-bold mb-2 text-gray-300">Statut de la commande</h3>
                <div className="grid grid-cols-2 gap-2">
                    {['PENDING', 'PAID', 'DELIVERED', 'CANCELLED'].map((status) => (
                        <button
                            key={status}
                            onClick={() => handleStatusChange(status)}
                            className={`py-2 px-4 rounded border ${currentOrder?.status === status ? 'bg-accent-mint text-darker-bg border-accent-mint font-bold' : 'bg-dark-bg border-gray-600 text-gray-400 hover:bg-gray-700'}`}
                        >
                            {status === 'PENDING' ? 'En attente' :
                             status === 'PAID' ? 'Payée' :
                             status === 'DELIVERED' ? 'Livrée' : 'Annulée'}
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

             <div className="flex justify-end pt-4 border-t border-gray-700">
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-300 hover:text-white">Fermer</button>
            </div>
            </>
          ) : null}
        </div>
      </Modal>
    </div>
  );
};

export default OrderManagementPage;