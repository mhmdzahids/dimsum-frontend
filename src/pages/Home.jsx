import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Truck,
  Smartphone,
  LayoutGrid,
  CreditCard,
  Clock,
  Camera,
  Video,
  MessageCircle,
  Headset,
  ChevronRight
} from 'lucide-react';
import imgWortel from '../assets/icon/wortel.webp';
import imgSosis from '../assets/icon/sosis.webp';
import imgJamur from '../assets/icon/jamur.webp';
import imgBeef from '../assets/icon/beef.webp';
import imgCrabstick from '../assets/icon/crabstick.webp';
import imgKeju from '../assets/icon/keju.webp';
import logoImg from '../assets/logo.webp';
import { Squash as Hamburger } from 'hamburger-react';
import HeaderDropdown from '../components/HeaderDropdown';
import HomeSkeleton from '../components/HomeSkeleton';

function Home() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [orderType, setOrderType] = useState('Pick Up');
  const [activeBanner, setActiveBanner] = useState(0);
  const [banners, setBanners] = useState([]);
  const [activeTopping, setActiveTopping] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assetsLoaded, setAssetsLoaded] = useState(false);

  const handleToppingClick = (name) => {
    setActiveTopping(name);
    setTimeout(() => {
      setActiveTopping((prev) => (prev === name ? null : prev));
    }, 450);
  };

  const [pendingOrder, setPendingOrder] = useState(() => {
    try {
      const saved = localStorage.getItem('dimsum_pending_order');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed || typeof parsed !== 'object' || !parsed.orderId) {
          try { localStorage.removeItem('dimsum_pending_order'); } catch { }
          return null;
        }
        if (parsed.expiresAt && new Date(parsed.expiresAt).getTime() <= Date.now()) {
          try { localStorage.removeItem('dimsum_pending_order'); } catch { }
          return null;
        }
        if (parsed.createdAt && (Date.now() - new Date(parsed.createdAt).getTime() > 60 * 60 * 1000)) {
          try { localStorage.removeItem('dimsum_pending_order'); } catch { }
          return null;
        }
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  // Preload banners, pending order validation, and core assets
  useEffect(() => {
    let isMounted = true;

    const loadDataAndAssets = async () => {
      try {
        const staticImages = [
          logoImg,
          imgWortel,
          imgSosis,
          imgJamur,
          imgBeef,
          imgCrabstick
        ];

        // 1. Fetch active banners & pending order validity in parallel
        const bannersPromise = fetch('/api/banners?active_only=true')
          .then(res => res.json())
          .catch(err => {
            console.error('Error fetching banners:', err);
            return { success: false, data: [] };
          });

        let orderPromise = Promise.resolve();
        if (pendingOrder?.orderId) {
          const token = pendingOrder.accessToken || localStorage.getItem('dimsum_current_order_token');
          const headers = {};
          if (token) headers['X-Order-Token'] = token;
          orderPromise = fetch(`/api/orders/${pendingOrder.orderId}`, { headers })
            .then(res => res.json())
            .then(data => {
              if (data.success && data.data) {
                if (data.data.status !== 'pending_payment') {
                  try { localStorage.removeItem('dimsum_pending_order'); } catch { }
                  if (isMounted) setPendingOrder(null);
                }
              } else if (data.status === 404 || data.error?.includes('tidak ditemukan')) {
                try { localStorage.removeItem('dimsum_pending_order'); } catch { }
                if (isMounted) setPendingOrder(null);
              }
            })
            .catch(() => { });
        }

        const [bannersData] = await Promise.all([bannersPromise, orderPromise]);

        let bannerUrls = [];
        if (bannersData?.success && Array.isArray(bannersData.data) && bannersData.data.length > 0) {
          if (isMounted) setBanners(bannersData.data);
          bannerUrls = bannersData.data.map(b => b.image_url).filter(Boolean);
        }

        // 2. Preload all images (icons + banners)
        const allImages = [...staticImages, ...bannerUrls];
        const imagePromises = allImages.map(src => {
          return new Promise((resolve) => {
            const img = new Image();
            img.src = src;
            img.onload = resolve;
            img.onerror = resolve;
          });
        });

        // 3. Minimum delay (550ms) for smooth skeleton presentation without abrupt flash
        const minLoadingTime = new Promise(resolve => setTimeout(resolve, 550));

        await Promise.all([...imagePromises, minLoadingTime]);

        if (isMounted) {
          setAssetsLoaded(true);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error initializing homepage:', err);
        if (isMounted) {
          setAssetsLoaded(true);
          setLoading(false);
        }
      }
    };

    loadDataAndAssets();

    return () => {
      isMounted = false;
    };
  }, []);

  // Periodic check for pending order expiry
  useEffect(() => {
    if (!pendingOrder?.orderId) return;

    const checkExpiry = () => {
      if (pendingOrder?.expiresAt && new Date(pendingOrder.expiresAt).getTime() <= Date.now()) {
        try { localStorage.removeItem('dimsum_pending_order'); } catch { }
        setPendingOrder(null);
      }
    };

    const timer = setInterval(checkExpiry, 3000);
    return () => clearInterval(timer);
  }, [pendingOrder?.orderId]);

  // Rotate carousel banners
  useEffect(() => {
    if (!banners || banners.length <= 1) return;
    const timer = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % banners.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [banners?.length]);

  const categories = [
    { name: 'Wortel', icon: imgWortel },
    { name: 'Sosis', icon: imgSosis },
    { name: 'Jamur', icon: imgJamur },
    { name: 'Beef', icon: imgBeef },
    { name: 'Crabstick', icon: imgCrabstick },
  ];

  const steps = [
    {
      title: 'Tentukan Cara Ordermu!',
      desc: 'Mau Pick-up? Delivery? Sesuaikan dengan kebutuhanmu!',
      icon: <Smartphone size={32} strokeWidth={1.5} />,
    },
    {
      title: 'Pilih Menu',
      desc: 'Pilih Produk dan Jumlah yang kamu inginkan.',
      icon: <LayoutGrid size={32} strokeWidth={1.5} />,
    },
    {
      title: 'Bayar Cashless',
      desc: 'Bayar instan pake QRIS, dompet digital, atau transfer bank.',
      icon: <CreditCard size={32} strokeWidth={1.5} />,
    },
    {
      title: 'Tunggu Disiapkan',
      desc: 'Tim kami bakal langsung siapin pesananmu. Siap diambil dalam beberapa menit!',
      icon: <Clock size={32} strokeWidth={1.5} />,
    },
    {
      title: 'Ambil & Gas!',
      desc: 'Datang ke toko, tunjukkan QR pesanan di area khusus Pick-up, langsung bawa pulang!',
      icon: <ShoppingBag size={32} strokeWidth={1.5} />,
    },
  ];

  // Render precise 1:1 skeleton loader while data and assets are loading
  if (loading || !assetsLoaded) {
    return <HomeSkeleton key="home-skeleton" />;
  }

  return (
    <div key="home-main-content" className="max-w-[480px] mx-auto min-h-screen relative shadow-2xl overflow-x-hidden bg-bg-cream animate-fade-in">
      {/* Header */}
      <header className="bg-brand-blue pt-3 px-6 pb-14 text-left relative z-10 transition-all duration-300">
        <div className="flex items-center justify-between text-white relative">
          <div className="h-14 flex items-center">
            <img src={logoImg} alt="Makan Dimsum Indonesia" className="h-full object-contain drop-shadow-md" />
          </div>
          <div className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-all cursor-pointer shrink-0">
            <Hamburger
              toggled={isMenuOpen}
              toggle={setIsMenuOpen}
              size={20}
              color="#FFFFFF"
              rounded
              label="Buka Menu"
            />
          </div>
        </div>

        {/* Expand-Down Navbar Collapse (Bootstrap style) */}
        <HeaderDropdown
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          variant="blue"
        />

        {/* Divider */}
        <div className="h-[1px] w-full bg-white/20 my-3"></div>

        {/* Greeting Area */}
        <div className="text-center">
          <h1 className="font-display font-black text-[24px] tracking-[0.6px] leading-[1.33] text-white mb-1.5">Halo, Dimsum Lovers!</h1>
          <p className="font-body font-bold text-[11px] leading-[1.25] text-white/85">Selamat Datang di Produsen & Distributor Dimsum Premium</p>
        </div>
      </header>

      {/* Sheet Content (overlaps header with visible rounded corners) */}
      <div className="bg-bg-cream rounded-t-[32px] -mt-6 relative z-20 pt-10 pb-16 shadow-[0_-4px_24px_rgba(0,0,0,0.05)]">

        {/* Segmented Control */}
        <div className="flex justify-center gap-4 px-6 mb-8">
          {['Pick Up', 'Delivery'].map((type) => {
            const isActive = orderType === type;
            const isDisabled = type === 'Delivery';
            return (
              <button
                key={type}
                disabled={isDisabled}
                className={`flex-1 flex flex-col items-center justify-center gap-3 py-6 px-4 rounded-[24px] font-body font-bold text-[12px] transition-all duration-200 relative ${isActive
                  ? 'bg-brand-gold text-white shadow-elevated'
                  : isDisabled
                    ? 'bg-[#EAEBEF] text-text-disabled cursor-not-allowed shadow-card opacity-70'
                    : 'bg-[#EAEBEF] text-text-secondary shadow-card'
                  }`}
                onClick={() => {
                  if (!isDisabled) {
                    setOrderType(type);
                    if (type === 'Pick Up') {
                      navigate('/menu');
                    }
                  }
                }}
              >
                {type === 'Pick Up' && <ShoppingBag size={32} strokeWidth={isActive ? 2.5 : 2} />}
                {type === 'Delivery' && <Truck size={32} strokeWidth={2} />}
                {type}
                {isDisabled && (
                  <span className="absolute top-3 right-3 text-[10px] bg-white text-text-secondary px-2 py-0.5 rounded-full shadow-sm">
                    Segera
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Carousel */}
        {banners.length > 0 && (
          <div className="px-6 pb-6 mt-4">
            <div className="overflow-hidden mb-6 rounded-[20px] shadow-card relative">
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${activeBanner * 100}%)` }}
              >
                {banners.map((item, index) => (
                  <div key={item.id || index} className="shrink-0 w-full h-[160px] bg-brand-blue-light flex items-center justify-center text-white font-body font-bold text-[14px] overflow-hidden">
                    {item.image_url ? (
                      <img src={item.image_url} alt={`Promo ${index + 1}`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-white/90">
                        <span className="font-heading font-black text-[16px]">Dimsum Hangat Premium</span>
                        <span className="text-[11px] opacity-80 mt-0.5">Rasakan kelezatan setiap gigitan</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {banners.length > 1 && (
              <div className="flex justify-center gap-2 mb-8">
                {banners.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 rounded-full transition-all duration-300 ${activeBanner === index ? 'w-6 bg-brand-gold' : 'w-1.5 bg-bg-cream-dark'
                      }`}
                  ></div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Categories / Favorites */}
        <div className="px-6 mb-8">
          <h2 className="font-heading font-black text-[20px] tracking-[0.5px] leading-[1.25] text-brand-blue">Aneka Topping</h2>
          <div className="flex justify-between gap-0.5 overflow-visible pb-4 mt-6 hide-scrollbar">
            {categories.map((cat, index) => {
              const isActive = activeTopping === cat.name;
              return (
                <div
                  key={index}
                  onClick={() => handleToppingClick(cat.name)}
                  className="flex flex-col items-center gap-1.5 min-w-[48px] max-w-[54px] group cursor-pointer select-none active:scale-95 transition-transform"
                >
                  <div className={`w-[56px] h-[56px] rounded-full bg-brand-blue flex items-center justify-center shadow-card shrink-0 overflow-hidden transition-all duration-200 ${isActive ? 'scale-110 shadow-elevated ring-2 ring-brand-gold' : 'group-hover:scale-105'
                    }`}>
                    <img
                      src={cat.icon}
                      alt={cat.name}
                      className={`w-[70%] h-[70%] object-contain transition-transform ${isActive ? 'animate-giggle' : 'group-hover:animate-giggle'
                        }`}
                    />
                  </div>
                  <span className={`font-body font-bold text-[9px] leading-[1.2] text-center break-words w-full transition-colors ${isActive ? 'text-brand-gold scale-105 font-black' : 'text-brand-blue group-hover:text-brand-gold'
                    }`}>
                    {cat.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5 Langkah Order */}
        <div className="px-6">
          <div className="inline-block bg-brand-gold text-white py-2 px-6 rounded-full font-heading font-black text-[16px] mb-8 shadow-card">
            5 Langkah Order
          </div>
          <div className="flex flex-col gap-8">
            {steps.map((step, index) => (
              <div key={index} className="flex gap-6 items-start">
                <div className="text-brand-blue shrink-0 mt-1">{step.icon}</div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-heading font-black text-[16px] text-brand-gold">{step.title}</h3>
                  <p className="font-body font-bold text-[11px] leading-[1.25] text-text-primary">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-brand-blue pt-12 px-6 pb-12 text-white flex justify-between items-start min-h-[250px]">
        <div className="flex flex-col gap-4 text-[12px] opacity-90">
          <div className="h-14 flex items-center mb-1">
            <img src={logoImg} alt="Makan Dimsum Indonesia" className="h-full object-contain drop-shadow-md" />
          </div>
          <p>Jl. Insinyur H. Juanda No.194,<br />RT.03/RW.01, Duren Jaya, <br />Kec. Bekasi Tim., Kota Bks,<br />Jawa Barat 17111</p>
          <p className="mt-6">Copyright 2026. All Rights Reserved.</p>
        </div>
        <div className="flex flex-col gap-6 items-end">
          <div className="text-[14px] font-bold">Follow Us Here!</div>
          <div className="flex flex-col gap-2 items-end">
            <div className="flex items-center gap-2 text-[12px]">
              <span>@makandimsum</span>
              <div className="w-6 h-6 rounded-full bg-white text-brand-blue flex items-center justify-center"><Camera size={14} /></div>
            </div>
            <div className="flex items-center gap-2 text-[12px]">
              <span>@makandimsum_id</span>
              <div className="w-6 h-6 rounded-full bg-white text-brand-blue flex items-center justify-center"><Video size={14} /></div>
            </div>
            <div className="flex items-center gap-2 text-[12px]">
              <span>@makandimsum</span>
              <div className="w-6 h-6 rounded-full bg-white text-brand-blue flex items-center justify-center"><MessageCircle size={14} /></div>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Action Button "Ada Keluhan?" (Always floating on top, z-[70]) */}
      <button
        onClick={() => window.open('https://wa.me/6281234567890?text=Halo%20Admin%20Makan%20Dimsum,%20saya%20butuh%20bantuan/ada%20keluhan%20pesanan...', '_blank')}
        className={`fixed ${pendingOrder && pendingOrder.orderId ? 'bottom-24' : 'bottom-6'
          } right-5 md:right-[calc(50%-240px+20px)] bg-brand-gold hover:bg-brand-gold-dark text-white border-none rounded-full py-3.5 px-5 flex items-center gap-2 shadow-elevated font-body font-bold text-[13px] cursor-pointer z-[70] hover:scale-105 active:scale-95 transition-all duration-200`}
        title="Hubungi Layanan Pelanggan"
      >
        <Headset size={19} strokeWidth={2.2} />
        <span>Ada Keluhan?</span>
      </button>

      {/* Floating Continue Payment Bar if pending order exists */}
      {pendingOrder && pendingOrder.orderId && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[448px] h-[64px] z-[100]">
          <div
            onClick={() => navigate('/payment', { state: { resumePending: true } })}
            className="w-full h-full bg-brand-gold rounded-[20px] shadow-elevated flex items-center justify-between overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
          >
            {/* Clock Icon with Ticking Urgency Animation */}
            <div className="bg-white/20 h-full self-stretch px-4 flex items-center justify-center relative shrink-0">
              <Clock size={28} className="text-white animate-ticking origin-center" />
            </div>

            {/* Info */}
            <div className="flex-grow px-3.5 flex flex-col justify-center min-w-0">
              <span className="text-white font-body font-medium text-[12px] opacity-90 truncate">
                Bayar Sekarang
              </span>
              <span className="text-white font-body font-bold text-[16px] tracking-tight truncate">
                Rp{Math.round(Number(pendingOrder.totalAmount || 0)).toLocaleString('id-ID')}
              </span>
            </div>

            {/* Urgent Pay Button */}
            <div className="px-5 h-full text-white font-body font-black text-[14px] flex items-center gap-1 shrink-0">
              <span>PAY NOW</span>
              <ChevronRight size={18} strokeWidth={2.5} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Home;
