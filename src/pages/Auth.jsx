import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, Mail, Lock, Eye, EyeOff, CheckCircle2, Shield } from 'lucide-react';
import logoImg from '../assets/logo.webp';

export default function Auth() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'

  // Form states
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleGoogleAuth = () => {
    triggerToast('Layanan Login Google sedang disiapkan. Silakan gunakan formulir masuk di bawah.');
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!loginIdentifier || !loginPassword) {
      triggerToast('Mohon isi nomor WhatsApp/Email dan kata sandi.');
      return;
    }

    // Save profile mock to local storage for pleasant UX
    if (!localStorage.getItem('dimsum_customer_name')) {
      localStorage.setItem('dimsum_customer_name', loginIdentifier.includes('@') ? loginIdentifier.split('@')[0] : 'Pelanggan Setia');
    }
    if (loginIdentifier.includes('@')) {
      localStorage.setItem('dimsum_customer_email', loginIdentifier);
    } else {
      localStorage.setItem('dimsum_customer_phone', loginIdentifier);
    }

    triggerToast('Berhasil masuk! Mengalihkan ke menu...');
    setTimeout(() => {
      navigate('/menu');
    }, 1200);
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (!regName || !regPhone || !regPassword) {
      triggerToast('Mohon lengkapi nama, nomor WhatsApp, dan kata sandi.');
      return;
    }
    if (!agreeTerms) {
      triggerToast('Anda perlu menyetujui Kebijakan Privasi.');
      return;
    }

    localStorage.setItem('dimsum_customer_name', regName.trim());
    localStorage.setItem('dimsum_customer_phone', regPhone.trim());
    if (regEmail.trim()) {
      localStorage.setItem('dimsum_customer_email', regEmail.trim());
    }

    triggerToast('Akun berhasil didaftarkan! Selamat datang di Makan Dimsum.');
    setTimeout(() => {
      navigate('/menu');
    }, 1200);
  };

  return (
    <div className="max-w-[480px] mx-auto min-h-screen relative shadow-2xl overflow-x-clip bg-bg-cream flex flex-col">
      {/* 1. Sticky Navbar */}
      <nav className="sticky top-0 z-50 bg-brand-blue/95 backdrop-blur-md px-5 py-3 text-white flex items-center justify-between border-b border-brand-blue-dark shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 transition-all flex items-center justify-center text-white cursor-pointer"
          aria-label="Kembali"
        >
          <ArrowLeft size={20} strokeWidth={2.2} />
        </button>
        <span className="font-heading font-black text-[16px] tracking-wide text-white">
          Akun Pelanggan
        </span>
        <div className="w-10" />
      </nav>

      {/* 2. Top Header Subheader */}
      <header className="bg-brand-blue px-5 pt-2 pb-8 text-white">
        <div className="flex items-center gap-3 mt-1">
          <img src={logoImg} alt="Makan Dimsum" className="h-12 w-auto object-contain drop-shadow-md" />
          <div>
            <h1 className="font-display font-black text-[20px] leading-tight">
              Makan Dimsum Indonesia
            </h1>
            <p className="font-body text-[11px] text-white/85 font-medium mt-0.5">
              Produsen & Distributor Dimsum Premium
            </p>
          </div>
        </div>
      </header>

      {/* 2. Sheet Card Overlap */}
      <main className="bg-bg-cream rounded-t-[28px] -mt-4 relative px-5 pt-6 pb-12 flex-1 flex flex-col">
        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[250] w-[90%] max-w-[400px] animate-toast-in">
            <div className="bg-text-primary/95 backdrop-blur-xs text-white px-4 py-3 rounded-[16px] shadow-elevated flex items-center gap-3 border border-white/20">
              <CheckCircle2 size={18} className="text-brand-gold shrink-0" />
              <span className="font-body font-medium text-[12px] leading-snug">
                {toastMessage}
              </span>
            </div>
          </div>
        )}

        {/* Segmented Control: Masuk vs Daftar */}
        <div className="bg-white p-1.5 rounded-[18px] shadow-sm border border-gray-100 flex gap-1 mb-6">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2.5 rounded-[14px] font-body font-bold text-[13px] transition-all cursor-pointer ${activeTab === 'login'
                ? 'bg-brand-gold text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
              }`}
          >
            Masuk
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-2.5 rounded-[14px] font-body font-bold text-[13px] transition-all cursor-pointer ${activeTab === 'register'
                ? 'bg-brand-gold text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
              }`}
          >
            Daftar
          </button>
        </div>

        {/* Google Authentication Button */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          className="w-full bg-white hover:bg-gray-50 border border-gray-200 active:scale-[0.98] transition-all rounded-[16px] p-3.5 shadow-sm flex items-center justify-center gap-3 cursor-pointer mb-5"
        >
          {/* Official Google Multi-Color SVG Icon */}
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.31 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span className="font-body font-bold text-[13px] text-text-primary">
            Lanjutkan dengan Google
          </span>
        </button>

        {/* Or Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="h-[1px] bg-gray-200 flex-1" />
          <span className="font-body font-medium text-[11px] text-text-secondary">
            atau gunakan formulir
          </span>
          <div className="h-[1px] bg-gray-200 flex-1" />
        </div>

        {/* Tab 1: Form Masuk */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="bg-white rounded-[22px] p-5 shadow-card border border-gray-100 flex flex-col gap-4 animate-fade-in">
            <div>
              <label className="block font-body font-bold text-[12px] text-text-primary mb-1.5">
                Nomor WhatsApp atau Email
              </label>
              <div className="relative">
                <User size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="08123456789 atau email@domain.com"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 text-[13px] font-body bg-gray-50 border border-gray-200 rounded-[14px] focus:outline-none focus:border-brand-blue focus:bg-white transition-all text-text-primary"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="font-body font-bold text-[12px] text-text-primary">
                  Kata Sandi
                </label>
                <button
                  type="button"
                  onClick={() => triggerToast('Fitur reset kata sandi dapat dibantu melalui WhatsApp Customer Service.')}
                  className="font-body font-medium text-[11px] text-brand-blue hover:underline cursor-pointer"
                >
                  Lupa kata sandi?
                </button>
              </div>
              <div className="relative">
                <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  placeholder="Masukkan kata sandi akun"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-[13px] font-body bg-gray-50 border border-gray-200 rounded-[14px] focus:outline-none focus:border-brand-blue focus:bg-white transition-all text-text-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-text-primary transition-colors cursor-pointer"
                >
                  {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 w-full py-3 bg-brand-gold hover:bg-brand-gold/90 text-white font-body font-bold text-[14px] rounded-[14px] shadow-elevated transition-transform active:scale-95 cursor-pointer"
            >
              Masuk Sekarang
            </button>
          </form>
        )}

        {/* Tab 2: Form Daftar */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="bg-white rounded-[22px] p-5 shadow-card border border-gray-100 flex flex-col gap-3.5 animate-fade-in">
            <div>
              <label className="block font-body font-bold text-[12px] text-text-primary mb-1.5">
                Nama Lengkap
              </label>
              <div className="relative">
                <User size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 text-[13px] font-body bg-gray-50 border border-gray-200 rounded-[14px] focus:outline-none focus:border-brand-blue focus:bg-white transition-all text-text-primary"
                />
              </div>
            </div>

            <div>
              <label className="block font-body font-bold text-[12px] text-text-primary mb-1.5">
                Nomor WhatsApp Aktif
              </label>
              <div className="relative">
                <Phone size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  required
                  placeholder="08123456789"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 text-[13px] font-body bg-gray-50 border border-gray-200 rounded-[14px] focus:outline-none focus:border-brand-blue focus:bg-white transition-all text-text-primary"
                />
              </div>
            </div>

            <div>
              <label className="block font-body font-bold text-[12px] text-text-primary mb-1.5">
                Alamat Email <span className="font-normal text-text-secondary">(Opsional)</span>
              </label>
              <div className="relative">
                <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  placeholder="budi@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 text-[13px] font-body bg-gray-50 border border-gray-200 rounded-[14px] focus:outline-none focus:border-brand-blue focus:bg-white transition-all text-text-primary"
                />
              </div>
            </div>

            <div>
              <label className="block font-body font-bold text-[12px] text-text-primary mb-1.5">
                Kata Sandi Baru
              </label>
              <div className="relative">
                <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  placeholder="Minimal 6 karakter"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-[13px] font-body bg-gray-50 border border-gray-200 rounded-[14px] focus:outline-none focus:border-brand-blue focus:bg-white transition-all text-text-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-text-primary transition-colors cursor-pointer"
                >
                  {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-2.5 pt-1">
              <input
                type="checkbox"
                id="agreeTerms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-brand-gold focus:ring-brand-gold cursor-pointer"
              />
              <label htmlFor="agreeTerms" className="font-body text-[11px] text-text-secondary leading-snug cursor-pointer">
                Saya menyetujui{' '}
                <span
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/privacy-policy');
                  }}
                  className="text-brand-blue font-bold hover:underline cursor-pointer"
                >
                  Kebijakan Privasi
                </span>{' '}
                Makan Dimsum Indonesia.
              </label>
            </div>

            <button
              type="submit"
              className="mt-2 w-full py-3 bg-brand-gold hover:bg-brand-gold/90 text-white font-body font-bold text-[14px] rounded-[14px] shadow-elevated transition-transform active:scale-95 cursor-pointer"
            >
              Buat Akun Baru
            </button>
          </form>
        )}

        {/* Security badge at bottom */}
        <div className="mt-8 flex items-center justify-center gap-2 text-text-secondary">
          <Shield size={16} className="text-brand-gold" />
          <span className="font-body font-medium text-[11px]">
            Data Anda terlindungi & terenkripsi aman
          </span>
        </div>
      </main>
    </div>
  );
}
