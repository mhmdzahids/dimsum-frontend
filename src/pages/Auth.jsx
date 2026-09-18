import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, User, Phone, Mail, Lock, Eye, EyeOff, CheckCircle2, Shield, Loader2 } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import logoImg from '../assets/logo.webp';
import { loginCustomer, isCustomerLoggedIn } from '../utils/customerAuth';

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/menu';

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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Post-login / register loading transition state
  const [isSuccessRedirecting, setIsSuccessRedirecting] = useState(false);
  const [successUser, setSuccessUser] = useState(null);
  const [successType, setSuccessType] = useState('login'); // 'login' | 'register'

  useEffect(() => {
    if (isCustomerLoggedIn()) {
      navigate(redirectTo, { replace: true });
    }
  }, [navigate, redirectTo]);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      triggerToast('Kredensial akun Google tidak ditemukan.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential })
      });
      const data = await res.json();
      if (data.success && data.data?.token) {
        loginCustomer(data.data.token, data.data.user);
        setSuccessUser(data.data.user);
        setSuccessType('login');
        setIsSuccessRedirecting(true);
        setTimeout(() => {
          navigate(redirectTo, { replace: true });
        }, 1300);
      } else {
        triggerToast(data.error || 'Gagal masuk dengan akun Google.');
      }
    } catch (err) {
      triggerToast('Terjadi gangguan jaringan saat memproses login Google.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleError = () => {
    triggerToast('Login Google dibatalkan atau tidak berhasil.');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginIdentifier || !loginPassword) {
      triggerToast('Mohon isi nomor WhatsApp/Email dan kata sandi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: loginIdentifier.trim(),
          password: loginPassword
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        loginCustomer(data.data.token, data.data.user);
        setSuccessUser(data.data.user);
        setSuccessType('login');
        setIsSuccessRedirecting(true);
        setTimeout(() => {
          navigate(redirectTo, { replace: true });
        }, 1300);
      } else {
        triggerToast(data.error || 'Email/Nomor WhatsApp atau kata sandi tidak cocok.');
      }
    } catch (err) {
      triggerToast('Terjadi gangguan jaringan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regName || (!regPhone && !regEmail) || !regPassword) {
      triggerToast('Mohon lengkapi nama, nomor WhatsApp/Email, dan kata sandi.');
      return;
    }
    if (!agreeTerms) {
      triggerToast('Anda perlu menyetujui Kebijakan Privasi.');
      return;
    }
    if (regPassword.length < 6) {
      triggerToast('Kata sandi minimal 6 karakter.');
      return;
    }

    setIsSubmitting(true);
    try {
      const identifier = (regPhone.trim() || regEmail.trim());
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          full_name: regName.trim(),
          password: regPassword
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        loginCustomer(data.data.token, data.data.user, 1500);
        setSuccessUser(data.data.user);
        setSuccessType('register');
        setIsSuccessRedirecting(true);
        setTimeout(() => {
          navigate(redirectTo, { replace: true });
        }, 1300);
      } else {
        triggerToast(data.error || 'Pendaftaran gagal. Silakan periksa kembali data Anda.');
      }
    } catch (err) {
      triggerToast('Terjadi gangguan koneksi saat mendaftar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccessRedirecting) {
    return (
      <div className="max-w-[480px] mx-auto min-h-screen bg-bg-cream flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden shadow-2xl">
        {/* Soft background ambient glow */}
        <div className="absolute w-72 h-72 rounded-full bg-brand-gold/15 blur-3xl -top-12 -left-12 pointer-events-none" />
        <div className="absolute w-72 h-72 rounded-full bg-brand-blue/10 blur-3xl -bottom-12 -right-12 pointer-events-none" />

        <div className="relative z-10 w-full max-w-[360px] bg-white rounded-[28px] p-8 shadow-card border border-gray-100 flex flex-col items-center text-center animate-fade-in">
          {/* Animated Logo with Glowing Ring */}
          <div className="relative mb-6">
            <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-brand-gold via-brand-blue to-brand-gold opacity-40 blur-md animate-pulse" />
            <div className="relative w-24 h-24 rounded-full bg-white shadow-elevated flex items-center justify-center p-3 border-2 border-brand-gold/30">
              <img src={logoImg} alt="Makan Dimsum" className="w-full h-full object-contain drop-shadow-sm" />
            </div>
            {/* Spinning Indicator Badge */}
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-brand-gold text-white flex items-center justify-center shadow-md animate-spin">
              <Loader2 size={16} strokeWidth={2.5} />
            </div>
          </div>

          {/* Success Status Tag */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 mb-3.5 shadow-2xs">
            <CheckCircle2 size={15} className="text-emerald-600" />
            <span className="font-body font-bold text-[11px] tracking-wide uppercase">
              {successType === 'login' ? 'Login Berhasil' : 'Registrasi Berhasil'}
            </span>
          </div>

          {/* Greeting */}
          <h2 className="font-heading font-black text-[20px] text-text-primary mb-1.5 leading-tight">
            Selamat Datang, {successUser?.full_name || 'Pelanggan'}!
          </h2>
          <p className="font-body text-[13px] text-text-secondary leading-snug mb-6">
            {successType === 'login'
              ? 'Akun Anda berhasil masuk. Menyiapkan menu pilihan Anda...'
              : 'Akun Anda berhasil dibuat & otomatis terhubung. Mengalihkan ke menu...'}
          </p>

          {/* Animated Progress Bar */}
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden mb-3.5">
            <div className="h-full bg-gradient-to-r from-brand-blue via-brand-gold to-brand-blue rounded-full w-full animate-progress" />
          </div>

          <span className="font-body font-medium text-[11px] text-text-secondary">
            Otomatis ter-login & mengalihkan...
          </span>
        </div>
      </div>
    );
  }

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

        {/* Google Authentication Component */}
        <div className="w-full flex justify-center mb-5 min-h-[44px]">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            theme="outline"
            size="large"
            text="continue_with"
            shape="pill"
            locale="id"
            width="340"
          />
        </div>

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
              disabled={isSubmitting}
              className="mt-2 w-full py-3 bg-brand-gold hover:bg-brand-gold/90 text-white font-body font-bold text-[14px] rounded-[14px] shadow-elevated transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Memproses Masuk...</span>
                </>
              ) : (
                'Masuk Sekarang'
              )}
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
              disabled={isSubmitting}
              className="mt-2 w-full py-3 bg-brand-gold hover:bg-brand-gold/90 text-white font-body font-bold text-[14px] rounded-[14px] shadow-elevated transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Membuat Akun...</span>
                </>
              ) : (
                'Daftar Sekarang'
              )}
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
