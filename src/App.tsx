import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import LegalPage from './pages/LegalPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import ShopPage from './pages/ShopPage';
import CartPage from './pages/CartPage';
import MyAccountPage from './pages/MyAccountPage';
import PaymentCallbackPage from './pages/PaymentCallbackPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import UserManagementPage from './pages/UserManagementPage';
import AdminLayout from './components/AdminLayout';
import EventManagementPage from './pages/EventManagementPage';
import ProductManagementPage from './pages/ProductManagementPage';
import OrderManagementPage from './pages/OrderManagementPage';
import AdminSalesStatisticsPage from './pages/AdminSalesStatisticsPage';
import AdminAuditLogsPage from './pages/AdminAuditLogsPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider, useNotification } from './context/NotificationContext';
import { CartProvider } from './context/CartContext';
import { ToastContainer } from './components/Toast';
import { setUnauthorizedCallback, setErrorCallback } from './api/client';
import { useEffect } from 'react';

const ApiInterceptor = () => {
  const { logout } = useAuth();
  const { addNotification } = useNotification();

  useEffect(() => {
    setUnauthorizedCallback(() => {
      logout();
      addNotification('error', 'Session expirée. Veuillez vous reconnecter.');
    });

    setErrorCallback((status, message) => {
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
              {/* Admin Routes (no Header/Footer) */}
              <Route path="/admin" element={<AdminLayout><AdminDashboardPage /></AdminLayout>} />
              <Route path="/admin/dashboard" element={<AdminLayout><AdminDashboardPage /></AdminLayout>} />
              <Route path="/admin/users" element={<AdminLayout><UserManagementPage /></AdminLayout>} />
              <Route path="/admin/events" element={<AdminLayout><EventManagementPage /></AdminLayout>} />
              <Route path="/admin/products" element={<AdminLayout><ProductManagementPage /></AdminLayout>} />
              <Route path="/admin/orders" element={<AdminLayout><OrderManagementPage /></AdminLayout>} />
              <Route path="/admin/statistics" element={<AdminLayout><AdminSalesStatisticsPage /></AdminLayout>} />
              <Route path="/admin/logs" element={<AdminLayout><AdminAuditLogsPage /></AdminLayout>} />

              {/* Public Routes (with Header/Footer) */}
              <Route
                path="*"
                element={
                  <>
                    <Header />
                    <main className="flex-grow pt-[98px]"> {/* Added padding to account for fixed header height */}
                      <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/about" element={<AboutPage />} />
                        <Route path="/legal" element={<LegalPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/events" element={<EventsPage />} />
                        <Route path="/events/:id" element={<EventDetailPage />} />
                        <Route path="/shop" element={<ShopPage />} />
                        <Route path="/cart" element={<CartPage />} />
                        <Route path="/my-account" element={<MyAccountPage />} />
                        <Route path="/payment/callback" element={<PaymentCallbackPage />} />
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