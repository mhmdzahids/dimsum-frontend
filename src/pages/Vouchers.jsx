import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Ticket, CheckCircle2, Check, AlertCircle } from 'lucide-react';

export default function Vouchers() {
  const navigate = useNavigate();
  const location = useLocation();
  const [promoCode, setPromoCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Active voucher state from localStorage
  const [savedVoucher, setSavedVoucher] = useState(() => {
    try {
      const saved = localStorage.getItem('dimsum_applied_voucher');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isVoucherChecked, setIsVoucherChecked] = useState(() => {
    return Boolean(localStorage.getItem('dimsum_applied_voucher'));
  });

  const [isLoading, setIsLoading] = useState(false);

  // Toggle circular checkbox on the active voucher card
  const handleToggleVoucher = () => {
    if (isVoucherChecked) {
      // Uncheck: remove promo
      setIsVoucherChecked(false);
      localStorage.removeItem('dimsum_applied_voucher');
      setSuccessMessage('');
      setErrorMessage('Promo berhasil dicopot dari pesanan.');
      setTimeout(() => setErrorMessage(''), 3000);
    } else {
      // Check: re-apply promo
      if (savedVoucher) {
        setIsVoucherChecked(true);
        localStorage.setItem('dimsum_applied_voucher', JSON.stringify(savedVoucher));
        setErrorMessage('');
        setSuccessMessage(`Voucher "${savedVoucher.code}" aktif kembali!`);
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    }
  };

  const handleApplyPromo = async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) return;

    // Calculate subtotal accurately from navigation state or checkout items
    let currentSubtotal = Number(location.state?.totalPrice || 0);
    if (!currentSubtotal) {
      try {
        const checkoutItems = JSON.parse(localStorage.getItem('dimsum_checkout_items') || '[]');
        if (Array.isArray(checkoutItems) && checkoutItems.length > 0) {
          currentSubtotal = checkoutItems.reduce((acc, it) => acc + (Number(it.price || 0) * (it.quantity || 1)), 0);
        }
      } catch {
        currentSubtotal = 0;
      }
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/vouchers/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code,
          subtotal: currentSubtotal
        })
      });

      const data = await res.json();

      if (data.success && data.data) {
        const validatedVoucher = {
          code: data.data.code,
          discount: data.data.discount,
          min_spend: data.data.min_spend,
          discount_type: data.data.discount_type,
          discount_value: data.data.discount_value,
          max_discount: data.data.max_discount
        };
        setSavedVoucher(validatedVoucher);
        setIsVoucherChecked(true);
        localStorage.setItem('dimsum_applied_voucher', JSON.stringify(validatedVoucher));
        setSuccessMessage(`Voucher "${validatedVoucher.code}" berhasil digunakan! (-Rp${Number(validatedVoucher.discount).toLocaleString('id-ID')})`);
        setErrorMessage('');
        setPromoCode('');
        setTimeout(() => {
          navigate(-1);
        }, 900);
      } else {
        setErrorMessage(data.message || 'Kode promo tidak valid atau sudah kedaluwarsa.');
        setSuccessMessage('');
      }
    } catch (err) {
      setErrorMessage('Terjadi kesalahan saat memeriksa voucher. Silakan coba lagi.');
      setSuccessMessage('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-[480px] mx-auto min-h-screen relative shadow-2xl overflow-x-hidden bg-white flex flex-col">
      {/* 1. Header */}
      <div className="bg-white flex items-center justify-between p-4 sticky top-0 z-50 border-b border-gray-100">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={24} className="text-text-primary" />
        </button>
        <h1 className="font-body font-black text-[18px] text-text-primary">
          Tambah Promo atau Voucher
        </h1>
        <div className="w-8"></div> {/* Spacer for centering */}
      </div>

      {/* 2. Promo Code Input Box (Section 1: Top) */}
      <div className="p-4 bg-white">
        <span className="font-body font-bold text-[11px] text-gray-500 uppercase tracking-wider block mb-2">
          Gunakan Kode Voucher
        </span>
        <div className="flex items-center gap-2 border border-gray-200 rounded-[16px] p-2 pl-4 focus-within:border-brand-gold focus-within:ring-1 focus-within:ring-brand-gold transition-all bg-white shadow-sm">
          <input
            type="text"
            value={promoCode}
            onChange={(e) => {
              setPromoCode(e.target.value.toUpperCase());
              if (errorMessage) setErrorMessage('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleApplyPromo();
            }}
            placeholder="Masukkan Kode Promo / Voucher"
            className="w-full font-body font-medium text-[14px] text-text-primary placeholder:text-gray-400 focus:outline-none bg-transparent uppercase"
          />
          <button
            onClick={handleApplyPromo}
            disabled={!promoCode.trim() || isLoading}
            className="shrink-0 px-6 py-2.5 bg-brand-gold text-white font-body font-bold text-[13px] rounded-[12px] transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 cursor-pointer hover:bg-brand-gold/90 flex items-center justify-center min-w-[70px]"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Pakai'
            )}
          </button>
        </div>

        {errorMessage && (
          <p className="text-red-500 font-body font-medium text-[12px] mt-2.5 ml-1 animate-fade-in flex items-center gap-1">
            <AlertCircle size={14} className="shrink-0" />
            <span>{errorMessage}</span>
          </p>
        )}

        {successMessage && (
          <p className="text-green-600 font-body font-bold text-[12px] mt-2.5 ml-1 flex items-center gap-1.5 animate-fade-in">
            <CheckCircle2 size={14} className="shrink-0" />
            <span>{successMessage}</span>
          </p>
        )}
      </div>

      {/* Separator Line / Divider Band (Like Gambar 2) */}
      <div className="h-2 w-full bg-[#F3F4F6] border-y border-gray-100"></div>

      {/* 3. Active Voucher Card Container (Section 2: Below Input) */}
      {savedVoucher && (
        <div className="p-4 bg-white border-b border-gray-100">
          <span className="font-body font-bold text-[11px] text-gray-500 uppercase tracking-wider block mb-2.5">
            Voucher yang Digunakan
          </span>

          {/* Ticket Card Container with Notches */}
          <div 
            onClick={handleToggleVoucher}
            className={`relative p-3.5 rounded-xl border transition-all cursor-pointer flex justify-between items-center overflow-hidden ${
              isVoucherChecked 
                ? 'bg-green-50/90 border-green-300 shadow-2xs' 
                : 'bg-white border-gray-200 opacity-60'
            }`}
          >
            {/* Decorative Ticket Notch Cutouts */}
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full border-r border-green-300" />
            <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full border-l border-green-300" />

            <div className="flex items-center gap-3 pl-1.5 min-w-0">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                isVoucherChecked ? 'bg-green-600 text-white shadow-2xs' : 'bg-gray-200 text-gray-400'
              }`}>
                <Ticket size={18} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-body font-black text-[14px] text-gray-900 tracking-tight">
                    {savedVoucher.code}
                  </h3>
                  {isVoucherChecked && (
                    <span className="bg-green-200 text-green-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                      Aktif
                    </span>
                  )}
                </div>
                <p className="font-body font-semibold text-[12px] text-green-700 mt-0.5">
                  Potongan Rp{Number(savedVoucher.discount).toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            {/* Circular Checkbox on the right side */}
            <div className="shrink-0 pr-1.5">
              <div 
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                  isVoucherChecked 
                    ? 'bg-green-600 text-white border-2 border-green-600 shadow-2xs' 
                    : 'bg-white border-2 border-gray-300'
                }`}
              >
                {isVoucherChecked && <Check size={14} strokeWidth={3} />}
              </div>
            </div>
          </div>

          <p className="text-[11px] text-gray-400 mt-2 pl-1">
            {isVoucherChecked 
              ? 'Hapus centang untuk mencopot promo ini dari pesanan Anda.' 
              : 'Centang kembali lingkaran di atas untuk mengaktifkan promo ini.'}
          </p>
        </div>
      )}

      {/* 4. Empty State Illustration & Description */}
      {!savedVoucher && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20 pt-8">
          {/* Graphic: Stylized Voucher Illustration */}
          <div className="relative w-[220px] h-[200px] flex items-center justify-center mb-6">
            <svg viewBox="0 0 200 180" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="100" cy="110" rx="65" ry="40" fill="#FFF9ED" />
              <circle cx="50" cy="100" r="16" fill="#FDF4E2" opacity="0.6" />
              <circle cx="150" cy="80" r="14" fill="#FDF4E2" opacity="0.6" />

              {/* Stylized Golden Ticket / Voucher */}
              <g transform="rotate(18 100 85)">
                <rect x="55" y="45" width="90" height="60" rx="8" fill="#F8DE7E" stroke="#E6C85C" strokeWidth="2" />
                <circle cx="55" cy="75" r="7" fill="white" />
                <circle cx="145" cy="75" r="7" fill="white" />
                <line x1="88" y1="46" x2="88" y2="104" stroke="#D8B54A" strokeWidth="2" strokeDasharray="3 3" />
                <rect x="66" y="60" width="14" height="6" rx="2" fill="#E2BC44" />
                <rect x="66" y="72" width="10" height="4" rx="1.5" fill="#E2BC44" />
                <rect x="100" y="62" width="30" height="5" rx="2" fill="#E2BC44" />
                <rect x="100" y="73" width="22" height="4" rx="2" fill="#E2BC44" />
              </g>

              {/* Prohibition Ring & Slash */}
              <circle cx="100" cy="90" r="48" stroke="#E26A54" strokeWidth="8" fill="none" opacity="0.9" />
              <line x1="66" y1="56" x2="134" y2="124" stroke="#E26A54" strokeWidth="8" strokeLinecap="round" opacity="0.9" />
            </svg>
          </div>

          <p className="font-body font-medium text-[14px] text-text-secondary text-center leading-relaxed max-w-[290px]">
            Belum ada promo atau voucher lain yang tersedia. Anda dapat memasukkan kode promo jika memilikinya.
          </p>
        </div>
      )}
    </div>
  );
}
