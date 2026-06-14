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
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import ShopPage from './pages/ShopPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import BalancePage from './pages/BalancePage';
import BattlePassPage from './pages/BattlePassPage';
import MyAccountPage from './pages/MyAccountPage';
import PaymentCallbackPage from './pages/PaymentCallbackPage';
import OrderPickupPage from './pages/OrderPickupPage';
import BattlePassClaimPage from './pages/BattlePassClaimPage';
import ShareFilePage from './pages/ShareFilePage';
import NotFoundPage from './pages/NotFoundPage';
import AdminLayout from './components/AdminLayout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider, useNotification } from './context/NotificationContext';
import { BannerProvider } from './context/BannerContext';
import { CartProvider } from './context/CartContext';
import { ToastContainer } from './components/Toast';
import { setUnauthorizedCallback, setErrorCallback } from './api/client';
import { useBanner } from './context/BannerContext';


// Lazy load admin pages for code splitting
const AdminBannerPage = lazy(() => import('./pages/AdminBannerPage'));
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
const AdminBackupsPage = lazy(() => import('./pages/AdminBackupsPage'));
const AdminBattlePassPage = lazy(() => import('./pages/AdminBattlePassPage'));
const AdminCaissePage = lazy(() => import('./pages/AdminCaissePage'));
const ComptabilitePage = lazy(() => import('./pages/AdminCompta'));

// Loading component for lazy loaded pages
const PageLoader = () => (
  <div className="min-h-screen bg-darker-bg flex items-center justify-center">
    <div className="w-10 h-10 border-2 border-accent-mint border-t-transparent rounded-full animate-spin"></div>
  </div>
);

/** Layout public : padding-top s'adapte à la présence du bandeau */
const PublicLayout = () => {
  const { isOpen: bannerOpen } = useBanner();
  return (
      <>
        <Header />
        {/* pt-20 = 80px (nav seule) | pt-[7.5rem] = 120px (nav + bandeau ~40px) */}
        <main className={`flex-grow ${bannerOpen ? 'pt-[7.5rem]' : 'pt-20'}`}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/legal" element={<LegalPage />} />
            <Route path="/cgv" element={<CGVPage />} />
            <Route path="/cgu" element={<CGUPage />} />
            <Route path="/confidentialite" element={<ConfidentialitePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:id" element={<EventDetailPage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/shop/:id" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/balance" element={<BalancePage />} />
            <Route path="/battle-pass" element={<BattlePassPage />} />
            <Route path="/my-account" element={<MyAccountPage />} />
            <Route path="/payment/callback" element={<PaymentCallbackPage />} />
            <Route path="/order-pickup/:id" element={<OrderPickupPage />} />
            <Route path="/battle-pass-claim/:battlePassId/:userId/:level/:tier" element={<BattlePassClaimPage />} />
            <Route path="/share/:token" element={<ShareFilePage />} />


            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
      </>
  );
};

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
            <BannerProvider>
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
                <Route path="/admin/backups" element={<Suspense fallback={<PageLoader />}><AdminLayout><AdminBackupsPage /></AdminLayout></Suspense>} />
                <Route path="/admin/battle-pass" element={<Suspense fallback={<PageLoader />}><AdminLayout><AdminBattlePassPage /></AdminLayout></Suspense>} />
                <Route path="/admin/banner" element={<Suspense fallback={<PageLoader />}><AdminLayout><AdminBannerPage /></AdminLayout></Suspense>} />
                <Route path="/admin/caisse" element={<Suspense fallback={<PageLoader />}><AdminLayout><AdminCaissePage /></AdminLayout></Suspense>} />
                <Route path="/admin/comptabilite" element={<Suspense fallback={<PageLoader />}><AdminLayout><ComptabilitePage /></AdminLayout></Suspense>} />

                <Route path="*" element={<PublicLayout />} />
              </Routes>
            </BannerProvider>
          </CartProvider>
        </NotificationProvider>
      </AuthProvider>
    </div>
  );
}

export default App;