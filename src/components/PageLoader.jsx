import React from 'react';

export default function PageLoader({ text = 'Memuat halaman...' }) {
  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="relative flex items-center justify-center mb-4">
        {/* Outer soft ring */}
        <div className="w-12 h-12 rounded-full border-2 border-brand-gold/20 animate-ping absolute" />
        {/* Spinning ring */}
        <div className="w-9 h-9 rounded-full border-[3px] border-[#E5DFD3] border-t-brand-gold animate-spin" />
      </div>
      <p className="font-body text-[13px] font-medium text-text-secondary tracking-wide animate-pulse">
        {text}
      </p>
    </div>
  );
}
