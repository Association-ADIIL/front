import React, { useEffect, useState } from 'react';
import { getAllUsers } from '../api/users';
import { getAllEvents } from '../api/events';
import { getAllOrders } from '../api/orders';
import { Users, Calendar, ShoppingBag, TrendingUp } from 'lucide-react';

const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState({
    usersCount: 0,
    eventsCount: 0,
    ordersCount: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [users, events, orders] = await Promise.all([
          getAllUsers(),
          getAllEvents(),
          getAllOrders(),
        ]);

        const revenue = orders.reduce((sum, order) => {
            return (order.status === 'PAID' || order.status === 'DELIVERED') ? sum + order.totalAmount : sum;
        }, 0);

        setStats({
          usersCount: users.length,
          eventsCount: events.length,
          ordersCount: orders.length,
          totalRevenue: revenue,
        });
      } catch (error) {
        console.error("Failed to fetch admin stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center">Chargement du tableau de bord...</div>;

  return (
    <div>
      <h1 className="text-4xl font-bold text-accent-mint mb-2 font-koulen">Tableau de Bord</h1>
      <p className="text-lg mb-8 text-gray-400">Vue d'ensemble de l'activité du BDE ADIIL.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card p-6 border border-gray-800 flex items-center justify-between">
          <div>
              <p className="text-gray-400 mb-1">Utilisateurs</p>
              <h2 className="text-3xl font-bold">{stats.usersCount}</h2>
          </div>
          <div className="p-3 bg-blue-900/20 rounded-full text-blue-400">
              <Users size={32} />
          </div>
        </div>
        
        <div className="card p-6 border border-gray-800 flex items-center justify-between">
          <div>
              <p className="text-gray-400 mb-1">Événements</p>
              <h2 className="text-3xl font-bold">{stats.eventsCount}</h2>
          </div>
          <div className="p-3 bg-purple-900/20 rounded-full text-purple-400">
              <Calendar size={32} />
          </div>
        </div>

        <div className="card p-6 border border-gray-800 flex items-center justify-between">
          <div>
              <p className="text-gray-400 mb-1">Commandes</p>
              <h2 className="text-3xl font-bold">{stats.ordersCount}</h2>
          </div>
          <div className="p-3 bg-orange-900/20 rounded-full text-orange-400">
              <ShoppingBag size={32} />
          </div>
        </div>

        <div className="card p-6 border border-gray-800 flex items-center justify-between">
          <div>
              <p className="text-gray-400 mb-1">Chiffre d'Affaires</p>
              <h2 className="text-3xl font-bold text-accent-mint">{stats.totalRevenue} €</h2>
          </div>
          <div className="p-3 bg-green-900/20 rounded-full text-accent-mint">
              <TrendingUp size={32} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card p-6 border border-gray-800">
          <h2 className="text-xl font-bold mb-4">Activité Récente</h2>
          <p className="text-gray-500 italic">Historique d'activité à venir...</p>
        </div>
        <div className="card p-6 border border-gray-800">
          <h2 className="text-xl font-bold mb-4">Actions Rapides</h2>
          <div className="grid grid-cols-2 gap-4">
              <button className="bg-dark-bg hover:bg-gray-800 border border-gray-700 p-4 rounded text-center transition-colors">
                  Créer un événement
              </button>
              <button className="bg-dark-bg hover:bg-gray-800 border border-gray-700 p-4 rounded text-center transition-colors">
                  Ajouter un produit
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;