import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Package, 
  Ticket, 
  QrCode, 
  Image as ImageIcon, 
  ExternalLink, 
  LogOut, 
  ShieldCheck
} from 'lucide-react';
import api from '../api/client';

export default function AdminNav({ activeTab }) {
  const navigate = useNavigate();
  const location = useLocation();

  const currentTab = activeTab || (() => {
    const path = location.pathname;
    if (path.startsWith('/admin/vouchers')) return 'vouchers';
    if (path.startsWith('/admin/scan-qr')) return 'scan-qr';
    if (path.startsWith('/admin/banners')) return 'banners';
    return 'products';
  })();

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout', {}, { auth: 'admin' });
    } catch (e) {
      console.error("Logout error", e);
    } finally {
      localStorage.removeItem('adminToken');
      navigate('/admin/login', { replace: true });
    }
  };

  const navItems = [
    { id: 'products', label: 'Produk & Stok', path: '/admin/products', icon: Package },
    { id: 'vouchers', label: 'Kelola Voucher', path: '/admin/vouchers', icon: Ticket },
    { id: 'scan-qr', label: 'Scan QR & Cek Stok', path: '/admin/scan-qr', icon: QrCode },
    { id: 'banners', label: 'Banner Promosi', path: '/admin/banners', icon: ImageIcon },
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-xs mb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-blue flex items-center justify-center text-white shadow-xs">
              <ShieldCheck size={22} />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-brand-gold font-body block leading-none">
                Dimsum Kasir & POS
              </span>
              <h1 className="text-lg font-bold text-text-primary font-heading leading-tight">
                Portal Admin
              </h1>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-gray-50 p-1.5 rounded-2xl border border-gray-200">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-blue text-white shadow-xs'
                      : 'text-text-secondary hover:text-text-primary hover:bg-white'
                  }`}
                >
                  <Icon size={15} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            <a
              href="/menu"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-brand-gold/30 text-brand-gold hover:bg-brand-gold/10 text-xs font-medium transition-colors"
              title="Buka menu pelanggan di tab baru"
            >
              <ExternalLink size={14} />
              <span className="hidden sm:inline">Menu Pelanggan</span>
            </a>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium transition-colors"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Sub-bar */}
        <div className="md:hidden flex items-center justify-start gap-1 py-2 overflow-x-auto no-scrollbar border-t border-gray-100">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-brand-blue text-white'
                    : 'text-text-secondary bg-gray-50'
                }`}
              >
                <Icon size={13} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
