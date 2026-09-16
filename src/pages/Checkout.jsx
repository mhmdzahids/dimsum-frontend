import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronRight,
  Minus,
  Plus,
  ConciergeBell,
  PenLine,
  SquarePen,
  CheckCircle2,
  StickyNote,
  Clock,
  ChevronDown,
  User,
  Phone,
  Mail,
  X
} from 'lucide-react';
import imgWortel from '../assets/icon/wortel.webp';

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const cartItems = location.state?.cartItems || [];

  // If there's an active pending order, redirect to payment
  useEffect(() => {
    const savedPending = localStorage.getItem('dimsum_pending_order');
    if (savedPending) {
      try {
        const parsed = JSON.parse(savedPending);
        if (parsed.orderId) {
          navigate('/payment', { state: { resumePending: true } });
        }
      } catch (e) {}
    }
  }, [navigate]);

  // Order Limit
  const [orderLimit, setOrderLimit] = useState(null);
  useEffect(() => {
    fetch('/api/settings/order-limit')
      .then(r => r.json())
      .then(data => {
        if (data.success) setOrderLimit(data.data.order_item_limit);
      })
      .catch(() => {});
  }, []);

  const generateDates = () => {
    const dates = ['Pick up Hari ini'];
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

  const deleteNotes = () => {
    setOrderNotes('');
    setTempNotes('');
    localStorage.removeItem('dimsum_order_notes');
    closeNotesModal();
  };

  // Lock background scroll when any modal or bottom sheet is open
  useEffect(() => {
    if (isTimeModalOpen || isNotesModalOpen) {
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
  }, [isTimeModalOpen, isNotesModalOpen]);

  const availableTimes = React.useMemo(() => {
    const times = [];
    const isToday = selectedDate === availableDates[0];
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    for (let h = 8; h <= 22; h++) {
      const hourStr = h.toString().padStart(2, '0');

      if (!isToday || (h > currentHour) || (h === currentHour && currentMinute <= 0)) {
        times.push(`${hourStr} : 00`);
      }

      if (h !== 22) {
        if (!isToday || (h > currentHour) || (h === currentHour && currentMinute <= 30)) {
          times.push(`${hourStr} : 30`);
        }
      }
    }
    return times;
  }, [selectedDate, availableDates]);

  const [selectedTime, setSelectedTime] = useState(availableTimes[0]);

  useEffect(() => {
    if (availableTimes.length > 0 && !availableTimes.includes(selectedTime)) {
      setSelectedTime(availableTimes[0]);
    }
  }, [availableTimes, selectedTime]);

  const [confirmedTime, setConfirmedTime] = useState(() => {
    return localStorage.getItem('dimsum_time') || location.state?.confirmedTime || 'Pilih Waktu Pickup';
  });

  useEffect(() => {
    if (confirmedTime && confirmedTime !== 'Pilih Waktu Pickup') {
      localStorage.setItem('dimsum_time', confirmedTime);
    }
  }, [confirmedTime]);

  const [items, setItems] = useState(() => {
    if (cartItems && cartItems.length > 0) {
      return cartItems;
    }
    const savedItems = localStorage.getItem('dimsum_checkout_items');
    return savedItems ? JSON.parse(savedItems) : [];
  });

  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem('dimsum_checkout_items', JSON.stringify(items));
    }
  }, [items]);

  const subtotal = items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
  const otherFees = 0;
  const total = subtotal + otherFees;
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

  // We can reuse the time modal logic here if they want to change it on this page too,
  // but for now we'll just display it as a static UI component based on the screenshot.
  // The screenshot shows a "Select Time" button.

  return (
    <div className="max-w-[480px] mx-auto min-h-screen relative shadow-2xl overflow-x-hidden bg-[#F8F9FA] flex flex-col">
      {/* 1. Header */}
      <div className="bg-white flex items-center justify-between p-4 sticky top-0 z-50 border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft size={24} className="text-text-primary" />
        </button>
        <h1 className="font-body font-black text-[18px] text-text-primary">
          Pesanan
        </h1>
        <div className="w-8"></div> {/* Spacer for centering */}
      </div>

      {/* Progress Bar (half filled) */}
      <div className="w-full bg-gray-200 h-1">
        <div className="bg-brand-gold w-1/2 h-full"></div>
      </div>

      {/* 2. Scrollable Content */}
      <div className="flex-1 overflow-y-auto hide-scrollbar pb-32">

        {/* Order Type Banner */}
        <div className="bg-white px-4 py-4 mb-2">
          <div className="border border-brand-gold rounded-[12px] p-3 flex justify-between items-center mb-3">
            <span className="font-body font-medium text-[14px] text-text-secondary">Tipe Pesanan</span>
            <div className="flex items-center gap-2">
              <span className="font-body font-bold text-[14px] text-text-primary">Pick Up</span>
              <CheckCircle2 size={18} className="text-brand-gold" />
            </div>
          </div>

          <div className="bg-white border border-gray-100 shadow-sm rounded-[12px] p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <ConciergeBell size={24} className="text-text-primary" />
              <span className="font-body font-bold text-[14px] text-text-primary">
                {confirmedTime !== 'Pilih Waktu Pickup' ? confirmedTime : 'Ambil Sekarang'}
              </span>
            </div>
            <button onClick={() => setIsTimeModalOpen(true)} className="border border-brand-gold rounded-[8px] px-4 py-1.5 text-brand-gold font-body font-bold text-[12px] hover:bg-brand-gold hover:text-white transition-colors">
              Pilih Waktu
            </button>
          </div>
        </div>

        {/* Ordered Items */}
        <div className="bg-white p-4 mb-2">
          {/* Header row with thin separator line underneath */}
          <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-100">
            <h2 className="font-body font-bold text-[16px] text-text-primary">Menu Dipesan ({currentTotalItems}){orderLimit && <span className="text-[12px] font-medium text-gray-400 ml-1">/ maks {orderLimit}</span>}</h2>
            <button onClick={() => navigate('/menu')} className="border border-brand-gold text-brand-gold rounded-[8px] px-4 py-1.5 font-body font-bold text-[12px] hover:bg-brand-gold hover:text-white transition-colors">
              + Tambah Menu
            </button>
          </div>

          {/* Order limit warnings */}
          {isNearLimit && (
            <div className="bg-amber-50 border border-amber-200 rounded-[10px] px-3 py-2 mb-3 flex items-center gap-2">
              <span className="text-amber-600 text-[12px] font-body font-medium">⚠️ Mendekati batas pembelian ({currentTotalItems}/{orderLimit} item)</span>
            </div>
          )}
          {isOverLimit && (
            <div className="bg-red-50 border border-red-200 rounded-[10px] px-3 py-2 mb-3 flex items-center gap-2">
              <span className="text-red-600 text-[12px] font-body font-bold">❌ Melebihi batas pembelian ({currentTotalItems}/{orderLimit} item). Kurangi jumlah item.</span>
            </div>
          )}

          {items.map(item => (
            <div key={item.id} className="flex flex-col border-b border-gray-100 pb-4 mb-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-body font-bold text-[14px] text-text-primary uppercase leading-tight">
                  {item.name}
                </h3>
              </div>

              <div className="flex flex-col gap-0.5 mb-3 text-[#6B7280]">
                <span className="font-body font-medium text-[13px]">{item.quantity}x MIX (Semua Varian)</span>
              </div>

              <div className="flex justify-between items-center mt-4">
                <span className="font-body font-bold text-[15px] text-[#6B7280]">
                  Rp{(Number(item.price) * item.quantity).toLocaleString('id-ID')}
                </span>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => updateItemQty(item.id, -1)}
                    className="w-6 h-6 rounded-full border border-text-primary flex items-center justify-center text-text-primary"
                  >
                    <Minus size={14} strokeWidth={2.5} />
                  </button>
                  <span className="font-body font-bold text-[14px] w-3 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateItemQty(item.id, 1)}
                    className="w-6 h-6 rounded-full border border-text-primary flex items-center justify-center text-text-primary"
                  >
                    <Plus size={14} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Add Notes Trigger */}
          <div className="mt-1">
            {!orderNotes ? (
              <button
                type="button"
                onClick={openNotesModal}
                className="w-full flex items-center gap-3 py-3 px-1 rounded-[12px] hover:bg-gray-50 active:bg-gray-100/70 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold shrink-0">
                  <SquarePen size={16} />
                </div>
                <span className="font-body font-medium text-[13px] text-[#6B7280] italic">Tambah Catatan</span>
              </button>
            ) : (
              <div
                onClick={openNotesModal}
                className="w-full flex flex-col p-3.5 rounded-[14px] border border-brand-gold/40 bg-brand-gold/5 cursor-pointer hover:bg-brand-gold/10 transition-colors"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 text-brand-gold">
                    <SquarePen size={14} />
                    <span className="font-body font-bold text-[13px]">Catatan Pesanan</span>
                  </div>
                  <span className="font-body font-bold text-[12px] text-brand-gold underline">Ubah</span>
                </div>
                <p className="font-body text-[13px] text-text-primary italic leading-relaxed break-words">
                  "{orderNotes}"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Details */}
        <div className="bg-white p-4 pb-8">
          <div className="border border-gray-100 shadow-sm rounded-[16px] p-5">
            <h2 className="font-body font-bold text-[15px] text-text-primary mb-5 text-center">Rincian Pembayaran</h2>

            <div className="flex justify-between items-center mb-4">
              <span className="font-body font-medium text-[14px] text-text-primary">Subtotal <span className="text-gray-400">({currentTotalItems} menu)</span></span>
              <span className="font-body font-bold text-[14px] text-text-primary">Rp{subtotal.toLocaleString('id-ID')}</span>
            </div>

            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-1 cursor-pointer">
                <span className="font-body font-medium text-[14px] text-text-primary">Biaya Lainnya</span>
                <ChevronDown size={14} className="text-text-primary" />
              </div>
              <span className="font-body font-bold text-[14px] text-text-primary">Rp{otherFees.toLocaleString('id-ID')}</span>
            </div>

            <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
              <span className="font-body font-bold text-[15px] text-text-primary">Total</span>
              <span className="font-body font-bold text-[15px] text-brand-gold">Rp{total.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white rounded-t-[24px] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-[100]">
        <div className="p-5 flex justify-between items-center">
          <div className="flex flex-col">
            <span className="font-body font-medium text-[13px] text-text-secondary">Total Pembayaran</span>
            <span className="font-body font-black text-[20px] text-text-primary mt-0.5">
              Rp{total.toLocaleString('id-ID')}
            </span>
          </div>
          <button
            onClick={() => {
              if (isOverLimit) return;
              sessionStorage.removeItem('dimsum_promo_return_method');
              localStorage.removeItem('dimsum_payment_method');
              navigate('/payment', { state: { confirmedTime: confirmedTime, cartItems: items, totalPrice: total, orderNotes: orderNotes } });
            }}
            disabled={isOverLimit}
            className={`h-[48px] font-body font-bold text-[14px] px-8 rounded-[12px] shadow-elevated transition-transform active:scale-95 ${
              isOverLimit
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-brand-gold text-white'
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
              <h2 className="font-body font-black text-[16px] text-text-primary">Pilih Waktu Pick Up</h2>
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
                    onClick={() => setSelectedDate(date)}
                    className={`px-5 py-3.5 cursor-pointer font-body font-bold text-[14px] transition-colors ${selectedDate === date ? 'text-text-primary' : 'text-[#D1D5DB]'}`}
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
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`px-5 py-3.5 text-center cursor-pointer font-body font-bold text-[14px] transition-colors ${selectedTime === time ? 'text-text-primary' : 'text-[#D1D5DB]'}`}
                    >
                      {time}
                    </div>
                  ))}
                </div>
              </div>

              {/* Selection Highlight Overlay (Optional for aesthetics) */}
              <div className="absolute top-[52px] left-0 right-0 h-[48px] border-y border-gray-100 pointer-events-none z-[-1] bg-gray-50/30"></div>
            </div>

            {/* Bottom Save Button */}
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setConfirmedTime(`${selectedDate}, ${selectedTime}`);
                  closeTimeModal();
                }}
                className="w-full bg-brand-gold text-white font-body font-black text-[15px] py-3.5 rounded-[12px] shadow-elevated"
              >
                Simpan
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

    </div>
  );
}
