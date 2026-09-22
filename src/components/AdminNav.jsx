import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Package, 
  Ticket, 
  QrCode, 
  Image as ImageIcon, 
  ExternalLink, 
  LogOut, 
  ShieldCheck,
  Users,
  Factory,
  BarChart3,
  ArrowUpRight
} from 'lucide-react';
import api from '../api/client';
import { getAdminUser, ROLE_CONFIG } from '../utils/adminAuth';

export default function AdminNav({ activeTab }) {
  const navigate = useNavigate();
  const location = useLocation();

  const adminUser = getAdminUser();
  const role = adminUser?.role || 'admin';
  const roleConfig = ROLE_CONFIG[role] || ROLE_CONFIG.admin;
  const allowedTabs = roleConfig.allowedTabs || ['scan-qr'];

  const currentTab = activeTab || (() => {
    const path = location.pathname;
    if (path.startsWith('/admin/inventory')) return 'inventory';
    if (path.startsWith('/admin/production')) return 'production';
    if (path.startsWith('/admin/stock-out')) return 'stock-out';
    if (path.startsWith('/admin/vouchers')) return 'vouchers';
    if (path.startsWith('/admin/scan-qr')) return 'scan-qr';
    if (path.startsWith('/admin/banners')) return 'banners';
    if (path.startsWith('/admin/users')) return 'users';
    return 'products';
  })();

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout', {}, { auth: 'admin' });
    } catch (e) {
      console.error("Logout error", e);
    } finally {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      navigate('/admin/login', { replace: true });
    }
  };

  const allNavItems = [
    { id: 'inventory', label: 'Stok', path: '/admin/inventory', icon: BarChart3 },
    { id: 'production', label: 'Produksi', path: '/admin/production', icon: Factory },
    { id: 'stock-out', label: 'Stok Keluar', path: '/admin/stock-out', icon: ArrowUpRight },
    { id: 'products', label: 'Produk', path: '/admin/products', icon: Package },
    { id: 'scan-qr', label: 'Scan QR', path: '/admin/scan-qr', icon: QrCode },
    { id: 'vouchers', label: 'Voucher', path: '/admin/vouchers', icon: Ticket },
    { id: 'banners', label: 'Banner', path: '/admin/banners', icon: ImageIcon },
    { id: 'users', label: 'Tim', path: '/admin/users', icon: Users },
  ];

  const visibleNavItems = allNavItems.filter(item => allowedTabs.includes(item.id));

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-xs mb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Brand Logo & Title with Role Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-blue flex items-center justify-center text-white shadow-xs shrink-0">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-brand-gold font-body block leading-none">
                  Makan Dimsum
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${roleConfig.badge}`}>
                  {roleConfig.label}
                </span>
              </div>
              <h1 className="text-lg font-bold text-text-primary font-heading leading-tight mt-0.5">
                {roleConfig.title}
              </h1>
            </div>
          </div>

          {/* Navigation Links - Filtered by Role */}
          <nav className="hidden md:flex items-center gap-1 bg-gray-50 p-1.5 rounded-2xl border border-gray-200">
            {visibleNavItems.map((item) => {
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium transition-colors cursor-pointer"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Sub-bar - Filtered by Role */}
        {visibleNavItems.length > 1 && (
          <div className="md:hidden flex items-center justify-start gap-1 py-2 overflow-x-auto no-scrollbar border-t border-gray-100">
            {visibleNavItems.map((item) => {
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
        )}
      </div>
    </header>
  );
}
