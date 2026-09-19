import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Ticket, CheckCircle2, Check, AlertCircle, Tag, Clock, Sparkles, Loader2 } from 'lucide-react';

/**
 * Reusable Voucher Card Component with 30% / 70% Layout
 * - Grid 1 (30%): Gold background (#FDF6E3) with coupon ticket icon
 * - Grid 2 (70%): White background with promo code, discount amount, S&K, and circular checkbox button
 * - Outline: Gold when active, gray when inactive
 */
function VoucherCard({
  code,
  discountTitle,
  minSpend,
  maxDiscount,
  endDate,
  isActive,
  onToggle,
  bgNotch = 'bg-[#FAFAFA]'
}) {
  return (
    <div
      onClick={onToggle}
      className={`relative rounded-2xl border transition-all cursor-pointer flex items-stretch shadow-2xs group select-none ${isActive
        ? 'border-brand-gold ring-1 ring-brand-gold/30 bg-white shadow-xs'
        : 'border-gray-200 hover:border-brand-gold/40 bg-white'
        }`}
    >
      {/* Semi-circular ticket notches on top & bottom of the 30% dividing seam */}
      <div
        className={`absolute -top-2 left-[30%] -translate-x-1/2 w-4 h-4 rounded-full border-b z-10 ${bgNotch} ${isActive ? 'border-brand-gold' : 'border-gray-200'
          }`}
      />
      <div
        className={`absolute -bottom-2 left-[30%] -translate-x-1/2 w-4 h-4 rounded-full border-t z-10 ${bgNotch} ${isActive ? 'border-brand-gold' : 'border-gray-200'
          }`}
      />

      {/* Grid 1: 30% - Gold background with Coupon Icon */}
      <div className="w-[30%] shrink-0 bg-[#FDF6E3] flex flex-col items-center justify-center p-3 relative border-r border-dashed border-[#EAE0CA] rounded-l-2xl">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${isActive
            ? 'bg-brand-gold text-white shadow-2xs'
            : 'bg-brand-gold/20 text-brand-gold'
            }`}
        >
          <Ticket size={22} strokeWidth={2.2} />
        </div>
      </div>

      {/* Grid 2: 70% - White background with Content & Checkbox */}
      <div className="w-[70%] min-w-0 bg-white p-3.5 sm:p-4 rounded-r-2xl flex flex-col justify-between">
        {/* Top: Code badge & Checkbox Button */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <span className="inline-block px-2 py-0.5 bg-brand-gold/10 text-brand-gold font-bold font-heading text-[12px] rounded-md tracking-wider">
              {code}
            </span>
            {isActive && (
              <span className="bg-brand-gold/15 text-brand-gold text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                Aktif
              </span>
            )}
          </div>

          {/* Checkbox button */}
          <div
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="shrink-0 p-0.5 cursor-pointer active:scale-90 transition-transform"
            aria-label={isActive ? 'Copot voucher' : 'Gunakan voucher'}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${isActive
                ? 'bg-brand-gold text-white border-2 border-brand-gold shadow-2xs'
                : 'bg-white border-2 border-gray-300 group-hover:border-brand-gold/60'
                }`}
            >
              {isActive && <Check size={14} strokeWidth={3} />}
            </div>
          </div>
        </div>

        {/* Middle: Discount Title */}
        <h3 className="font-heading font-bold text-[14.5px] text-text-primary mt-1.5 leading-snug">
          {discountTitle}
        </h3>

        {/* Bottom: S&K Promo */}
        <div className="mt-2.5 pt-2 border-t border-dashed border-gray-100 space-y-0.5 text-[11px] text-text-secondary">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span>
              {minSpend > 0
                ? `Min. belanja Rp${Number(minSpend).toLocaleString('id-ID')}`
                : 'Tanpa minimum belanja'}
            </span>
            {maxDiscount && (
              <span>• Maks. diskon Rp${Number(maxDiscount).toLocaleString('id-ID')}</span>
            )}
          </div>

          {endDate && (
            <div className="flex items-center gap-1 text-[10.5px] text-gray-400">
              <Clock size={11} />
              <span>
                Berlaku s/d{' '}
                {new Date(endDate).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Vouchers() {
  const navigate = useNavigate();
  const location = useLocation();
  const [promoCode, setPromoCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Page loading spinner state so user does not see content before data is ready
  const [pageLoading, setPageLoading] = useState(true);
  const [publicVouchers, setPublicVouchers] = useState([]);

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
  const [isSwitchingVoucher, setIsSwitchingVoucher] = useState(false);

  // Fetch public vouchers on component mount
  useEffect(() => {
    let isMounted = true;
    const fetchPublicVouchers = async () => {
      try {
        const res = await fetch('/api/vouchers/public');
        const data = await res.json();
        if (isMounted && data.success) {
          setPublicVouchers(data.data || []);
        }
      } catch (err) {
        console.error('Gagal mengambil daftar voucher:', err);
      } finally {
        if (isMounted) {
          setPageLoading(false);
        }
      }
    };

    fetchPublicVouchers();
    return () => {
      isMounted = false;
    };
  }, []);

  // Toggle circular checkbox on the active voucher card (copot atau aktifkan kembali)
  const handleToggleVoucher = async () => {
    if (isSwitchingVoucher) return;
    setIsSwitchingVoucher(true);
    await new Promise((resolve) => setTimeout(resolve, 400));

    if (isVoucherChecked) {
      // Uncheck: remove promo (copot)
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
    setIsSwitchingVoucher(false);
  };

  // Helper to validate and apply any promo code (manual input or public button click)
  const applyVoucherCode = async (rawCode) => {
    const code = rawCode.trim().toUpperCase();
    if (!code || isSwitchingVoucher) return;

    // Calculate subtotal accurately from navigation state or checkout items
    let currentSubtotal = Number(location.state?.totalPrice || 0);
    if (!currentSubtotal) {
      try {
        const checkoutItems = JSON.parse(localStorage.getItem('dimsum_checkout_items') || '[]');
        if (Array.isArray(checkoutItems) && checkoutItems.length > 0) {
          currentSubtotal = checkoutItems.reduce(
            (acc, it) => acc + Number(it.price || 0) * (it.quantity || 1),
            0
          );
        }
      } catch {
        currentSubtotal = 0;
      }
    }

    setIsLoading(true);
    setIsSwitchingVoucher(true);
    setErrorMessage('');
    setSuccessMessage('');

    const minDelay = new Promise((resolve) => setTimeout(resolve, 450));

    try {
      const [res] = await Promise.all([
        fetch('/api/vouchers/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: code,
            subtotal: currentSubtotal
          })
        }),
        minDelay
      ]);

      const data = await res.json();

      if (data.success && data.data) {
        const validatedVoucher = {
          code: data.data.code,
          discount: data.data.discount,
          min_spend: data.data.min_spend,
          discount_type: data.data.discount_type,
          discount_value: data.data.discount_value,
          max_discount: data.data.max_discount,
          end_date: data.data.end_date
        };
        setSavedVoucher(validatedVoucher);
        setIsVoucherChecked(true);
        localStorage.setItem('dimsum_applied_voucher', JSON.stringify(validatedVoucher));
        setSuccessMessage(
          `Voucher "${validatedVoucher.code}" berhasil dipilih! (-Rp${Number(
            validatedVoucher.discount
          ).toLocaleString('id-ID')})`
        );
        setErrorMessage('');
        setPromoCode('');
      } else {
        setErrorMessage(data.message || 'Kode promo tidak valid atau sudah kedaluwarsa.');
        setSuccessMessage('');
      }
    } catch (err) {
      setErrorMessage('Terjadi kesalahan saat memeriksa voucher. Silakan coba lagi.');
      setSuccessMessage('');
    } finally {
      setIsLoading(false);
      setIsSwitchingVoucher(false);
    }
  };

  const handleApplyPromo = () => {
    applyVoucherCode(promoCode);
  };

  // Filter available vouchers so the selected voucher doesn't appear twice
  const availableVouchers = publicVouchers.filter((v) => {
    if (savedVoucher && savedVoucher.code === v.code) {
      return false;
    }
    return true;
  });

  // Find matching details if savedVoucher needs fallbacks
  const matchingPublic = publicVouchers.find((v) => v.code === savedVoucher?.code);

  // 0. Loading spinner screen
  if (pageLoading) {
    return (
      <div className="max-w-[480px] mx-auto min-h-screen relative shadow-2xl bg-white flex flex-col font-body">
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
          <div className="w-8"></div>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-10 h-10 border-3 border-brand-gold border-t-transparent rounded-full animate-spin mb-3.5"></div>
          <p className="font-heading font-bold text-sm text-text-primary">
            Menyiapkan Promo...
          </p>
          <p className="font-body text-xs text-text-secondary mt-1">
            Memuat voucher terbaik untuk pesanan Anda
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[480px] mx-auto min-h-screen relative shadow-2xl overflow-x-hidden bg-[#FAFAFA] flex flex-col pb-28 font-body">
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
        <div className="w-8"></div>
      </header>

      {/* 2. Promo Code Input Box */}
      <div className="p-4 bg-white border-b border-gray-100">
        <h2 className="font-body font-semibold text-[13px] text-text-secondary mb-2 flex items-center gap-1.5">
          <Tag size={15} className="text-brand-gold" />
          Punya Kode Promo Khusus?
        </h2>
        <div className="flex items-center gap-2 border border-gray-200 rounded-xl p-1.5 pl-3.5 focus-within:border-brand-gold focus-within:ring-1 focus-within:ring-brand-gold transition-all bg-white shadow-2xs">
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
            placeholder="Masukkan kode promo (misal: DIMSUM10)"
            className="w-full font-body font-medium text-[13.5px] text-text-primary placeholder:text-gray-400 placeholder:text-[13px] placeholder:normal-case focus:outline-none bg-transparent uppercase"
          />
          <button
            type="button"
            onClick={handleApplyPromo}
            disabled={!promoCode.trim() || isLoading}
            className="shrink-0 px-5 py-2 bg-brand-gold hover:bg-brand-gold-dark text-white font-body font-bold text-[13px] rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 cursor-pointer flex items-center justify-center min-w-[68px]"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Klaim'
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

      {/* 3. Active Voucher Card Container */}
      {savedVoucher && (
        <div className="p-4 bg-white border-b border-gray-100">
          <h2 className="font-body font-semibold text-[13px] text-text-secondary mb-2.5">
            Voucher yang Sedang Dipilih
          </h2>

          <VoucherCard
            code={savedVoucher.code}
            discountTitle={
              savedVoucher.discount_type === 'percent' ? (
                <>
                  Diskon {parseFloat(savedVoucher.discount_value || matchingPublic?.discount_value || 0)}%
                  <span className="text-brand-gold text-[12.5px] font-semibold ml-1.5">
                    (Hemat Rp{Number(savedVoucher.discount).toLocaleString('id-ID')})
                  </span>
                </>
              ) : (
                `Potongan Rp${Number(savedVoucher.discount || savedVoucher.discount_value || matchingPublic?.discount_value || 0).toLocaleString('id-ID')}`
              )
            }
            minSpend={savedVoucher.min_spend ?? matchingPublic?.min_spend ?? 0}
            maxDiscount={savedVoucher.max_discount ?? matchingPublic?.max_discount}
            endDate={savedVoucher.end_date ?? matchingPublic?.end_date}
            isActive={isVoucherChecked}
            onToggle={handleToggleVoucher}
            bgNotch="bg-white"
          />

          <p className="font-body text-[12px] text-text-secondary mt-2 pl-1 leading-relaxed">
            {isVoucherChecked
              ? 'Klik kartu untuk mencopot promo ini dari pesanan.'
              : 'Klik kembali kartu untuk mengaktifkan promo ini.'}
          </p>
        </div>
      )}

      {/* 4. Public Available Vouchers Section */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading font-bold text-[14px] text-text-primary flex items-center gap-1.5">
            <Sparkles size={16} className="text-brand-gold" />
            Promo Tersedia ({availableVouchers.length})
          </h2>
          <span className="text-[11px] text-text-secondary">
            Bisa langsung digunakan
          </span>
        </div>

        {availableVouchers.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-xs">
            <Ticket size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="font-heading font-semibold text-[13px] text-text-primary">
              {savedVoucher
                ? 'Semua Promo Publik Sedang Digunakan'
                : 'Belum Ada Promo Publik'}
            </p>
            <p className="font-body text-[12px] text-text-secondary mt-1">
              Jika Anda memiliki kode voucher khusus lainnya, silakan masukkan pada kolom di atas.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {availableVouchers.map((v) => (
              <VoucherCard
                key={v.id || v.code}
                code={v.code}
                discountTitle={
                  v.discount_type === 'percent'
                    ? `Diskon ${parseFloat(v.discount_value)}%`
                    : `Potongan Rp${Number(v.discount_value).toLocaleString('id-ID')}`
                }
                minSpend={v.min_spend}
                maxDiscount={v.max_discount}
                endDate={v.end_date}
                isActive={false}
                onToggle={() => applyVoucherCode(v.code)}
                bgNotch="bg-[#FAFAFA]"
              />
            ))}
          </div>
        )}
      </div>

      {/* 5. Sticky Bottom Action Bar (Closure) */}
      {savedVoucher && isVoucherChecked && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white/95 backdrop-blur-md border-t border-[#EAEAEA] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] p-4 z-40">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full py-3.5 bg-brand-gold hover:bg-brand-gold-dark text-white font-body font-bold text-[14px] rounded-[12px] shadow-sm transition-transform active:scale-95 cursor-pointer"
          >
            Gunakan Voucher & Kembali
          </button>
        </div>
      )}

      {/* 6. Floating Medium Loading Overlay (Gold spinner with translucent rounded box) */}
      {isSwitchingVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto select-none">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[20px] bg-black/60 flex items-center justify-center shadow-2xl border border-white/10 animate-fade-in">
            <Loader2 size={38} className="text-brand-gold animate-spin" strokeWidth={2.5} />
          </div>
        </div>
      )}
    </div>
  );
}
