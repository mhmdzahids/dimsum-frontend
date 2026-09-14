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
  Menu as MenuIcon
} from 'lucide-react';
import imgWortel from '../assets/icon/wortel.webp';
import imgSosis from '../assets/icon/sosis.webp';
import imgJamur from '../assets/icon/jamur.webp';
import imgBeef from '../assets/icon/beef.webp';
import imgCrabstick from '../assets/icon/crabstick.webp';
import imgKeju from '../assets/icon/keju.webp';
import logoImg from '../assets/logo.webp';

function Home() {
  const navigate = useNavigate();
  const [orderType, setOrderType] = useState('Pick Up');
  const [activeBanner, setActiveBanner] = useState(0);
  const [banners, setBanners] = useState([1, 2, 3]);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await fetch('/api/banners?active_only=true');
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          setBanners(data.data);
        }
      } catch (err) {
        console.error('Error fetching banners:', err);
      }
    };
    fetchBanners();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % banners.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [banners.length]);

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

  return (
    <div className="max-w-[480px] mx-auto min-h-screen relative shadow-2xl overflow-x-hidden bg-bg-cream">
      {/* Header */}
      <header className="bg-brand-blue pt-3 px-6 pb-14 text-left relative">
        {/* Top Navbar Area */}
        <div className="flex items-center justify-between text-white mb-3">
          <div className="h-14 flex items-center">
            <img src={logoImg} alt="Makan Dimsum Indonesia" className="h-full object-contain drop-shadow-md" />
          </div>
          <button className="w-11 h-11 bg-white/20 text-white rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
            <MenuIcon size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Divider */}
        <div className="h-[1px] w-full bg-white/20 mb-3"></div>

        {/* Greeting Area */}
        <div className="text-center">
          <h1 className="font-display font-black text-[24px] tracking-[0.6px] leading-[1.33] text-white mb-1.5">Halo, Dimsum Lovers!</h1>
          <p className="font-body font-bold text-[11px] leading-[1.25] text-white/85">Selamat Datang di Produsen & Distributor Dimsum Premium</p>
        </div>
      </header>

      {/* Sheet Content (overlaps header) */}
      <div className="bg-bg-cream rounded-t-[32px] -mt-6 relative pt-10 pb-16 shadow-[0_-4px_24px_rgba(0,0,0,0.05)]">

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
                    `[ Banner Promo ${item} ]`
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center gap-2 mb-8">
            {banners.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all duration-300 ${activeBanner === index ? 'w-6 bg-brand-gold' : 'w-1.5 bg-bg-cream-dark'
                  }`}
              ></div>
            ))}
          </div>
        </div>

        {/* Categories / Favorites */}
        <div className="px-6 mb-8">
          <h2 className="font-heading font-black text-[20px] tracking-[0.5px] leading-[1.25] text-brand-blue">Pilihan Topping</h2>
          <div className="flex justify-between gap-0.5 overflow-visible pb-4 mt-6 hide-scrollbar">
            {categories.map((cat, index) => (
              <div key={index} className="flex flex-col items-center gap-1.5 min-w-[48px] max-w-[54px] group cursor-pointer">
                <div className="w-[56px] h-[56px] rounded-full bg-brand-blue flex items-center justify-center shadow-card shrink-0 overflow-hidden">
                  <img src={cat.icon} alt={cat.name} className="w-[70%] h-[70%] object-contain transition-transform group-hover:animate-giggle" />
                </div>
                <span className="font-body font-bold text-[9px] leading-[1.2] text-brand-blue text-center break-words w-full group-hover:text-brand-gold transition-colors">{cat.name}</span>
              </div>
            ))}
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

      {/* Floating Action Button */}
      <button className="fixed bottom-6 right-6 md:right-[calc(50%-240px+24px)] bg-brand-gold text-white border-none rounded-full py-4 px-6 flex items-center gap-2 shadow-[0_8px_24px_rgba(0,0,0,0.12)] font-bold cursor-pointer z-10">
        <Headset size={20} />
        Ada Keluhan?
      </button>

    </div>
  );
}

export default Home;
