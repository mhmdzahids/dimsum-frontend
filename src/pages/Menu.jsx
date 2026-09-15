import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Menu as MenuIcon,
  ChevronRight,
  ConciergeBell,
  ShoppingBasket,
  X,
  Plus,
  Minus
} from 'lucide-react';

import imgWortel from '../assets/icon/wortel.webp';
import imgSosis from '../assets/icon/sosis.webp';
import imgJamur from '../assets/icon/jamur.webp';
import imgBeef from '../assets/icon/beef.webp';
import imgCrabstick from '../assets/icon/crabstick.webp';
import imgKeju from '../assets/icon/keju.webp';

import bannerMenu from '../assets/banner/banner_menu.webp';

function MenuPage() {
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [selectedTopping, setSelectedTopping] = useState('Wortel');
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('dimsum_cart');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('dimsum_cart', JSON.stringify(cart));
  }, [cart]);

  const generateDates = () => {
    const dates = ['Hari ini'];
    for (let i = 1; i <= 6; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const options = { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' };
      dates.push(d.toLocaleDateString('id-ID', options).replace(/,/g, ''));
    }
    return dates;
  };
  const availableDates = React.useMemo(() => generateDates(), []);

  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(availableDates[0]);

  const [isProductModalClosing, setIsProductModalClosing] = useState(false);
  const [isTimeModalClosing, setIsTimeModalClosing] = useState(false);

  const closeProductModal = () => {
    setIsProductModalClosing(true);
    setTimeout(() => {
      setSelectedProduct(null);
      setIsProductModalClosing(false);
    }, 280);
  };

  const closeTimeModal = () => {
    setIsTimeModalClosing(true);
    setTimeout(() => {
      setIsTimeModalOpen(false);
      setIsTimeModalClosing(false);
    }, 280);
  };

  const getAvailableTimes = React.useCallback((dateToCheck) => {
    const times = [];
    const isToday = dateToCheck === availableDates[0];
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    for (let h = 9; h <= 21; h++) {
      const hourStr = h.toString().padStart(2, '0');

      if (!isToday || (h > currentHour) || (h === currentHour && currentMinute <= 0)) {
        times.push(`${hourStr} : 00`);
      }

      if (h !== 21) {
        if (!isToday || (h > currentHour) || (h === currentHour && currentMinute <= 30)) {
          times.push(`${hourStr} : 30`);
        }
      }
    }
    return times;
  }, [availableDates]);

  const availableTimes = React.useMemo(() => getAvailableTimes(selectedDate), [getAvailableTimes, selectedDate]);

  const [selectedTime, setSelectedTime] = useState(availableTimes[0]);

  const [confirmedTime, setConfirmedTime] = useState(() => {
    return localStorage.getItem('dimsum_time') || null;
  });

  useEffect(() => {
    if (confirmedTime) {
      localStorage.setItem('dimsum_time', confirmedTime);
    }
  }, [confirmedTime]);

  const orderTypeRef = useRef(null);
  const [isHighlighting, setIsHighlighting] = useState(false);

  const updateCart = (productId, amount) => {
    setCart((prev) => {
      const current = prev[productId] || 0;
      const next = Math.max(0, current + amount);
      if (next === 0) {
        const newCart = { ...prev };
        delete newCart[productId];
        return newCart;
      }
      return { ...prev, [productId]: next };
    });
  };

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assetsLoaded, setAssetsLoaded] = useState(false);

  useEffect(() => {
    const loadDataAndAssets = async () => {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();

        let formattedProducts = [];
        if (data.success) {
          formattedProducts = data.data.map(p => ({
            ...p,
            weight: p.weight || '18-20 Gram/Pcs',
            description: p.description || '',
            priceFormatted: `Rp${Number(p.price).toLocaleString('id-ID')}`,
            image: p.image_url || imgWortel
          }));
          setProducts(formattedProducts);

          setCart(prevCart => {
            const newCart = { ...prevCart };
            let changed = false;
            for (const id in newCart) {
              if (!formattedProducts.some(p => p.id === id)) {
                delete newCart[id];
                changed = true;
              }
            }
            return changed ? newCart : prevCart;
          });
        }

        // --- Preload Assets ---
        // Preload banner and all product images so UI appears instantly
        const imageUrlsToLoad = [bannerMenu];
        formattedProducts.forEach(p => {
          if (p.image) imageUrlsToLoad.push(p.image);
        });

        // Create promises for each image to load
        const imagePromises = imageUrlsToLoad.map(src => {
          return new Promise((resolve) => {
            const img = new Image();
            img.src = src;
            img.onload = resolve;
            img.onerror = resolve; // Resolve even on error to prevent infinite loading
          });
        });

        // Minimum 2 second loading delay
        const minLoadingTime = new Promise(resolve => setTimeout(resolve, 700));

        await Promise.all([...imagePromises, minLoadingTime]);

        setAssetsLoaded(true);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching products and assets:', err);
        setAssetsLoaded(true); // Fallback to allow rendering
        setLoading(false);
      }
    };

    loadDataAndAssets();
  }, []);

  const validCartEntries = Object.entries(cart).filter(([id]) => products.some(p => p.id === id));
  const totalItems = validCartEntries.reduce((sum, [, qty]) => sum + qty, 0);
  const totalPrice = validCartEntries.reduce((total, [id, qty]) => {
    const prod = products.find(p => p.id === id);
    if (prod) {
      return total + (Number(prod.price) * qty);
    }
    return total;
  }, 0);

  // Loading Screen
  if (loading || !assetsLoaded) {
    return (
      <div className="max-w-[480px] mx-auto min-h-screen relative shadow-2xl bg-bg-cream flex flex-col items-center justify-center z-50">
        <div className="w-12 h-12 border-4 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 font-body font-bold text-[14px] text-brand-blue animate-pulse">Menyiapkan Menu...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[480px] mx-auto min-h-screen relative shadow-2xl overflow-x-hidden bg-bg-cream pb-24">

      {/* 1. Header & Hero Section */}
      <div className="relative">
        {/* Top Navbar */}
        <div className="absolute top-0 left-0 w-full flex justify-between items-center px-4 py-4 z-10">
          <button onClick={() => navigate('/')} className="w-10 h-10 bg-white text-brand-blue rounded-full flex items-center justify-center shadow-sm">
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>

          <div className="flex gap-2 ml-auto">
            <button className="w-10 h-10 bg-white text-brand-blue rounded-full flex items-center justify-center shadow-sm">
              <MenuIcon size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Hero Banner */}
        <div className="w-full">
          <img src={bannerMenu} alt="Menu Banner" className="w-full h-auto object-cover" />
        </div>
      </div>

      {/* 2. Location Card */}
      <div className="px-4 -mt-10 relative z-20">
        <button
          onClick={() => navigate('/outlet')}
          className="w-full text-left bg-white rounded-[20px] p-5 shadow-card flex justify-between items-center transition-transform active:scale-95"
        >
          <div className="flex flex-col gap-1">
            <h2 className="font-body font-bold text-[16px] text-brand-blue">
              Makan Dimsum Cabang Utama
            </h2>
            <p className="font-body font-medium text-[12px] text-text-secondary">
              Open today, 08:00-22:00
            </p>
          </div>
          <ChevronRight size={20} className="text-text-secondary" />
        </button>
      </div>

      {/* 3. Order Type Card */}
      <div className="px-4 mt-4">
        <div ref={orderTypeRef} className={`bg-white rounded-[20px] shadow-card overflow-hidden transition-all duration-300 ${isHighlighting ? 'animate-flash-ring' : ''}`}>
          {/* Top Row */}
          <div className="flex justify-between items-center p-4 border-b border-gray-100">
            <span className="font-body font-medium text-[14px] text-text-primary">Order Type</span>
            <div className="border border-gray-300 rounded-[10px] px-4 py-1.5">
              <span className="font-body font-bold text-[13px] text-text-primary">Pick Up</span>
            </div>
          </div>
          {/* Bottom Row */}
          <div className="flex justify-between items-center p-4">
            <div className="flex items-center gap-3">
              <ConciergeBell size={24} className="text-brand-blue" />
              <div className="flex flex-col">
                <span className={`font-body font-bold text-[14px] ${confirmedTime ? 'text-text-primary' : 'text-text-secondary'}`}>
                  {confirmedTime || 'Pilih Waktu Pickup'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsTimeModalOpen(true)}
              className="border border-brand-gold rounded-[10px] px-4 py-1.5 text-brand-gold font-body font-bold text-[13px]"
            >
              Select Time
            </button>
          </div>
        </div>
      </div>

      {/* 5. Section Title */}
      <div className="px-4 mb-4 mt-8">
        <h3 className="font-body font-black text-[15px] text-brand-blue">
          Produk Kami
        </h3>
      </div>

      {/* 6. Product List */}
      <div className="px-4 flex flex-col gap-3">
        {products.map((product) => {
          const productQty = cart[product.id] || 0;
          return (
            <div
              key={product.id}
              onClick={() => {
                setSelectedProduct(product);
                setQty(productQty || 1);
                setSelectedTopping('Wortel');
              }}
              className={`bg-white rounded-[16px] shadow-sm flex p-3 cursor-pointer border ${productQty > 0
                ? 'border-gray-100 border-r-4 border-r-brand-gold'
                : 'border-gray-100 border-r-4 border-r-transparent'
                }`}
            >
              {/* Product Image Box */}
              <div className="w-[84px] h-[84px] bg-gray-100 rounded-[12px] flex items-center justify-center shrink-0 overflow-hidden">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              </div>
              {/* Product Info */}
              <div className="pl-3 flex flex-col flex-grow justify-center">
                <h4 className="font-body font-bold text-[14px] text-brand-blue leading-tight">
                  {product.name}
                </h4>
                <span className="font-body font-medium text-[11px] text-text-secondary mt-0.5">
                  {product.weight}
                </span>
                <div className="flex justify-between items-center mt-2">
                  <span className="font-body font-bold text-[14px] text-brand-gold">
                    {product.priceFormatted}
                  </span>

                  {productQty === 0 ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProduct(product);
                        setQty(1);
                        setSelectedTopping('Wortel');
                      }}
                      className="border border-brand-gold text-brand-gold font-body font-bold text-[12px] rounded-full px-5 py-1 transition-colors hover:bg-brand-gold hover:text-white"
                    >
                      Add
                    </button>
                  ) : (
                    <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => updateCart(product.id, -1)}
                        className="w-6 h-6 rounded-full border border-text-primary flex items-center justify-center text-text-primary"
                      >
                        <Minus size={14} strokeWidth={2.5} />
                      </button>
                      <span className="font-body font-bold text-[14px] w-3 text-center">{productQty}</span>
                      <button
                        onClick={() => updateCart(product.id, 1)}
                        className="w-6 h-6 rounded-full border border-text-primary flex items-center justify-center text-text-primary"
                      >
                        <Plus size={14} strokeWidth={2.5} />
                      </button>
                    </div>
                  )}

                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 7. Bottom Checkout Bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[448px] h-[64px] z-[100]">
          <div
            onClick={() => {
              if (!confirmedTime) {
                setIsHighlighting(true);
                orderTypeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(() => setIsHighlighting(false), 2000);
              } else {
                // Pass total and items to checkout
                const cartItems = Object.entries(cart).map(([id, qty]) => {
                  const p = products.find(p => p.id === id);
                  return { ...p, quantity: qty };
                });
                navigate('/checkout', { state: { confirmedTime, cartItems, totalPrice, totalItems } });
              }
            }}
            className="w-full h-full bg-brand-gold rounded-[20px] shadow-elevated flex items-center justify-between overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
          >
            {/* Basket Icon */}
            <div className="bg-white/20 p-4 relative">
              <ShoppingBasket size={28} className="text-white" />
              <div className="absolute top-2 right-2 bg-brand-blue text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {totalItems}
              </div>
            </div>
            {/* Info */}
            <div className="flex-grow px-4 flex flex-col">
              <span className="text-white font-body font-medium text-[12px] opacity-90">Total</span>
              <span className="text-white font-body font-bold text-[16px]">Rp{totalPrice.toLocaleString('id-ID')}</span>
            </div>
            {/* Checkout Button */}
            <div className="px-6 h-full text-white font-body font-black text-[14px] flex items-center">
              CHECK OUT ({totalItems})
            </div>
          </div>
        </div>
      )}

      {/* 8. Full-screen Product Detail Modal */}
      {selectedProduct && (
        <div className={`fixed inset-0 bg-white z-[100] overflow-y-auto flex flex-col max-w-[480px] mx-auto ${isProductModalClosing ? 'animate-slide-down' : 'animate-slide-up'}`}>
          {/* Image Header */}
          <div className="relative w-full aspect-square bg-gray-50">
            <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
            <button
              onClick={closeProductModal}
              className="absolute top-4 right-4 bg-white text-text-primary rounded-full p-2 shadow-card"
            >
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>

          {/* Title & Info */}
          <div className="p-4 bg-white">
            <h1 className="font-heading font-black text-[22px] text-text-primary uppercase leading-tight">
              {selectedProduct.name}
            </h1>
            <p className="font-body font-black text-[18px] text-text-primary mt-1">{selectedProduct.priceFormatted}</p>
            <p className="font-body font-medium text-[12px] text-text-secondary mt-3 leading-relaxed">
              {selectedProduct.description || `Dimsum premium ${selectedProduct.weight}. Tersedia dalam kemasan higienis, diproduksi segar setiap hari.`}
            </p>
          </div>

          {/* Divider */}
          <div className="h-2 w-full bg-[#F3F4F6]"></div>

          {/* Topping Selection */}
          <div className="p-4 flex-grow bg-white">
            <div className="flex justify-between items-center mb-1">
              <h2 className="font-body font-black text-[14px] text-text-primary uppercase tracking-wide">Pilihan Topping</h2>
              <div className="bg-green-100 text-green-700 w-5 h-5 rounded-full flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
            </div>
            <p className="font-body font-medium text-[12px] text-text-secondary mb-4">Pilih salah satu varian topping.</p>

            <div className="flex flex-col">
              {/* MIX Option */}
              <label className="flex justify-between items-center py-4 border-b border-gray-100 cursor-default">
                <span className="font-body font-bold text-[13px] text-text-primary uppercase">MIX (Semua Varian)</span>
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={true}
                    readOnly
                    className="peer appearance-none w-5 h-5 border-2 border-gray-300 rounded-md checked:border-brand-gold checked:bg-brand-gold transition-all cursor-default"
                  />
                  <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
              </label>

              {['Wortel', 'Sosis', 'Jamur', 'Beef', 'Crabstick', 'Keju'].map((topping, idx) => (
                <label key={topping} className={`flex justify-between items-center py-4 opacity-40 cursor-not-allowed ${idx !== 5 ? 'border-b border-gray-100' : ''}`}>
                  <span className="font-body font-bold text-[13px] text-text-primary uppercase">{topping}</span>
                  <div className="relative flex items-center justify-center">
                    <input
                      type="radio"
                      name="topping"
                      value={topping}
                      checked={false}
                      readOnly
                      disabled={true}
                      className="peer appearance-none w-5 h-5 border-2 border-gray-300 rounded-md checked:border-brand-gold checked:bg-brand-gold transition-all disabled:bg-gray-100"
                    />
                    <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Modal Bottom Sticky Bar */}
          <div className="sticky bottom-0 mt-auto w-full p-4 bg-white border-t border-gray-100 z-[110] rounded-t-[24px] shadow-[0_-10px_40px_rgba(0,0,0,0.08)]">
            <div className="flex justify-between items-center mb-4 px-1">
              <span className="font-body font-medium text-[14px] text-text-primary">Total Order</span>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-7 h-7 rounded-full border-2 border-text-primary flex items-center justify-center text-text-primary"
                >
                  <Minus size={16} strokeWidth={2.5} />
                </button>
                <span className="font-body font-bold text-[15px] w-4 text-center">{qty}</span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="w-7 h-7 rounded-full border-2 border-text-primary flex items-center justify-center text-text-primary"
                >
                  <Plus size={16} strokeWidth={2.5} />
                </button>
              </div>
            </div>
            <button
              onClick={() => {
                setCart((prev) => ({ ...prev, [selectedProduct.id]: qty }));
                closeProductModal();
              }}
              className="w-full bg-brand-gold text-white font-body font-black text-[15px] py-3.5 rounded-[16px] shadow-elevated"
            >
              Add Orders - Rp{(Number(selectedProduct.price) * qty).toLocaleString('id-ID')}
            </button>
          </div>
        </div>
      )}

      {/* 9. Select Pick Up Time Bottom Sheet */}
      {isTimeModalOpen && (
        <div className="fixed inset-0 z-[120] flex flex-col justify-end">
          {/* Backdrop */}
          <div className={`absolute inset-0 bg-black/40 ${isTimeModalClosing ? 'animate-fade-out' : 'animate-fade-in'}`} onClick={closeTimeModal}></div>

          {/* Bottom Sheet */}
          <div className={`relative bg-white w-full max-w-[480px] mx-auto rounded-t-[24px] shadow-2xl flex flex-col ${isTimeModalClosing ? 'animate-slide-down' : 'animate-slide-up'}`}>
            {/* Header */}
            <div className="p-5 flex justify-between items-center border-b border-gray-100">
              <h2 className="font-body font-black text-[16px] text-text-primary">Select Pick Up Time</h2>
              <button
                onClick={closeTimeModal}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-text-primary"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            {/* Pickers Content */}
            <div className="flex h-[260px] overflow-hidden relative">
              {/* Left Column: Dates */}
              <div className="w-[60%] overflow-y-auto hide-scrollbar pt-2 pb-10 border-r border-gray-50">
                {availableDates.map(date => (
                  <div
                    key={date}
                    onClick={() => {
                      setSelectedDate(date);
                      const newTimes = getAvailableTimes(date);
                      if (newTimes.length > 0) {
                        setSelectedTime(newTimes[0]);
                      }
                    }}
                    className={`px-5 py-3.5 cursor-pointer font-body font-bold text-[14px] transition-colors border-y ${selectedDate === date ? 'text-text-primary bg-gray-50/50 border-gray-100' : 'text-[#D1D5DB] border-transparent'}`}
                  >
                    {date}
                  </div>
                ))}
              </div>

              {/* Right Column: Times */}
              <div className="w-[40%] overflow-y-auto hide-scrollbar pt-2 pb-10">
                <div className="flex flex-col">
                  {availableTimes.map(time => (
                    <div
                      key={`${selectedDate}-${time}`}
                      onClick={() => setSelectedTime(time)}
                      className={`px-5 py-3.5 text-center cursor-pointer font-body font-bold text-[14px] transition-colors border-y ${selectedTime === time ? 'text-text-primary bg-gray-50/50 border-gray-100' : 'text-[#D1D5DB] border-transparent'}`}
                    >
                      {time}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Save Button */}
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setConfirmedTime(`${selectedDate}, ${selectedTime}`);
                  closeTimeModal();
                }}
                className="w-full bg-brand-gold text-white font-body font-black text-[15px] py-3.5 rounded-[16px] shadow-elevated"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default MenuPage;
