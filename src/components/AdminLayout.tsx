import React, { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Calendar,
  ShoppingBag,
  ClipboardList,
  BarChart3,
  FolderOpen,
  Users,
  ScrollText,
  ArrowLeft,
  Menu,
  X
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/events', label: 'Evenements', icon: Calendar },
  { path: '/admin/products', label: 'Produits', icon: ShoppingBag },
  { path: '/admin/orders', label: 'Commandes', icon: ClipboardList },
  { path: '/admin/statistics', label: 'Statistiques', icon: BarChart3 },
  { path: '/admin/files', label: 'Fichiers', icon: FolderOpen },
  { path: '/admin/users', label: 'Utilisateurs', icon: Users },
  { path: '/admin/logs', label: 'Logs', icon: ScrollText },
];

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { isAdmin, loading } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-darker-bg flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-accent-mint border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex min-h-screen bg-dark-bg text-white">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-darker-bg border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-koulen text-accent-mint">
          ADMIN ADIIL
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-white hover:text-accent-mint transition-colors"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed h-full overflow-y-auto border-r border-gray-800 bg-darker-bg shadow-lg z-50
        w-64 transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 pt-4 lg:pt-6">
          <Link to="/" className="block mb-8 group hidden lg:block">
            <h2 className="text-2xl font-koulen text-accent-mint group-hover:text-white transition-colors">
              ADMIN ADIIL
            </h2>
            <div className="flex items-center gap-1 text-xs text-gray-500 group-hover:text-accent-mint transition-colors mt-1">
              <ArrowLeft size={12} />
              <span>Retour au site</span>
            </div>
          </Link>

          {/* Mobile: Retour au site link */}
          <Link to="/" className="lg:hidden flex items-center gap-2 text-sm text-gray-500 hover:text-accent-mint transition-colors mb-6 mt-12">
            <ArrowLeft size={14} />
            <span>Retour au site</span>
          </Link>

          <nav>
            <ul className="space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;

                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={closeSidebar}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        isActive
                          ? 'bg-accent-mint/10 text-accent-mint border border-accent-mint/30'
                          : 'text-gray-400 hover:bg-dark-bg hover:text-white border border-transparent'
                      }`}
                    >
                      <Icon size={18} />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 lg:p-8 lg:ml-64 min-w-0 mt-14 lg:mt-0">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
