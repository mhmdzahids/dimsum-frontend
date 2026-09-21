import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  ExternalLink,
  ChevronDown,
  LogOut,
  ShieldCheck,
  AlertTriangle,
  User
} from 'lucide-react';
import { getAdminUser, ROLE_CONFIG } from '../../utils/adminAuth';
import api from '../../api/client';

const ROUTE_META = {
  '/admin': { title: 'Dashboard', section: 'Overview' },
  '/admin/inventory': { title: 'Ringkasan Stok', section: 'Operations' },
  '/admin/production': { title: 'Produksi Lot', section: 'Operations' },
  '/admin/stock-out': { title: 'Pengeluaran Stok', section: 'Operations' },
  '/admin/scan-qr': { title: 'Scan QR / Kasir', section: 'Operations' },
  '/admin/products': { title: 'Produk & Menu', section: 'Catalog' },
  '/admin/vouchers': { title: 'Voucher Promo', section: 'Catalog' },
  '/admin/banners': { title: 'Banner Promosi', section: 'Catalog' },
  '/admin/users': { title: 'Manajemen Tim', section: 'Management' }
};

export default function AdminTopBar({ onToggleSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getAdminUser();
  const role = user?.role || 'admin';
  const roleConfig = ROLE_CONFIG[role] || ROLE_CONFIG.admin;

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [criticalCount, setCriticalCount] = useState(0);
  const dropdownRef = useRef(null);

  // Derive title & breadcrumbs
  const meta = ROUTE_META[location.pathname] || { title: 'Portal Admin', section: 'Admin' };

  // Fetch quick notification status (critical buffer stock count)
  useEffect(() => {
    let isMounted = true;
    const checkAlerts = async () => {
      try {
        const res = await api.get('/api/inventory/dashboard/summary', { auth: 'admin' });
        if (res.success && res.data && isMounted) {
          setCriticalCount(res.data.critical_products?.length || 0);
        }
      } catch {
        // Ignore silent notification fail
      }
    };
    checkAlerts();
    return () => { isMounted = false; };
  }, [location.pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout', {}, { auth: 'admin' });
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      navigate('/admin/login', { replace: true });
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-bg-cream-dark/80 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between shadow-xs">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-cream transition-colors"
          aria-label="Buka Menu"
        >
          <Menu size={20} />
        </button>

        <div>
          {/* Small Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-text-secondary">
            <span>Portal Admin</span>
            <span>›</span>
            <span>{meta.section}</span>
          </div>
          {/* Current Page Title */}
          <h1 className="text-base sm:text-lg font-bold text-text-primary font-heading leading-none mt-0.5">
            {meta.title}
          </h1>
        </div>
      </div>

      {/* Right: Actions & User Pill */}
      <div className="flex items-center gap-3">
        {/* Customer Menu Link (Desktop pill) */}
        <a
          href="/menu"
          target="_blank"
          rel="noreferrer"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-brand-gold/30 bg-brand-gold/10 hover:bg-brand-gold/20 text-brand-gold-dark text-xs font-semibold transition-colors"
          title="Buka Menu Pelanggan di Tab Baru"
        >
          <ExternalLink size={13} />
          <span>Lihat Menu Pelanggan</span>
        </a>

        {/* Notifications / Critical Alert Icon */}
        <Link
          to="/admin/inventory"
          title={criticalCount > 0 ? `${criticalCount} varian stok kritis di freezer!` : 'Semua stok dalam ambang aman'}
          className="relative p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-cream transition-colors"
        >
          <Bell size={18} />
          {criticalCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-brand-red rounded-full ring-2 ring-white animate-pulse" />
          )}
        </Link>

        {/* User Pill & Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-full hover:bg-bg-cream transition-colors cursor-pointer border border-transparent hover:border-bg-cream-dark/60"
          >
            <div className="w-8 h-8 rounded-full bg-brand-blue text-white font-heading font-bold text-xs flex items-center justify-center shadow-xs">
              {(user?.full_name || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-text-primary leading-tight">
                {user?.full_name || 'Administrator'}
              </div>
              <div className="text-[10px] text-text-secondary font-medium leading-none">
                {roleConfig.label}
              </div>
            </div>
            <ChevronDown size={14} className="text-text-secondary hidden sm:block" />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-elevated border border-bg-cream-dark/80 p-2 z-50 animate-scaleUp">
              <div className="px-3 py-2.5 border-b border-gray-100 mb-1">
                <div className="text-xs font-bold text-text-primary">
                  {user?.full_name || 'Administrator'}
                </div>
                <div className="text-[11px] text-text-secondary">
                  {user?.email || role}
                </div>
                <span className={`inline-block mt-1.5 text-[9px] px-2 py-0.5 rounded-full font-bold border ${roleConfig.badge}`}>
                  {roleConfig.label}
                </span>
              </div>

              <a
                href="/menu"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-text-primary hover:bg-bg-cream font-medium"
              >
                <ExternalLink size={14} className="text-brand-gold" />
                <span>Buka Web Menu Pelanggan</span>
              </a>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-600 hover:bg-red-50 font-medium transition-colors cursor-pointer mt-1"
              >
                <LogOut size={14} />
                <span>Keluar Akun</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
