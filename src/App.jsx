import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Checkout from './pages/Checkout';
import Payment from './pages/Payment';
import OrderStatus from './pages/OrderStatus';
import AdminProducts from './pages/AdminProducts';
import AdminBanners from './pages/AdminBanners';
import AdminVouchers from './pages/AdminVouchers';
import AdminScanQR from './pages/AdminScanQR';
import OutletInfo from './pages/OutletInfo';
import Vouchers from './pages/Vouchers';
import Auth from './pages/Auth';
import OrderHistory from './pages/OrderHistory';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Profile from './pages/Profile';
import ProfileEdit from './pages/ProfileEdit';
import AddressNew from './pages/AddressNew';

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
        <Router>
          <ScrollToTop />
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
            <Route path="/profile/edit" element={<ProfileEdit />} />
            <Route path="/address/new" element={<AddressNew />} />
            <Route path="/order-history" element={<OrderHistory />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/admin" element={<AdminProducts />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/banners" element={<AdminBanners />} />
            <Route path="/admin/vouchers" element={<AdminVouchers />} />
            <Route path="/admin/scan-qr" element={<AdminScanQR />} />
          </Routes>
        </Router>
      </ErrorBoundary>
    </GoogleOAuthProvider>
  );
}

export default App;
