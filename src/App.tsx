import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import LegalPage from './pages/LegalPage';
import CGVPage from './pages/CGVPage';
import CGUPage from './pages/CGUPage';
import ConfidentialitePage from './pages/ConfidentialitePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import ShopPage from './pages/ShopPage';
import CartPage from './pages/CartPage';
import BalancePage from './pages/BalancePage';
import MyAccountPage from './pages/MyAccountPage';
import PaymentCallbackPage from './pages/PaymentCallbackPage';
import OrderPickupPage from './pages/OrderPickupPage';
import AdminLayout from './components/AdminLayout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider, useNotification } from './context/NotificationContext';
import { CartProvider } from './context/CartContext';
import { ToastContainer } from './components/Toast';
import { setUnauthorizedCallback, setErrorCallback } from './api/client';

// Lazy load admin pages for code splitting
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const UserManagementPage = lazy(() => import('./pages/UserManagementPage'));
const EventManagementPage = lazy(() => import('./pages/EventManagementPage'));
const ProductManagementPage = lazy(() => import('./pages/ProductManagementPage'));
const OrderManagementPage = lazy(() => import('./pages/OrderManagementPage'));
const AdminSalesStatisticsPage = lazy(() => import('./pages/AdminSalesStatisticsPage'));
const AdminAuditLogsPage = lazy(() => import('./pages/AdminAuditLogsPage'));
const FileManagementPage = lazy(() => import('./pages/FileManagementPage'));
const CategoryManagementPage = lazy(() => import('./pages/CategoryManagementPage'));
const PromotionManagementPage = lazy(() => import('./pages/PromotionManagementPage'));
const TransactionManagementPage = lazy(() => import('./pages/TransactionManagementPage'));

// Loading component for lazy loaded pages
const PageLoader = () => (
  <div className="min-h-screen bg-darker-bg flex items-center justify-center">
    <div className="w-10 h-10 border-2 border-accent-mint border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const ApiInterceptor = () => {
  const { logout } = useAuth();
  const { addNotification } = useNotification();

  useEffect(() => {
    setUnauthorizedCallback(() => {
      logout();
      addNotification('error', 'Session expirée. Veuillez vous reconnecter.');
    });

    setErrorCallback((_status, message) => {
      addNotification('error', message);
    });
  }, [logout, addNotification]);

  return null;
};

function App() {
  return (
    <div className="min-h-screen bg-dark-bg text-white flex flex-col font-montserrat">
      <AuthProvider>
        <NotificationProvider>
          <CartProvider>
            <ApiInterceptor />
            <ToastContainer />
            <Routes>
              {/* Admin Routes (no Header/Footer) - Lazy loaded */}
              <Route path="/admin" element={<Suspense fallback={<PageLoader />}><AdminLayout><AdminDashboardPage /></AdminLayout></Suspense>} />
              <Route path="/admin/dashboard" element={<Suspense fallback={<PageLoader />}><AdminLayout><AdminDashboardPage /></AdminLayout></Suspense>} />
              <Route path="/admin/users" element={<Suspense fallback={<PageLoader />}><AdminLayout><UserManagementPage /></AdminLayout></Suspense>} />
              <Route path="/admin/events" element={<Suspense fallback={<PageLoader />}><AdminLayout><EventManagementPage /></AdminLayout></Suspense>} />
              <Route path="/admin/products" element={<Suspense fallback={<PageLoader />}><AdminLayout><ProductManagementPage /></AdminLayout></Suspense>} />
              <Route path="/admin/categories" element={<Suspense fallback={<PageLoader />}><AdminLayout><CategoryManagementPage /></AdminLayout></Suspense>} />
              <Route path="/admin/orders" element={<Suspense fallback={<PageLoader />}><AdminLayout><OrderManagementPage /></AdminLayout></Suspense>} />
              <Route path="/admin/statistics" element={<Suspense fallback={<PageLoader />}><AdminLayout><AdminSalesStatisticsPage /></AdminLayout></Suspense>} />
              <Route path="/admin/files" element={<Suspense fallback={<PageLoader />}><AdminLayout><FileManagementPage /></AdminLayout></Suspense>} />
              <Route path="/admin/logs" element={<Suspense fallback={<PageLoader />}><AdminLayout><AdminAuditLogsPage /></AdminLayout></Suspense>} />
              <Route path="/admin/promotions" element={<Suspense fallback={<PageLoader />}><AdminLayout><PromotionManagementPage /></AdminLayout></Suspense>} />
              <Route path="/admin/transactions" element={<Suspense fallback={<PageLoader />}><AdminLayout><TransactionManagementPage /></AdminLayout></Suspense>} />

              {/* Public Routes (with Header/Footer) */}
              <Route
                path="*"
                element={
                  <>
                    <Header />
                    <main className="flex-grow pt-20"> {/* Added padding to account for fixed header height (~80px) */}
                      <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/about" element={<AboutPage />} />
                        <Route path="/legal" element={<LegalPage />} />
                        <Route path="/cgv" element={<CGVPage />} />
                        <Route path="/cgu" element={<CGUPage />} />
                        <Route path="/confidentialite" element={<ConfidentialitePage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/events" element={<EventsPage />} />
                        <Route path="/events/:id" element={<EventDetailPage />} />
                        <Route path="/shop" element={<ShopPage />} />
                        <Route path="/cart" element={<CartPage />} />
                        <Route path="/balance" element={<BalancePage />} />
                        <Route path="/my-account" element={<MyAccountPage />} />
                        <Route path="/payment/callback" element={<PaymentCallbackPage />} />
                        <Route path="/order-pickup/:id" element={<OrderPickupPage />} />
                        <Route path="*" element={<div className="min-h-screen flex items-center justify-center"><div className="text-center"><h1 className="text-4xl font-bold mb-4">404 - Page non trouvée</h1><p className="text-gray-400">La page que vous recherchez n'existe pas.</p></div></div>} />
                      </Routes>
                    </main>
                    <Footer />
                  </>
                }
              />
            </Routes>
          </CartProvider>
        </NotificationProvider>
      </AuthProvider>
    </div>
  );
}

export default App;