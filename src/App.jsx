import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import PageLoader from './components/PageLoader';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/guards/ProtectedRoute';

// Core Customer Funnel (Eagerly Loaded for Instant Navigation)
import Home from './pages/Home';
import Menu from './pages/Menu';
import Checkout from './pages/Checkout';
import Payment from './pages/Payment';
import OrderStatus from './pages/OrderStatus';
import OutletInfo from './pages/OutletInfo';
import Vouchers from './pages/Vouchers';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import ProfileEdit from './pages/ProfileEdit';

// Secondary Customer Pages (Lazy Loaded on Demand)
const AddressNew = lazy(() => import('./pages/AddressNew'));
const OrderHistory = lazy(() => import('./pages/OrderHistory'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));

// Admin Pages & Guards (Lazy Loaded - Customers Never Download Admin Code)
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminRoute = lazy(() => import('./components/guards/AdminRoute'));
const AdminLayout = lazy(() => import('./components/layouts/AdminLayout'));
const AdminProducts = lazy(() => import('./pages/AdminProducts'));
const AdminBanners = lazy(() => import('./pages/AdminBanners'));
const AdminVouchers = lazy(() => import('./pages/AdminVouchers'));
const AdminScanQR = lazy(() => import('./pages/AdminScanQR'));

import { GoogleOAuthProvider } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '382706943737-7meooomqaah5o8rv1c9jblpshgt8tl9i.apps.googleusercontent.com';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ErrorBoundary>
        <AuthProvider>
          <Router>
            <ScrollToTop />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/menu" element={<Menu />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/payment" element={<Payment />} />
                <Route path="/order-status" element={<OrderStatus />} />
                <Route path="/outlet" element={<OutletInfo />} />
                <Route path="/vouchers" element={<Vouchers />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />

                {/* Customer Account (Protected) */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/profile/edit" element={<ProfileEdit />} />
                  <Route path="/address/new" element={<AddressNew />} />
                  <Route path="/order-history" element={<OrderHistory />} />
                </Route>

                {/* Admin Portal */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route element={<AdminRoute />}>
                  <Route element={<AdminLayout />}>
                    <Route path="/admin" element={<Navigate to="/admin/products" replace />} />
                    <Route path="/admin/products" element={<AdminProducts />} />
                    <Route path="/admin/banners" element={<AdminBanners />} />
                    <Route path="/admin/vouchers" element={<AdminVouchers />} />
                    <Route path="/admin/scan-qr" element={<AdminScanQR />} />
                  </Route>
                </Route>
              </Routes>
            </Suspense>
          </Router>
        </AuthProvider>
      </ErrorBoundary>
    </GoogleOAuthProvider>
  );
}

export default App;
