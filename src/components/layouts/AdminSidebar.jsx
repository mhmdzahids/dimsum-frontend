import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  Factory,
  ArrowUpRight,
  QrCode,
  Package,
  Ticket,
  Image as ImageIcon,
  Users,
  LogOut,
  X,
  ExternalLink
} from 'lucide-react';
import { getAdminUser, ROLE_CONFIG } from '../../utils/adminAuth';
import api from '../../api/client';
import logoImg from '../../assets/logo.webp';

export default function AdminSidebar({ mobileOpen, setMobileOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getAdminUser();
  const role = user?.role || 'admin';
  const roleConfig = ROLE_CONFIG[role] || ROLE_CONFIG.admin;
  const allowedTabs = roleConfig.allowedTabs || ['dashboard'];

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout', {}, { auth: 'admin' });
    } catch {
      // Ignore network fail on logout
    } finally {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      navigate('/admin/login', { replace: true });
    }
  };

  const navGroups = [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'dashboard', label: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true }
      ]
    },
    {
      title: 'OPERATIONS',
      items: [
        { id: 'inventory', label: 'Ringkasan Stok', path: '/admin/inventory', icon: Layers },
        { id: 'production', label: 'Produksi Lot', path: '/admin/production', icon: Factory },
        { id: 'stock-out', label: 'Pengeluaran Stok', path: '/admin/stock-out', icon: ArrowUpRight },
        { id: 'scan-qr', label: 'Scan QR / Kasir', path: '/admin/scan-qr', icon: QrCode }
      ]
    },
    {
      title: 'CATALOG',
      items: [
        { id: 'products', label: 'Produk & Menu', path: '/admin/products', icon: Package },
        { id: 'vouchers', label: 'Voucher', path: '/admin/vouchers', icon: Ticket },
        { id: 'banners', label: 'Banner Promosi', path: '/admin/banners', icon: ImageIcon }
      ]
    },
    {
      title: 'MANAGEMENT',
      items: [
        { id: 'users', label: 'Manajemen Tim', path: '/admin/users', icon: Users }
      ]
    }
  ];

  // Filter items by role permissions
  const filteredGroups = navGroups.map(group => ({
    ...group,
    items: group.items.filter(item => allowedTabs.includes(item.id))
  })).filter(group => group.items.length > 0);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-bg-cream-dark/80 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-bg-cream-dark/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-bg-cream flex items-center justify-center p-1.5 border border-bg-cream-dark/70 shadow-xs">
            <img src={logoImg} alt="Makan Dimsum Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] uppercase tracking-wider font-extrabold text-brand-blue font-body leading-none">
                Dimsum Kasir & POS
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${roleConfig.badge}`}>
                {roleConfig.label}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile close button */}
        {setMobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-cream"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 no-scrollbar">
        {filteredGroups.map(group => (
          <div key={group.title}>
            <div className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-widest text-text-secondary/70 font-body">
              {group.title}
            </div>
            <nav className="space-y-1">
              {group.items.map(item => {
                const Icon = item.icon;
                const isActive = item.exact
                  ? location.pathname === item.path
                  : location.pathname.startsWith(item.path);

                return (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    end={item.exact}
                    onClick={() => setMobileOpen && setMobileOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                      isActive
                        ? 'bg-brand-blue text-white shadow-xs font-bold'
                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-cream/70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        size={17}
                        className={`transition-colors ${
                          isActive ? 'text-white' : 'text-text-secondary group-hover:text-brand-blue'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-gold shrink-0"></span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Bottom User Card & Quick Actions */}
      <div className="p-4 border-t border-bg-cream-dark/70 bg-bg-cream/30 space-y-2">
        <a
          href="/menu"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between w-full px-3 py-2 rounded-xl border border-brand-gold/30 bg-brand-gold/10 hover:bg-brand-gold/20 text-brand-gold-dark text-[11px] font-bold transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <ExternalLink size={13} />
            <span>Lihat Menu Pelanggan</span>
          </span>
          <span className="text-[10px] bg-brand-gold/20 px-1.5 py-0.5 rounded text-brand-gold-dark font-mono">
            Tab Baru
          </span>
        </a>

        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white border border-bg-cream-dark/80 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-brand-blue text-white font-heading font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
              {(user?.full_name || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-text-primary truncate">
                {user?.full_name || 'Administrator'}
              </div>
              <div className="text-[10px] text-text-secondary truncate">
                {roleConfig.label}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Keluar"
            className="p-1.5 text-text-secondary hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Persistent) */}
      <aside className="hidden lg:block w-64 xl:w-72 shrink-0 h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Overlay) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-text-primary/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-slideRight">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
