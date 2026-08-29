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
  X,
  Tags,
  Gift,
  CreditCard,
  Terminal,
  Shield,
  Database,
  Trophy,
  Megaphone,
  Receipt,

} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

// Color configurations for each nav item
const colorConfig: Record<string, { bg: string; text: string; border: string; shadow: string; iconBg: string; hoverClass: string; scrollbar: string }> = {
  '/admin/dashboard': {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/30',
    shadow: 'shadow-red-500/5',
    iconBg: 'bg-red-500/20',
    hoverClass: 'hover:bg-red-500/10 hover:text-red-400 [&>div]:hover:bg-red-500/20 [&>div>svg]:hover:text-red-400',
    scrollbar: 'scrollbar-red'
  },
  '/admin/events': {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
    shadow: 'shadow-purple-500/5',
    iconBg: 'bg-purple-500/20',
    hoverClass: 'hover:bg-purple-500/10 hover:text-purple-400 [&>div]:hover:bg-purple-500/20 [&>div>svg]:hover:text-purple-400',
    scrollbar: 'scrollbar-purple'
  },
  '/admin/products': {
    bg: 'bg-orange-500/10',
    text: 'text-orange-400',
    border: 'border-orange-500/30',
    shadow: 'shadow-orange-500/5',
    iconBg: 'bg-orange-500/20',
    hoverClass: 'hover:bg-orange-500/10 hover:text-orange-400 [&>div]:hover:bg-orange-500/20 [&>div>svg]:hover:text-orange-400',
    scrollbar: 'scrollbar-orange'
  },
  '/admin/categories': {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    border: 'border-cyan-500/30',
    shadow: 'shadow-cyan-500/5',
    iconBg: 'bg-cyan-500/20',
    hoverClass: 'hover:bg-cyan-500/10 hover:text-cyan-400 [&>div]:hover:bg-cyan-500/20 [&>div>svg]:hover:text-cyan-400',
    scrollbar: 'scrollbar-cyan'
  },
  '/admin/orders': {
    bg: 'bg-green-500/10',
    text: 'text-green-400',
    border: 'border-green-500/30',
    shadow: 'shadow-green-500/5',
    iconBg: 'bg-green-500/20',
    hoverClass: 'hover:bg-green-500/10 hover:text-green-400 [&>div]:hover:bg-green-500/20 [&>div>svg]:hover:text-green-400',
    scrollbar: 'scrollbar-green'
  },
  '/admin/promotions': {
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    shadow: 'shadow-rose-500/5',
    iconBg: 'bg-rose-500/20',
    hoverClass: 'hover:bg-rose-500/10 hover:text-rose-400 [&>div]:hover:bg-rose-500/20 [&>div>svg]:hover:text-rose-400',
    scrollbar: 'scrollbar-rose'
  },
  '/admin/transactions': {
    bg: 'bg-pink-500/10',
    text: 'text-pink-400',
    border: 'border-pink-500/30',
    shadow: 'shadow-pink-500/5',
    iconBg: 'bg-pink-500/20',
    hoverClass: 'hover:bg-pink-500/10 hover:text-pink-400 [&>div]:hover:bg-pink-500/20 [&>div>svg]:hover:text-pink-400',
    scrollbar: 'scrollbar-pink'
  },
  '/admin/statistics': {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    shadow: 'shadow-emerald-500/5',
    iconBg: 'bg-emerald-500/20',
    hoverClass: 'hover:bg-emerald-500/10 hover:text-emerald-400 [&>div]:hover:bg-emerald-500/20 [&>div>svg]:hover:text-emerald-400',
    scrollbar: 'scrollbar-emerald'
  },
  '/admin/files': {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    shadow: 'shadow-amber-500/5',
    iconBg: 'bg-amber-500/20',
    hoverClass: 'hover:bg-amber-500/10 hover:text-amber-400 [&>div]:hover:bg-amber-500/20 [&>div>svg]:hover:text-amber-400',
    scrollbar: 'scrollbar-amber'
  },
  '/admin/users': {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
    shadow: 'shadow-blue-500/5',
    iconBg: 'bg-blue-500/20',
    hoverClass: 'hover:bg-blue-500/10 hover:text-blue-400 [&>div]:hover:bg-blue-500/20 [&>div>svg]:hover:text-blue-400',
    scrollbar: 'scrollbar-blue'
  },
  '/admin/logs': {
    bg: 'bg-gray-500/10',
    text: 'text-gray-400',
    border: 'border-gray-500/30',
    shadow: 'shadow-gray-500/5',
    iconBg: 'bg-gray-500/20',
    hoverClass: 'hover:bg-gray-500/10 hover:text-gray-400 [&>div]:hover:bg-gray-500/20 [&>div>svg]:hover:text-gray-400',
    scrollbar: 'scrollbar-gray'
  },
  '/admin/backups': {
    bg: 'bg-teal-500/10',
    text: 'text-teal-400',
    border: 'border-teal-500/30',
    shadow: 'shadow-teal-500/5',
    iconBg: 'bg-teal-500/20',
    hoverClass: 'hover:bg-teal-500/10 hover:text-teal-400 [&>div]:hover:bg-teal-500/20 [&>div>svg]:hover:text-teal-400',
    scrollbar: 'scrollbar-teal'
  },
  '/admin/battle-pass': {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    shadow: 'shadow-amber-500/5',
    iconBg: 'bg-amber-500/20',
    hoverClass: 'hover:bg-amber-500/10 hover:text-amber-400 [&>div]:hover:bg-amber-500/20 [&>div>svg]:hover:text-amber-400',
    scrollbar: 'scrollbar-amber'
  },
  '/admin/caisse': {
      bg: 'bg-accent-mint/10',
      text: 'text-accent-mint',
      border: 'border-accent-mint/30',
      shadow: 'shadow-accent-mint/5',
      iconBg: 'bg-accent-mint/20',
      hoverClass: 'hover:bg-accent-mint/10 hover:text-accent-mint [&>div]:hover:bg-accent-mint/20 [&>div>svg]:hover:text-accent-mint',
      scrollbar: 'scrollbar-green'
    },
  '/admin/banner': {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-400',
    border: 'border-yellow-500/30',
    shadow: 'shadow-yellow-500/5',
    iconBg: 'bg-yellow-500/20',
    hoverClass: 'hover:bg-yellow-500/10 hover:text-yellow-400 [&>div]:hover:bg-yellow-500/20 [&>div>svg]:hover:text-yellow-400',
    scrollbar: 'scrollbar-yellow',
  },
  '/admin/comptabilite': {
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    border: 'border-indigo-500/30',
    shadow: 'shadow-indigo-500/5',
    iconBg: 'bg-indigo-500/20',
    hoverClass: 'hover:bg-indigo-500/10 hover:text-indigo-400 [&>div]:hover:bg-indigo-500/20 [&>div>svg]:hover:text-indigo-400',
    scrollbar: 'scrollbar-indigo'
  }
};

const navSections = [
  {
    title: 'General',
    items: [
      { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ]
  },
  {
    title: 'New',
    items: [
      { path: '/admin/caisse', label: 'Caisse', icon: Receipt },
      { path: '/admin/comptabilite', label: 'Comptabilité', icon: Receipt },
      { path: '/admin/battle-pass', label: 'Battle Pass', icon: Trophy },
      { path: '/admin/banner', label: 'Bandeau', icon: Megaphone },
    ]
  },
  {
    title: 'Gestion',
    items: [
      { path: '/admin/events', label: 'Evenements', icon: Calendar },
      { path: '/admin/products', label: 'Produits', icon: ShoppingBag },
      { path: '/admin/categories', label: 'Categories', icon: Tags },
      { path: '/admin/orders', label: 'Commandes', icon: ClipboardList },
      { path: '/admin/promotions', label: 'Promotions', icon: Gift },
    ]
  },
  {
    title: 'Finances',
    items: [
      { path: '/admin/transactions', label: 'Transactions', icon: CreditCard },
      { path: '/admin/statistics', label: 'Statistiques', icon: BarChart3 },
    ]
  },
  {
    title: 'Systeme',
    items: [
      { path: '/admin/files', label: 'Fichiers', icon: FolderOpen },
      { path: '/admin/users', label: 'Utilisateurs', icon: Users },
      { path: '/admin/logs', label: 'Logs', icon: ScrollText },
      { path: '/admin/backups', label: 'Backups', icon: Database },
    ]
  }
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

  // Get the current active path's color config
  const getActiveColors = () => {
    if (location.pathname === '/admin' || location.pathname === '/admin/') {
      return colorConfig['/admin/dashboard'];
    }
    return colorConfig[location.pathname] || colorConfig['/admin/dashboard'];
  };

  const activeColors = getActiveColors();

  return (
    <div className={`flex h-screen bg-dark-bg text-white overflow-hidden`}>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-[100] bg-darker-bg border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className={`w-8 h-8 ${activeColors.iconBg} rounded-lg flex items-center justify-center`}>
            <Shield size={16} className={activeColors.text} />
          </div>
          <span className="text-xl font-koulen text-white">ADMIN</span>
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`p-2 text-white ${activeColors.text.replace('text-', 'hover:text-')} transition-colors`}
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-[90]"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed h-full overflow-y-auto overflow-x-hidden ${activeColors.scrollbar} border-r border-gray-800 bg-darker-bg shadow-lg z-[100]
        w-72 transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="relative p-5 pt-4 lg:pt-5">
          {/* Logo Section */}
          <Link to="/" className="block mb-6 group hidden lg:block">
            <div className="flex items-center gap-3 p-3 bg-dark-bg/50 rounded-xl border border-gray-800 group-hover:border-red-500/30 transition-colors">
              <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center group-hover:bg-red-500/30 transition-colors">
                <Shield size={20} className="text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-koulen text-white">
                  ADMIN <span className="text-red-400">ADIIL</span>
                </h2>
                <div className="flex items-center gap-1 text-[10px] text-gray-500 group-hover:text-red-400 transition-colors">
                  <ArrowLeft size={10} />
                  <span>Retour au site</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Mobile: Retour au site link */}
          <Link to="/" className="lg:hidden flex items-center gap-2 text-sm text-gray-500 hover:text-red-400 transition-colors mb-6 mt-14 px-2">
            <ArrowLeft size={14} />
            <span>Retour au site</span>
          </Link>

          {/* Navigation */}
                    <nav className="space-y-6">
                      {navSections.map((section) => {
                        const isNew = section.title === 'New';
                        return (
                        <div
                          key={section.title}
                          className={isNew ? 'p-2.5 rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/[0.07] to-transparent' : undefined}
                        >
                          <p className={`px-3 mb-2 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                            isNew ? 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via--300 to-cyan-300' : 'text-gray-500'
                          }`}>

                            {section.title}

                          </p>
                          <ul className="space-y-1">
                  {section.items.map((item) => {
                    // Check if active - also match /admin to /admin/dashboard
                    const isActive = location.pathname === item.path ||
                      (item.path === '/admin/dashboard' && (location.pathname === '/admin' || location.pathname === '/admin/'));
                    const Icon = item.icon;
                    const colors = colorConfig[item.path];

                    return (
                      <li key={item.path}>
                        <Link
                          to={item.path}
                          onClick={closeSidebar}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                            isActive
                              ? `${colors.bg} ${colors.text} border ${colors.border} shadow-lg ${colors.shadow}`
                              : `text-gray-400 border border-transparent ${colors.hoverClass}`
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                            isActive ? colors.iconBg : isNew ? 'bg-accent-mint/15' : 'bg-dark-bg'
                          }`}>
                            <Icon size={16} className={`transition-colors ${
                              isActive ? colors.text : isNew ? 'text-accent-mint' : ''
                            }`} />
                          </div>
                          <span className="font-medium text-sm">{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                                </ul>
                              </div>
                              );
                            })}
                          </nav>

          {/* Footer info */}
          <div className="mt-8 p-3 bg-dark-bg/50 rounded-xl border border-gray-800">
            <div className="flex items-center gap-2 text-[10px] text-gray-500">
              <Terminal size={12} />
              <span>Panel Administrateur</span>
            </div>
          </div>
        </div>
      </aside>



      {/* Main content */}
      <main className={`flex-1 p-4 lg:p-8 lg:ml-72 min-w-0 mt-14 lg:mt-0 relative overflow-y-auto ${activeColors.scrollbar}`}>
        {/* Background decoration */}
        <div className={`fixed top-0 right-0 w-[400px] h-[400px] ${activeColors.bg} rounded-full blur-[150px] pointer-events-none`} />
        <div className="relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
