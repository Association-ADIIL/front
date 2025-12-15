import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMyOrders, type Order } from '../api/orders';
import { getMyInscriptions, type Inscription } from '../api/inscriptions';
import { Link, Navigate } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import BalanceDisplay from '../components/BalanceDisplay';

const MyAccountPage: React.FC = () => {
  const { user, token, loading: authLoading, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingInscriptions, setLoadingInscriptions] = useState(true);

  // State for collapsible sections
  const [isOrdersExpanded, setIsOrdersExpanded] = useState(true);
  const [isInscriptionsExpanded, setIsInscriptionsExpanded] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (token) {
        try {
          const data = await getMyOrders();
          setOrders(data);
        } catch (error) {
          console.error("Failed to fetch orders:", error);
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
          console.error("Failed to fetch inscriptions:", error);
        } finally {
          setLoadingInscriptions(false);
        }
      }
    };

    if (!authLoading && user) {
        fetchOrders();
        fetchInscriptions();
    }
  }, [user, token, authLoading]);

  if (authLoading) return <div className="text-center mt-20">Chargement...</div>;
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-accent-mint font-koulen">Mon Compte</h1>
          <button onClick={logout} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors">
              Deconnexion
          </button>
      </div>

      <div className="card p-8 mb-8">
        <h2 className="text-2xl font-bold mb-4">Mes Informations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-400">Nom:</p>
            <p className="text-xl capitalize">{user.lastName}</p>
          </div>
          <div>
            <p className="text-gray-400">Prénom:</p>
            <p className="text-xl capitalize">{user.firstName}</p>
          </div>
          <div>
            <p className="text-gray-400">Email:</p>
            <p className="text-xl">{user.email}</p>
          </div>
          <div>
            <p className="text-gray-400">Type de compte:</p>
            <p className="text-xl">
                {user.type === 'STUDENT' ? `Etudiant` :
                 user.type === 'PROFESSOR' ? 'Professeur' :
                 user.type === 'EXTERNAL' ? 'Externe' :
                 user.type === 'ADMIN_BDE' ? 'Admin BDE' :
                 user.type === 'ADMIN_PROF' ? 'Admin Prof' :
                 'Inconnu'}
                {user.studentGroup && (user.type === 'STUDENT' || user.type === 'ADMIN_BDE') && (
                    ` (${user.studentGroup})`
                )}
            </p>
          </div>
        </div>
      </div>

      {/* Balance Display */}
      <div className="mb-8">
        <BalanceDisplay variant="card" showRechargeButton={true} />
      </div>

      <div className="card p-8 mb-8">
        <button 
          onClick={() => setIsOrdersExpanded(!isOrdersExpanded)}
          className="w-full flex justify-between items-center text-left mb-4 focus:outline-none group"
        >
          <h2 className="text-2xl font-bold group-hover:text-accent-mint transition-colors">Mes Commandes Boutique</h2>
          {isOrdersExpanded ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
        </button>
        
        {isOrdersExpanded && (
          loadingOrders ? (
              <div className="text-center py-4">Chargement des commandes...</div>
          ) : orders.length === 0 ? (
              <p className="text-gray-500">Vous n'avez passé aucune commande pour le moment.</p>
          ) : (
              <div className="space-y-4">
                  {orders.map((order) => (
                      <div key={order.id} className="border border-gray-700 p-4 rounded-md flex flex-col gap-4">
                          <div className="flex flex-col md:flex-row justify-between items-center gap-4 w-full">
                              <div>
                                  <p className="text-xl font-bold">Commande #{order.id.toString().padStart(6, '0')}</p>
                                  <p className="text-gray-400">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
                                  <p className="text-sm text-gray-400">Total: {order.totalPrice.toFixed(2)} €</p>
                                  {order.refundedAmount > 0 && (
                                      <p className="text-sm text-red-400 font-bold">Remboursé: {order.refundedAmount.toFixed(2)} €</p>
                                  )}
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                   <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                                       order.orderStatus === 'PAID' || order.orderStatus === 'COLLECTED' ? 'bg-status-subscribed text-white' :
                                       order.orderStatus === 'CANCELLED' ? 'bg-status-full text-white' :
                                       'bg-yellow-600/50 text-white'
                                   }`}>
                                       {order.orderStatus === 'PENDING' ? 'En attente' :
                                        order.orderStatus === 'PAID' ? 'Payée' :
                                        order.orderStatus === 'COLLECTED' ? 'Récupérée' : 'Annulée'}
                                   </span>
                              </div>
                          </div>
                          
                          {/* Order Items Detail */}
                          <div className="bg-dark-bg p-3 rounded-md text-sm">
                              <p className="font-bold text-gray-300 mb-2">Détail de la commande :</p>
                              <ul className="space-y-1">
                                  {order.items.map((item) => (
                                      <li key={item.id} className="flex justify-between text-gray-400">
                                          <span>
                                              {item.product.name} (x{item.quantity})
                                              {item.refundedQuantity > 0 && (
                                                  <span className="text-red-400 ml-2 text-xs">
                                                      (dont {item.refundedQuantity} remboursé{item.refundedQuantity > 1 ? 's' : ''})
                                                  </span>
                                              )}
                                          </span>
                                          <span>{(item.price * item.quantity).toFixed(2)} €</span>
                                      </li>
                                  ))}
                              </ul>
                          </div>
                      </div>
                  ))}
              </div>
          )
        )}
      </div>
      
       {/* Event Inscriptions */}
       <div className="card p-8">
          <button 
            onClick={() => setIsInscriptionsExpanded(!isInscriptionsExpanded)}
            className="w-full flex justify-between items-center text-left mb-4 focus:outline-none group"
          >
            <h2 className="text-2xl font-bold group-hover:text-accent-mint transition-colors">Mes Inscriptions aux Evenements</h2>
            {isInscriptionsExpanded ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
          </button>

          {isInscriptionsExpanded && (
            loadingInscriptions ? (
              <div className="text-center py-4">Chargement des inscriptions...</div>
            ) : inscriptions.length === 0 ? (
              <div>
                <p className="text-gray-500">Vous n'êtes inscrit à aucun événement pour le moment.</p>
                <Link to="/events" className="text-accent-mint hover:underline mt-2 block">Voir les événements disponibles</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {inscriptions.map((inscription) => (
                  <div key={inscription.id} className="border border-gray-700 p-4 rounded-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex-1">
                      <p className="text-xl font-bold">{inscription.event?.title || 'Événement inconnu'}</p>
                      <div className="text-sm text-gray-400 space-y-1 mt-2">
                        <p>Date de l'événement: {inscription.event?.date ? new Date(inscription.event.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}</p>
                        <p>Lieu: {inscription.event?.location || 'N/A'}</p>
                        <p>Nombre de places: {inscription.quantity}</p>
                        <p>Date d'inscription: {new Date(inscription.createdAt).toLocaleDateString()}</p>
                        <p>Montant: {inscription.totalPrice === 0 ? 'Gratuit' : `${inscription.totalPrice} €`}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        inscription.paymentStatus === 'PAID' ? 'bg-status-subscribed text-white' :
                        inscription.paymentStatus === 'REFUNDED' ? 'bg-purple-600/50 text-white' :
                        'bg-yellow-600/50 text-white'
                      }`}>
                        {inscription.paymentStatus === 'PENDING' ? 'Paiement en attente' :
                         inscription.paymentStatus === 'PAID' ? 'Payé' : 'Remboursé'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {inscription.paymentMethod === 'HELLOASSO' ? 'HelloAsso' :
                         inscription.paymentMethod === 'PAYPAL' ? 'PayPal' :
                         inscription.paymentMethod === 'CASH_CB' ? 'Espèces/CB' : 'Gratuit'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
       </div>
    </div>
  );
};

export default MyAccountPage;
