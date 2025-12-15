import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMyOrders, type Order } from '../api/orders';
import { getMyInscriptions, type Inscription } from '../api/inscriptions';
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
  Ticket
} from 'lucide-react';
import BalanceDisplay from '../components/BalanceDisplay';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const MyAccountPage: React.FC = () => {
  useDocumentTitle('Mon Compte');
  const { user, token, loading: authLoading, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingInscriptions, setLoadingInscriptions] = useState(true);
  const [isOrdersExpanded, setIsOrdersExpanded] = useState(false);
  const [isInscriptionsExpanded, setIsInscriptionsExpanded] = useState(false);

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
      <section className="bg-darker-bg py-8 border-b border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <span className="text-accent-mint text-sm font-bold uppercase tracking-wider">Espace personnel</span>
              <h1 className="text-5xl md:text-6xl font-koulen text-white mt-2">MON COMPTE</h1>
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
                  {user.studentGroup && (
                    <div className="flex items-center gap-3 text-gray-400">
                      <GraduationCap size={18} className="text-accent-mint" />
                      <span className="text-sm font-montserrat">Groupe {user.studentGroup.replace(/^G/, '')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Balance Card */}
              <BalanceDisplay variant="card" showRechargeButton={true} />
            </div>

            {/* Right column - Orders & Inscriptions */}
            <div className="lg:col-span-2 space-y-6">
              {/* Orders Section */}
              <div className="bg-darker-bg rounded-2xl border border-gray-800 overflow-hidden">
                <button
                  onClick={() => setIsOrdersExpanded(!isOrdersExpanded)}
                  className="w-full flex items-center justify-between p-6 hover:bg-dark-bg/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent-mint/10 rounded-xl flex items-center justify-center">
                      <ShoppingBag size={20} className="text-accent-mint" />
                    </div>
                    <div className="text-left">
                      <h2 className="text-lg font-bold text-white">Mes commandes</h2>
                      <p className="text-sm text-gray-500">{orders.length} commande{orders.length > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  {isOrdersExpanded ? <ChevronDown size={20} className="text-gray-500" /> : <ChevronRight size={20} className="text-gray-500" />}
                </button>

                {isOrdersExpanded && (
                  <div className="border-t border-gray-800">
                    {loadingOrders ? (
                      <div className="flex justify-center py-8">
                        <div className="w-8 h-8 border-2 border-accent-mint border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="p-6 text-center">
                        <Package size={40} className="mx-auto text-gray-700 mb-3" />
                        <p className="text-gray-500 font-montserrat">Aucune commande pour le moment</p>
                        <Link to="/shop" className="text-accent-mint text-sm hover:underline mt-2 inline-block">
                          Decouvrir la boutique
                        </Link>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-800">
                        {orders.map((order) => (
                          <div key={order.id} className="p-4 hover:bg-dark-bg/30 transition-colors">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <p className="font-bold text-white">
                                  Commande #{order.id.toString().padStart(6, '0')}
                                </p>
                                <p className="text-xs text-gray-500 font-montserrat">
                                  {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                              </div>
                              <div className="text-right">
                                {getStatusBadge(order.orderStatus, 'order')}
                                <p className="text-accent-mint font-koulen text-lg mt-1">{order.totalPrice.toFixed(2)}€</p>
                                {order.refundedAmount > 0 && (
                                  <p className="text-xs text-red-400">-{order.refundedAmount.toFixed(2)}€ rembourse</p>
                                )}
                              </div>
                            </div>

                            <div className="bg-dark-bg rounded-xl p-3">
                              <div className="space-y-1">
                                {order.items.map((item) => (
                                  <div key={item.id} className="flex justify-between text-sm">
                                    <span className="text-gray-400">
                                      {item.quantity}x {item.product.name}
                                      {item.refundedQuantity > 0 && (
                                        <span className="text-red-400 ml-1 text-xs">
                                          ({item.refundedQuantity} remb.)
                                        </span>
                                      )}
                                    </span>
                                    <span className="text-gray-300">{(item.price * item.quantity).toFixed(2)}€</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Inscriptions Section */}
              <div className="bg-darker-bg rounded-2xl border border-gray-800 overflow-hidden">
                <button
                  onClick={() => setIsInscriptionsExpanded(!isInscriptionsExpanded)}
                  className="w-full flex items-center justify-between p-6 hover:bg-dark-bg/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent-mint/10 rounded-xl flex items-center justify-center">
                      <Ticket size={20} className="text-accent-mint" />
                    </div>
                    <div className="text-left">
                      <h2 className="text-lg font-bold text-white">Mes inscriptions</h2>
                      <p className="text-sm text-gray-500">{inscriptions.length} evenement{inscriptions.length > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  {isInscriptionsExpanded ? <ChevronDown size={20} className="text-gray-500" /> : <ChevronRight size={20} className="text-gray-500" />}
                </button>

                {isInscriptionsExpanded && (
                  <div className="border-t border-gray-800">
                    {loadingInscriptions ? (
                      <div className="flex justify-center py-8">
                        <div className="w-8 h-8 border-2 border-accent-mint border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : inscriptions.length === 0 ? (
                      <div className="p-6 text-center">
                        <Calendar size={40} className="mx-auto text-gray-700 mb-3" />
                        <p className="text-gray-500 font-montserrat">Aucune inscription pour le moment</p>
                        <Link to="/events" className="text-accent-mint text-sm hover:underline mt-2 inline-block">
                          Voir les evenements
                        </Link>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-800">
                        {inscriptions.map((inscription) => (
                          <div key={inscription.id} className="p-4 hover:bg-dark-bg/30 transition-colors">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <p className="font-bold text-white">{inscription.event?.title || 'Événement inconnu'}</p>
                                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Calendar size={12} className="text-accent-mint" />
                                    {inscription.event?.date
                                      ? new Date(inscription.event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                                      : 'N/A'
                                    }
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MapPin size={12} className="text-accent-mint" />
                                    {inscription.event?.location || 'N/A'}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                {getStatusBadge(inscription.paymentStatus, 'inscription')}
                                <p className="text-accent-mint font-koulen text-lg mt-1">
                                  {inscription.totalPrice === 0 ? 'GRATUIT' : `${inscription.totalPrice}€`}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-gray-500 bg-dark-bg rounded-xl p-3">
                              <div className="flex items-center gap-4">
                                <span>{inscription.quantity} place{inscription.quantity > 1 ? 's' : ''}</span>
                                <span className="flex items-center gap-1">
                                  <CreditCard size={12} />
                                  {inscription.paymentMethod === 'HELLOASSO' ? 'HelloAsso' :
                                   inscription.paymentMethod === 'PAYPAL' ? 'PayPal' :
                                   inscription.paymentMethod === 'CASH_CB' ? 'Sur place' : 'Gratuit'}
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
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MyAccountPage;
