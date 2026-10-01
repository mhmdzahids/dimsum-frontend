import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronRight,
  Minus,
  Plus,
  Flame,
  Ticket,
  ShoppingBag,
  PenLine,
  CheckCircle2,
  ChevronDown,
  X,
  Truck,
  MapPin,
  Coins,
  AlertCircle
} from 'lucide-react';
import { getValidPickupTime, savePickupTime } from '../utils/pickupTime';
import {
  isCustomerLoggedIn,
  getCustomerUser,
  subscribeCustomerAuth
} from '../utils/customerAuth';
import {
  calculateHaversineDistance,
  OUTLET_COORDS
} from '../utils/geo';
import api from '../api/client';

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const cartItems = location.state?.cartItems || [];

  // Check if user returned from Payment page to animate progress bar in reverse
  const [isReturningFromPayment] = useState(() => {
    const flag = sessionStorage.getItem('dimsum_returned_from_payment');
    if (flag === 'true') {
      sessionStorage.removeItem('dimsum_returned_from_payment');
      return true;
    }
    return false;
  });

  // If there's an active pending order, redirect to payment
  useEffect(() => {
    const savedPending = localStorage.getItem('dimsum_pending_order');
    if (savedPending) {
      try {
        const parsed = JSON.parse(savedPending);
        if (parsed.orderId) {
          navigate('/payment', { state: { resumePending: true } });
        }
      } catch (e) { }
    }
  }, [navigate]);

  // Order Limit
  const [orderLimit, setOrderLimit] = useState(null);
  useEffect(() => {
    api.get('/api/settings/order-limit')
      .then(res => {
        if (res.success && res.data) setOrderLimit(res.data.order_item_limit);
      })
      .catch(() => { });
  }, []);

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
  const [isTimeModalClosing, setIsTimeModalClosing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(availableDates[0]);

  const closeTimeModal = () => {
    setIsTimeModalClosing(true);
    setTimeout(() => {
      setIsTimeModalOpen(false);
      setIsTimeModalClosing(false);
    }, 280);
  };

  // Order Notes State & Handlers
  const [orderNotes, setOrderNotes] = useState(() => localStorage.getItem('dimsum_order_notes') || '');
  const [tempNotes, setTempNotes] = useState('');
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [isNotesModalClosing, setIsNotesModalClosing] = useState(false);

  const openNotesModal = () => {
    setTempNotes(orderNotes);
    setIsNotesModalOpen(true);
  };

  const closeNotesModal = () => {
    setIsNotesModalClosing(true);
    setTimeout(() => {
      setIsNotesModalOpen(false);
      setIsNotesModalClosing(false);
    }, 280);
  };

  const saveNotes = () => {
    const trimmed = tempNotes.trim();
    setOrderNotes(trimmed);
    localStorage.setItem('dimsum_order_notes', trimmed);
    closeNotesModal();
  };

  // Customer Auth & Coins State
  const [isLoggedIn, setIsLoggedIn] = useState(() => isCustomerLoggedIn());
  const [customerUser, setCustomerUser] = useState(() => getCustomerUser());
  useEffect(() => {
    const unsub = subscribeCustomerAuth(() => {
      setIsLoggedIn(isCustomerLoggedIn());
      setCustomerUser(getCustomerUser());
    });
    return unsub;
  }, []);

  // Order Type & Delivery States
  const [orderType, setOrderType] = useState(() => {
    return localStorage.getItem('dimsum_order_type') || 'pickup';
  });
  const [deliveryAddress, setDeliveryAddress] = useState(() => {
    return localStorage.getItem('dimsum_delivery_address') || '';
  });
  const [deliveryNotes, setDeliveryNotes] = useState(() => {
    return localStorage.getItem('dimsum_delivery_notes') || '';
  });
  const [deliveryLabel, setDeliveryLabel] = useState(() => {
    return localStorage.getItem('dimsum_delivery_label') || 'Rumah';
  });
  const [deliveryCoords, setDeliveryCoords] = useState(() => {
    try {
      const saved = localStorage.getItem('dimsum_delivery_coords');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isDeliveryAuthModalOpen, setIsDeliveryAuthModalOpen] = useState(false);
  const [deliveryToast, setDeliveryToast] = useState('');

  const deliveryDistanceKm = deliveryCoords
    ? calculateHaversineDistance(
      OUTLET_COORDS.latitude,
      OUTLET_COORDS.longitude,
      deliveryCoords.latitude,
      deliveryCoords.longitude
    )
    : null;

  // Refresh delivery info on navigation
  useEffect(() => {
    setDeliveryAddress(localStorage.getItem('dimsum_delivery_address') || '');
    setDeliveryNotes(localStorage.getItem('dimsum_delivery_notes') || '');
    setDeliveryLabel(localStorage.getItem('dimsum_delivery_label') || 'Rumah');
    try {
      const saved = localStorage.getItem('dimsum_delivery_coords');
      if (saved) setDeliveryCoords(JSON.parse(saved));
    } catch { }
  }, [location.key]);

  const showDeliveryToast = (msg) => {
    setDeliveryToast(msg);
    setTimeout(() => setDeliveryToast(''), 3000);
  };

  const handleSelectOrderType = (type) => {
    if (type === 'delivery') {
      if (!isCustomerLoggedIn()) {
        setIsDeliveryAuthModalOpen(true);
        return;
      }
      setOrderType('delivery');
      localStorage.setItem('dimsum_order_type', 'delivery');
      if (!deliveryAddress) {
        navigate('/address/new', { state: { returnTo: '/checkout' } });
      }
    } else {
      setOrderType('pickup');
      localStorage.setItem('dimsum_order_type', 'pickup');
    }
  };

  const handleNavigateToAddressNew = () => {
    navigate('/address/new', { state: { returnTo: '/checkout' } });
  };

  const handleLocationSavedFromCheckout = (locationData) => {
    setDeliveryAddress(locationData.full_address);
    setDeliveryNotes(locationData.notes);
    setDeliveryLabel(locationData.label);
    setDeliveryCoords({
      latitude: locationData.latitude,
      longitude: locationData.longitude
    });
  };

  const handleAddressChange = (e) => {
    setDeliveryAddress(e.target.value);
    localStorage.setItem('dimsum_delivery_address', e.target.value);
  };

  const handleDeliveryNotesChange = (e) => {
    setDeliveryNotes(e.target.value);
    localStorage.setItem('dimsum_delivery_notes', e.target.value);
  };

  const deleteNotes = () => {
    setOrderNotes('');
    setTempNotes('');
    localStorage.removeItem('dimsum_order_notes');
    closeNotesModal();
  };

  // Lock background scroll when any modal or bottom sheet is open
  useEffect(() => {
    if (isTimeModalOpen || isNotesModalOpen || isLocationModalOpen) {
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
  }, [isTimeModalOpen, isNotesModalOpen, isLocationModalOpen]);

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

  const [selectedTime, setSelectedTime] = useState(() => {
    const times = getAvailableTimes(availableDates[0]);
    return times.length > 0 ? times[0] : '';
  });

  const [confirmedTime, setConfirmedTime] = useState(() => {
    return location.state?.confirmedTime || getValidPickupTime() || 'Pilih Waktu Pickup';
  });

  const openTimeModal = () => {
    if (confirmedTime && confirmedTime !== 'Pilih Waktu Pickup') {
      const parts = confirmedTime.split(',').map(s => s.trim());
      const cDate = parts[0];
      const cTime = parts[1];
      if (cDate && availableDates.includes(cDate)) {
        setSelectedDate(cDate);
        const times = getAvailableTimes(cDate);
        if (times.includes(cTime)) {
          setSelectedTime(cTime);
        } else if (times.length > 0) {
          setSelectedTime(times[0]);
        } else {
          setSelectedTime('');
        }
        setIsTimeModalOpen(true);
        return;
      }
    }

    const curTimes = getAvailableTimes(selectedDate);
    if (curTimes.length > 0) {
      if (!curTimes.includes(selectedTime)) {
        setSelectedTime(curTimes[0]);
      }
    } else {
      setSelectedTime('');
    }
    setIsTimeModalOpen(true);
  };

  // Auto-reset if time expires while on checkout page
  useEffect(() => {
    const checkExpiry = () => {
      const valid = getValidPickupTime();
      if (!valid && confirmedTime !== 'Pilih Waktu Pickup') {
        setConfirmedTime('Pilih Waktu Pickup');
      }
    };

    const timer = setInterval(checkExpiry, 5000);
    return () => clearInterval(timer);
  }, [confirmedTime]);

  const [items, setItems] = useState(() => {
    // Cross-validate with active cart in localStorage (dimsum_cart)
    let hasActiveCartItems = false;
    try {
      const rawCart = localStorage.getItem('dimsum_cart');
      const cartObj = rawCart ? JSON.parse(rawCart) : {};
      const totalCartQty = Object.values(cartObj).reduce((sum, q) => sum + (Number(q) || 0), 0);
      hasActiveCartItems = totalCartQty > 0;
    } catch {
      hasActiveCartItems = false;
    }

    if (cartItems && cartItems.length > 0 && hasActiveCartItems) {
      return cartItems;
    }

    // Cross-validation: If active cart is empty, purge stale checkout snapshot
    if (!hasActiveCartItems) {
      localStorage.removeItem('dimsum_checkout_items');
      return [];
    }

    const savedItems = localStorage.getItem('dimsum_checkout_items');
    return savedItems ? JSON.parse(savedItems) : [];
  });

  // Security Route Guard: Prevent direct URL access when cart is empty
  useEffect(() => {
    const savedPending = localStorage.getItem('dimsum_pending_order');
    let hasActiveCart = false;
    try {
      const rawCart = localStorage.getItem('dimsum_cart');
      const cartObj = rawCart ? JSON.parse(rawCart) : {};
      hasActiveCart = Object.values(cartObj).reduce((sum, q) => sum + (Number(q) || 0), 0) > 0;
    } catch {
      hasActiveCart = false;
    }

    if (!savedPending && (!hasActiveCart || !items || items.length === 0)) {
      localStorage.removeItem('dimsum_checkout_items');
      navigate('/menu', {
        replace: true,
        state: { emptyCartNotice: 'Keranjang belanja Anda masih kosong. Silakan pilih menu terlebih dahulu.' }
      });
    }
  }, [items, navigate]);

  // Sync latest product prices and discount status from backend on mount
  useEffect(() => {
    api.get('/api/products')
      .then(res => {
        if (res.success && Array.isArray(res.data)) {
          setItems(prevItems => {
            return prevItems.map(item => {
              const latest = res.data.find(p => p.id === item.id);
              if (latest) {
                const hasDiscount = Boolean(latest.is_discount && latest.discount_percent > 0);
                const activePrice = Number(latest.price);
                const originalPrice = latest.original_price ? Number(latest.original_price) : activePrice;
                return {
                  ...item,
                  ...latest,
                  hasDiscount,
                  price: activePrice,
                  originalPrice,
                  discountPercent: latest.discount_percent || 0
                };
              }
              return item;
            });
          });
        }
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem('dimsum_checkout_items', JSON.stringify(items));
    }
  }, [items]);

  // Voucher state & calculation
  const [appliedVoucher, setAppliedVoucher] = useState(() => {
    try {
      const saved = localStorage.getItem('dimsum_applied_voucher');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Re-sync voucher when location changes or window regains focus (e.g. after returning from /vouchers)
  useEffect(() => {
    const syncVoucher = () => {
      try {
        const saved = localStorage.getItem('dimsum_applied_voucher');
        setAppliedVoucher(saved ? JSON.parse(saved) : null);
      } catch {
        setAppliedVoucher(null);
      }
    };
    syncVoucher();
    window.addEventListener('focus', syncVoucher);
    return () => window.removeEventListener('focus', syncVoucher);
  }, [location]);

  // Price calculations: original subtotal, product discount savings, subtotal menu, voucher discount, final total
  const subtotalOriginal = items.reduce((sum, item) => {
    const origUnitPrice = Number(item.originalPrice || item.original_price || item.price);
    return sum + (origUnitPrice * item.quantity);
  }, 0);

  const subtotalMenu = items.reduce((sum, item) => {
    return sum + (Number(item.price) * item.quantity);
  }, 0);

  // Auto-resync voucher if discount was zero or missing discount_value metadata
  useEffect(() => {
    if (appliedVoucher && appliedVoucher.code && subtotalMenu > 0 && (!appliedVoucher.discount_value || Number(appliedVoucher.discount) === 0)) {
      api.post('/api/vouchers/validate', { code: appliedVoucher.code, subtotal: subtotalMenu })
        .then(res => {
          if (res.success && res.data) {
            const updated = {
              code: res.data.code,
              discount: res.data.discount,
              min_spend: res.data.min_spend,
              discount_type: res.data.discount_type,
              discount_value: res.data.discount_value,
              max_discount: res.data.max_discount
            };
            setAppliedVoucher(updated);
            localStorage.setItem('dimsum_applied_voucher', JSON.stringify(updated));
          }
        })
        .catch(() => { });
    }
  }, [appliedVoucher?.code, subtotalMenu]);

  const totalMenuDiscount = Math.max(0, subtotalOriginal - subtotalMenu);

  const voucherDiscount = React.useMemo(() => {
    if (!appliedVoucher) return 0;
    if (appliedVoucher.discount_type === 'percent') {
      const pct = Number(appliedVoucher.discount_value || 0);
      let disc = (pct / 100) * subtotalMenu;
      if (appliedVoucher.max_discount !== null && appliedVoucher.max_discount !== undefined) {
        disc = Math.min(disc, Number(appliedVoucher.max_discount));
      }
      return Math.round(Math.min(disc, subtotalMenu));
    }
    return Math.round(Math.min(Number(appliedVoucher.discount || appliedVoucher.discount_value || 0), subtotalMenu));
  }, [appliedVoucher, subtotalMenu]);

  const otherFees = 0;
  const deliveryFee = orderType === 'delivery' ? 10000 : 0;
  const finalTotal = Math.max(0, subtotalMenu - voucherDiscount + otherFees + deliveryFee);
  const totalSavings = totalMenuDiscount + voucherDiscount;
  const currentTotalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const updateItemQty = (id, change) => {
    setItems(prev => {
      const updated = prev.map(item => {
        if (item.id === id) {
          return { ...item, quantity: Math.max(1, item.quantity + change) };
        }
        return item;
      });
      // Check order limit
      if (orderLimit) {
        const newTotal = updated.reduce((sum, item) => sum + item.quantity, 0);
        if (newTotal > orderLimit) return prev; // Block the change
      }
      return updated;
    });
  };

  const isOverLimit = orderLimit && currentTotalItems > orderLimit;
  const isNearLimit = orderLimit && currentTotalItems >= Math.floor(orderLimit * 0.9) && !isOverLimit;

  // Fallback while redirecting if directly accessed with empty cart
  const savedPending = localStorage.getItem('dimsum_pending_order');
  if (!savedPending && (!items || items.length === 0)) {
    return (
      <div className="max-w-[480px] mx-auto min-h-screen bg-[#F5F1EB] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
          <p className="font-body font-bold text-[14px] text-text-secondary">Memeriksa keranjang belanja...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[480px] mx-auto min-h-screen relative shadow-2xl overflow-x-clip bg-[#F5F1EB] flex flex-col">
      {/* 1. Sticky Navbar & Progress Bar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft size={24} className="text-text-primary" />
          </button>
          <h1 className="font-body font-black text-[18px] text-text-primary">
            Pesanan
          </h1>
          <div className="w-8"></div> {/* Spacer for centering */}
        </div>

        {/* Progress Bar (half filled with ease animation, retracting if returning from checkout/payment) */}
        <div className="w-full bg-gray-200 h-1 overflow-hidden">
          <div className={`bg-brand-gold h-full ${isReturningFromPayment ? 'animate-bar-retract-half' : 'animate-bar-fill-half'}`}></div>
        </div>
      </header>

      {/* 2. Scrollable Content */}
      <div className="flex-1 pb-32">

        {/* Order Fulfillment (Pickup vs Delivery) Card */}
        <div className="mx-4 mt-3 mb-3 bg-white rounded-[16px] p-4 border border-gray-100/90 shadow-xs flex flex-col gap-3">
          {/* Header & Segmented Switcher */}
          <div className="flex flex-col gap-2.5 pb-2.5 border-b border-gray-100/70">
            <div className="flex items-center justify-between">
              <span className="font-body text-[13px] text-text-secondary font-medium">Tipe Pesanan</span>
            </div>

            {/* Segmented Control: Pick Up vs Delivery */}
            <div className="bg-gray-100/80 p-1 rounded-[12px] flex gap-1">
              <button
                type="button"
                onClick={() => handleSelectOrderType('pickup')}
                className={`flex-1 py-2 rounded-[9px] font-body font-bold text-[12px] transition-all flex items-center justify-center gap-1.5 cursor-pointer ${orderType === 'pickup'
                  ? 'bg-white text-text-primary shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
                  }`}
              >
                <ShoppingBag size={14} className={orderType === 'pickup' ? 'text-brand-blue' : ''} />
                <span>Pick Up Outlet</span>
              </button>
              <button
                type="button"
                disabled={true}
                className="flex-1 py-2 rounded-[9px] font-body font-medium text-[12px] transition-all flex items-center justify-center gap-1.5 cursor-not-allowed bg-gray-200/70 text-text-secondary/60 shadow-none relative select-none"
                title="Layanan Pesan Antar (Delivery) Segera Hadir"
              >
                <Truck size={14} className="text-text-secondary/60 shrink-0" />
                <span>Delivery Order</span>
                <span className="absolute -top-2 -right-1 bg-brand-gold text-white text-[8.5px] font-bold px-1.5 py-0.5 rounded-full shadow-xs leading-none tracking-tight">
                  Segera
                </span>
              </button>
            </div>
          </div>

          {/* If Pick Up: show pickup time selector */}
          {orderType === 'pickup' ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue shrink-0">
                  <ShoppingBag size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="font-body text-[11px] text-text-secondary font-medium">Waktu Pengambilan</span>
                  <span className="font-body font-bold text-[14px] text-text-primary leading-tight">
                    {confirmedTime !== 'Pilih Waktu Pickup' ? confirmedTime : 'Ambil Sekarang'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={openTimeModal}
                className="border border-brand-gold/40 text-brand-gold rounded-[8px] px-3 py-1.5 font-body font-semibold text-[12px] hover:bg-brand-gold hover:text-white transition-colors cursor-pointer"
              >
                Pilih Waktu
              </button>
            </div>
          ) : (
            /* If Delivery: Shopee/Gojek-style interactive address & pinpoint card */
            <div className="flex flex-col gap-3 animate-fade-in">
              {/* Address Card with Pinpoint Status */}
              <div
                onClick={handleNavigateToAddressNew}
                className="w-full p-3.5 rounded-[14px] bg-gray-50/90 hover:bg-gray-100/90 border border-gray-200/70 flex flex-col gap-2.5 text-left group active:scale-[0.99] transition-all cursor-pointer shadow-2xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-brand-gold/15 text-brand-gold-dark flex items-center justify-center shrink-0">
                      <MapPin size={15} />
                    </div>
                    <span className="font-body font-bold text-[13px] text-text-primary group-hover:text-brand-gold-dark flex items-center gap-1.5">
                      {deliveryLabel || 'Alamat Pengiriman'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-brand-gold hover:text-brand-gold-dark font-body font-bold text-[12px]">
                    <span>{deliveryAddress ? 'Ubah Titik' : '+ Pilih Titik'}</span>
                    <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>

                {deliveryAddress ? (
                  <div className="flex flex-col gap-1.5">
                    <p className="font-body text-[12px] text-text-primary leading-relaxed">
                      {deliveryAddress}
                    </p>
                    {deliveryNotes && (
                      <div className="bg-amber-50/70 border border-amber-200/60 rounded-[8px] px-2.5 py-1 text-[11px] font-body text-amber-900 flex items-start gap-1.5">
                        <span className="font-bold shrink-0">Patokan:</span>
                        <span className="line-clamp-2">{deliveryNotes}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50/70 border border-dashed border-amber-300 rounded-[10px] text-center">
                    <p className="font-body font-medium text-[12px] text-amber-900">
                      📍 Belum ada alamat delivery terpilih.
                    </p>
                    <span className="font-body font-bold text-[12px] text-brand-gold underline mt-1 inline-block">
                      Ketuk di sini untuk pasang pin di peta
                    </span>
                  </div>
                )}

                {/* Distance & GPS Pinpoint Indicator */}
                {deliveryCoords ? (
                  <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between text-[11px] font-body">
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Titik GPS Terpasang
                    </span>
                    {deliveryDistanceKm !== null && (
                      <span className="text-text-secondary font-medium">
                        Jarak ~{deliveryDistanceKm} km dari outlet
                      </span>
                    )}
                  </div>
                ) : (
                  deliveryAddress && (
                    <div className="pt-1.5 border-t border-gray-200/60 flex items-center gap-1 text-[11px] font-body text-amber-700">
                      <AlertCircle size={12} />
                      <span>Pin peta belum ditentukan. Ketuk untuk presisi pengantaran.</span>
                    </div>
                  )
                )}
              </div>

              {/* Delivery ETA & Shipping Fee Card */}
              <div className="bg-blue-50/70 border border-blue-100 rounded-[12px] px-3.5 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-brand-blue/15 text-brand-blue flex items-center justify-center shrink-0">
                    <Truck size={15} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-body text-[11px] text-text-secondary">Estimasi Pengantaran</span>
                    <span className="font-body font-bold text-[12px] text-brand-blue">
                      30 - 45 Menit (Kurir Express)
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-body text-[10px] text-text-secondary block">Ongkir Flat</span>
                  <span className="font-body font-bold text-[13px] text-text-primary">
                    Rp{deliveryFee.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Ordered Items */}
        <div className="mx-4 mb-3 bg-white rounded-[16px] p-4.5 border border-gray-100/90 shadow-xs">
          {/* Header row */}
          <div className="flex justify-between items-center pb-3 mb-3 border-b border-gray-100/80">
            <h2 className="font-body font-bold text-[15px] text-text-primary">
              Menu Dipesan
            </h2>
            <button
              type="button"
              onClick={() => navigate('/menu')}
              className="border border-brand-gold/40 text-brand-gold rounded-[8px] px-3 py-1 font-body font-semibold text-[12px] hover:bg-brand-gold hover:text-white transition-colors cursor-pointer"
            >
              + Tambah Menu
            </button>
          </div>

          {items.map((item, index) => {
            const origUnitPrice = Number(item.originalPrice || item.original_price || item.price);
            const saleUnitPrice = Number(item.price);
            const itemHasDiscount = Boolean(item.hasDiscount || (item.is_discount && item.discount_percent > 0) || origUnitPrice > saleUnitPrice);
            const itemDiscountPercent = item.discountPercent || item.discount_percent || (origUnitPrice > saleUnitPrice ? Math.round(((origUnitPrice - saleUnitPrice) / origUnitPrice) * 100) : 0);
            const itemOrigTotal = origUnitPrice * item.quantity;
            const itemSaleTotal = saleUnitPrice * item.quantity;

            return (
              <div
                key={item.id}
                className={`flex flex-col py-3.5 ${index !== items.length - 1 ? 'border-b border-gray-100/70' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-body font-semibold text-[14px] text-text-primary leading-tight">
                    {item.name}
                  </h3>
                </div>

                {/* Promo Badge: Clean single badge in brand red */}
                {itemHasDiscount && (
                  <div className="mt-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-red/10 text-brand-red border border-brand-red/20 leading-tight">
                      <Flame size={10} className="fill-brand-red text-brand-red shrink-0" />
                      <span>PROMO {itemDiscountPercent}%</span>
                    </span>
                  </div>
                )}

                <div className="flex flex-col gap-0.5 mt-1 text-text-secondary">
                  <span className="font-body text-[12px]">{item.quantity}x MIX (Semua Varian)</span>
                </div>

                <div className="flex justify-between items-end mt-2.5">
                  <div className="flex flex-col">
                    {itemHasDiscount && (
                      <span className="font-body text-[11.5px] text-gray-400 line-through leading-tight">
                        Rp{itemOrigTotal.toLocaleString('id-ID')}
                      </span>
                    )}
                    <span className="font-body font-bold text-[15px] text-brand-gold leading-tight mt-0.5">
                      Rp{itemSaleTotal.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => updateItemQty(item.id, -1)}
                      className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-text-primary hover:border-text-primary hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <Minus size={13} strokeWidth={2.5} />
                    </button>
                    <span className="font-body font-bold text-[14px] min-w-[20px] text-center text-text-primary">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateItemQty(item.id, 1)}
                      className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-text-primary hover:border-text-primary hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <Plus size={13} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add Notes: Minimalist secondary action */}
          <div className="mt-2 pt-3 border-t border-gray-100/70">
            {!orderNotes ? (
              <button
                type="button"
                onClick={openNotesModal}
                className="inline-flex items-center gap-2 text-text-secondary hover:text-brand-gold transition-colors py-1 cursor-pointer font-body text-[13px] font-medium"
              >
                <PenLine size={14} className="text-text-secondary" />
                <span>Tambah Catatan Pesanan</span>
              </button>
            ) : (
              <div
                onClick={openNotesModal}
                className="w-full flex items-start justify-between p-3 rounded-[12px] bg-amber-50/40 border border-brand-gold/25 cursor-pointer hover:bg-amber-50/70 transition-colors"
              >
                <div className="flex flex-col gap-0.5 pr-2">
                  <span className="font-body font-semibold text-[11px] text-text-secondary uppercase tracking-wider">Catatan Pesanan:</span>
                  <p className="font-body text-[13px] text-text-primary italic leading-snug break-words">
                    "{orderNotes}"
                  </p>
                </div>
                <span className="font-body font-semibold text-[12px] text-brand-gold shrink-0 hover:underline">Ubah</span>
              </div>
            )}
          </div>
        </div>

        {/* Promo / Voucher Trigger Section */}
        <div className="mx-4 mb-3 bg-white rounded-[16px] p-4 border border-gray-100/90 shadow-xs">
          <div
            onClick={() => {
              navigate('/vouchers', {
                state: {
                  ...location.state,
                  confirmedTime,
                  cartItems: items,
                  totalPrice: subtotalMenu,
                  orderNotes
                }
              });
            }}
            className="flex justify-between items-center cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold shrink-0">
                <Ticket size={16} />
              </div>
              {appliedVoucher ? (
                <div className="flex flex-col min-w-0">
                  <span className="font-body text-[11px] text-text-secondary font-medium">Voucher Digunakan</span>
                  <span className="font-body font-bold text-[14px] text-text-primary truncate">
                    {appliedVoucher.code}
                  </span>
                </div>
              ) : (
                <span className="font-body font-semibold text-[14px] text-text-primary group-hover:text-brand-gold transition-colors">
                  Gunakan Voucher Promo
                </span>
              )}
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              {appliedVoucher && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-brand-gold/15 text-brand-gold border border-brand-gold/30 font-body font-bold text-[12px]">
                  -Rp{voucherDiscount.toLocaleString('id-ID')}
                </span>
              )}
              <ChevronRight size={18} className="text-text-secondary group-hover:text-brand-gold transition-colors" />
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="mx-4 mb-4 bg-white rounded-[16px] p-5 border border-gray-100/90 shadow-xs">
          <h2 className="font-body font-bold text-[15px] text-text-primary mb-4">Rincian Pembayaran</h2>

          <div className="flex flex-col divide-y divide-gray-50">
            {/* Subtotal Normal */}
            <div className="flex justify-between items-center py-2.5">
              <span className="font-body text-[13px] text-text-secondary">
                Subtotal <span className="text-[12px]">({currentTotalItems} item)</span>
              </span>
              <span className="font-body font-semibold text-[13px] text-text-primary">
                Rp{subtotalOriginal.toLocaleString('id-ID')}
              </span>
            </div>

            {/* Diskon Menu Promo */}
            {totalMenuDiscount > 0 && (
              <div className="flex justify-between items-center py-2.5">
                <div className="flex items-center gap-1.5 text-brand-red">
                  <span className="font-body text-[13px] text-text-secondary">Diskon Menu Promo</span>
                </div>
                <span className="font-body font-semibold text-[13px] text-brand-red">
                  -Rp{totalMenuDiscount.toLocaleString('id-ID')}
                </span>
              </div>
            )}

            {/* Diskon Voucher */}
            {voucherDiscount > 0 && (
              <div className="flex justify-between items-center py-2.5">
                <div className="flex items-center gap-1.5 text-brand-gold">
                  <span className="font-body text-[13px] text-text-secondary">
                    Diskon Voucher ({appliedVoucher?.code})
                  </span>
                </div>
                <span className="font-body font-semibold text-[13px] text-brand-gold">
                  -Rp{voucherDiscount.toLocaleString('id-ID')}
                </span>
              </div>
            )}

            {/* Ongkos Kirim Delivery */}
            {orderType === 'delivery' && (
              <div className="flex justify-between items-center py-2.5">
                <div className="flex items-center gap-1.5 text-brand-blue">
                  <Truck size={14} className="text-brand-blue" />
                  <span className="font-body text-[13px] font-medium">Ongkos Kirim (Delivery)</span>
                </div>
                <span className="font-body font-semibold text-[13px] text-text-primary">
                  Rp{deliveryFee.toLocaleString('id-ID')}
                </span>
              </div>
            )}

            {/* Biaya Lainnya */}
            <div className="flex justify-between items-center py-2.5">
              <div className="flex items-center gap-1">
                <span className="font-body text-[13px] text-text-secondary">Biaya Penanganan</span>
                <ChevronDown size={13} className="text-text-secondary" />
              </div>
              <span className="font-body font-semibold text-[13px] text-text-primary">
                Rp{otherFees.toLocaleString('id-ID')}
              </span>
            </div>

            {/* Total Pembayaran */}
            <div className="flex justify-between items-center pt-3.5 mt-0.5 border-t border-gray-100">
              <span className="font-body font-bold text-[14px] text-text-primary">Total</span>
              <span className="font-body font-bold text-[16px] text-brand-gold">
                Rp{finalTotal.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white/95 backdrop-blur-md border-t border-[#EAEAEA] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] z-[100]">
        <div className="px-5 py-3.5 flex justify-between items-center">
          <div className="flex flex-col justify-center">
            <span className="font-body font-medium text-[11px] text-text-secondary uppercase tracking-wider leading-tight">
              Total Pembayaran
            </span>
            <span className="font-body font-black text-[20px] text-brand-gold leading-tight mt-0.5">
              Rp{finalTotal.toLocaleString('id-ID')}
            </span>
            {totalSavings > 0 && (
              <div className="flex items-center gap-1 leading-tight mt-0.5">
                <span className="font-body font-medium text-[11px] text-text-secondary">
                  Hemat
                </span>
                <span className="font-body font-bold text-[11px] text-brand-gold">
                  Rp{totalSavings.toLocaleString('id-ID')}
                </span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              if (isOverLimit) return;
              if (orderType === 'pickup') {
                if (!confirmedTime || confirmedTime === 'Pilih Waktu Pickup' || !getValidPickupTime()) {
                  setIsTimeModalOpen(true);
                  return;
                }
              } else if (orderType === 'delivery') {
                if (!deliveryAddress || deliveryAddress.trim().length < 5) {
                  showDeliveryToast('Mohon masukkan alamat pengiriman lengkap (minimal 5 karakter).');
                  return;
                }
              }
              sessionStorage.removeItem('dimsum_promo_return_method');
              localStorage.removeItem('dimsum_payment_method');
              window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
              navigate('/payment', {
                state: {
                  confirmedTime: orderType === 'delivery' ? 'Delivery (30-45 mnt)' : confirmedTime,
                  cartItems: items,
                  totalPrice: subtotalMenu,
                  finalTotal: finalTotal,
                  orderNotes: orderNotes,
                  orderType: orderType,
                  deliveryAddress: orderType === 'delivery' ? deliveryAddress.trim() : null,
                  deliveryNotes: orderType === 'delivery' ? deliveryNotes.trim() : null,
                  deliveryCoords: orderType === 'delivery' ? deliveryCoords : null,
                  deliveryFee: deliveryFee
                }
              });
            }}
            disabled={isOverLimit}
            className={`h-[48px] font-body font-bold text-[14px] px-7 rounded-[12px] shadow-elevated transition-transform active:scale-95 cursor-pointer ${isOverLimit
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-brand-gold hover:bg-brand-gold-dark text-white'
              }`}
          >
            Lanjut ke Pembayaran
          </button>
        </div>
      </div>

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
              <div className="w-1/2 overflow-y-auto hide-scrollbar pt-2 pb-10 border-r border-gray-100">
                {availableDates.map(date => (
                  <div
                    key={date}
                    onClick={() => {
                      setSelectedDate(date);
                      const newTimes = getAvailableTimes(date);
                      if (newTimes.length > 0) {
                        setSelectedTime(newTimes.includes(selectedTime) ? selectedTime : newTimes[0]);
                      } else {
                        setSelectedTime('');
                      }
                    }}
                    className={`px-4 py-3.5 cursor-pointer font-body font-bold text-[14px] transition-colors border-y ${selectedDate === date ? 'text-text-primary bg-gray-50/50 border-gray-100' : 'text-[#D1D5DB] border-transparent'}`}
                  >
                    {date}
                  </div>
                ))}
              </div>

              {/* Right Column: Times */}
              <div className="w-1/2 overflow-y-auto hide-scrollbar pt-2 pb-10 flex flex-col">
                {availableTimes.length > 0 ? (
                  <div className="flex flex-col">
                    {availableTimes.map(time => (
                      <div
                        key={`${selectedDate}-${time}`}
                        onClick={() => setSelectedTime(time)}
                        className={`px-4 py-3.5 text-center cursor-pointer font-body font-bold text-[14px] transition-colors border-y ${selectedTime === time ? 'text-text-primary bg-gray-50/50 border-gray-100' : 'text-[#D1D5DB] border-transparent'}`}
                      >
                        {time}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center px-3 py-4 text-center select-none my-auto">
                    {/* Enlarged Icon without background container, animated nengok kanan kiri */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="54"
                      height="54"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-brand-blue mb-3 overflow-visible select-none drop-shadow-xs"
                    >
                      {/* Head Circle - subtle parallax shift */}
                      <circle cx="12" cy="12" r="10" className="animate-head-turn" />

                      {/* Facial features - nengok kanan kiri */}
                      <g className="animate-face-look">
                        {/* Eyes with Blinking */}
                        <g className="animate-eye-blink" style={{ transformOrigin: '12px 9.5px' }}>
                          <path d="M9 10V9" />
                          <path d="M15 10V9" />
                        </g>

                        {/* Mouth turning into cemberut / frown */}
                        <path
                          d="M9 16a5 5 0 0 1 6 0"
                          className="animate-mouth-frown"
                          style={{ transformOrigin: '12px 16px' }}
                        />
                      </g>
                    </svg>

                    <p className="font-body font-bold text-[12.5px] text-brand-blue leading-tight px-1 max-w-[160px]">
                      Yah, sudah diluar jam operasional
                    </p>
                    <span className="font-body font-medium text-[10.5px] text-text-secondary mt-1.5 leading-snug px-1">
                      Pilih tanggal lain ya
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Save Button */}
            <div className="p-4 border-t border-gray-100">
              <button
                disabled={!selectedTime || availableTimes.length === 0}
                onClick={() => {
                  if (!selectedTime || availableTimes.length === 0) return;
                  const label = savePickupTime(selectedDate, selectedTime, availableDates);
                  if (label) {
                    setConfirmedTime(label);
                    closeTimeModal();
                  }
                }}
                className={`w-full font-body font-black text-[15px] py-3.5 rounded-[16px] transition-all ${!selectedTime || availableTimes.length === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                  : 'bg-brand-gold text-white shadow-elevated active:scale-95 cursor-pointer'
                  }`}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Add Notes Bottom Sheet Modal */}
      {isNotesModalOpen && (
        <div className="fixed inset-0 z-[130] flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className={`absolute inset-0 bg-black/40 touch-none overscroll-contain ${isNotesModalClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
            onClick={closeNotesModal}
          ></div>

          {/* Bottom Sheet */}
          <div className={`relative bg-white w-full max-w-[480px] mx-auto rounded-t-[24px] shadow-2xl flex flex-col overscroll-contain ${isNotesModalClosing ? 'animate-slide-down' : 'animate-slide-up'}`}>
            {/* Header */}
            <div className="p-5 flex justify-between items-center border-b border-gray-100">
              <div className="flex items-center gap-2">
                <h2 className="font-body font-black text-[16px] text-text-primary">Catatan Pesanan</h2>
              </div>
              <button
                type="button"
                onClick={closeNotesModal}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-text-primary hover:bg-gray-200 transition-colors"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col gap-3">
              <div className="relative">
                <textarea
                  value={tempNotes}
                  onChange={e => setTempNotes(e.target.value.slice(0, 150))}
                  maxLength={150}
                  rows={4}
                  placeholder="Contoh: Saus cabai dipisah ya min, jangan terlalu pedas..."
                  className="w-full border border-gray-200 rounded-[14px] p-3.5 font-body text-[14px] text-text-primary resize-none focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-colors"
                />
                <div className="flex justify-end mt-1">
                  <span className={`font-body text-[12px] font-medium ${tempNotes.length >= 140 ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                    {tempNotes.length}/150
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-5 pt-0 border-t border-gray-100 mt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={saveNotes}
                className="w-full bg-brand-gold text-white font-body font-black text-[15px] py-3.5 rounded-[12px] shadow-elevated transition-transform active:scale-95 mt-3"
              >
                Simpan Catatan
              </button>
              {orderNotes && (
                <button
                  type="button"
                  onClick={deleteNotes}
                  className="w-full py-2.5 text-red-500 font-body font-bold text-[13px] hover:bg-red-50 rounded-[10px] transition-colors"
                >
                  Hapus Catatan
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Delivery Toast */}
      {deliveryToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[250] w-[90%] max-w-[400px] animate-toast-in">
          <div className="bg-text-primary/95 backdrop-blur-xs text-white px-4 py-3 rounded-[16px] shadow-elevated flex items-center gap-3 border border-white/20">
            <Truck size={18} className="text-brand-gold shrink-0" />
            <span className="font-body font-medium text-[12px] leading-snug">
              {deliveryToast}
            </span>
          </div>
        </div>
      )}

      {/* Modal: Ajakan Login untuk Delivery Order & Bonus Koin */}
      {isDeliveryAuthModalOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs animate-fade-in"
            onClick={() => setIsDeliveryAuthModalOpen(false)}
          />
          <div className="relative bg-white w-full max-w-[380px] rounded-[24px] p-6 shadow-2xl flex flex-col items-center text-center z-10 animate-scale-up">
            <button
              onClick={() => setIsDeliveryAuthModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-text-primary transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center text-brand-gold mb-3 shadow-xs">
              <Truck size={28} />
            </div>

            <h3 className="font-heading font-black text-[18px] text-text-primary mb-1">
              Pesan Antar (Delivery)
            </h3>
            <p className="font-body text-[12px] text-text-secondary leading-relaxed mb-4">
              Layanan pesan antar khusus untuk pelanggan terdaftar demi kemudahan pelacakan pesanan Anda.
            </p>

            <div className="w-full bg-gradient-to-r from-amber-500/10 via-brand-gold/15 to-amber-500/10 border border-brand-gold/30 rounded-[14px] p-3 mb-5 flex items-center gap-2.5 text-left">
              <Coins size={22} className="text-amber-600 shrink-0" />
              <div>
                <span className="font-body font-bold text-[12px] text-amber-900 block leading-tight">
                  Bonus 1.000 Dimsum Coins!
                </span>
                <span className="font-body text-[11px] text-amber-800 leading-tight">
                  Daftar akun sekarang & nikmati kemudahan pesan antar.
                </span>
              </div>
            </div>

            <div className="w-full flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeliveryAuthModalOpen(false);
                  navigate('/auth?redirect=/checkout');
                }}
                className="w-full py-3 bg-brand-gold hover:bg-brand-gold/90 text-white font-body font-bold text-[13px] rounded-[12px] shadow-elevated transition-all active:scale-95 cursor-pointer"
              >
                Masuk / Buat Akun Baru
              </button>
              <button
                type="button"
                onClick={() => setIsDeliveryAuthModalOpen(false)}
                className="w-full py-2.5 text-text-secondary hover:text-text-primary font-body font-semibold text-[12px] transition-colors cursor-pointer"
              >
                Tetap Pick Up di Outlet (Guest)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
