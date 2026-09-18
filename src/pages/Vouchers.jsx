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
    <div className="max-w-[480px] mx-auto min-h-screen relative shadow-2xl overflow-x-hidden bg-white flex flex-col pb-24">
      {/* 1. Header */}
      <header className="bg-white/95 backdrop-blur-md flex items-center justify-between px-4 py-3.5 sticky top-0 z-50 border-b border-gray-100">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-1.5 -ml-1 rounded-full hover:bg-gray-100 active:scale-95 transition-all cursor-pointer text-text-primary"
          aria-label="Kembali"
        >
          <ArrowLeft size={22} strokeWidth={2.2} />
        </button>
        <h1 className="font-heading font-bold text-[17px] text-text-primary">
          Tambah Promo atau Voucher
        </h1>
        <div className="w-8"></div> {/* Spacer for centering */}
      </header>

      {/* 2. Promo Code Input Box */}
      <div className="p-4 bg-white">
        <h2 className="font-body font-medium text-[13px] text-text-secondary mb-2">
          Gunakan Kode Voucher
        </h2>
        <div className="flex items-center gap-2 border border-gray-200 rounded-[12px] p-1.5 pl-3.5 focus-within:border-brand-gold focus-within:ring-1 focus-within:ring-brand-gold transition-all bg-white shadow-2xs">
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
            placeholder="Kode promo / voucher"
            className="w-full font-body font-medium text-[13.5px] text-text-primary placeholder:text-gray-400 placeholder:text-[13px] placeholder:normal-case focus:outline-none bg-transparent uppercase"
          />
          <button
            type="button"
            onClick={handleApplyPromo}
            disabled={!promoCode.trim() || isLoading}
            className="shrink-0 px-5 py-2 bg-brand-gold hover:bg-brand-gold-dark text-white font-body font-bold text-[13px] rounded-[8px] transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 cursor-pointer flex items-center justify-center min-w-[64px]"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Pakai'
            )}
          </button>
        </div>

        {errorMessage && (
          <p className="text-red-500 font-body font-medium text-[12px] mt-2.5 ml-1 animate-fade-in flex items-center gap-1.5">
            <AlertCircle size={14} className="shrink-0" />
            <span>{errorMessage}</span>
          </p>
        )}

        {successMessage && (
          <p className="text-brand-gold font-body font-bold text-[12px] mt-2.5 ml-1 flex items-center gap-1.5 animate-fade-in">
            <CheckCircle2 size={14} className="shrink-0" />
            <span>{successMessage}</span>
          </p>
        )}
      </div>

      {/* Separator Divider */}
      <div className="h-2 w-full bg-[#F5F1EB]/80 border-y border-gray-100/60"></div>

      {/* 3. Active Voucher Card Container */}
      {savedVoucher && (
        <div className="p-4 bg-white border-b border-gray-100">
          <h2 className="font-body font-medium text-[13px] text-text-secondary mb-2.5">
            Voucher yang Digunakan
          </h2>

          {/* Ticket Card Container with Warm Gold Selected State */}
          <div
            onClick={handleToggleVoucher}
            className={`relative p-3.5 rounded-xl border transition-all cursor-pointer flex justify-between items-center overflow-hidden ${isVoucherChecked
                ? 'bg-[#FDF6E3] border-brand-gold/40 shadow-2xs'
                : 'bg-white border-gray-200 opacity-60'
              }`}
          >
            {/* Decorative Ticket Notch Cutouts */}
            <div className={`absolute -left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full border-r ${isVoucherChecked ? 'border-brand-gold/40' : 'border-gray-200'
              }`} />
            <div className={`absolute -right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full border-l ${isVoucherChecked ? 'border-brand-gold/40' : 'border-gray-200'
              }`} />

            <div className="flex items-center gap-3 pl-1.5 min-w-0">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isVoucherChecked ? 'bg-brand-gold text-white shadow-2xs' : 'bg-gray-100 text-gray-400'
                }`}>
                <Ticket size={18} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-body font-bold text-[14px] text-text-primary tracking-tight">
                    {savedVoucher.code}
                  </h3>
                  {isVoucherChecked && (
                    <span className="bg-brand-gold/15 text-brand-gold text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Aktif
                    </span>
                  )}
                </div>
                <p className="font-body font-bold text-[13px] text-brand-gold mt-0.5">
                  Potongan Rp{Number(savedVoucher.discount).toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            {/* Circular Checkbox with Warm Gold Style */}
            <div className="shrink-0 pr-1.5">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${isVoucherChecked
                    ? 'bg-brand-gold text-white border-2 border-brand-gold shadow-2xs'
                    : 'bg-white border-2 border-gray-300'
                  }`}
              >
                {isVoucherChecked && <Check size={14} strokeWidth={3} />}
              </div>
            </div>
          </div>

          <p className="font-body text-[12px] text-text-secondary mt-2.5 pl-1 leading-relaxed">
            {isVoucherChecked
              ? 'Hapus centang untuk mencopot promo ini dari pesanan Anda.'
              : 'Centang kembali lingkaran di atas untuk mengaktifkan promo ini.'}
          </p>
        </div>
      )}



      {/* 5. Sticky Bottom Action Bar (Closure) */}
      {savedVoucher && isVoucherChecked && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white/95 backdrop-blur-md border-t border-[#EAEAEA] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] p-4 z-40">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full py-3 bg-brand-gold hover:bg-brand-gold-dark text-white font-body font-bold text-[14px] rounded-[12px] shadow-sm transition-transform active:scale-95 cursor-pointer"
          >
            Gunakan Voucher & Kembali
          </button>
        </div>
      )}
    </div>
  );
}
