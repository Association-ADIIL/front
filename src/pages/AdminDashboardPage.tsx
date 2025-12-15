import React, { useEffect, useState } from 'react';
import { getAllUsers } from '../api/users';
import { getAllEvents, type Event } from '../api/events';
import { getAllOrders, updateOrderStatus, type Order } from '../api/orders';
import { getAllInscriptions, type Inscription } from '../api/inscriptions';
import { getBalanceStats, type BalanceStats } from '../api/balance';
import { useNavigate } from 'react-router-dom';
import {
  Users, Calendar, ShoppingBag, TrendingUp, Plus,
  ArrowRight, Clock, CheckCircle, AlertCircle, CalendarCheck, CreditCard, Wallet
} from 'lucide-react';
import AddBalanceModal from '../components/AddBalanceModal';

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    newUsersThisMonth: 0,
    totalEvents: 0,
    upcomingEvents: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    revenueThisMonth: 0,
    totalInscriptions: 0,
  });
  const [balanceStats, setBalanceStats] = useState<BalanceStats | null>(null);
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recentInscriptions, setRecentInscriptions] = useState<Inscription[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [ordersToCollect, setOrdersToCollect] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddBalanceModalOpen, setIsAddBalanceModalOpen] = useState(false);

  const handleMarkCollected = async (orderId: number) => {
    try {
      await updateOrderStatus(orderId, 'COLLECTED');
      setOrdersToCollect(prev => prev.filter(o => o.id !== orderId));
    } catch (error) {
      console.error("Failed to mark order as collected:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [users, events, orders, inscriptions, balanceStatsData] = await Promise.all([
          getAllUsers(),
          getAllEvents(),
          getAllOrders(),
          getAllInscriptions({}),
          getBalanceStats(),
        ]);

        setBalanceStats(balanceStatsData);

        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // User stats
        const newUsersThisMonth = users.filter(u => new Date(u.createdAt) >= firstDayOfMonth).length;

        // Event stats
        const upcoming = events
          .filter(e => new Date(e.date) >= now)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Order stats
        const pendingOrders = orders.filter(o => o.paymentStatus === 'PENDING').length;
        const totalRevenue = orders
          .filter(o => o.paymentStatus === 'PAID')
          .reduce((sum, o) => sum + o.totalPrice, 0);
        const revenueThisMonth = orders
          .filter(o => o.paymentStatus === 'PAID' && new Date(o.createdAt) >= firstDayOfMonth)
          .reduce((sum, o) => sum + o.totalPrice, 0);

        // Orders to collect
        setOrdersToCollect(orders.filter(o => 
          o.orderStatus !== 'COLLECTED' && 
          o.orderStatus !== 'CANCELLED' && 
          o.paymentStatus !== 'REFUNDED' &&
          (o.paymentStatus === 'PAID' || (o.paymentMethod === 'CASH_CB' && o.paymentStatus === 'PENDING'))
        ));

        // Recent items
        const recentEventsList = events
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 3);

        const recentOrdersList = orders
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);

        const recentInscriptionsList = inscriptions
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);

        setStats({
          totalUsers: users.length,
          newUsersThisMonth,
          totalEvents: events.length,
          upcomingEvents: upcoming.length,
          totalOrders: orders.length,
          pendingOrders,
          totalRevenue,
          revenueThisMonth,
          totalInscriptions: inscriptions.length,
        });

        setRecentEvents(recentEventsList);
        setRecentOrders(recentOrdersList);
        setRecentInscriptions(recentInscriptionsList);
        setUpcomingEvents(upcoming.slice(0, 4));
      } catch (error) {
        console.error("Failed to fetch admin stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-accent-mint"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-accent-mint mb-2 font-koulen">Tableau de Bord</h1>
        <p className="text-gray-400">Vue d'ensemble de l'activité du BDE ADIIL</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <button
          onClick={() => navigate('/admin/events')}
          className="bg-gradient-to-br from-purple-600/20 to-purple-900/20 border border-purple-600/30 hover:border-purple-500 p-4 rounded-lg transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <Calendar className="text-purple-400" size={24} />
            <Plus className="text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" size={18} />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Nouvel Événement</h3>
          <p className="text-xs text-gray-400">Créer un événement</p>
        </button>

        <button
          onClick={() => navigate('/admin/products')}
          className="bg-gradient-to-br from-orange-600/20 to-orange-900/20 border border-orange-600/30 hover:border-orange-500 p-4 rounded-lg transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <ShoppingBag className="text-orange-400" size={24} />
            <Plus className="text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity" size={18} />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Nouveau Produit</h3>
          <p className="text-xs text-gray-400">Ajouter à la boutique</p>
        </button>

        <button
          onClick={() => setIsAddBalanceModalOpen(true)}
          className="bg-gradient-to-br from-cyan-600/20 to-cyan-900/20 border border-cyan-600/30 hover:border-cyan-500 p-4 rounded-lg transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <Wallet className="text-cyan-400" size={24} />
            <Plus className="text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" size={18} />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Recharger Solde</h3>
          <p className="text-xs text-gray-400">Ajouter du crédit</p>
        </button>

        <button
          onClick={() => navigate('/admin/users')}
          className="bg-gradient-to-br from-blue-600/20 to-blue-900/20 border border-blue-600/30 hover:border-blue-500 p-4 rounded-lg transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <Users className="text-blue-400" size={24} />
            <ArrowRight className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" size={18} />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Utilisateurs</h3>
          <p className="text-xs text-gray-400">Gérer les comptes</p>
        </button>

        <button
          onClick={() => navigate('/admin/orders')}
          className="bg-gradient-to-br from-green-600/20 to-green-900/20 border border-green-600/30 hover:border-green-500 p-4 rounded-lg transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="text-accent-mint" size={24} />
            <ArrowRight className="text-accent-mint opacity-0 group-hover:opacity-100 transition-opacity" size={18} />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Commandes</h3>
          <p className="text-xs text-gray-400">Voir toutes les ventes</p>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Users */}
        <div className="card p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-900/20 rounded-lg">
              <Users className="text-blue-400" size={24} />
            </div>
            <span className="text-xs text-green-400 font-bold">+{stats.newUsersThisMonth} ce mois</span>
          </div>
          <h3 className="text-2xl font-bold mb-1">{stats.totalUsers}</h3>
          <p className="text-sm text-gray-400">Utilisateurs inscrits</p>
        </div>

        {/* Events */}
        <div className="card p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-900/20 rounded-lg">
              <Calendar className="text-purple-400" size={24} />
            </div>
            <span className="text-xs text-purple-400 font-bold">{stats.upcomingEvents} à venir</span>
          </div>
          <h3 className="text-2xl font-bold mb-1">{stats.totalEvents}</h3>
          <p className="text-sm text-gray-400">Événements créés</p>
        </div>

        {/* Orders */}
        <div className="card p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-900/20 rounded-lg">
              <ShoppingBag className="text-orange-400" size={24} />
            </div>
            {stats.pendingOrders > 0 && (
              <span className="text-xs text-yellow-400 font-bold flex items-center gap-1">
                <Clock size={12} />
                {stats.pendingOrders} en attente
              </span>
            )}
          </div>
          <h3 className="text-2xl font-bold mb-1">{stats.totalOrders}</h3>
          <p className="text-sm text-gray-400">Commandes totales</p>
        </div>

        {/* Revenue */}
        <div className="card p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-900/20 rounded-lg">
              <TrendingUp className="text-accent-mint" size={24} />
            </div>
            <span className="text-xs text-accent-mint font-bold">{stats.revenueThisMonth.toFixed(2)}€ ce mois</span>
          </div>
          <h3 className="text-2xl font-bold text-accent-mint mb-1">{stats.totalRevenue.toFixed(2)} €</h3>
          <p className="text-sm text-gray-400">Chiffre d'affaires total</p>
        </div>
      </div>

      {/* Balance Stats */}
      {balanceStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Total Balance */}
          <div className="card p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-900/20 rounded-lg">
                <Wallet className="text-purple-400" size={24} />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-purple-400 mb-1">{balanceStats.totalBalance.toFixed(2)} €</h3>
            <p className="text-sm text-gray-400">Solde total des cartes</p>
          </div>

          {/* Total Recharged */}
          <div className="card p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-cyan-900/20 rounded-lg">
                <CreditCard className="text-cyan-400" size={24} />
              </div>
              <span className="text-xs text-cyan-400 font-bold">{balanceStats.rechargedThisMonth.toFixed(2)}€ ce mois</span>
            </div>
            <h3 className="text-2xl font-bold text-cyan-400 mb-1">{balanceStats.totalRecharged.toFixed(2)} €</h3>
            <p className="text-sm text-gray-400">Total rechargé</p>
          </div>

          {/* Recharges Count */}
          <div className="card p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-pink-900/20 rounded-lg">
                <TrendingUp className="text-pink-400" size={24} />
              </div>
              <span className="text-xs text-pink-400 font-bold">{balanceStats.rechargesThisMonth} ce mois</span>
            </div>
            <h3 className="text-2xl font-bold text-pink-400 mb-1">{balanceStats.totalRecharges}</h3>
            <p className="text-sm text-gray-400">Recharges effectuées</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <div className="card p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <CalendarCheck className="text-accent-mint" size={20} />
              Événements à venir
            </h2>
            <button
              onClick={() => navigate('/admin/events')}
              className="text-sm text-accent-mint hover:underline"
            >
              Voir tout
            </button>
          </div>
          {upcomingEvents.length === 0 ? (
            <p className="text-gray-500 italic py-4">Aucun événement à venir</p>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map(event => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-3 bg-dark-bg rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
                  onClick={() => navigate('/admin/events')}
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-purple-900/30 rounded-lg flex flex-col items-center justify-center">
                    <span className="text-xs text-purple-400 font-bold">
                      {new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric' })}
                    </span>
                    <span className="text-xs text-purple-400">
                      {new Date(event.date).toLocaleDateString('fr-FR', { month: 'short' })}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm truncate">{event.title}</h4>
                    <p className="text-xs text-gray-400 truncate">{event.location}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        event.status === 'FULL' ? 'bg-red-900/30 text-red-400' :
                        event.status === 'OPEN' ? 'bg-green-900/30 text-green-400' :
                        'bg-gray-700 text-gray-400'
                      }`}>
                        {event.status === 'FULL' ? 'Complet' :
                         event.status === 'OPEN' ? 'Ouvert' : 'Fermé'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {event.registeredPeople || 0}/{event.totalPlaces} inscrits
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Inscriptions */}
        <div className="card p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <CalendarCheck className="text-accent-mint" size={20} />
              Dernières inscriptions
            </h2>
            <button
              onClick={() => navigate('/admin/orders')}
              className="text-sm text-accent-mint hover:underline"
            >
              Voir tout
            </button>
          </div>
          {recentInscriptions.length === 0 ? (
            <p className="text-gray-500 italic py-4">Aucune inscription</p>
          ) : (
            <div className="space-y-2">
              {recentInscriptions.map(inscription => (
                <div
                  key={inscription.id}
                  className="flex items-center justify-between p-3 bg-dark-bg rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
                  onClick={() => navigate('/admin/orders')}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      inscription.paymentStatus === 'PAID' ? 'bg-green-400' :
                      inscription.paymentStatus === 'PENDING' ? 'bg-yellow-400' :
                      inscription.paymentStatus === 'REFUNDED' ? 'bg-purple-400' :
                      'bg-red-400'
                    }`} />
                    <div>
                      <p className="text-sm font-bold">{inscription.event?.title || 'Événement'}</p>
                      <p className="text-xs text-gray-400">
                        {inscription.user?.firstName} {inscription.user?.lastName} - {inscription.quantity} place{inscription.quantity > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-accent-mint">{inscription.totalPrice.toFixed(2)} €</p>
                    <p className="text-xs text-gray-400">
                      {new Date(inscription.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Orders to Collect Section */}
      {ordersToCollect.length > 0 && (
        <div className="card p-6 border border-gray-700">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
            <ShoppingBag className="text-accent-mint" size={20} />
            Commandes en attente de récupération
          </h2>
          <div className="space-y-3">
            {ordersToCollect.map(order => (
              <div key={order.id} className="flex flex-col p-4 bg-dark-bg rounded-lg border border-gray-700 gap-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-white">#{order.id}</span>
                      <span className="text-gray-400">- {order.user ? `${order.user.firstName} ${order.user.lastName}` : 'Client Inconnu'}</span>
                      {order.paymentMethod === 'CASH_CB' && (
                          <span className="px-2 py-0.5 rounded-full bg-yellow-900/50 text-yellow-200 text-xs font-bold border border-yellow-700">
                              Paiement Sur Place
                          </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-400">
                      {order.items.length} article(s) • Total: {order.totalPrice.toFixed(2)} €
                    </div>
                  </div>
                  <button
                    onClick={() => handleMarkCollected(order.id)}
                    className="px-4 py-2 bg-accent-mint hover:bg-accent-mint/80 text-darker-bg font-bold rounded-lg transition-colors flex items-center gap-2 self-start md:self-center"
                  >
                    <CheckCircle size={18} />
                    Valider Récupération
                  </button>
                </div>

                {/* Order Items Detail */}
                <div className="bg-darker-bg p-3 rounded-md border border-gray-700">
                  <p className="font-bold text-gray-300 mb-2 text-sm">Détail de la commande:</p>
                  <ul className="space-y-2">
                    {order.items.map((item) => (
                      <li key={item.id} className="flex justify-between text-sm">
                        <span className="text-gray-400">
                          {item.product.name}
                          {item.variantId && item.product.variants && (
                            <span className="text-accent-mint ml-2">
                              ({(item.product.variants as any[]).find((v: any) => v.id === item.variantId)?.name})
                            </span>
                          )}
                          <span className="text-gray-500 ml-2">x{item.quantity}</span>
                        </span>
                        <span className="text-white font-medium">{(item.price * item.quantity).toFixed(2)} €</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Balance Modal */}
      <AddBalanceModal
        isOpen={isAddBalanceModalOpen}
        onClose={() => setIsAddBalanceModalOpen(false)}
        onSuccess={() => {
          // Optionally refresh balance stats
          getBalanceStats().then(setBalanceStats).catch(console.error);
        }}
      />
    </div>
  );
};

export default AdminDashboardPage;
