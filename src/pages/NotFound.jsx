import React from 'react';
import { Link } from 'react-router-dom';
import logoImg from '../assets/logo.webp';

export default function NotFound() {

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDFBF7] via-[#F9F5EE] to-[#F3EDE2] flex flex-col items-center justify-center p-4 sm:p-6 font-body text-text-primary selection:bg-brand-red/10 selection:text-brand-red relative overflow-hidden">
      {/* Decorative background glow circles */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-brand-gold/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-brand-red/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full text-center relative z-10 animate-scaleIn">
        {/* Brand Logo */}
        <Link to="/" className="inline-block mb-6 group">
          <img
            src={logoImg}
            alt="Makan Dimsum Indonesia"
            className="h-14 sm:h-16 w-auto mx-auto object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
          />
        </Link>

        {/* 404 Clean Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-white/60 shadow-xl shadow-amber-950/5 p-6 sm:p-8 relative overflow-hidden">
          {/* Big Stylized 404 */}
          <div className="relative my-2 select-none">
            <span className="text-7xl sm:text-8xl font-black font-heading tracking-tighter bg-gradient-to-br from-brand-red via-red-600 to-amber-700 bg-clip-text text-transparent">
              404
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold font-heading text-text-primary mt-2 mb-2">
            Halaman Tidak Ditemukan
          </h2>

          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-6">
            Halaman yang Anda tuju tidak tersedia atau sudah dipindahkan.
          </p>
        </div>

        {/* Footer info */}
        <p className="mt-6 text-[11px] text-text-secondary">
          Makan Dimsum Indonesia
        </p>
      </div>
    </div>
  );
}
