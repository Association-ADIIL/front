import React, { useEffect, useState } from 'react';
import { logger } from '../utils/logger';
import { getAllOrders, type Order } from '../api/orders';
import { getAllInscriptions, type Inscription } from '../api/inscriptions';
import { TrendingUp, DollarSign, ShoppingBag, Calendar, Users } from 'lucide-react';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

interface Stats {
  totalRevenue: number;
  revenueThisMonth: number;
  revenueThisYear: number;
  totalOrders: number;
  totalInscriptions: number;
  averageOrderValue: number;
  averageInscriptionValue: number;
}

const AdminSalesStatisticsPage: React.FC = () => {
  useDocumentTitle('Admin - Statistiques');
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    revenueThisMonth: 0,
    revenueThisYear: 0,
    totalOrders: 0,
    totalInscriptions: 0,
    averageOrderValue: 0,
    averageInscriptionValue: 0,
  });
  const [, setOrders] = useState<Order[]>([]);
  const [, setInscriptions] = useState<Inscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [revenueSourceData, setRevenueSourceData] = useState<any[]>([]);
  const [paymentMethodData, setPaymentMethodData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersData, inscriptionsData] = await Promise.all([
          getAllOrders(),
          getAllInscriptions({}),
        ]);

        setOrders(ordersData);
        setInscriptions(inscriptionsData);

        // Calculate stats
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const firstDayOfYear = new Date(now.getFullYear(), 0, 1);

        // Orders revenue
        const paidOrders = ordersData.filter(o => o.paymentStatus === 'PAID');
        const ordersRevenue = paidOrders.reduce((sum, o) => sum + o.totalPrice, 0);
        const ordersThisMonth = paidOrders.filter(o => new Date(o.createdAt) >= firstDayOfMonth);
        const ordersRevenueThisMonth = ordersThisMonth.reduce((sum, o) => sum + o.totalPrice, 0);
        const ordersThisYear = paidOrders.filter(o => new Date(o.createdAt) >= firstDayOfYear);
        const ordersRevenueThisYear = ordersThisYear.reduce((sum, o) => sum + o.totalPrice, 0);

        // Inscriptions revenue
        const paidInscriptions = inscriptionsData.filter(i => i.paymentStatus === 'PAID');
        const inscriptionsRevenue = paidInscriptions.reduce((sum, i) => sum + i.totalPrice, 0);
        const inscriptionsThisMonth = paidInscriptions.filter(i => new Date(i.createdAt) >= firstDayOfMonth);
        const inscriptionsRevenueThisMonth = inscriptionsThisMonth.reduce((sum, i) => sum + i.totalPrice, 0);
        const inscriptionsThisYear = paidInscriptions.filter(i => new Date(i.createdAt) >= firstDayOfYear);
        const inscriptionsRevenueThisYear = inscriptionsThisYear.reduce((sum, i) => sum + i.totalPrice, 0);

        setStats({
          totalRevenue: ordersRevenue + inscriptionsRevenue,
          revenueThisMonth: ordersRevenueThisMonth + inscriptionsRevenueThisMonth,
          revenueThisYear: ordersRevenueThisYear + inscriptionsRevenueThisYear,
          totalOrders: paidOrders.length,
          totalInscriptions: paidInscriptions.length,
          averageOrderValue: paidOrders.length > 0 ? ordersRevenue / paidOrders.length : 0,
          averageInscriptionValue: paidInscriptions.length > 0 ? inscriptionsRevenue / paidInscriptions.length : 0,
        });

        // Calculate monthly revenue data (last 6 months)
        const monthlyRevenue: { [key: string]: { orders: number; inscriptions: number } } = {};
        const months = [];

        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthKey = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
          months.push(monthKey);
          monthlyRevenue[monthKey] = { orders: 0, inscriptions: 0 };
        }

        paidOrders.forEach(order => {
          const monthKey = new Date(order.createdAt).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
          if (monthlyRevenue[monthKey]) {
            monthlyRevenue[monthKey].orders += order.totalPrice;
          }
        });

        paidInscriptions.forEach(inscription => {
          const monthKey = new Date(inscription.createdAt).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
          if (monthlyRevenue[monthKey]) {
            monthlyRevenue[monthKey].inscriptions += inscription.totalPrice;
          }
        });

        const monthlyChartData = months.map(month => ({
          month,
          Commandes: Math.round(monthlyRevenue[month].orders * 100) / 100,
          Inscriptions: Math.round(monthlyRevenue[month].inscriptions * 100) / 100,
          Total: Math.round((monthlyRevenue[month].orders + monthlyRevenue[month].inscriptions) * 100) / 100,
        }));

        setMonthlyData(monthlyChartData);

        // Revenue source pie chart data
        setRevenueSourceData([
          { name: 'Commandes', value: Math.round(ordersRevenue * 100) / 100, color: '#77F1BE' },
          { name: 'Inscriptions', value: Math.round(inscriptionsRevenue * 100) / 100, color: '#FF6B9D' },
        ]);

        // Payment method data
        const paymentMethods: { [key: string]: number } = {};
        [...paidOrders, ...paidInscriptions].forEach(item => {
          const method = item.paymentMethod;
          paymentMethods[method] = (paymentMethods[method] || 0) + item.totalPrice;
        });

        const methodLabels: { [key: string]: string } = {
          PAYPAL: 'PayPal',
          HELLOASSO: 'HelloAsso',
          CASH_CB: 'Especes/CB',
          FREE: 'Gratuit',
          BALANCE: 'Solde ADIIL',
        };

        setPaymentMethodData(
          Object.entries(paymentMethods).map(([method, amount]) => ({
            method: methodLabels[method] || method,
            montant: Math.round(amount * 100) / 100,
          }))
        );

      } catch (error) {
        logger.error('Error fetching statistics', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-1 h-12 bg-emerald-500 rounded-full hidden sm:block" />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full uppercase tracking-wide">Finances</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold font-koulen text-white">STATISTIQUES</h1>
            <p className="text-gray-500 text-sm mt-1">Vue d'ensemble des revenus et des ventes</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Revenue */}
        <div className="bg-darker-bg p-5 rounded-2xl border border-gray-800 hover:border-emerald-500/30 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
              <DollarSign className="text-emerald-400" size={22} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-1">Revenu Total</p>
          <h3 className="text-3xl font-koulen text-emerald-400">{stats.totalRevenue.toFixed(2)}€</h3>
        </div>

        {/* Revenue This Month */}
        <div className="bg-darker-bg p-5 rounded-2xl border border-gray-800 hover:border-orange-500/30 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
              <TrendingUp className="text-orange-400" size={22} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-1">Revenu ce mois</p>
          <h3 className="text-3xl font-koulen text-orange-400">{stats.revenueThisMonth.toFixed(2)}€</h3>
        </div>

        {/* Revenue This Year */}
        <div className="bg-darker-bg p-5 rounded-2xl border border-gray-800 hover:border-purple-500/30 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
              <Calendar className="text-purple-400" size={22} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-1">Revenu cette annee</p>
          <h3 className="text-3xl font-koulen text-purple-400">{stats.revenueThisYear.toFixed(2)}€</h3>
        </div>

        {/* Total Transactions */}
        <div className="bg-darker-bg p-5 rounded-2xl border border-gray-800 hover:border-blue-500/30 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
              <Users className="text-blue-400" size={22} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-1">Transactions</p>
          <h3 className="text-3xl font-koulen text-blue-400">{stats.totalOrders + stats.totalInscriptions}</h3>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Orders Stats */}
        <div className="bg-darker-bg p-6 rounded-2xl border border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <ShoppingBag className="text-emerald-400" size={24} />
            <h2 className="text-xl font-bold text-white">Commandes Boutique</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-800">
              <span className="text-gray-400">Total des commandes</span>
              <span className="text-white font-semibold">{stats.totalOrders}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-800">
              <span className="text-gray-400">Panier moyen</span>
              <span className="text-white font-semibold">{stats.averageOrderValue.toFixed(2)} EUR</span>
            </div>
          </div>
        </div>

        {/* Inscriptions Stats */}
        <div className="bg-darker-bg p-6 rounded-2xl border border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="text-pink-400" size={24} />
            <h2 className="text-xl font-bold text-white">Inscriptions Evenements</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-800">
              <span className="text-gray-400">Total des inscriptions</span>
              <span className="text-white font-semibold">{stats.totalInscriptions}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-800">
              <span className="text-gray-400">Prix moyen</span>
              <span className="text-white font-semibold">{stats.averageInscriptionValue.toFixed(2)} EUR</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="space-y-6">
        {/* Monthly Revenue Trend */}
        <div className="bg-darker-bg p-6 rounded-2xl border border-gray-800">
          <h2 className="text-xl font-bold text-white mb-6">Evolution du Revenu (6 derniers mois)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F0F0F', border: '1px solid #374151', borderRadius: '12px' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Legend />
              <Line type="monotone" dataKey="Commandes" stroke="#77F1BE" strokeWidth={2} />
              <Line type="monotone" dataKey="Inscriptions" stroke="#FF6B9D" strokeWidth={2} />
              <Line type="monotone" dataKey="Total" stroke="#9333EA" strokeWidth={3} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Source Pie Chart */}
          <div className="bg-darker-bg p-6 rounded-2xl border border-gray-800">
            <h2 className="text-xl font-bold text-white mb-6">Repartition du Revenu</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenueSourceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${value}EUR (${((percent ?? 0) * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {revenueSourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F0F0F', border: '1px solid #374151', borderRadius: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Payment Methods Bar Chart */}
          <div className="bg-darker-bg p-6 rounded-2xl border border-gray-800">
            <h2 className="text-xl font-bold text-white mb-6">Methodes de Paiement</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={paymentMethodData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="method" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F0F0F', border: '1px solid #374151', borderRadius: '12px' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Bar dataKey="montant" fill="#77F1BE" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSalesStatisticsPage;
