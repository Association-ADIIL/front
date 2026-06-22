import React, { useEffect, useState } from 'react';
import { logger } from '../utils/logger';
import { getAllOrders, type Order } from '../api/orders';
import { getAllInscriptions, type Inscription } from '../api/inscriptions';
import { TrendingUp, DollarSign, ShoppingBag, Calendar, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react';
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
  revenueLastMonth: number;
  revenueThisYear: number;
  totalOrders: number;
  totalInscriptions: number;
  averageOrderValue: number;
  averageInscriptionValue: number;
}

// Custom tooltip component for better styling
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-darker-bg border border-gray-700 rounded-xl p-3 shadow-xl">
        <p className="text-white font-medium mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="font-bold">{entry.value.toFixed(2)} €</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Custom legend component
const CustomLegend = ({ payload }: any) => {
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-300 text-sm">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

const AdminSalesStatisticsPage: React.FC = () => {
  useDocumentTitle('Admin - Statistiques');
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    revenueThisMonth: 0,
    revenueLastMonth: 0,
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
        const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        const firstDayOfYear = new Date(now.getFullYear(), 0, 1);

        // Orders revenue
        const paidOrders = ordersData.filter(o => o.paymentStatus === 'PAID');
        const ordersRevenue = paidOrders.reduce((sum, o) => sum + o.totalPrice, 0);
        const ordersThisMonth = paidOrders.filter(o => new Date(o.createdAt) >= firstDayOfMonth);
        const ordersRevenueThisMonth = ordersThisMonth.reduce((sum, o) => sum + o.totalPrice, 0);
        const ordersLastMonth = paidOrders.filter(o => {
          const date = new Date(o.createdAt);
          return date >= firstDayOfLastMonth && date <= lastDayOfLastMonth;
        });
        const ordersRevenueLastMonth = ordersLastMonth.reduce((sum, o) => sum + o.totalPrice, 0);
        const ordersThisYear = paidOrders.filter(o => new Date(o.createdAt) >= firstDayOfYear);
        const ordersRevenueThisYear = ordersThisYear.reduce((sum, o) => sum + o.totalPrice, 0);

        // Inscriptions revenue
        const paidInscriptions = inscriptionsData.filter(i => i.paymentStatus === 'PAID');
        const inscriptionsRevenue = paidInscriptions.reduce((sum, i) => sum + i.totalPrice, 0);
        const inscriptionsThisMonth = paidInscriptions.filter(i => new Date(i.createdAt) >= firstDayOfMonth);
        const inscriptionsRevenueThisMonth = inscriptionsThisMonth.reduce((sum, i) => sum + i.totalPrice, 0);
        const inscriptionsLastMonth = paidInscriptions.filter(i => {
          const date = new Date(i.createdAt);
          return date >= firstDayOfLastMonth && date <= lastDayOfLastMonth;
        });
        const inscriptionsRevenueLastMonth = inscriptionsLastMonth.reduce((sum, i) => sum + i.totalPrice, 0);
        const inscriptionsThisYear = paidInscriptions.filter(i => new Date(i.createdAt) >= firstDayOfYear);
        const inscriptionsRevenueThisYear = inscriptionsThisYear.reduce((sum, i) => sum + i.totalPrice, 0);

        setStats({
          totalRevenue: ordersRevenue + inscriptionsRevenue,
          revenueThisMonth: ordersRevenueThisMonth + inscriptionsRevenueThisMonth,
          revenueLastMonth: ordersRevenueLastMonth + inscriptionsRevenueLastMonth,
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
          const monthKey = date.toLocaleDateString('fr-FR', { month: 'short' });
          months.push(monthKey);
          monthlyRevenue[monthKey] = { orders: 0, inscriptions: 0 };
        }

        paidOrders.forEach(order => {
          const monthKey = new Date(order.createdAt).toLocaleDateString('fr-FR', { month: 'short' });
          if (monthlyRevenue[monthKey]) {
            monthlyRevenue[monthKey].orders += order.totalPrice;
          }
        });

        paidInscriptions.forEach(inscription => {
          const monthKey = new Date(inscription.createdAt).toLocaleDateString('fr-FR', { month: 'short' });
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

        // Payment method data (exclude FREE as it doesn't represent actual revenue)
        const paymentMethods: { [key: string]: number } = {};
        [...paidOrders, ...paidInscriptions].forEach(item => {
          const method = item.paymentMethod;
          if (method === 'FREE') return; // Skip free transactions
          paymentMethods[method] = (paymentMethods[method] || 0) + item.totalPrice;
        });

        const methodLabels: { [key: string]: string } = {

          HELLOASSO: 'HelloAsso',
          CASH: 'Espèces',
          CB: 'CB',
          FREE: 'Gratuit',
          BALANCE: 'Solde',
        };

        const methodColors: { [key: string]: string } = {
          CASH: '#0070ba',
          HELLOASSO: '#49D38A',
          CB: '#F59E0B',
          FREE: '#8B5CF6',
          BALANCE: '#77F1BE',
        };

        setPaymentMethodData(
          Object.entries(paymentMethods).map(([method, amount]) => ({
            method: methodLabels[method] || method,
            montant: Math.round(amount * 100) / 100,
            fill: methodColors[method] || '#77F1BE',
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

  // Calculate month-over-month change
  const monthChange = stats.revenueLastMonth > 0
    ? ((stats.revenueThisMonth - stats.revenueLastMonth) / stats.revenueLastMonth) * 100
    : 0;
  const isPositiveChange = monthChange >= 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Revenue */}
        <div className="bg-darker-bg p-4 sm:p-5 rounded-2xl border border-gray-800 hover:border-emerald-500/30 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
              <DollarSign className="text-emerald-400" size={20} />
            </div>
          </div>
          <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider mb-1">Revenu Total</p>
          <h3 className="text-xl sm:text-3xl font-koulen text-emerald-400">{stats.totalRevenue.toFixed(2)}€</h3>
        </div>

        {/* Revenue This Month */}
        <div className="bg-darker-bg p-4 sm:p-5 rounded-2xl border border-gray-800 hover:border-orange-500/30 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500/10 rounded-xl flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
              <TrendingUp className="text-orange-400" size={20} />
            </div>
            {stats.revenueLastMonth > 0 && (
              <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${isPositiveChange ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                {isPositiveChange ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                <span className="font-medium">{Math.abs(monthChange).toFixed(0)}%</span>
              </div>
            )}
          </div>
          <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider mb-1">Ce mois</p>
          <h3 className="text-xl sm:text-3xl font-koulen text-orange-400">{stats.revenueThisMonth.toFixed(2)}€</h3>
        </div>

        {/* Revenue This Year */}
        <div className="bg-darker-bg p-4 sm:p-5 rounded-2xl border border-gray-800 hover:border-purple-500/30 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/10 rounded-xl flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
              <Calendar className="text-purple-400" size={20} />
            </div>
          </div>
          <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider mb-1">Cette année</p>
          <h3 className="text-xl sm:text-3xl font-koulen text-purple-400">{stats.revenueThisYear.toFixed(2)}€</h3>
        </div>

        {/* Total Transactions */}
        <div className="bg-darker-bg p-4 sm:p-5 rounded-2xl border border-gray-800 hover:border-blue-500/30 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
              <Users className="text-blue-400" size={20} />
            </div>
          </div>
          <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider mb-1">Transactions</p>
          <h3 className="text-xl sm:text-3xl font-koulen text-blue-400">{stats.totalOrders + stats.totalInscriptions}</h3>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Orders Stats */}
        <div className="bg-darker-bg p-4 sm:p-6 rounded-2xl border border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <ShoppingBag className="text-emerald-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Commandes Boutique</h2>
              <p className="text-xs text-gray-500">Ventes de produits</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-3 px-4 bg-dark-bg rounded-xl">
              <span className="text-gray-400 text-sm">Total des commandes</span>
              <span className="text-white font-bold text-lg">{stats.totalOrders}</span>
            </div>
            <div className="flex justify-between items-center py-3 px-4 bg-dark-bg rounded-xl">
              <span className="text-gray-400 text-sm">Panier moyen</span>
              <span className="text-emerald-400 font-koulen text-xl">{stats.averageOrderValue.toFixed(2)} €</span>
            </div>
          </div>
        </div>

        {/* Inscriptions Stats */}
        <div className="bg-darker-bg p-4 sm:p-6 rounded-2xl border border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-pink-500/10 rounded-xl flex items-center justify-center">
              <Calendar className="text-pink-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Inscriptions Événements</h2>
              <p className="text-xs text-gray-500">Billetterie et participations</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-3 px-4 bg-dark-bg rounded-xl">
              <span className="text-gray-400 text-sm">Total des inscriptions</span>
              <span className="text-white font-bold text-lg">{stats.totalInscriptions}</span>
            </div>
            <div className="flex justify-between items-center py-3 px-4 bg-dark-bg rounded-xl">
              <span className="text-gray-400 text-sm">Prix moyen</span>
              <span className="text-pink-400 font-koulen text-xl">{stats.averageInscriptionValue.toFixed(2)} €</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="space-y-4 sm:space-y-6">
        {/* Monthly Revenue Trend */}
        <div className="bg-darker-bg p-4 sm:p-6 rounded-2xl border border-gray-800">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Évolution du Revenu</h2>
          <div className="h-[250px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  axisLine={{ stroke: '#374151' }}
                  tickLine={false}
                />
                <YAxis
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  axisLine={{ stroke: '#374151' }}
                  tickLine={false}
                  tickFormatter={(value) => `${value}€`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend />} />
                <Line
                  type="monotone"
                  dataKey="Commandes"
                  stroke="#77F1BE"
                  strokeWidth={2}
                  dot={{ fill: '#77F1BE', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, fill: '#77F1BE' }}
                />
                <Line
                  type="monotone"
                  dataKey="Inscriptions"
                  stroke="#FF6B9D"
                  strokeWidth={2}
                  dot={{ fill: '#FF6B9D', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, fill: '#FF6B9D' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Revenue Source Pie Chart */}
          <div className="bg-darker-bg p-4 sm:p-6 rounded-2xl border border-gray-800">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Répartition du Revenu</h2>
            <div className="h-[250px] sm:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueSourceData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {revenueSourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-darker-bg border border-gray-700 rounded-xl p-3 shadow-xl">
                            <p className="text-white font-medium">{data.name}</p>
                            <p className="text-lg font-koulen" style={{ color: data.color }}>
                              {data.value.toFixed(2)} €
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Custom legend below */}
            <div className="flex justify-center gap-6 mt-2">
              {revenueSourceData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-gray-300 text-sm">{entry.name}</span>
                  <span className="text-gray-500 text-sm">({entry.value.toFixed(0)}€)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Methods Bar Chart */}
          <div className="bg-darker-bg p-4 sm:p-6 rounded-2xl border border-gray-800">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Méthodes de Paiement</h2>
            <div className="h-[250px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentMethodData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis
                    dataKey="method"
                    stroke="#9CA3AF"
                    tick={{ fill: '#9CA3AF', fontSize: 11 }}
                    axisLine={{ stroke: '#374151' }}
                    tickLine={false}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    axisLine={{ stroke: '#374151' }}
                    tickLine={false}
                    tickFormatter={(value) => `${value}€`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-darker-bg border border-gray-700 rounded-xl p-3 shadow-xl">
                            <p className="text-white font-medium">{data.method}</p>
                            <p className="text-lg font-koulen text-emerald-400">
                              {data.montant.toFixed(2)} €
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="montant"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={60}
                  >
                    {paymentMethodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSalesStatisticsPage;
