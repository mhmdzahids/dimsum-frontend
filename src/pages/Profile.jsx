import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  CreditCard,
  Package,
  Truck,
  ShoppingBag,
  MapPin,
  Headset,
  ChevronRight,
  ShieldCheck,
  LogOut,
  Sparkles,
  Settings,
  X,
  Navigation,
  Home,
  Briefcase,
  Tag
} from 'lucide-react';
import logoImg from '../assets/logo.webp';
import profileBannerImg from '../assets/user-profile-banner.webp';
import {
  isCustomerLoggedIn,
  getCustomerUser,
  logoutCustomer,
  updateCustomerUser,
  subscribeCustomerAuth
} from '../utils/customerAuth';
import { getOrderHistory, syncOrderHistoryWithServer } from '../utils/orderHistory';
import LocationPickerModal, {
  calculateHaversineDistance,
  OUTLET_COORDS
} from '../components/LocationPickerModal';

export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(() => isCustomerLoggedIn());
  const [user, setUser] = useState(() => getCustomerUser());
  const [orders, setOrders] = useState(() => getOrderHistory());
  const [savedAddress, setSavedAddress] = useState(() => {
    const u = getCustomerUser();
    return u?.address || localStorage.getItem('dimsum_delivery_address') || '';
  });
  const [savedNotes, setSavedNotes] = useState(() => {
    return localStorage.getItem('dimsum_delivery_notes') || '';
  });
  const [savedLabel, setSavedLabel] = useState(() => {
    return localStorage.getItem('dimsum_delivery_label') || 'Rumah';
  });
  const [savedCoords, setSavedCoords] = useState(() => {
    try {
      const saved = localStorage.getItem('dimsum_delivery_coords');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  const handleBack = () => {
    const from = location.state?.from;
    if (from && from !== '/profile' && !from.startsWith('/profile/edit')) {
      navigate(from);
    } else {
      navigate('/menu');
    }
  };

  useEffect(() => {
    const u = getCustomerUser();
    if (u?.address) {
      setSavedAddress(u.address);
    } else {
      setSavedAddress(localStorage.getItem('dimsum_delivery_address') || '');
    }
    setSavedNotes(localStorage.getItem('dimsum_delivery_notes') || '');
    setSavedLabel(localStorage.getItem('dimsum_delivery_label') || 'Rumah');
    try {
      const saved = localStorage.getItem('dimsum_delivery_coords');
      if (saved) setSavedCoords(JSON.parse(saved));
    } catch { }
  }, [location.key]);

  useEffect(() => {
    // Auth subscriber
    const unsub = subscribeCustomerAuth(() => {
      const logged = isCustomerLoggedIn();
      setIsLoggedIn(logged);
      const currentUser = getCustomerUser();
      setUser(currentUser);
      if (currentUser?.address) {
        setSavedAddress(currentUser.address);
      } else {
        setSavedAddress(localStorage.getItem('dimsum_delivery_address') || '');
      }
      setSavedNotes(localStorage.getItem('dimsum_delivery_notes') || '');
      setSavedLabel(localStorage.getItem('dimsum_delivery_label') || 'Rumah');
      try {
        const saved = localStorage.getItem('dimsum_delivery_coords');
        if (saved) setSavedCoords(JSON.parse(saved));
      } catch { }
      if (!logged) {
        navigate('/auth?redirect=/profile', { replace: true });
      }
    });

    // If not logged in, redirect to auth
    if (!isCustomerLoggedIn()) {
      navigate('/auth?redirect=/profile', { replace: true });
    }

    // Sync order history
    syncOrderHistoryWithServer()
      .then((updated) => {
        if (Array.isArray(updated)) {
          setOrders(updated);
        }
      })
      .catch(() => { });

    return unsub;
  }, [navigate]);

  // Jarak ke outlet Makan Dimsum
  const distanceKm = savedCoords
    ? calculateHaversineDistance(
        OUTLET_COORDS.latitude,
        OUTLET_COORDS.longitude,
        savedCoords.latitude,
        savedCoords.longitude
      )
    : null;

  // Order counts
  const pendingPaymentCount = orders.filter((o) => o.status === 'pending_payment').length;
  const processingCount = orders.filter(
    (o) => o.status === 'processing' || o.status === 'paid' || o.status === 'preparing'
  ).length;
  const deliveringCount = orders.filter(
    (o) => o.status === 'delivering' || o.status === 'shipped' || o.status === 'ready'
  ).length;
  const totalOrdersCount = orders.length;

  const handleLogout = () => {
    if (window.confirm('Apakah Anda yakin ingin keluar dari akun?')) {
      logoutCustomer();
      navigate('/menu');
    }
  };

  const handleContactCS = () => {
    const waUrl =
      'https://wa.me/6281234567890?text=Halo%20Admin%20Makan%20Dimsum,%20saya%20butuh%20bantuan%20layanan%20pelanggan...';
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleOpenAddressModal = () => {
    navigate('/address/new', { state: { returnTo: '/profile' } });
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-[480px] mx-auto min-h-screen bg-bg-cream flex items-center justify-center p-6">
        <div className="bg-white rounded-[24px] p-6 text-center shadow-card w-full max-w-[340px]">
          <div className="w-14 h-14 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center mx-auto mb-3">
            <User size={28} />
          </div>
          <h2 className="font-heading font-black text-[18px] text-text-primary mb-1">
            Belum Masuk Akun
          </h2>
          <p className="font-body text-[12px] text-text-secondary mb-5">
            Silakan masuk atau daftar akun untuk melihat informasi profil dan pesanan Anda.
          </p>
          <button
            onClick={() => navigate('/auth?redirect=/profile')}
            className="w-full py-2.5 bg-brand-gold hover:bg-brand-gold-dark text-white font-body font-bold text-[13px] rounded-[12px] shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            Masuk / Daftar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-bg-cream flex flex-col shadow-2xl overflow-x-clip relative pb-14">
      {/* 1. Header Navbar */}
      <nav className="sticky top-0 z-50 bg-brand-blue/95 backdrop-blur-md px-5 py-3 text-white flex items-center justify-between border-b border-brand-blue-dark shadow-sm">
        <button
          onClick={handleBack}
          className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 transition-all flex items-center justify-center text-white cursor-pointer"
          aria-label="Kembali"
        >
          <ArrowLeft size={20} strokeWidth={2.2} />
        </button>
        <span className="font-heading font-black text-[16px] tracking-wide text-white">
          Profil Saya
        </span>
        <div className="w-10" />
      </nav>

      {/* 2. Top Profile Hero Card with Banner Pattern */}
      <div className="relative px-5 pt-4 pb-12 text-white overflow-hidden bg-brand-blue">
        {/* Banner Pattern Background */}
        <div
          className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-90 scale-105"
          style={{ backgroundImage: `url(${profileBannerImg})` }}
        />
        {/* Subtle Gradient Overlay for depth and text legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-brand-blue/30 via-transparent to-brand-blue/50 pointer-events-none" />

        {/* Gear Settings Button (Top Right of Banner) */}
        <button
          type="button"
          onClick={() => navigate('/profile/edit', { state: { from: location.state?.from || '/menu' } })}
          className="absolute top-3.5 right-4 z-20 w-9 h-9 rounded-full bg-white text-brand-blue flex items-center justify-center shadow-md hover:bg-gray-50 active:scale-95 transition-all cursor-pointer group"
          title="Ubah Profil & Detail Akun"
          aria-label="Pengaturan Profil"
        >
          <Settings size={18} className="text-brand-blue group-hover:rotate-45 transition-transform duration-300" />
        </button>

        <div className="relative z-10 flex items-center gap-4">
          {/* Avatar with Ring */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-full bg-white p-[2px] shadow-elevated">
              <div className="w-full h-full rounded-full bg-[#3079af] flex items-center justify-center text-white font-heading font-black text-[22px]">
                {(user?.full_name || 'U').charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-brand-gold text-white flex items-center justify-center shadow-xs border-2 border-white">
              <Sparkles size={12} className="fill-white" />
            </div>
          </div>

          {/* User Details */}
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-black text-[18px] leading-tight text-white truncate">
              {user?.full_name || 'Pelanggan Setia'}
            </h1>
            <div className="flex items-center gap-1.5 mt-1 text-white/85 text-[12px] font-body">
              {user?.email?.includes('@') ? <Mail size={13} /> : <Phone size={13} />}
              <span className="truncate">{user?.email || 'Nomor WhatsApp'}</span>
            </div>
            <div className="mt-2 inline-flex items-center gap-1.5 bg-brand-gold text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-xs">
              <ShieldCheck size={12} className="text-white" />
              <span>Pelanggan Terdaftar</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Content Sheet (Bottom-sheet reveal overlap) */}
      <main className="bg-bg-cream rounded-t-[28px] -mt-6 relative z-10 px-4 pt-6 pb-12 flex-1 flex flex-col gap-4 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
        {/* CARD 1: Pesanan Saya */}
        <div className="bg-white rounded-[22px] p-4.5 shadow-card border border-gray-100/90">
          <div className="flex items-center pb-3.5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <ShoppingBag size={18} className="text-brand-blue" />
              <h2 className="font-heading font-black text-[15px] text-text-primary">
                Pesanan Saya
              </h2>
            </div>
          </div>

          {/* 4 Status Action Columns (Unified color.brand.blue) */}
          <div className="grid grid-cols-4 gap-2 pt-4">
            {/* 1. Belum Bayar */}
            <button
              onClick={() => navigate('/order-history?tab=pending')}
              className="flex flex-col items-center gap-1.5 group cursor-pointer active:scale-95 transition-all text-center"
            >
              <div className="relative w-12 h-12 rounded-[16px] bg-brand-blue/10 group-hover:bg-brand-blue/15 text-brand-blue flex items-center justify-center transition-colors shadow-2xs border border-brand-blue/20">
                <CreditCard size={20} strokeWidth={2} />
                {pendingPaymentCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-red text-white font-body font-black text-[10px] flex items-center justify-center shadow-xs">
                    {pendingPaymentCount}
                  </span>
                )}
              </div>
              <span className="font-body font-bold text-[11px] text-text-primary group-hover:text-brand-blue leading-tight">
                Belum Bayar
              </span>
            </button>

            {/* 2. Dikemas */}
            <button
              onClick={() => navigate('/order-history?tab=processing')}
              className="flex flex-col items-center gap-1.5 group cursor-pointer active:scale-95 transition-all text-center"
            >
              <div className="relative w-12 h-12 rounded-[16px] bg-brand-blue/10 group-hover:bg-brand-blue/15 text-brand-blue flex items-center justify-center transition-colors shadow-2xs border border-brand-blue/20">
                <Package size={20} strokeWidth={2} />
                {processingCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-blue text-white font-body font-black text-[10px] flex items-center justify-center shadow-xs">
                    {processingCount}
                  </span>
                )}
              </div>
              <span className="font-body font-bold text-[11px] text-text-primary group-hover:text-brand-blue leading-tight">
                Dikemas
              </span>
            </button>

            {/* 3. Dikirim */}
            <button
              onClick={() => navigate('/order-history?tab=delivering')}
              className="flex flex-col items-center gap-1.5 group cursor-pointer active:scale-95 transition-all text-center"
            >
              <div className="relative w-12 h-12 rounded-[16px] bg-brand-blue/10 group-hover:bg-brand-blue/15 text-brand-blue flex items-center justify-center transition-colors shadow-2xs border border-brand-blue/20">
                <Truck size={20} strokeWidth={2} />
                {deliveringCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-blue text-white font-body font-black text-[10px] flex items-center justify-center shadow-xs">
                    {deliveringCount}
                  </span>
                )}
              </div>
              <span className="font-body font-bold text-[11px] text-text-primary group-hover:text-brand-blue leading-tight">
                Dikirim
              </span>
            </button>

            {/* 4. Riwayat Transaksi */}
            <button
              onClick={() => navigate('/order-history?tab=all')}
              className="flex flex-col items-center gap-1.5 group cursor-pointer active:scale-95 transition-all text-center"
            >
              <div className="relative w-12 h-12 rounded-[16px] bg-brand-blue/10 group-hover:bg-brand-blue/15 text-brand-blue flex items-center justify-center transition-colors shadow-2xs border border-brand-blue/20">
                <ShoppingBag size={20} strokeWidth={2} />
                {totalOrdersCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-blue text-white font-body font-black text-[10px] flex items-center justify-center shadow-xs">
                    {totalOrdersCount}
                  </span>
                )}
              </div>
              <span className="font-body font-bold text-[11px] text-text-primary group-hover:text-brand-blue leading-tight">
                Riwayat
              </span>
            </button>
          </div>
        </div>

        {/* CARD 2: Alamat Pengiriman & Titik Peta */}
        <div className="bg-white rounded-[22px] p-4.5 shadow-card border border-gray-100/90 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center">
                <MapPin size={15} />
              </div>
              <h2 className="font-heading font-black text-[15px] text-text-primary">
                Alamat Pengiriman
              </h2>
            </div>
            <button
              type="button"
              onClick={handleOpenAddressModal}
              className="text-[12px] font-body font-bold text-brand-gold hover:text-brand-gold-dark hover:underline cursor-pointer"
            >
              {savedAddress ? 'Ubah Lokasi' : '+ Atur Titik Peta'}
            </button>
          </div>

          {/* Alamat Pengiriman Detail Card */}
          <div
            onClick={handleOpenAddressModal}
            className="w-full p-3.5 rounded-[16px] bg-gray-50/80 hover:bg-gray-100/80 border border-gray-200/60 flex flex-col gap-2.5 text-left group active:scale-[0.99] transition-all cursor-pointer shadow-2xs"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-body font-bold text-[13px] text-text-primary group-hover:text-brand-blue flex items-center gap-1.5">
                  {savedLabel === 'Rumah' && <Home size={14} className="text-brand-blue" />}
                  {savedLabel === 'Kantor' && <Briefcase size={14} className="text-brand-blue" />}
                  {savedLabel !== 'Rumah' && savedLabel !== 'Kantor' && <Tag size={14} className="text-brand-blue" />}
                  {savedLabel || 'Alamat Utama'}
                </span>
                <span className="text-[10px] bg-brand-gold/10 text-brand-gold-dark font-bold px-2 py-0.5 rounded-full border border-brand-gold/20">
                  Default
                </span>
              </div>
              <div className="flex items-center gap-1 text-text-secondary group-hover:text-brand-blue shrink-0 text-[11px] font-body font-semibold">
                <span>Atur di Peta</span>
                <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            <p className="font-body text-[12px] text-text-primary/90 leading-relaxed">
              {savedAddress || 'Belum ada titik alamat. Ketuk untuk membuka peta dan pilih pin lokasi Anda.'}
            </p>

            {savedNotes && (
              <div className="bg-amber-50/60 border border-amber-200/60 rounded-[10px] px-2.5 py-1.5 text-[11px] font-body text-amber-900 flex items-start gap-1.5">
                <span className="font-bold shrink-0">Patokan:</span>
                <span className="line-clamp-2">{savedNotes}</span>
              </div>
            )}

            {savedCoords ? (
              <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between text-[11px] font-body">
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Titik Pin GPS Terpasang
                </span>
                {distanceKm !== null && (
                  <span className="text-text-secondary font-medium">
                    ~{distanceKm} km dari outlet
                  </span>
                )}
              </div>
            ) : (
              <div className="pt-1.5 border-t border-gray-200/60 flex items-center gap-1 text-[11px] font-body text-brand-red">
                <Navigation size={12} />
                <span>Belum ada titik GPS presisi (Buka peta untuk pasang pin)</span>
              </div>
            )}
          </div>
        </div>

        {/* CARD 3: Bantuan & Layanan (Neutral card, WhatsApp green on icon only) */}
        <div className="bg-white rounded-[22px] p-4.5 shadow-card border border-gray-100/90 flex flex-col gap-3">
          <div className="pb-2 border-b border-gray-100">
            <h2 className="font-heading font-black text-[15px] text-text-primary">
              Bantuan
            </h2>
          </div>

          {/* Customer Service WhatsApp */}
          <button
            type="button"
            onClick={handleContactCS}
            className="w-full p-3.5 rounded-[16px] bg-gray-50/80 hover:bg-gray-100/80 border border-gray-200/60 flex items-center justify-between text-left group active:scale-[0.99] transition-all cursor-pointer shadow-2xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center shrink-0">
                <Headset size={20} />
              </div>
              <div className="min-w-0">
                <span className="font-body font-bold text-[13px] text-text-primary group-hover:text-brand-blue block">
                  Customer Service (WhatsApp)
                </span>
                <p className="font-body text-[11px] text-text-secondary mt-0.5 truncate">
                  Hubungi admin untuk bantuan & pertanyaan pesanan
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-text-secondary shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Kebijakan Privasi Link */}
          <button
            type="button"
            onClick={() => navigate('/privacy-policy')}
            className="w-full p-3.5 rounded-[16px] bg-gray-50/80 hover:bg-gray-100/80 border border-gray-200/60 flex items-center justify-between text-left group active:scale-[0.99] transition-all cursor-pointer shadow-2xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center shrink-0">
                <ShieldCheck size={18} />
              </div>
              <div className="min-w-0">
                <span className="font-body font-bold text-[13px] text-text-primary group-hover:text-brand-blue block">
                  Kebijakan Privasi
                </span>
                <p className="font-body text-[11px] text-text-secondary mt-0.5 truncate">
                  Informasi keamanan data & ketentuan layanan
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-text-secondary shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* LOGOUT BUTTON (Clean ghost / text button in brand red without heavy card wrapper) */}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full py-2.5 bg-transparent hover:bg-red-50/60 text-brand-red font-body font-semibold text-[13px] rounded-[12px] transition-all cursor-pointer flex items-center justify-center gap-2 mt-1 hover:underline"
        >
          <LogOut size={16} />
          <span>Keluar dari Akun</span>
        </button>

        {/* Footer Brand watermark */}
        <div className="mt-4 flex flex-col items-center justify-center gap-1 text-center">
          <img src={logoImg} alt="Makan Dimsum" className="h-7 w-auto opacity-40 grayscale" />
          <span className="font-body font-medium text-[10px] text-text-secondary/70">
            Makan Dimsum Indonesia • v1.0
          </span>
        </div>
      </main>

    </div>
  );
}
