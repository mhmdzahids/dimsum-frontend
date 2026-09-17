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

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  return (
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
  );
}

export default App;
