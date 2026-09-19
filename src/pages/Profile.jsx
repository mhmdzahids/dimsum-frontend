import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Settings,
  ShoppingBag,
  CreditCard,
  Package,
  Truck,
  MapPin,
  Headset,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Plus,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  User,
  ExternalLink,
  Camera,
  Video,
  MessageCircle,
  Wallet,
  Receipt
} from 'lucide-react';
import logoImg from '../assets/logo.webp';
import imgWortel from '../assets/icon/wortel.webp';
import imgBeef from '../assets/icon/beef.webp';
import imgKeju from '../assets/icon/keju.webp';
import imgJamur from '../assets/icon/jamur.webp';
import imgCrabstick from '../assets/icon/crabstick.webp';
import imgSosis from '../assets/icon/sosis.webp';

import {
  isCustomerLoggedIn,
  getCustomerUser,
  logoutCustomer,
  subscribeCustomerAuth
} from '../utils/customerAuth';
import { getOrderHistory, syncOrderHistoryWithServer } from '../utils/orderHistory';

// Token konsisten kartu: radius 20px (radius.lg), shadow elevation.sm, tanpa border
const CARD_SURFACE_TOKEN = 'card-surface';

export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(() => isCustomerLoggedIn());
  const [user, setUser] = useState(() => getCustomerUser());
  const [orders, setOrders] = useState(() => getOrderHistory());
  const [toastMessage, setToastMessage] = useState('');

  const [savedAddress, setSavedAddress] = useState(() => {
    const u = getCustomerUser();
    return u?.address || localStorage.getItem('dimsum_delivery_address') || '';
  });

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
  }, [location.key]);

  useEffect(() => {
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
      if (!logged) {
        navigate('/auth?redirect=/profile', { replace: true });
      }
    });

    if (!isCustomerLoggedIn()) {
      navigate('/auth?redirect=/profile', { replace: true });
    }

    syncOrderHistoryWithServer()
      .then((updated) => {
        if (Array.isArray(updated)) {
          setOrders(updated);
        }
      })
      .catch(() => { });

    return unsub;
  }, [navigate]);

  // Status counts for badges
  const pendingPaymentCount = orders.filter(
    (o) => o.status === 'pending_payment' || o.status === 'pending'
  ).length;

  const processingCount = orders.filter(
    (o) => o.status === 'processing' || o.status === 'paid' || o.status === 'preparing'
  ).length;

  // Active latest order
  const activeOrder = useMemo(() => {
    return orders.find((o) =>
      [
        'pending',
        'pending_payment',
        'paid',
        'preparing',
        'processing',
        'delivering',
        'shipped',
        'ready',
        'ready_for_pickup'
      ].includes(o.status)
    );
  }, [orders]);

  // Set of product IDs/names currently in active order (so they won't appear in Re-Order)
  const activeProductKeys = useMemo(() => {
    if (!activeOrder || !Array.isArray(activeOrder.items)) return new Set();
    return new Set(
      activeOrder.items.map((it) => String(it.id || it.product_id || it.name).toLowerCase())
    );
  }, [activeOrder]);

  // Helper to resolve product image
  const getProductImage = (item) => {
    if (item?.image) return item.image;
    if (item?.image_url) return item.image_url;
    const name = (item?.name || item?.product_name || '').toLowerCase();
    if (name.includes('beef') || name.includes('sapi')) return imgBeef;
    if (name.includes('keju') || name.includes('cheese')) return imgKeju;
    if (name.includes('jamur') || name.includes('mushroom')) return imgJamur;
    if (name.includes('crab') || name.includes('kepiting')) return imgCrabstick;
    if (name.includes('sosis') || name.includes('sausage')) return imgSosis;
    return imgWortel;
  };

  // Re-order products: only show if at least 2 distinct products not in active order
  const reorderProducts = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    const map = new Map();
    orders.forEach((order) => {
      if (Array.isArray(order.items)) {
        order.items.forEach((it) => {
          const key = String(it.id || it.product_id || it.name).toLowerCase();
          // Exclude products currently in the active order
          if (!activeProductKeys.has(key) && !map.has(key)) {
            map.set(key, {
              id: it.id || it.product_id || key,
              name: it.name || it.product_name || 'Dimsum Spesial',
              price: it.price || it.unit_price || 20000,
              image: getProductImage(it)
            });
          }
        });
      }
    });
    const list = Array.from(map.values());
    // Only display if at least 2 distinct products
    return list.length >= 2 ? list.slice(0, 6) : [];
  }, [orders, activeProductKeys]);

  const handleQuickAddToCart = (e, product) => {
    e.stopPropagation();
    try {
      const saved = localStorage.getItem('dimsum_cart');
      const cart = saved ? JSON.parse(saved) : {};
      const pid = String(product.id || product.name);
      cart[pid] = (cart[pid] || 0) + 1;
      localStorage.setItem('dimsum_cart', JSON.stringify(cart));
      setToastMessage(`"${product.name}" ditambahkan ke keranjang`);
      setTimeout(() => setToastMessage(''), 2500);
    } catch (err) {
      console.error(err);
    }
  };

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
      <div className="max-w-[480px] mx-auto min-h-screen bg-bg-cream flex items-center justify-center p-6 font-body">
        <div className="bg-white rounded-[24px] p-6 text-center shadow-card w-full max-w-[340px]">
          <div className="w-14 h-14 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center mx-auto mb-3">
            <User size={28} />
          </div>
          <h2 className="font-heading font-black text-[18px] text-brand-blue mb-1">
            Belum Masuk Akun
          </h2>
          <p className="font-body text-[13px] text-text-secondary mb-5 leading-relaxed">
            Silakan masuk atau daftar akun untuk melihat profil dan pesanan Anda.
          </p>
          <button
            onClick={() => navigate('/auth?redirect=/profile')}
            className="w-full min-h-[44px] py-2.5 bg-brand-gold hover:bg-brand-gold-dark text-white font-body font-bold text-[13px] rounded-full shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            Masuk / Daftar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-bg-cream flex flex-col shadow-2xl overflow-x-clip relative font-body">
      {/* 1. Header Biru: Tinggi diperkecil ~20%, Logo sama dengan homepage, Motif Anyaman Bambu SVG 8% */}
      <header className="bg-brand-blue text-white relative pt-3 pb-8 px-5 overflow-hidden transition-all">
        {/* Motif Anyaman Bambu SVG (Opacity 8%) */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.08] pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="bamboo-weave-profile" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M0 10 L10 0 L20 10 L10 20 Z" fill="none" stroke="#FFFFFF" strokeWidth="1.2" />
              <path d="M10 10 L0 20 M20 0 L10 10" fill="none" stroke="#FFFFFF" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#bamboo-weave-profile)" />
        </svg>

        {/* Top Bar: Tombol Kembali, Logo Asli Homepage, Tombol Pengaturan */}
        <div className="relative z-10 flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 transition-all flex items-center justify-center text-white cursor-pointer"
            aria-label="Kembali"
          >
            <ArrowLeft size={19} strokeWidth={2.2} />
          </button>

          {/* Logo Sama dengan Homepage (Logo Asli Berwarna dengan Drop-Shadow) */}
          <div className="h-10 flex items-center">
            <img
              src={logoImg}
              alt="Makan Dimsum Indonesia"
              className="h-full object-contain drop-shadow-md"
            />
          </div>

          <button
            type="button"
            onClick={() =>
              navigate('/profile/edit', { state: { from: location.state?.from || '/menu' } })
            }
            className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 transition-all flex items-center justify-center text-white cursor-pointer"
            title="Pengaturan Profil"
            aria-label="Pengaturan Profil"
          >
            <Settings size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Hero Identitas Pengguna: Baris "Halo, Zahid" dihapus, langsung nama */}
        <div className="relative z-10 flex items-center gap-3.5 mt-3.5">
          {/* Avatar Inisial */}
          <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white shadow-md flex items-center justify-center text-white font-heading font-black text-[22px] shrink-0">
            {(user?.full_name || 'U').charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="font-heading font-black text-[18px] text-white leading-tight truncate">
              {user?.full_name || 'Pelanggan Setia'}
            </h1>
            <div className="flex items-center gap-1.5 mt-1 text-white/85 text-[12px]">
              {user?.phone ? (
                <>
                  <Phone size={12} className="shrink-0" />
                  <span className="truncate">{user.phone}</span>
                </>
              ) : (
                <>
                  <Mail size={12} className="shrink-0" />
                  <span className="truncate">{user?.email || 'Nomor telepon belum diatur'}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main Sheet: Latar Cream, Hanya Pesanan Berjalan yang Berupa Kartu */}
      <main className="bg-bg-cream rounded-t-sheet -mt-5 relative z-20 px-5 pt-5 pb-10 flex-1 flex flex-col">
        
        {/* SECTION 1: PESANAN BERJALAN (Satu-satunya yang Berupa Kartu) */}
        <section aria-labelledby="active-order-heading">
          {activeOrder ? (
            /* Order Status Card Sesuai PRD 5.2 (Putih, Strip Kiri Emas 4px) */
            <div className={`${CARD_SURFACE_TOKEN} border-l-4! border-l-solid! border-l-brand-gold! p-4 transition-all`}>
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="font-heading font-bold text-[14px] text-brand-blue">
                    Pesanan Berjalan
                  </span>
                  {/* Status Pill */}
                  {['pending_payment', 'pending'].includes(activeOrder.status) ? (
                    <span className="bg-brand-gold/15 text-brand-gold-dark text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                      Menunggu Bayar
                    </span>
                  ) : ['paid', 'preparing', 'processing'].includes(activeOrder.status) ? (
                    <span className="bg-brand-blue/15 text-brand-blue-dark text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                      Sedang Dikemas
                    </span>
                  ) : ['delivering', 'shipped'].includes(activeOrder.status) ? (
                    <span className="bg-brand-blue/15 text-brand-blue-dark text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                      Sedang Dikirim
                    </span>
                  ) : (
                    <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                      Siap Diambil
                    </span>
                  )}
                </div>
              </div>

              {/* Item Summary dengan Foto Produk Utama */}
              <div className="flex items-center gap-3 py-3">
                <img
                  src={getProductImage(activeOrder.items?.[0])}
                  alt="Dimsum"
                  className="w-14 h-14 rounded-[12px] object-cover bg-bg-cream shrink-0 border border-gray-100 shadow-2xs"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-body font-bold text-[13px] text-text-primary truncate">
                    {activeOrder.items?.[0]?.name || activeOrder.items?.[0]?.product_name || 'Dimsum Spesial'}
                  </h3>
                  <p className="font-body text-[12px] text-text-secondary mt-0.5">
                    {activeOrder.items?.length > 1
                      ? `${activeOrder.items[0]?.quantity || 1}x (+${activeOrder.items.length - 1} menu lainnya)`
                      : `${activeOrder.items?.[0]?.quantity || 1} porsi`}
                  </p>
                  <p className="font-body text-[11px] text-text-secondary flex items-center gap-1 mt-1">
                    <Clock size={12} className="text-brand-blue" />
                    <span>Pick-up: <strong>{activeOrder.confirmedTime || 'Segera'}</strong></span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-body font-bold text-[14px] text-brand-gold">
                    Rp{Number(activeOrder.totalAmount || 0).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                {['pending_payment', 'pending'].includes(activeOrder.status) ? (
                  <button
                    type="button"
                    onClick={() => navigate('/payment', { state: { resumePending: true } })}
                    className="min-h-[40px] px-4 py-2 bg-brand-gold hover:bg-brand-gold-dark text-white font-body font-bold text-[12px] rounded-full shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Bayar Sekarang</span>
                    <ChevronRight size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      navigate('/order-status', { state: { orderId: activeOrder.orderId } })
                    }
                    className="min-h-[40px] px-4 py-2 bg-brand-blue hover:bg-brand-blue-dark text-white font-body font-bold text-[12px] rounded-full shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Lihat QR & Lacak</span>
                    <ChevronRight size={14} />
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Empty State Ringkas bila Tidak Ada Pesanan Berjalan (Tersusun Vertikal di Mobile) */
            <div className={`${CARD_SURFACE_TOKEN} p-4 flex flex-col gap-3.5`}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center shrink-0 mt-0.5">
                  <ShoppingBag size={20} strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-heading font-bold text-[14px] text-text-primary whitespace-nowrap leading-snug">
                    Tidak ada pesanan aktif
                  </h3>
                  <p className="font-body text-[12px] text-text-secondary mt-0.5 leading-relaxed">
                    Siap santap dimsum hangat hari ini?
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/menu')}
                className="w-full min-h-[42px] py-2.5 px-4 bg-brand-gold hover:bg-brand-gold-dark text-white font-body font-bold text-[13px] rounded-full shadow-xs active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center"
              >
                Pesan Sekarang
              </button>
            </div>
          )}

        </section>

        {/* SECTION PINTASAN: PESANAN SAYA */}
        <section aria-labelledby="my-orders-heading" className="mt-5">
          <h2
            id="my-orders-heading"
            className="font-heading font-bold text-[14px] text-[#4E8298] mb-3"
          >
            Pesanan Saya
          </h2>

          {/* Satu wadah putih (#FFFFFF), radius 12px, shadow elevation.sm, tanpa border */}
          <div className={`${CARD_SURFACE_TOKEN} py-4 px-2 flex items-center overflow-hidden`}>
            {/* 1. Belum Bayar */}
            <button
              type="button"
              onClick={() => navigate('/order-history?tab=pending')}
              className="flex-1 min-w-0 min-h-[80px] px-1 py-1 flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer active:bg-[#F5F1EB] focus-visible:outline-2 focus-visible:outline-[#4E8298] focus-visible:outline-offset-[-2px]"
              aria-label="Pesanan Belum Bayar"
            >
              <div className="relative inline-flex items-center justify-center">
                <Wallet size={24} strokeWidth={1.75} className="text-[#4E8298]" />
                {pendingPaymentCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-1 rounded-full bg-[#C9A23D] text-white text-[11px] font-bold flex items-center justify-center leading-none">
                    {pendingPaymentCount}
                  </span>
                )}
              </div>
              <span className="font-body font-medium text-[12px] leading-[1.3] text-[#2C3E50] text-center line-clamp-2 w-full">
                Belum Bayar
              </span>
            </button>

            {/* Garis pemisah vertikal 1px, tinggi 50% (40px / 80px), tidak menyentuh teks */}
            <div className="w-[1px] h-[40px] bg-[#E5DFD3] shrink-0 self-center" aria-hidden="true" />

            {/* 2. Dikemas */}
            <button
              type="button"
              onClick={() => navigate('/order-history?tab=processing')}
              className="flex-1 min-w-0 min-h-[80px] px-1 py-1 flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer active:bg-[#F5F1EB] focus-visible:outline-2 focus-visible:outline-[#4E8298] focus-visible:outline-offset-[-2px]"
              aria-label="Pesanan Dikemas"
            >
              <div className="relative inline-flex items-center justify-center">
                <Package size={24} strokeWidth={1.75} className="text-[#4E8298]" />
                {processingCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-1 rounded-full bg-[#C9A23D] text-white text-[11px] font-bold flex items-center justify-center leading-none">
                    {processingCount}
                  </span>
                )}
              </div>
              <span className="font-body font-medium text-[12px] leading-[1.3] text-[#2C3E50] text-center line-clamp-2 w-full">
                Dikemas
              </span>
            </button>

            {/* Garis pemisah vertikal 1px, tinggi 50% */}
            <div className="w-[1px] h-[40px] bg-[#E5DFD3] shrink-0 self-center" aria-hidden="true" />

            {/* 3. Dikirim */}
            <button
              type="button"
              onClick={() => navigate('/order-history?tab=delivering')}
              className="flex-1 min-w-0 min-h-[80px] px-1 py-1 flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer active:bg-[#F5F1EB] focus-visible:outline-2 focus-visible:outline-[#4E8298] focus-visible:outline-offset-[-2px]"
              aria-label="Pesanan Dikirim"
            >
              <div className="relative inline-flex items-center justify-center">
                <Truck size={24} strokeWidth={1.75} className="text-[#4E8298]" />
              </div>
              <span className="font-body font-medium text-[12px] leading-[1.3] text-[#2C3E50] text-center line-clamp-2 w-full">
                Dikirim
              </span>
            </button>

            {/* Garis pemisah vertikal 1px, tinggi 50% */}
            <div className="w-[1px] h-[40px] bg-[#E5DFD3] shrink-0 self-center" aria-hidden="true" />

            {/* 4. Riwayat */}
            <button
              type="button"
              onClick={() => navigate('/order-history?tab=all')}
              className="flex-1 min-w-0 min-h-[80px] px-1 py-1 flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer active:bg-[#F5F1EB] focus-visible:outline-2 focus-visible:outline-[#4E8298] focus-visible:outline-offset-[-2px]"
              aria-label="Riwayat Pesanan"
            >
              <div className="relative inline-flex items-center justify-center">
                <Receipt size={24} strokeWidth={1.75} className="text-[#4E8298]" />
              </div>
              <span className="font-body font-medium text-[12px] leading-[1.3] text-[#2C3E50] text-center line-clamp-2 w-full">
                Riwayat
              </span>
            </button>
          </div>
        </section>

        {/* SECTION 2: PESAN ULANG (Hanya jika minimal 2 produk berbeda di luar pesanan berjalan, tanpa kartu, tanpa bayangan) */}
        {reorderProducts.length >= 2 && (
          <>
            {/* Garis Pemisah Tipis 1px (#E5DFD3) dan Jarak 32px */}
            <div className="h-[1px] w-full bg-[#E5DFD3] my-8" />

            <section aria-labelledby="reorder-heading">
              <div className="flex items-center justify-between mb-3 px-0.5">
                <h2
                  id="reorder-heading"
                  className="font-heading font-bold text-[14px] text-brand-blue"
                >
                  Pesan Ulang Favoritmu
                </h2>
                <button
                  type="button"
                  onClick={() => navigate('/menu')}
                  className="text-[11px] font-body font-semibold text-brand-blue hover:underline cursor-pointer"
                >
                  Lihat Menu
                </button>
              </div>

              {/* Horizontal Scroll Carousel: Flat tanpa kartu pembungkus dan tanpa bayangan */}
              <div className="flex gap-3 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar scroll-smooth">
                {reorderProducts.map((p, idx) => (
                  <div
                    key={idx}
                    onClick={() => navigate('/menu')}
                    className="w-[130px] shrink-0 flex flex-col justify-between cursor-pointer active:scale-98 group"
                  >
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-full h-20 rounded-[12px] object-cover bg-white/70 border border-[#E5DFD3]"
                    />
                    <div className="mt-2 flex flex-col justify-between flex-1">
                      {/* Nama Produk Tampil Penuh Maksimal 2 Baris */}
                      <p className="font-body font-bold text-[12px] text-text-primary line-clamp-2 leading-snug h-8">
                        {p.name}
                      </p>
                      <div className="flex items-center justify-between mt-1.5 pt-1">
                        <span className="font-body font-bold text-[11px] text-brand-gold">
                          Rp{Number(p.price).toLocaleString('id-ID')}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleQuickAddToCart(e, p)}
                          className="w-6 h-6 rounded-full bg-brand-gold hover:bg-brand-gold-dark text-white flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
                          title="Tambah ke Keranjang"
                          aria-label={`Tambah ${p.name}`}
                        >
                          <Plus size={14} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* Garis Pemisah Tipis 1px (#E5DFD3) dan Jarak 32px */}
        <div className="h-[1px] w-full bg-[#E5DFD3] my-8" />

        {/* SECTION 3: ALAMAT PENGIRIMAN (Tanpa Kartu & Tanpa Bayangan: Judul + 1 Kalimat + 1 Tombol Secondary) */}
        <section aria-labelledby="shipping-address-heading">
          <div className="flex flex-col gap-2">
            <h2
              id="shipping-address-heading"
              className="font-heading font-bold text-[14px] text-brand-blue"
            >
              Alamat Pengiriman
            </h2>

            <p className="font-body text-[12px] text-text-secondary leading-relaxed">
              {savedAddress
                ? savedAddress
                : 'Belum ada alamat pengiriman. Saat ini layanan Pesan & Ambil di outlet.'}
            </p>

            <div className="pt-1">
              <button
                type="button"
                onClick={handleOpenAddressModal}
                className="min-h-[38px] px-4 py-1.5 border border-brand-blue text-brand-blue hover:bg-brand-blue/5 rounded-full font-body font-semibold text-[12px] transition-all cursor-pointer inline-flex items-center justify-center"
              >
                Atur di Peta
              </button>
            </div>
          </div>
        </section>

        {/* Garis Pemisah Tipis 1px (#E5DFD3) dan Jarak 32px */}
        <div className="h-[1px] w-full bg-[#E5DFD3] my-8" />

        {/* SECTION 4: BANTUAN (Tanpa Kartu & Tanpa Bayangan: Langsung di Atas Latar Cream, Pemisah Garis Tipis) */}
        <section aria-labelledby="help-heading">
          <h2
            id="help-heading"
            className="font-heading font-bold text-[14px] text-brand-blue mb-1"
          >
            Bantuan
          </h2>

          <div className="divide-y divide-[#E5DFD3]">
            {/* Baris 1: Chat CS (WhatsApp) */}
            <button
              type="button"
              onClick={handleContactCS}
              className="w-full py-3 flex items-center justify-between text-left group transition-colors cursor-pointer min-h-[44px]"
            >
              <div className="flex items-center gap-2.5">
                <Headset size={18} strokeWidth={1.8} className="text-brand-blue shrink-0" />
                <span className="font-body font-semibold text-[13px] text-text-primary group-hover:text-brand-blue transition-colors">
                  Chat CS (WhatsApp)
                </span>
              </div>
              <ExternalLink size={15} className="text-text-secondary/70 shrink-0" />
            </button>

            {/* Baris 2: Kebijakan Privasi */}
            <button
              type="button"
              onClick={() => navigate('/privacy-policy')}
              className="w-full py-3 flex items-center justify-between text-left group transition-colors cursor-pointer min-h-[44px]"
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={18} strokeWidth={1.8} className="text-brand-blue shrink-0" />
                <span className="font-body font-semibold text-[13px] text-text-primary group-hover:text-brand-blue transition-colors">
                  Kebijakan Privasi
                </span>
              </div>
              <ChevronRight size={16} className="text-text-secondary/70 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </section>

        {/* Garis Pemisah Tipis 1px (#E5DFD3) dan Jarak 32px */}
        <div className="h-[1px] w-full bg-[#E5DFD3] my-8" />

        {/* SECTION 5: KELUAR DARI AKUN (Tombol Ghost Teks Biru) */}
        <div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full min-h-[44px] py-2 bg-transparent hover:bg-brand-blue/5 text-brand-blue font-body font-semibold text-[13px] rounded-full transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <LogOut size={16} strokeWidth={2} />
            <span>Keluar dari Akun</span>
          </button>
        </div>
      </main>

      {/* 3. Footer Homepage (Band Biru, Logo, Alamat, Sosial Media, dan Versi v1.0) */}
      <footer className="bg-brand-blue pt-10 px-6 pb-12 text-white flex justify-between items-start min-h-[230px]">
        <div className="flex flex-col gap-3 text-[12px] opacity-90 max-w-[55%]">
          <div className="h-12 flex items-center mb-1">
            <img src={logoImg} alt="Makan Dimsum Indonesia" className="h-full object-contain drop-shadow-md" />
          </div>
          <p className="leading-relaxed">
            Jl. Insinyur H. Juanda No.194,<br />
            RT.03/RW.01, Duren Jaya, <br />
            Kec. Bekasi Tim., Kota Bks,<br />
            Jawa Barat 17111
          </p>
          <p className="mt-4 text-[11px] opacity-80">
            Copyright 2026. All Rights Reserved.
            <span className="opacity-60 text-[10px] block mt-0.5">v1.0</span>
          </p>
        </div>

        <div className="flex flex-col gap-4 items-end">
          <div className="text-[13px] font-bold">Follow Us Here!</div>
          <div className="flex flex-col gap-2 items-end">
            <div className="flex items-center gap-2 text-[12px]">
              <span>@makandimsum</span>
              <div className="w-6 h-6 rounded-full bg-white text-brand-blue flex items-center justify-center">
                <Camera size={13} />
              </div>
            </div>
            <div className="flex items-center gap-2 text-[12px]">
              <span>@makandimsum_id</span>
              <div className="w-6 h-6 rounded-full bg-white text-brand-blue flex items-center justify-center">
                <Video size={13} />
              </div>
            </div>
            <div className="flex items-center gap-2 text-[12px]">
              <span>@makandimsum</span>
              <div className="w-6 h-6 rounded-full bg-white text-brand-blue flex items-center justify-center">
                <MessageCircle size={13} />
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-black/85 backdrop-blur-md text-white px-4 py-2.5 rounded-full shadow-lg text-[12px] font-body font-semibold flex items-center gap-2 animate-fade-in pointer-events-none">
          <CheckCircle2 size={16} className="text-brand-gold shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
