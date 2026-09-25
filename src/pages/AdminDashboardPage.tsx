import React, { useEffect, useState } from 'react';
import { getAllUsers } from '../api/users';
import { getAllEvents, type Event } from '../api/events';
import { getAllOrders, updateOrderStatus, updatePaymentStatus, type Order } from '../api/orders';
import { getAllInscriptions, type Inscription } from '../api/inscriptions';
import { getBalanceStats, type BalanceStats } from '../api/balance';
import { useNavigate } from 'react-router-dom';
import {
  Users, Calendar, ShoppingBag, TrendingUp, Plus,
  ArrowRight, Clock, CheckCircle, CalendarCheck, CreditCard, Wallet
} from 'lucide-react';
import AddBalanceModal from '../components/AddBalanceModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { logger } from '../utils/logger';

const AdminDashboardPage: React.FC = () => {
  useDocumentTitle('Admin - Dashboard');
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    newUsersThisMonth: 0,
    totalEvents: 0,
    upcomingEvents: 0,
    totalOrders: 0,
    ordersToCollectCount: 0,
    totalRevenue: 0,
    revenueThisMonth: 0,
    totalInscriptions: 0,
    avgOrderValue: 0,
  });
  const [balanceStats, setBalanceStats] = useState<BalanceStats | null>(null);
  const [recentInscriptions, setRecentInscriptions] = useState<Inscription[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [ordersToCollect, setOrdersToCollect] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddBalanceModalOpen, setIsAddBalanceModalOpen] = useState(false);
  const [confirmOrderId, setConfirmOrderId] = useState<number | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const handleMarkCollected = async (orderId: number) => {
    setConfirmLoading(true);
    try {
      await updatePaymentStatus(orderId, 'PAID');
      await updateOrderStatus(orderId, 'COLLECTED');
      setOrdersToCollect(prev => prev.filter(o => o.id !== orderId));
      setConfirmOrderId(null);
    } catch (error) {
      logger.error('Failed to mark order as collected', error);
    } finally {
      setConfirmLoading(false);
    }
  };

  const orderToConfirm = ordersToCollect.find(o => o.id === confirmOrderId);

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

        // Order stats - orders to collect: paid + waiting for collection OR cash_cb pending
        const ordersToCollectCount = orders.filter(o =>
          o.orderStatus !== 'COLLECTED' &&
          o.orderStatus !== 'CANCELLED' &&
          o.paymentStatus !== 'REFUNDED' &&
          (o.paymentStatus === 'PAID' || ((o.paymentMethod === 'CASH' || o.paymentMethod === 'CB') && o.paymentStatus === 'PENDING'))
        ).length;
        const totalRevenue = orders
          .filter(o => o.paymentStatus === 'PAID')
          .reduce((sum, o) => sum + o.totalPrice, 0);

        const revenueThisMonth = orders
          .filter(o => o.paymentStatus === 'PAID' && new Date(o.createdAt) >= firstDayOfMonth)
          .reduce((sum, o) => sum + o.totalPrice, 0);

        const paidOrders = orders.filter(o =>
          o.paymentStatus === 'PAID' &&
          !o.items.some(item => (item.product as any).subcategoryId === 19)
        );
        const avgOrderValue = paidOrders.length > 0
          ? paidOrders.reduce((sum, o) => sum + o.totalPrice, 0) / paidOrders.length
          : 0;

        // Orders to collect
        setOrdersToCollect(orders.filter(o => 
          o.orderStatus !== 'COLLECTED' && 
          o.orderStatus !== 'CANCELLED' && 
          o.paymentStatus !== 'REFUNDED' &&
          (o.paymentStatus === 'PAID' || ((o.paymentMethod === 'CASH' || o.paymentMethod === 'CB') && o.paymentStatus === 'PENDING'))
        ));

        // Recent inscriptions
        const recentInscriptionsList = inscriptions
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);

        setStats({
          totalUsers: users.length,
          newUsersThisMonth,
          totalEvents: events.length,
          upcomingEvents: upcoming.length,
          totalOrders: orders.length,
          ordersToCollectCount,
          totalRevenue,
          revenueThisMonth,
          totalInscriptions: inscriptions.length,
          avgOrderValue,
        });

        setRecentInscriptions(recentInscriptionsList);
        setUpcomingEvents(upcoming.slice(0, 4));
      } catch (error) {
        logger.error('Failed to fetch admin stats', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-red-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-1 h-12 bg-red-500 rounded-full hidden sm:block" />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-bold rounded-full uppercase tracking-wide">Admin</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold text-white font-koulen">TABLEAU DE BORD</h1>
            <p className="text-gray-500 text-sm mt-1">Vue d'ensemble de l'activite du BDE ADIIL</p>
          </div>
        </div>
      </div>

      {/* Quick Actions - Hidden on mobile */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-5 gap-4">
        <button
          onClick={() => navigate('/admin/events')}
          className="bg-darker-bg border border-gray-800 hover:border-purple-500/50 p-4 rounded-2xl transition-all group hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/10"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
              <Calendar className="text-purple-400" size={20} />
            </div>
            <Plus className="text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" size={18} />
          </div>
          <h3 className="text-sm font-bold text-white mb-0.5 text-left">Nouvel Evenement</h3>
          <p className="text-xs text-gray-500 text-left">Creer un evenement</p>
        </button>

        <button
          onClick={() => navigate('/admin/products')}
          className="bg-darker-bg border border-gray-800 hover:border-orange-500/50 p-4 rounded-2xl transition-all group hover:-translate-y-1 hover:shadow-lg hover:shadow-orange-500/10"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
              <ShoppingBag className="text-orange-400" size={20} />
            </div>
            <Plus className="text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity" size={18} />
          </div>
          <h3 className="text-sm font-bold text-white mb-0.5 text-left">Nouveau Produit</h3>
          <p className="text-xs text-gray-500 text-left">Ajouter a la boutique</p>
        </button>

        <button
          onClick={() => setIsAddBalanceModalOpen(true)}
          className="bg-darker-bg border border-gray-800 hover:border-cyan-500/50 p-4 rounded-2xl transition-all group hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/10"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
              <Wallet className="text-cyan-400" size={20} />
            </div>
            <Plus className="text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" size={18} />
          </div>
          <h3 className="text-sm font-bold text-white mb-0.5 text-left">Recharger Solde</h3>
          <p className="text-xs text-gray-500 text-left">Ajouter du credit</p>
        </button>

        <button
          onClick={() => navigate('/admin/users')}
          className="bg-darker-bg border border-gray-800 hover:border-blue-500/50 p-4 rounded-2xl transition-all group hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/10"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
              <Users className="text-blue-400" size={20} />
            </div>
            <ArrowRight className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" size={18} />
          </div>
          <h3 className="text-sm font-bold text-white mb-0.5 text-left">Utilisateurs</h3>
          <p className="text-xs text-gray-500 text-left">Gerer les comptes</p>
        </button>

        <button
          onClick={() => navigate('/admin/orders')}
          className="bg-darker-bg border border-gray-800 hover:border-green-500/50 p-4 rounded-2xl transition-all group hover:-translate-y-1 hover:shadow-lg hover:shadow-green-500/10"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
              <TrendingUp className="text-green-400" size={20} />
            </div>
            <ArrowRight className="text-green-400 opacity-0 group-hover:opacity-100 transition-opacity" size={18} />
          </div>
          <h3 className="text-sm font-bold text-white mb-0.5 text-left">Commandes</h3>
          <p className="text-xs text-gray-500 text-left">Voir toutes les ventes</p>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Users */}
        <div className="bg-darker-bg rounded-2xl p-5 border border-gray-800 hover:border-blue-500/30 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
              <Users className="text-blue-400" size={22} />
            </div>
            <span className="text-[10px] text-green-400 font-bold bg-green-500/10 px-2 py-1 rounded-full">+{stats.newUsersThisMonth} ce mois</span>
          </div>
          <h3 className="text-3xl font-koulen text-white mb-1">{stats.totalUsers}</h3>
          <p className="text-xs text-gray-500">Utilisateurs inscrits</p>
        </div>

        {/* Events */}
        <div className="bg-darker-bg rounded-2xl p-5 border border-gray-800 hover:border-purple-500/30 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
              <Calendar className="text-purple-400" size={22} />
            </div>
            <span className="text-[10px] text-purple-400 font-bold bg-purple-500/10 px-2 py-1 rounded-full">{stats.upcomingEvents} a venir</span>
          </div>
          <h3 className="text-3xl font-koulen text-white mb-1">{stats.totalEvents}</h3>
          <p className="text-xs text-gray-500">Evenements crees</p>
        </div>

        {/* Orders */}
        <div className="bg-darker-bg rounded-2xl p-5 border border-gray-800 hover:border-orange-500/30 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
              <ShoppingBag className="text-orange-400" size={22} />
            </div>
            {stats.ordersToCollectCount > 0 && (
              <span className="text-[10px] text-yellow-400 font-bold bg-yellow-500/10 px-2 py-1 rounded-full flex items-center gap-1">
                <Clock size={10} />
                {stats.ordersToCollectCount} a recuperer
              </span>
            )}
          </div>
          <h3 className="text-3xl font-koulen text-white mb-1">{stats.totalOrders}</h3>
          <p className="text-xs text-gray-500">Commandes totales</p>
        </div>

        {/* Revenue */}
        <div className="bg-darker-bg rounded-2xl p-5 border border-gray-800 hover:border-green-500/30 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
              <TrendingUp className="text-green-400" size={22} />
            </div>
            <span className="text-[10px] text-green-400 font-bold bg-green-500/10 px-2 py-1 rounded-full">{stats.revenueThisMonth.toFixed(2)}€ ce mois</span>
          </div>
          <h3 className="text-3xl font-koulen text-green-400 mb-1">{stats.totalRevenue.toFixed(2)} €</h3>
          <p className="text-xs text-gray-500">Chiffre d'affaires total</p>
        </div>

        {/* Panier moyen */}
        <div className="bg-darker-bg rounded-2xl p-5 border border-gray-800 hover:border-yellow-500/30 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center group-hover:bg-yellow-500/20 transition-colors">
              <ShoppingBag className="text-yellow-400" size={22} />
            </div>
          </div>
          <h3 className="text-3xl font-koulen text-yellow-400 mb-1">{stats.avgOrderValue.toFixed(2)} €</h3>
          <p className="text-xs text-gray-500">Panier moyen</p>
        </div>
      </div>

      {/* Balance Stats */}
      {balanceStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Balance */}
          <div className="bg-darker-bg rounded-2xl p-5 border border-gray-800 hover:border-purple-500/30 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                <Wallet className="text-purple-400" size={22} />
              </div>
            </div>
            <h3 className="text-3xl font-koulen text-purple-400 mb-1">{balanceStats.totalBalance.toFixed(2)} €</h3>
            <p className="text-xs text-gray-500">Solde total ADIIL</p>
          </div>

          {/* Total Recharged */}
          <div className="bg-darker-bg rounded-2xl p-5 border border-gray-800 hover:border-cyan-500/30 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                <CreditCard className="text-cyan-400" size={22} />
              </div>
              <span className="text-[10px] text-cyan-400 font-bold bg-cyan-500/10 px-2 py-1 rounded-full">{balanceStats.rechargedThisMonth.toFixed(2)}€ ce mois</span>
            </div>
            <h3 className="text-3xl font-koulen text-cyan-400 mb-1">{balanceStats.totalRecharged.toFixed(2)} €</h3>
            <p className="text-xs text-gray-500">Total recharge</p>
          </div>

          {/* Recharges Count */}
          <div className="bg-darker-bg rounded-2xl p-5 border border-gray-800 hover:border-pink-500/30 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-pink-500/10 rounded-xl flex items-center justify-center group-hover:bg-pink-500/20 transition-colors">
                <TrendingUp className="text-pink-400" size={22} />
              </div>
              <span className="text-[10px] text-pink-400 font-bold bg-pink-500/10 px-2 py-1 rounded-full">{balanceStats.rechargesThisMonth} ce mois</span>
            </div>
            <h3 className="text-3xl font-koulen text-pink-400 mb-1">{balanceStats.totalRecharges}</h3>
            <p className="text-xs text-gray-500">Recharges effectuees</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upcoming Events */}
        <div className="bg-darker-bg rounded-2xl border border-gray-800 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                <CalendarCheck className="text-purple-400" size={18} />
              </div>
              <h2 className="font-bold text-white">Evenements a venir</h2>
            </div>
            <button
              onClick={() => navigate('/admin/events')}
              className="text-xs text-gray-400 hover:text-purple-400 transition-colors"
            >
              Voir tout →
            </button>
          </div>
          <div className="p-4">
            {upcomingEvents.length === 0 ? (
              <p className="text-gray-500 italic py-4 text-center text-sm">Aucun evenement a venir</p>
            ) : (
              <div className="space-y-2">
                {upcomingEvents.map(event => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-3 bg-dark-bg rounded-xl hover:bg-dark-bg/70 border border-transparent hover:border-purple-500/20 transition-all cursor-pointer group"
                    onClick={() => navigate('/admin/events')}
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-purple-500/10 rounded-xl flex flex-col items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                      <span className="text-sm text-purple-400 font-bold leading-none">
                        {new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric' })}
                      </span>
                      <span className="text-[10px] text-purple-400/70 uppercase">
                        {new Date(event.date).toLocaleDateString('fr-FR', { month: 'short' })}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm truncate text-white group-hover:text-purple-400 transition-colors">{event.title}</h4>
                      <p className="text-xs text-gray-500 truncate">{event.location}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          event.status === 'FULL' ? 'bg-red-500/20 text-red-400' :
                          event.status === 'OPEN' ? 'bg-green-500/20 text-green-400' :
                          'bg-gray-700 text-gray-400'
                        }`}>
                          {event.status === 'FULL' ? 'Complet' :
                           event.status === 'OPEN' ? 'Ouvert' : 'Ferme'}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {event.registeredPeople || 0}/{event.totalPlaces}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Inscriptions */}
        <div className="bg-darker-bg rounded-2xl border border-gray-800 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                <CalendarCheck className="text-green-400" size={18} />
              </div>
              <h2 className="font-bold text-white">Dernieres inscriptions</h2>
            </div>
            <button
              onClick={() => navigate('/admin/orders')}
              className="text-xs text-gray-400 hover:text-green-400 transition-colors"
            >
              Voir tout →
            </button>
          </div>
          <div className="p-4">
            {recentInscriptions.length === 0 ? (
              <p className="text-gray-500 italic py-4 text-center text-sm">Aucune inscription</p>
            ) : (
              <div className="space-y-2">
                {recentInscriptions.map(inscription => (
                  <div
                    key={inscription.id}
                    className="flex items-center justify-between p-3 bg-dark-bg rounded-xl hover:bg-dark-bg/70 border border-transparent hover:border-green-500/20 transition-all cursor-pointer group"
                    onClick={() => navigate('/admin/orders')}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        inscription.paymentStatus === 'PAID' ? 'bg-green-400' :
                        inscription.paymentStatus === 'PENDING' ? 'bg-yellow-400' :
                        inscription.paymentStatus === 'REFUNDED' ? 'bg-purple-400' :
                        'bg-red-400'
                      }`} />
                      <div>
                        <p className="text-sm font-bold text-white group-hover:text-green-400 transition-colors">{inscription.event?.title || 'Evenement'}</p>
                        <p className="text-xs text-gray-500">
                          {inscription.user?.firstName} {inscription.user?.lastName} • {inscription.quantity} place{inscription.quantity > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-400">{inscription.totalPrice.toFixed(2)} €</p>
                      <p className="text-[10px] text-gray-500">
                        {new Date(inscription.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Orders to Collect Section */}
      {ordersToCollect.length > 0 && (
        <div className="bg-darker-bg rounded-2xl border border-gray-800 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-800 bg-yellow-500/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                <ShoppingBag className="text-yellow-400" size={18} />
              </div>
              <div>
                <h2 className="font-bold text-white">Commandes a recuperer</h2>
                <p className="text-xs text-yellow-400">{ordersToCollect.length} en attente</p>
              </div>
            </div>
          </div>
          <div className="p-4 space-y-3">
            {ordersToCollect.map(order => (
              <div key={order.id} className="bg-dark-bg rounded-xl border border-gray-800 overflow-hidden hover:border-yellow-500/30 transition-all">
                <div className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono text-xs bg-darker-bg px-2 py-0.5 rounded text-gray-400">#{order.id.toString().padStart(6, '0')}</span>
                        <span className="text-white font-medium">{order.user ? `${order.user.firstName} ${order.user.lastName}` : 'Client Inconnu'}</span>
                        {(order.paymentMethod === 'CASH' || order.paymentMethod === 'CB') && (
                          <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-[10px] font-bold">
                            Paiement sur place
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {order.items.length} article(s) • <span className="text-green-400 font-medium">{order.totalPrice.toFixed(2)} €</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setConfirmOrderId(order.id)}
                      className="px-4 py-2.5 bg-green-500 hover:bg-green-400 text-darker-bg font-bold rounded-xl transition-colors flex items-center gap-2 text-sm"
                    >
                      <CheckCircle size={16} />
                      Valider
                    </button>
                  </div>
                </div>

                {/* Order Items Detail */}
                <div className="border-t border-gray-800 bg-darker-bg/50 p-3">
                  <ul className="space-y-1.5">
                    {order.items.map((item) => {
                      const hasProductDiscount = item.originalPrice && item.originalPrice > item.price;
                      const originalTotal = hasProductDiscount ? item.originalPrice! * item.quantity : null;
                      const itemTotal = item.price * item.quantity;

                      return (
                        <li key={item.id} className="flex justify-between text-xs">
                          <span className="text-gray-400">
                            <span className="text-white">{item.quantity}x</span> {item.product.name}
                          </span>
                          <span className="text-right">
                            {hasProductDiscount ? (
                              <>
                                <span className="text-gray-600 line-through mr-1">{originalTotal!.toFixed(2)}€</span>
                                <span className="text-red-400 font-medium">{itemTotal.toFixed(2)}€</span>
                              </>
                            ) : (
                              <span className="text-gray-300 font-medium">{itemTotal.toFixed(2)}€</span>
                            )}
                          </span>
                        </li>
                      );
                    })}
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
          getBalanceStats().then(setBalanceStats).catch(err => logger.error('Failed to refresh balance stats', err));
        }}
      />

      {/* Confirm Order Collection Dialog */}
      <ConfirmDialog
        isOpen={confirmOrderId !== null}
        onClose={() => setConfirmOrderId(null)}
        onConfirm={() => confirmOrderId && handleMarkCollected(confirmOrderId)}
        title="Confirmer la récupération"
        message={orderToConfirm
          ? `Voulez-vous confirmer la récupération de la commande #${orderToConfirm.id} de ${orderToConfirm.user?.firstName} ${orderToConfirm.user?.lastName} (${orderToConfirm.totalPrice.toFixed(2)} €) ?`
          : ''
        }
        confirmText="Valider"
        cancelText="Annuler"
        variant="info"
        loading={confirmLoading}
      />
    </div>
  );
};

export default AdminDashboardPage;