import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Ticket, CheckCircle2 } from 'lucide-react';

export default function Vouchers() {
  const navigate = useNavigate();
  const location = useLocation();
  const [promoCode, setPromoCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleApplyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) return;

    // Demo promo codes for testing or generic validation
    if (code === 'DIMSUM10' || code === 'PROMOHEMAT' || code === 'DIMSUMMERDEKA') {
      const discount = code === 'DIMSUM10' ? 10000 : 5000;
      localStorage.setItem('dimsum_applied_voucher', JSON.stringify({ code, discount }));
      setSuccessMessage(`Voucher "${code}" applied successfully! (Rp${discount.toLocaleString('id-ID')} OFF)`);
      setErrorMessage('');
      setTimeout(() => {
        navigate(-1);
      }, 900);
    } else {
      setErrorMessage('Promo code is invalid or has expired.');
      setSuccessMessage('');
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
          Add Promos or Vouchers
        </h1>
        <div className="w-8"></div> {/* Spacer for centering */}
      </div>

      {/* 2. Promo Code Input Box */}
      <div className="p-4 border-b border-gray-50">
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
            placeholder="Enter a Promo/Voucher Code"
            className="w-full font-body font-medium text-[14px] text-text-primary placeholder:text-gray-400 focus:outline-none bg-transparent uppercase"
          />
          <button
            onClick={handleApplyPromo}
            disabled={!promoCode.trim()}
            className="shrink-0 px-5 py-2.5 bg-brand-gold text-white font-body font-bold text-[13px] rounded-[12px] transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          >
            Apply
          </button>
        </div>

        {errorMessage && (
          <p className="text-red-500 font-body font-medium text-[12px] mt-2.5 ml-1 animate-fade-in">
            {errorMessage}
          </p>
        )}

        {successMessage && (
          <p className="text-green-600 font-body font-bold text-[12px] mt-2.5 ml-1 flex items-center gap-1.5 animate-fade-in">
            <CheckCircle2 size={14} />
            <span>{successMessage}</span>
          </p>
        )}
      </div>

      {/* 3. Empty State Illustration & Description */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20 pt-8">
        {/* Graphic: Forbidden Voucher Illustration matching user's image */}
        <div className="relative w-[220px] h-[200px] flex items-center justify-center mb-6">
          <svg viewBox="0 0 200 180" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Soft decorative background glow / leaves */}
            <ellipse cx="100" cy="110" rx="65" ry="40" fill="#FFF9ED" />
            <circle cx="50" cy="100" r="16" fill="#FDF4E2" opacity="0.6" />
            <circle cx="150" cy="80" r="14" fill="#FDF4E2" opacity="0.6" />

            {/* Stylized Golden Ticket / Voucher */}
            <g transform="rotate(18 100 85)">
              <rect x="55" y="45" width="90" height="60" rx="8" fill="#F8DE7E" stroke="#E6C85C" strokeWidth="2" />
              {/* Ticket Notches */}
              <circle cx="55" cy="75" r="7" fill="white" />
              <circle cx="145" cy="75" r="7" fill="white" />
              {/* Dashed separator line */}
              <line x1="88" y1="46" x2="88" y2="104" stroke="#D8B54A" strokeWidth="2" strokeDasharray="3 3" />
              {/* Ticket details */}
              <rect x="66" y="60" width="14" height="6" rx="2" fill="#E2BC44" />
              <rect x="66" y="72" width="10" height="4" rx="1.5" fill="#E2BC44" />
              <rect x="100" y="62" width="30" height="5" rx="2" fill="#E2BC44" />
              <rect x="100" y="73" width="22" height="4" rx="2" fill="#E2BC44" />
            </g>

            {/* Prohibition Ring & Slash (Red Circle with Diagonal Slash) */}
            <circle cx="100" cy="90" r="48" stroke="#E26A54" strokeWidth="8" fill="none" opacity="0.9" />
            <line x1="66" y1="56" x2="134" y2="124" stroke="#E26A54" strokeWidth="8" strokeLinecap="round" opacity="0.9" />
          </svg>
        </div>

        {/* Text exactly matching the user's reference image */}
        <p className="font-body font-medium text-[14px] text-text-secondary text-center leading-relaxed max-w-[290px]">
          Promo/voucher isn't available yet. You can enter the promo/voucher code if you have one.
        </p>
      </div>
    </div>
  );
}
