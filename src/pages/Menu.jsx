import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Menu as MenuIcon,
  ChevronRight,
  ConciergeBell,
  ShoppingBasket,
  ShoppingBag,
  X,
  Plus,
  Minus,
  Clock,
  Check,
  AlertCircle,
  Flame
} from 'lucide-react';

import imgWortel from '../assets/icon/wortel.webp';
import imgSosis from '../assets/icon/sosis.webp';
import imgJamur from '../assets/icon/jamur.webp';
import imgBeef from '../assets/icon/beef.webp';
import imgCrabstick from '../assets/icon/crabstick.webp';
import imgKeju from '../assets/icon/keju.webp';

import bannerMenu from '../assets/banner/banner_menu.webp';
import { Squash as Hamburger } from 'hamburger-react';
import HeaderDropdown from '../components/HeaderDropdown';
import { getValidPickupTime, savePickupTime } from '../utils/pickupTime';

function MenuPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [emptyCartToast, setEmptyCartToast] = useState('');

  // Listen for empty cart notices from route guards
  useEffect(() => {
    if (location.state?.emptyCartNotice) {
      setEmptyCartToast(location.state.emptyCartNotice);
      const timer = setTimeout(() => setEmptyCartToast(''), 4000);
      window.history.replaceState({}, document.title);
      return () => clearTimeout(timer);
    }
  }, [location.state?.emptyCartNotice]);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [selectedTopping, setSelectedTopping] = useState('Wortel');
  const [activeTopping, setActiveTopping] = useState(null);

  const handleToppingClick = (name) => {
    setActiveTopping(name);
    setTimeout(() => {
      setActiveTopping((prev) => (prev === name ? null : prev));
    }, 450);
  };
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('dimsum_cart');
    return saved ? JSON.parse(saved) : {};
  });

  const [pendingOrder, setPendingOrder] = useState(() => {
    try {
      const saved = localStorage.getItem('dimsum_pending_order');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.expiresAt && new Date(parsed.expiresAt).getTime() <= Date.now()) {
          localStorage.removeItem('dimsum_pending_order');
          return null;
        }
        if (parsed.createdAt && (Date.now() - new Date(parsed.createdAt).getTime() > 60 * 60 * 1000)) {
          localStorage.removeItem('dimsum_pending_order');
          return null;
        }
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });
  const [showPendingModal, setShowPendingModal] = useState(false);

  useEffect(() => {
    localStorage.setItem('dimsum_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    sessionStorage.removeItem('dimsum_returned_from_payment');
  }, []);

  // Order Limit
  const [orderLimit, setOrderLimit] = useState(null);
  const [limitToast, setLimitToast] = useState(false);
  useEffect(() => {
    fetch('/api/settings/order-limit')
      .then(r => r.json())
      .then(data => {
        if (data.success) setOrderLimit(data.data.order_item_limit);
      })
      .catch(() => { });
  }, []);

  // Verify pending order validity with server and check expiry interval
  useEffect(() => {
    if (!pendingOrder?.orderId) return;

    const checkExpiry = () => {
      if (pendingOrder.expiresAt && new Date(pendingOrder.expiresAt).getTime() <= Date.now()) {
        localStorage.removeItem('dimsum_pending_order');
        setPendingOrder(null);
      }
    };

    const token = pendingOrder.accessToken || localStorage.getItem('dimsum_current_order_token');
    const headers = {};
    if (token) headers['X-Order-Token'] = token;

    fetch(`/api/orders/${pendingOrder.orderId}`, { headers })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          if (data.data.status !== 'pending_payment') {
            localStorage.removeItem('dimsum_pending_order');
            setPendingOrder(null);
          }
        } else if (data.status === 404 || data.error?.includes('tidak ditemukan')) {
          localStorage.removeItem('dimsum_pending_order');
          setPendingOrder(null);
        }
      })
      .catch(() => { });

    const timer = setInterval(checkExpiry, 3000);
    return () => clearInterval(timer);
  }, [pendingOrder]);

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

  // Lock background scroll when modal or bottom sheet is open
  useEffect(() => {
    if (selectedProduct || isTimeModalOpen || showPendingModal) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [selectedProduct, isTimeModalOpen, showPendingModal]);

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
    return getValidPickupTime();
  });

  // Watch for expiry: if the selected pickup time passes while user is browsing, auto-reset
  useEffect(() => {
    const checkExpiry = () => {
      const valid = getValidPickupTime();
      if (!valid && confirmedTime) {
        setConfirmedTime(null);
      }
    };

    const timer = setInterval(checkExpiry, 5000);
    return () => clearInterval(timer);
  }, [confirmedTime]);

  const orderTypeRef = useRef(null);
  const [isHighlighting, setIsHighlighting] = useState(false);

  const updateCart = (productId, amount) => {
    setCart((prev) => {
      const current = prev[productId] || 0;
      const next = Math.max(0, current + amount);
      // Check order limit before increasing
      if (orderLimit && amount > 0) {
        const currentTotal = Object.values(prev).reduce((s, q) => s + q, 0);
        if (currentTotal + amount > orderLimit) {
          setLimitToast(true);
          setTimeout(() => setLimitToast(false), 3000);
          return prev;
        }
      }
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
          formattedProducts = data.data.map(p => {
            const hasDiscount = Boolean(p.is_discount && p.discount_percent > 0);
            const activePrice = Number(p.price);
            const originalPrice = p.original_price ? Number(p.original_price) : activePrice;
            const discountPercent = p.discount_percent || 0;

            return {
              ...p,
              weight: p.weight || '18-20 Gram/Pcs',
              description: p.description || '',
              hasDiscount,
              price: activePrice,
              originalPrice,
              discountPercent,
              priceFormatted: `Rp${activePrice.toLocaleString('id-ID')}`,
              originalPriceFormatted: `Rp${originalPrice.toLocaleString('id-ID')}`,
              image: p.image_url || imgWortel
            };
          });

          // Sort products: highest discount percentage first, then regular non-promo products
          formattedProducts.sort((a, b) => {
            const discountA = a.hasDiscount ? a.discountPercent : 0;
            const discountB = b.hasDiscount ? b.discountPercent : 0;
            if (discountB !== discountA) {
              return discountB - discountA;
            }
            return a.name.localeCompare(b.name);
          });

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
        <div className={`absolute top-0 left-0 w-full px-4 pt-4 pb-2 transition-all duration-300 ${isMenuOpen ? 'z-[110]' : 'z-50'}`}>
          <div className="flex justify-between items-center relative z-50">
            <button
              onClick={() => navigate('/')}
              className="w-12 h-12 bg-white text-brand-blue rounded-full flex items-center justify-center shadow-md cursor-pointer hover:bg-white/90 active:scale-95 transition-all"
            >
              <ArrowLeft size={20} strokeWidth={2.5} />
            </button>

            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-white/90 active:scale-95 transition-all cursor-pointer">
              <Hamburger
                toggled={isMenuOpen}
                toggle={setIsMenuOpen}
                size={20}
                color="#4E8298"
                rounded
                label="Buka Menu"
              />
            </div>
          </div>

          {/* Expand-Down Navbar Collapse */}
          <HeaderDropdown
            isOpen={isMenuOpen}
            onClose={() => setIsMenuOpen(false)}
            variant="white"
          />
        </div>

        {/* Hero Banner */}
        <div className="w-full relative z-0">
          <img src={bannerMenu} alt="Menu Banner" className="w-full h-auto object-cover" />
        </div>
      </div>

      {/* 2. Location Card (Layered on top of banner without text cut-off) */}
      <div className="px-4 -mt-6 relative z-30">
        <button
          onClick={() => navigate('/outlet')}
          className="w-full text-left bg-white rounded-[20px] p-5 shadow-elevated flex justify-between items-center transition-transform active:scale-95"
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
                if (pendingOrder) {
                  setShowPendingModal(true);
                  return;
                }
                setSelectedProduct(product);
                setQty(productQty || 1);
                setSelectedTopping('Wortel');
              }}
              className={`bg-white rounded-[16px] shadow-sm flex p-3 cursor-pointer transition-all ${
                product.hasDiscount
                  ? productQty > 0
                    ? 'border-[1.2px] border-brand-red/40 border-r-4 border-r-brand-red'
                    : 'border-[1.2px] border-brand-red/40'
                  : productQty > 0
                  ? 'border border-gray-100 border-r-4 border-r-brand-gold'
                  : 'border border-gray-100 border-r-4 border-r-transparent'
                }`}
            >
              {/* Product Image Box */}
              <div className="relative w-[84px] h-[84px] shrink-0">
                <div className="w-full h-full bg-gray-100 rounded-[12px] overflow-hidden flex items-center justify-center">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                </div>
                {product.hasDiscount && (
                  <span className="absolute -top-2 -left-2 bg-brand-red text-white border-2 border-white rounded-full px-1.5 py-0.5 shadow-md flex items-center gap-0.5 z-10">
                    <Flame size={10} className="fill-white text-white shrink-0 -skew-x-[14deg] -rotate-[6deg] transform" />
                    <span className="font-body font-black italic text-[9.5px] leading-none tracking-tight">
                      {product.discountPercent}%
                    </span>
                  </span>
                )}
              </div>
              {/* Product Info */}
              <div className="pl-3 flex flex-col flex-grow justify-center min-w-0">
                <h4 className="font-body font-bold text-[14px] text-brand-blue leading-tight truncate">
                  {product.name}
                </h4>
                <span className="font-body font-medium text-[11px] text-text-secondary mt-0.5">
                  {product.weight}
                </span>
                <div className="flex justify-between items-end mt-1.5">
                  <div className="flex flex-col">
                    {product.hasDiscount && (
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-body font-medium text-[11px] text-text-secondary line-through">
                          {product.originalPriceFormatted}
                        </span>
                        <span className="bg-brand-red/10 text-brand-red border border-brand-red/25 font-body font-bold text-[10px] px-1.5 py-0.2 rounded-[4px] leading-tight">
                          -{product.discountPercent}%
                        </span>
                      </div>
                    )}
                    <span className="font-body font-black text-[14px] text-brand-gold leading-tight">
                      {product.priceFormatted}
                    </span>
                  </div>

                  {productQty === 0 ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (pendingOrder) {
                          setShowPendingModal(true);
                          return;
                        }
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
                        onClick={() => {
                          if (pendingOrder) {
                            setShowPendingModal(true);
                            return;
                          }
                          updateCart(product.id, -1);
                        }}
                        className="w-6 h-6 rounded-full border border-text-primary flex items-center justify-center text-text-primary"
                      >
                        <Minus size={14} strokeWidth={2.5} />
                      </button>
                      <span className="font-body font-bold text-[14px] w-3 text-center">{productQty}</span>
                      <button
                        onClick={() => {
                          if (pendingOrder) {
                            setShowPendingModal(true);
                            return;
                          }
                          updateCart(product.id, 1);
                        }}
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

      {/* 7. Bottom Checkout / Continue Payment Bar */}
      {pendingOrder ? (
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
                Rp{Math.round(Number(pendingOrder.totalAmount)).toLocaleString('id-ID')}
              </span>
            </div>

            {/* Urgent Pay Button */}
            <div className="px-5 h-full text-white font-body font-black text-[14px] flex items-center gap-1 shrink-0">
              <span>PAY NOW</span>
              <ChevronRight size={18} strokeWidth={2.5} />
            </div>
          </div>
        </div>
      ) : totalItems > 0 ? (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[448px] h-[64px] z-[100]">
          <div
            onClick={() => {
              if (!confirmedTime) {
                setIsHighlighting(true);
                orderTypeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setIsTimeModalOpen(true);
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
            <div className="bg-white/20 h-full self-stretch px-4 flex items-center justify-center relative">
              <ShoppingBasket size={28} className="text-white" />
              <div className="absolute top-2.5 right-2 bg-brand-blue text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
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
      ) : null}

      {/* 8. Full-screen Product Detail Modal */}
      {selectedProduct && (
        <div className={`fixed inset-0 bg-white z-[100] flex flex-col max-w-[480px] mx-auto ${isProductModalClosing ? 'animate-slide-down' : 'animate-slide-up'}`}>
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
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
              {selectedProduct.hasDiscount ? (
                <div className="mt-1.5 flex items-baseline gap-2 flex-wrap">
                  <span className="font-body font-black text-[20px] text-brand-gold">
                    {selectedProduct.priceFormatted}
                  </span>
                  <span className="font-body font-medium text-[13px] text-text-secondary line-through">
                    {selectedProduct.originalPriceFormatted}
                  </span>
                  <span className="bg-brand-red/10 text-brand-red border border-brand-red/25 font-body font-bold text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Flame size={12} className="fill-brand-red text-brand-red shrink-0 -skew-x-[14deg] -rotate-[6deg] transform" />
                    <span className="italic font-black">Diskon {selectedProduct.discountPercent}%</span>
                  </span>
                </div>
              ) : (
                <p className="font-body font-black text-[18px] text-text-primary mt-1">{selectedProduct.priceFormatted}</p>
              )}
              <p className="font-body font-medium text-[12px] text-text-secondary mt-3 leading-relaxed">
                {selectedProduct.description || `Dimsum premium ${selectedProduct.weight}. Tersedia dalam kemasan higienis, diproduksi segar setiap hari.`}
              </p>
            </div>

            {/* Divider */}
            <div className="h-2 w-full bg-[#F3F4F6]"></div>

            {/* Topping Dimsum Info */}
            <div className="p-4 bg-white pb-6">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-body font-black text-[14px] text-text-primary uppercase tracking-wide">Topping Dimsum</h2>
                </div>
              </div>
              <p className="font-body font-medium text-[12px] text-text-secondary mb-3.5">
                Setiap kemasan sudah berisi kombinasi aneka varian topping lezat berikut:
              </p>

              {/* Toppings Circular Showcase (Matching Homepage Style) */}
              <div className="bg-[#FAF8F5] border border-[#EFE9DF] rounded-[20px] p-4 shadow-sm">
                <div className="grid grid-cols-3 gap-y-4 gap-x-2">
                  {[
                    { name: 'Wortel', icon: imgWortel },
                    { name: 'Sosis', icon: imgSosis },
                    { name: 'Jamur', icon: imgJamur },
                    { name: 'Beef', icon: imgBeef },
                    { name: 'Crabstick', icon: imgCrabstick },
                    { name: 'Keju', icon: imgKeju },
                  ].map((t, idx) => {
                    const isActive = activeTopping === t.name;
                    return (
                      <div
                        key={idx}
                        onClick={() => handleToppingClick(t.name)}
                        className="flex flex-col items-center gap-1.5 group cursor-pointer select-none active:scale-95 transition-transform"
                      >
                        <div className={`w-[56px] h-[56px] rounded-full bg-brand-blue flex items-center justify-center shadow-card overflow-hidden transition-all duration-200 ${isActive ? 'scale-110 shadow-elevated ring-2 ring-brand-gold' : 'group-hover:scale-105'
                          }`}>
                          <img
                            src={t.icon}
                            alt={t.name}
                            className={`w-[72%] h-[72%] object-contain transition-transform ${isActive ? 'animate-giggle' : 'group-hover:animate-giggle'
                              }`}
                          />
                        </div>
                        <span className={`font-body font-bold text-[11px] text-center transition-colors ${isActive ? 'text-brand-gold scale-105 font-black' : 'text-brand-blue group-hover:text-brand-gold'
                          }`}>
                          {t.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Modal Bottom Sticky Bar */}
          <div className="w-full p-4 bg-white border-t border-gray-100 z-20 rounded-t-[24px] shadow-[0_-10px_40px_rgba(0,0,0,0.08)] shrink-0">
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
                  onClick={() => {
                    if (orderLimit && selectedProduct) {
                      const currentTotal = Object.values(cart).reduce((s, q) => s + q, 0);
                      const existingQty = cart[selectedProduct.id] || 0;
                      const netAdd = (qty + 1) - existingQty;
                      if (currentTotal + netAdd > orderLimit) {
                        setLimitToast(true);
                        setTimeout(() => setLimitToast(false), 3000);
                        return;
                      }
                    }
                    setQty(qty + 1);
                  }}
                  className="w-7 h-7 rounded-full border-2 border-text-primary flex items-center justify-center text-text-primary"
                >
                  <Plus size={16} strokeWidth={2.5} />
                </button>
              </div>
            </div>
            <button
              onClick={() => {
                if (pendingOrder) {
                  closeProductModal();
                  setShowPendingModal(true);
                  return;
                }
                // Check order limit
                if (orderLimit) {
                  const currentTotal = Object.values(cart).reduce((s, q) => s + q, 0);
                  const existingQty = cart[selectedProduct.id] || 0;
                  const netAdd = qty - existingQty;
                  if (currentTotal + netAdd > orderLimit) {
                    setLimitToast(true);
                    setTimeout(() => setLimitToast(false), 3000);
                    return;
                  }
                }
                setCart((prev) => ({ ...prev, [selectedProduct.id]: qty }));
                closeProductModal();
              }}
              className="w-full bg-brand-gold text-white font-body font-black text-[15px] py-3.5 rounded-[16px] shadow-elevated transition-transform active:scale-95"
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
          <div className={`absolute inset-0 bg-black/40 touch-none overscroll-contain ${isTimeModalClosing ? 'animate-fade-out' : 'animate-fade-in'}`} onClick={closeTimeModal}></div>

          {/* Bottom Sheet */}
          <div className={`relative bg-white w-full max-w-[480px] mx-auto rounded-t-[24px] shadow-2xl flex flex-col overscroll-contain ${isTimeModalClosing ? 'animate-slide-down' : 'animate-slide-up'}`}>
            {/* Header */}
            <div className="p-5 flex justify-between items-center border-b border-gray-100">
              <h2 className="font-body font-black text-[16px] text-text-primary">Pilih waktu Pick Up</h2>
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
                  const label = savePickupTime(selectedDate, selectedTime, availableDates);
                  setConfirmedTime(label);
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

      {/* 10. Pending Order Notice Modal */}
      {showPendingModal && pendingOrder && (
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs touch-none overscroll-contain animate-fade-in"
            onClick={() => setShowPendingModal(false)}
          ></div>
          <div className="relative bg-white w-full max-w-[440px] rounded-t-[28px] sm:rounded-[28px] shadow-2xl p-6 flex flex-col items-center text-center animate-slide-up sm:animate-fade-in z-10">
            <div className="w-14 h-14 rounded-full bg-brand-gold/15 text-brand-gold flex items-center justify-center mb-4">
              <Clock size={28} strokeWidth={2.2} />
            </div>

            <h3 className="font-heading font-black text-[19px] text-text-primary mb-2">
              Selesaikan Pembayaran Dulu Yuk!
            </h3>

            <p className="font-body font-medium text-[13px] text-text-secondary leading-relaxed mb-6">
              Kamu masih memiliki pesanan yang belum dibayar sebesar <b className="text-brand-gold font-black">Rp{pendingOrder.totalAmount?.toLocaleString('id-ID')}</b>. Selesaikan pembayaran QRIS ini sebelum membuat pesanan baru ya.
            </p>

            <button
              onClick={() => {
                setShowPendingModal(false);
                navigate('/payment', { state: { resumePending: true } });
              }}
              className="w-full bg-brand-gold text-white font-heading font-black text-[15px] py-3.5 rounded-[16px] shadow-elevated transition-transform active:scale-95 mb-3"
            >
              Lanjutkan Pembayaran
            </button>

            <button
              onClick={() => {
                if (window.confirm("Batalkan pesanan sebelumnya dan mulai pesanan baru?")) {
                  localStorage.removeItem('dimsum_pending_order');
                  setPendingOrder(null);
                  setShowPendingModal(false);
                }
              }}
              className="text-red-500 font-body font-bold text-[13px] py-2 hover:bg-red-50 px-4 rounded-full transition-colors"
            >
              Batalkan Pesanan Sebelumnya
            </button>
          </div>
        </div>
      )}

      {/* 11. Order Limit Toast Notification */}
      {limitToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-[400px] animate-toast-in">
          <div className="bg-red-500/95 backdrop-blur-xs text-white px-4 py-3 rounded-[16px] shadow-elevated flex items-center justify-between gap-3 border border-red-400/40">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <AlertCircle size={18} className="text-white" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-heading font-black text-[14px] leading-tight">Batas Pesanan Tercapai</span>
                <span className="font-body font-medium text-[12px] text-white/90 leading-tight mt-0.5">
                  Maksimum {orderLimit} item per transaksi.
                </span>
              </div>
            </div>
            <button
              onClick={() => setLimitToast(false)}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white shrink-0 transition-colors"
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}

      {/* 12. Empty Cart Route Guard Toast */}
      {emptyCartToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-[400px] animate-toast-in">
          <div className="bg-brand-blue/95 backdrop-blur-xs text-white px-4 py-3 rounded-[16px] shadow-elevated flex items-center justify-between gap-3 border border-white/20">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <ShoppingBag size={18} className="text-white" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-heading font-black text-[14px] leading-tight">Keranjang Belanja Kosong</span>
                <span className="font-body font-medium text-[12px] text-white/90 leading-tight mt-0.5">
                  {emptyCartToast}
                </span>
              </div>
            </div>
            <button
              onClick={() => setEmptyCartToast('')}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white shrink-0 transition-colors"
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default MenuPage;
