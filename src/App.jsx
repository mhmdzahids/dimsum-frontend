import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Checkout from './pages/Checkout';
import Payment from './pages/Payment';
import OrderStatus from './pages/OrderStatus';
import AdminProducts from './pages/AdminProducts';
import AdminBanners from './pages/AdminBanners';
import OutletInfo from './pages/OutletInfo';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/order-status" element={<OrderStatus />} />
        <Route path="/outlet" element={<OutletInfo />} />
        <Route path="/admin/products" element={<AdminProducts />} />
        <Route path="/admin/banners" element={<AdminBanners />} />
      </Routes>
    </Router>
  );
}

export default App;
