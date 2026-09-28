import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  Search,
  X,
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
  '/admin/dashboard': { title: 'Dashboard', section: 'Overview' },
  '/admin/inventory': { title: 'Ringkasan Stok', section: 'Operations' },
  '/admin/raw-materials': { title: 'Bahan Baku & Kesiapan (P1)', section: 'Operations' },
  '/admin/production': { title: 'Produksi Kemasan (P2)', section: 'Operations' },
  '/admin/qc-history': { title: 'Riwayat Selesai QC', section: 'Operations' },
  '/admin/stock-out': { title: 'Pengeluaran Stok', section: 'Operations' },
  '/admin/scan-qr': { title: 'Verifikasi QR Pickup', section: 'Operations' },
  '/admin/products': { title: 'Produk & Menu', section: 'Catalog' },
  '/admin/vouchers': { title: 'Voucher Promo', section: 'Catalog' },
  '/admin/banners': { title: 'Banner Promosi', section: 'Catalog' },
  '/admin/users': { title: 'Manajemen Tim', section: 'Management' }
};

const QUICK_NAV = [
  { id: 'dashboard', label: 'Dashboard', path: '/admin', section: 'Overview', keywords: ['dashboard', 'ringkasan', 'overview'] },
  { id: 'pos', label: 'Kasir Toko (POS)', path: '/admin/pos', section: 'Operations', keywords: ['pos', 'kasir', 'transaksi', 'order', 'toko'] },
  { id: 'inventory', label: 'Ringkasan Stok', path: '/admin/inventory', section: 'Operations', keywords: ['stok', 'inventory', 'buffer', 'freezer'] },
  { id: 'raw-materials', label: 'Bahan Baku & Kesiapan (P1)', path: '/admin/raw-materials', section: 'Operations', keywords: ['bahan', 'baku', 'daging', 'ayam', 'tepung', 'kulit', 'gilingan', 'h-1', 'kesiapan', 'ayu'] },
  { id: 'production', label: 'Produksi Kemasan (P2)', path: '/admin/production', section: 'Operations', keywords: ['produksi', 'kemasan', 'p2', 'mika', 'vakum', 'pack', 'lot', 'rencana', 'verifikasi'] },
  { id: 'qc-history', label: 'Riwayat Selesai QC', path: '/admin/qc-history', section: 'Operations', keywords: ['qc', 'checker', 'stiker', 'qr', 'lot', 'riwayat', 'verifikasi'] },
  { id: 'stock-out', label: 'Pengeluaran Stok', path: '/admin/stock-out', section: 'Operations', keywords: ['keluar', 'stok keluar', 'shopee', 'tiktok', 'po', 'offline'] },
  { id: 'scan-qr', label: 'Verifikasi QR Pickup', path: '/admin/scan-qr', section: 'Operations', keywords: ['scan', 'qr', 'pickup', 'verifikasi'] },
  { id: 'products', label: 'Produk & Menu', path: '/admin/products', section: 'Catalog', keywords: ['produk', 'menu', 'katalog', 'harga', 'diskon'] },
  { id: 'vouchers', label: 'Voucher Promo', path: '/admin/vouchers', section: 'Catalog', keywords: ['voucher', 'promo', 'kode', 'diskon'] },
  { id: 'banners', label: 'Banner Promosi', path: '/admin/banners', section: 'Catalog', keywords: ['banner', 'spanduk', 'gambar'] },
  { id: 'users', label: 'Manajemen Tim', path: '/admin/users', section: 'Management', keywords: ['tim', 'user', 'pengguna', 'role', 'admin'] }
];

export default function AdminTopBar({ onToggleSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getAdminUser();
  const role = user?.role || 'admin';
  const roleConfig = ROLE_CONFIG[role] || ROLE_CONFIG.admin;
  const allowedTabs = roleConfig.allowedTabs || ['scan-qr'];
  const hasInventoryAccess = allowedTabs.includes('inventory');

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [criticalCount, setCriticalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const lastCheckRef = useRef(0);

  // Derive title & breadcrumbs
  const meta = ROUTE_META[location.pathname] || { title: 'Portal Admin', section: 'Admin' };

  // Filter matching routes for searchbar against role permissions
  const visibleQuickNav = QUICK_NAV.filter(item => allowedTabs.includes(item.id));
  const matchingRoutes = searchQuery.trim()
    ? visibleQuickNav.filter(item => {
        const q = searchQuery.toLowerCase();
        return (
          item.label.toLowerCase().includes(q) ||
          item.section.toLowerCase().includes(q) ||
          item.keywords.some(k => k.includes(q))
        );
      })
    : [];

  // Fetch quick notification status (critical buffer stock count) with 60s throttling to protect rate limiter
  useEffect(() => {
    if (!hasInventoryAccess) return;
    let isMounted = true;
    const now = Date.now();
    if (now - lastCheckRef.current < 60000 && lastCheckRef.current > 0) {
      return;
    }
    const checkAlerts = async () => {
      try {
        const res = await api.get('/api/inventory/dashboard/summary', { auth: 'admin' });
        if (res.success && res.data && isMounted) {
          lastCheckRef.current = Date.now();
          setCriticalCount(res.data.critical_products?.length || 0);
        }
      } catch {
        // Ignore silent notification fail
      }
    };
    checkAlerts();
    return () => { isMounted = false; };
  }, [location.pathname]);

  // Close dropdown & search on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
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
    <header className="h-16 sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-bg-cream-dark/80 px-4 sm:px-6 flex items-center justify-between transition-all">
      {/* Left: Mobile Toggle & Breadcrumb Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-cream transition-colors cursor-pointer"
          title="Buka Menu"
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
        {/* TopBar Searchbar */}
        <div className="relative hidden sm:block w-48 md:w-56 lg:w-64" ref={searchRef}>
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => { if (searchQuery.trim()) setSearchOpen(true); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && matchingRoutes.length > 0) {
                navigate(matchingRoutes[0].path);
                setSearchOpen(false);
                setSearchQuery('');
              } else if (e.key === 'Escape') {
                setSearchOpen(false);
              }
            }}
            placeholder="Cari menu / halaman..."
            className="w-full pl-9 pr-7 py-1.5 text-xs rounded-full border border-bg-cream-dark/90 bg-bg-cream/40 focus:bg-white focus:border-brand-blue/50 focus:outline-none transition-all placeholder:text-text-secondary/60 text-text-primary"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setSearchOpen(false); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary cursor-pointer"
            >
              <X size={12} />
            </button>
          )}

          {/* Quick Search Dropdown */}
          {searchOpen && searchQuery.trim() && (
            <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-elevated border border-bg-cream-dark/80 p-1.5 z-50 animate-scaleUp">
              {matchingRoutes.length > 0 ? (
                matchingRoutes.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-text-primary hover:bg-bg-cream/60 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>{item.label}</span>
                    <span className="text-[10px] text-text-secondary font-medium">{item.section}</span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-[11px] text-text-secondary text-center">
                  Tidak ada menu yang cocok
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notifications / Critical Alert Icon (Only for inventory-permitted roles) */}
        {hasInventoryAccess && (
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
        )}

        {/* User Pill & Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-full hover:bg-bg-cream transition-colors cursor-pointer border border-transparent hover:border-bg-cream-dark/60"
          >
            <div className="w-8 h-8 rounded-full bg-brand-blue text-white font-heading font-bold text-xs flex items-center justify-center shadow-xs">
              {(user?.full_name || 'A').charAt(0).toUpperCase()}
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
