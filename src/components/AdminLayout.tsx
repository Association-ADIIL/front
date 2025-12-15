import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { isAdmin, loading } = useAuth();

  if (loading) {
      return <div className="min-h-screen bg-dark-bg text-white flex items-center justify-center">Chargement...</div>;
  }

  if (!isAdmin) {
      return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen bg-dark-bg text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-darker-bg p-6 shadow-lg fixed h-full overflow-y-auto">
        <Link to="/" className="block mb-8">
            <h2 className="text-3xl font-koulen text-accent-mint hover:text-white transition-colors">Admin ADIIL</h2>
            <p className="text-xs text-gray-400">Retour au site</p>
        </Link>
        <nav>
          <ul className="space-y-4">
            <li>
              <Link to="/admin/dashboard" className="block text-lg hover:text-accent-mint transition-colors font-bold">Dashboard</Link>
            </li>
            <li>
              <Link to="/admin/events" className="block text-lg hover:text-accent-mint transition-colors">Événements</Link>
            </li>
            <li>
              <Link to="/admin/products" className="block text-lg hover:text-accent-mint transition-colors">Produits</Link>
            </li>
            <li>
              <Link to="/admin/orders" className="block text-lg hover:text-accent-mint transition-colors">Commandes</Link>
            </li>
            <li>
              <Link to="/admin/statistics" className="block text-lg hover:text-accent-mint transition-colors">Statistiques</Link>
            </li>
            <li>
              <Link to="/admin/files" className="block text-lg hover:text-accent-mint transition-colors">Fichiers</Link>
            </li>
            <li>
              <Link to="/admin/users" className="block text-lg hover:text-accent-mint transition-colors">Utilisateurs</Link>
            </li>
            <li>
              <Link to="/admin/logs" className="block text-lg hover:text-accent-mint transition-colors">Logs d'Activité</Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 ml-64 min-w-0">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;