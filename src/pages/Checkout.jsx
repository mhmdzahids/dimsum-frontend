import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  ChevronRight, 
  Minus,
  Plus,
  ConciergeBell,
  PenLine,
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

  const generateDates = () => {
    const dates = ['Pick up Hari ini'];
    for (let i = 1; i <= 6; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const options = { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' };
      dates.push(d.toLocaleDateString('en-GB', options).replace(/,/g, ''));
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
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(1, item.quantity + change) };
      }
      return item;
    }));
  };

  // We can reuse the time modal logic here if they want to change it on this page too,
  // but for now we'll just display it as a static UI component based on the screenshot.
  // The screenshot shows a "Select Time" button.
  
  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] relative">
      {/* 1. Header */}
      <div className="bg-white flex items-center justify-between p-4 sticky top-0 z-50 border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft size={24} className="text-text-primary" />
        </button>
        <h1 className="font-body font-black text-[18px] text-text-primary">
          Order
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
            <span className="font-body font-medium text-[14px] text-text-secondary">Order Type</span>
            <div className="flex items-center gap-2">
              <span className="font-body font-bold text-[14px] text-text-primary">Pick Up</span>
              <CheckCircle2 size={18} className="text-brand-gold" />
            </div>
          </div>

          <div className="bg-white border border-gray-100 shadow-sm rounded-[12px] p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <ConciergeBell size={24} className="text-text-primary" />
              <span className="font-body font-bold text-[14px] text-text-primary">
                {confirmedTime !== 'Pilih Waktu Pickup' ? confirmedTime : 'Pick Up Now'}
              </span>
            </div>
            <button onClick={() => setIsTimeModalOpen(true)} className="border border-brand-gold rounded-[8px] px-4 py-1.5 text-brand-gold font-body font-bold text-[12px] hover:bg-brand-gold hover:text-white transition-colors">
              Select Time
            </button>
          </div>
        </div>



        {/* Ordered Items */}
        <div className="bg-white p-4 mb-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-body font-bold text-[16px] text-text-primary">Ordered Items ({currentTotalItems})</h2>
            <button onClick={() => navigate('/menu')} className="border border-brand-gold text-brand-gold rounded-[8px] px-4 py-1.5 font-body font-bold text-[12px]">
              + Add Item
            </button>
          </div>

          {items.map(item => (
          <div key={item.id} className="flex flex-col border-b border-gray-100 pb-4 mb-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-body font-bold text-[14px] text-text-primary uppercase leading-tight w-[70%]">
                {item.name}
              </h3>
              <button className="flex items-center gap-1 border border-gray-200 rounded-[8px] px-3 py-1.5 text-text-primary hover:bg-gray-50">
                <PenLine size={12} />
                <span className="font-body font-medium text-[12px]">Edit</span>
              </button>
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
                  <Minus size={14} strokeWidth={2.5}/>
                </button>
                <span className="font-body font-bold text-[14px] w-3 text-center">{item.quantity}</span>
                <button 
                  onClick={() => updateItemQty(item.id, 1)}
                  className="w-6 h-6 rounded-full border border-text-primary flex items-center justify-center text-text-primary"
                >
                  <Plus size={14} strokeWidth={2.5}/>
                </button>
              </div>
            </div>
          </div>
          ))}
          
          <div className="mt-4">
            <div className="flex items-center gap-2 text-brand-gold mb-2 pl-1">
              <PenLine size={16} />
              <span className="font-body font-bold text-[13px]">Add Notes</span>
            </div>
            <textarea
              className="w-full border border-gray-200 rounded-[12px] p-3 font-body text-[13px] text-text-primary focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-colors"
              placeholder="Tambahkan catatan pesanan di sini (opsional)..."
              rows="2"
            ></textarea>
          </div>
        </div>

        {/* Payment Details */}
        <div className="bg-white p-4 pb-8">
          <div className="border border-gray-100 shadow-sm rounded-[16px] p-5">
            <h2 className="font-body font-bold text-[15px] text-text-primary mb-5 text-center">Payment Details</h2>
            
            <div className="flex justify-between items-center mb-4">
              <span className="font-body font-medium text-[14px] text-text-primary">Subtotal <span className="text-gray-400">({currentTotalItems} menu)</span></span>
              <span className="font-body font-bold text-[14px] text-text-primary">Rp{subtotal.toLocaleString('id-ID')}</span>
            </div>
            
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-1 cursor-pointer">
                <span className="font-body font-medium text-[14px] text-text-primary">Other fees</span>
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
      <div className="absolute bottom-0 left-0 w-full bg-white rounded-t-[24px] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-[100]">
        <div className="p-5 flex justify-between items-center">
          <div className="flex flex-col">
            <span className="font-body font-medium text-[13px] text-text-secondary">Total Payment</span>
            <span className="font-body font-black text-[20px] text-text-primary mt-0.5">
              Rp{total.toLocaleString('id-ID')}
            </span>
          </div>
          <button 
            onClick={() => navigate('/payment', { state: { confirmedTime: confirmedTime, cartItems: items, totalPrice: total } })}
            className="h-[48px] bg-brand-gold text-white font-body font-bold text-[14px] px-8 rounded-[12px] shadow-elevated transition-transform active:scale-95"
          >
            Continue to Payment
          </button>
        </div>
      </div>

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
                Save
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
