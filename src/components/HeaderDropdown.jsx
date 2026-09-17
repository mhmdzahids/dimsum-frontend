import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ShoppingBag, ShieldCheck, ChevronRight } from 'lucide-react';

export default function HeaderDropdown({ isOpen, onClose, variant = 'blue' }) {
  const navigate = useNavigate();

  // Safely check if there is an active pending order for badge
  const hasPendingOrder = (() => {
    try {
      const saved = localStorage.getItem('dimsum_pending_order');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Boolean(
          parsed &&
          typeof parsed === 'object' &&
          parsed.orderId &&
          (!parsed.expiresAt || new Date(parsed.expiresAt).getTime() > Date.now())
        );
      }
      return false;
    } catch {
      return false;
    }
  })();

  const isBlue = variant === 'blue';

  return (
    <>
      {/* Background Fade / Backdrop Overlay: ONLY for menu page (!isBlue), NOT homepage */}
      {!isBlue && (
        <div
          onClick={onClose}
          aria-hidden="true"
          className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${
            isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        />
      )}

      <div
        className={`relative z-50 grid transition-[grid-template-rows,opacity,margin] duration-300 ease-in-out ${isOpen
          ? 'grid-rows-[1fr] opacity-100 mt-4 mb-2'
          : 'grid-rows-[0fr] opacity-0 mt-0 mb-0 pointer-events-none'
          }`}
      >
        <div className="overflow-hidden">
          <div
            className={`rounded-[22px] p-2.5 flex flex-col gap-2 transition-all ${isBlue
              ? 'bg-white/10 backdrop-blur-md border border-white/20 text-white'
              : 'bg-white border border-brand-blue/25 text-text-primary'
              }`}
          >
            {/* 1. Masuk / Daftar */}
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/auth');
              }}
              className={`w-full px-3.5 py-3 rounded-[16px] transition-all flex items-center justify-between text-left group cursor-pointer ${isBlue
                ? 'hover:bg-white/15 active:bg-white/20 active:scale-[0.99] text-white'
                : 'hover:bg-brand-blue/15 active:bg-brand-blue/20 active:scale-[0.99] text-text-primary'
                }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-[11px] flex items-center justify-center shrink-0 transition-colors ${isBlue
                    ? 'bg-white/20 text-white group-hover:bg-brand-gold group-hover:text-white'
                    : 'border border-brand-blue/30 text-brand-blue bg-brand-blue/5 group-hover:bg-brand-blue group-hover:text-white group-hover:border-brand-blue'
                    }`}
                >
                  <User size={18} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <span
                    className={`font-body font-bold text-[14px] block truncate ${isBlue ? 'text-white' : 'text-text-primary group-hover:text-brand-blue'
                      }`}
                  >
                    Masuk / Daftar
                  </span>
                  <span
                    className={`font-body font-medium text-[11px] block leading-tight ${isBlue ? 'text-white/75' : 'text-text-secondary'
                      }`}
                  >
                    Masuk atau daftar akun pelanggan
                  </span>
                </div>
              </div>
              <ChevronRight
                size={18}
                className={`transition-all shrink-0 ml-2 group-hover:translate-x-0.5 ${isBlue ? 'text-white/60 group-hover:text-white' : 'text-text-secondary group-hover:text-brand-blue'
                  }`}
              />
            </button>

            {/* Divider Line */}
            <div className={`h-[1px] mx-2 ${isBlue ? 'bg-white/15' : 'bg-brand-blue/20'}`} />

            {/* 2. Riwayat Transaksi */}
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/order-history');
              }}
              className={`w-full px-3.5 py-3 rounded-[16px] transition-all flex items-center justify-between text-left group cursor-pointer ${isBlue
                ? 'hover:bg-white/15 active:bg-white/20 active:scale-[0.99] text-white'
                : 'hover:bg-brand-blue/15 active:bg-brand-blue/20 active:scale-[0.99] text-text-primary'
                }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-[11px] flex items-center justify-center shrink-0 transition-colors ${isBlue
                    ? 'bg-white/20 text-white group-hover:bg-brand-gold group-hover:text-white'
                    : 'border border-brand-blue/30 text-brand-blue bg-brand-blue/5 group-hover:bg-brand-blue group-hover:text-white group-hover:border-brand-blue'
                    }`}
                >
                  <ShoppingBag size={18} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-body font-bold text-[14px] block truncate ${isBlue ? 'text-white' : 'text-text-primary group-hover:text-brand-blue'
                        }`}
                    >
                      Riwayat Transaksi
                    </span>
                    {hasPendingOrder && (
                      <span className="w-2 h-2 rounded-full bg-brand-gold animate-ping shrink-0" />
                    )}
                  </div>
                  <span
                    className={`font-body font-medium text-[11px] block leading-tight ${isBlue ? 'text-white/75' : 'text-text-secondary'
                      }`}
                  >
                    {hasPendingOrder ? 'Ada 1 pesanan berlangsung' : 'Daftar transaksi & status pesanan'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                {hasPendingOrder && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isBlue ? 'bg-brand-gold text-white' : 'bg-amber-100 text-amber-800'
                      }`}
                  >
                    Aktif
                  </span>
                )}
                <ChevronRight
                  size={18}
                  className={`transition-all shrink-0 group-hover:translate-x-0.5 ${isBlue ? 'text-white/60 group-hover:text-white' : 'text-text-secondary group-hover:text-brand-blue'
                    }`}
                />
              </div>
            </button>

            {/* Divider Line */}
            <div className={`h-[1px] mx-2 ${isBlue ? 'bg-white/15' : 'bg-brand-blue/20'}`} />

            {/* 3. Kebijakan Privasi */}
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/privacy-policy');
              }}
              className={`w-full px-3.5 py-3 rounded-[16px] transition-all flex items-center justify-between text-left group cursor-pointer ${isBlue
                ? 'hover:bg-white/15 active:bg-white/20 active:scale-[0.99] text-white'
                : 'hover:bg-brand-blue/15 active:bg-brand-blue/20 active:scale-[0.99] text-text-primary'
                }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-[11px] flex items-center justify-center shrink-0 transition-colors ${isBlue
                    ? 'bg-white/20 text-white group-hover:bg-brand-gold group-hover:text-white'
                    : 'border border-brand-blue/30 text-brand-blue bg-brand-blue/5 group-hover:bg-brand-blue group-hover:text-white group-hover:border-brand-blue'
                    }`}
                >
                  <ShieldCheck size={18} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <span
                    className={`font-body font-bold text-[14px] block truncate ${isBlue ? 'text-white' : 'text-text-primary group-hover:text-brand-blue'
                      }`}
                  >
                    Kebijakan Privasi
                  </span>
                  <span
                    className={`font-body font-medium text-[11px] block leading-tight ${isBlue ? 'text-white/75' : 'text-text-secondary'
                      }`}
                  >
                    Keamanan transaksi & privasi data
                  </span>
                </div>
              </div>
              <ChevronRight
                size={18}
                className={`transition-all shrink-0 ml-2 group-hover:translate-x-0.5 ${isBlue ? 'text-white/60 group-hover:text-white' : 'text-text-secondary group-hover:text-brand-blue'
                  }`}
              />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
