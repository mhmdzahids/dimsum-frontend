import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Save,
  ShieldCheck
} from 'lucide-react';
import {
  getCustomerToken,
  getCustomerUser,
  isCustomerLoggedIn,
  updateCustomerUser
} from '../utils/customerAuth';

export default function ProfileEdit() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(() => getCustomerUser());
  const token = getCustomerToken();

  // Redirect if not logged in
  useEffect(() => {
    if (!isCustomerLoggedIn()) {
      navigate('/auth?redirect=/profile/edit', { replace: true });
    }
  }, [navigate]);

  // Initial user baseline
  const initialName = user?.full_name || '';
  const initialEmail = user?.email?.includes('@') ? user.email : '';
  const initialPhone = user?.phone || (user?.email && !user.email.includes('@') ? user.email : '');

  // Form State
  const [fullName, setFullName] = useState(() => initialName);
  const [email, setEmail] = useState(() => initialEmail);
  const [phone, setPhone] = useState(() => initialPhone);

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Dirty State Tracker ("mengubah walaupun satu huruf saja")
  const isDirty = (
    fullName !== initialName ||
    email !== initialEmail ||
    phone !== initialPhone ||
    Boolean(currentPassword || newPassword || confirmPassword)
  );

  // Unsaved Confirmation Modal State
  const [isConfirmDiscardOpen, setIsConfirmDiscardOpen] = useState(false);

  // Visibility Toggles
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Protect accidental tab close or page reload when dirty
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Safe navigation back to /profile with origin state to prevent loops
  const doGoBack = () => {
    const origin = location.state?.from || '/menu';
    navigate('/profile', { replace: true, state: { from: origin } });
  };

  const handleAttemptBack = () => {
    if (isDirty) {
      setIsConfirmDiscardOpen(true);
    } else {
      doGoBack();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      setErrorMessage('Nama lengkap wajib diisi.');
      return;
    }

    if (!trimmedEmail && !trimmedPhone) {
      setErrorMessage('Mohon cantumkan setidaknya Email atau Nomor WhatsApp.');
      return;
    }

    // Email format validation
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMessage('Format alamat email tidak valid (contoh: user@domain.com).');
      return;
    }

    // Phone format validation
    if (trimmedPhone) {
      const cleanPhone = trimmedPhone.replace(/[\s-]/g, '');
      if (!/^(?:\+62|62|0)[0-9]{8,14}$/.test(cleanPhone)) {
        setErrorMessage('Format nomor WhatsApp/telepon tidak valid (contoh: 08123456789).');
        return;
      }
    }

    // Password validation if user entered new password
    if (newPassword || confirmPassword || currentPassword) {
      if (!currentPassword) {
        setErrorMessage('Mohon masukkan kata sandi saat ini untuk verifikasi keamanan.');
        return;
      }
      if (!newPassword || newPassword.length < 6) {
        setErrorMessage('Kata sandi baru minimal harus 6 karakter.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMessage('Konfirmasi kata sandi baru tidak cocok.');
        return;
      }
    }

    setIsLoading(true);

    try {
      const payload = {
        full_name: trimmedName,
        email: trimmedEmail || undefined,
        phone: trimmedPhone || undefined
      };

      if (newPassword) {
        payload.current_password = currentPassword;
        payload.new_password = newPassword;
      }

      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Gagal memperbarui profil.');
      }

      // Update local storage and dispatch subscriber event
      if (data.data) {
        updateCustomerUser(data.data);
        setUser(data.data);
      }

      setSuccessMessage('Profil dan detail akun Anda berhasil diperbarui!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Auto redirect back to profile after 1.2s
      setTimeout(() => {
        doGoBack();
      }, 1200);
    } catch (err) {
      setErrorMessage(err.message || 'Terjadi kesalahan pada sistem. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const initialLetter = (fullName.trim() || user?.full_name || 'U').charAt(0).toUpperCase();

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-bg-cream flex flex-col shadow-2xl overflow-x-clip relative pb-12">
      {/* 1. Header Navbar */}
      <nav className="sticky top-0 z-50 bg-brand-blue/95 backdrop-blur-md px-5 py-3 text-white flex items-center justify-between border-b border-brand-blue-dark shadow-sm">
        <button
          type="button"
          onClick={handleAttemptBack}
          className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 transition-all flex items-center justify-center text-white cursor-pointer"
          aria-label="Kembali"
        >
          <ArrowLeft size={20} strokeWidth={2.2} />
        </button>
        <span className="font-heading font-black text-[16px] tracking-wide text-white">
          Detail Akun Pengguna
        </span>
        <div className="w-10" />
      </nav>

      <main className="px-4 py-5 flex flex-col gap-4">
        {/* Avatar Preview Card */}
        <div className="bg-white rounded-[22px] p-5 shadow-card border border-gray-100/90 flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-full bg-white p-[2px] shadow-elevated">
              <div className="w-full h-full rounded-full bg-[#3079af] flex items-center justify-center text-white font-heading font-black text-[24px]">
                {initialLetter}
              </div>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-heading font-black text-[16px] text-text-primary truncate">
              {fullName.trim() || 'Nama Pelanggan'}
            </h2>
            <p className="font-body text-[12px] text-text-secondary truncate mt-0.5">
              {phone.trim() || email.trim() || 'Belum ada kontak'}
            </p>
            <div className="mt-1.5 inline-flex items-center gap-1.5 bg-brand-gold/15 text-brand-gold px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
              <ShieldCheck size={12} />
              <span>Pelanggan Terdaftar</span>
            </div>
          </div>
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="bg-red-50 border border-brand-red/30 rounded-[14px] p-3.5 flex items-start gap-2.5 text-brand-red animate-in fade-in duration-200">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span className="font-body text-[12.5px] font-medium leading-snug">
              {errorMessage}
            </span>
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-300 rounded-[14px] p-3.5 flex items-start gap-2.5 text-emerald-800 animate-in fade-in duration-200">
            <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-600" />
            <span className="font-body text-[12.5px] font-semibold leading-snug">
              {successMessage}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* CARD 1: Data Diri */}
          <div className="bg-white rounded-[22px] p-5 shadow-card border border-gray-100/90 flex flex-col gap-4">
            <div className="pb-2 border-b border-gray-100 flex items-center gap-2">
              <User size={18} className="text-brand-blue" />
              <h3 className="font-heading font-black text-[15px] text-text-primary">
                Informasi Pribadi
              </h3>
            </div>

            {/* Nama Lengkap */}
            <div className="flex flex-col gap-1.5">
              <label className="font-body font-bold text-[12px] text-text-primary">
                Nama Lengkap <span className="text-brand-red">*</span>
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-text-secondary">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Masukkan nama lengkap"
                  className="w-full pl-9.5 pr-4 py-2.5 rounded-[12px] border border-gray-200 bg-gray-50/50 font-body text-[13px] text-text-primary focus:outline-none focus:border-brand-gold focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="font-body font-bold text-[12px] text-text-primary">
                Alamat Email
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-text-secondary">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contoh@email.com"
                  className="w-full pl-9.5 pr-4 py-2.5 rounded-[12px] border border-gray-200 bg-gray-50/50 font-body text-[13px] text-text-primary focus:outline-none focus:border-brand-gold focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Nomor WhatsApp */}
            <div className="flex flex-col gap-1.5">
              <label className="font-body font-bold text-[12px] text-text-primary">
                Nomor WhatsApp / Telepon
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-text-secondary">
                  <Phone size={16} />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08123456789"
                  className="w-full pl-9.5 pr-4 py-2.5 rounded-[12px] border border-gray-200 bg-gray-50/50 font-body text-[13px] text-text-primary focus:outline-none focus:border-brand-gold focus:bg-white transition-all"
                />
              </div>
              <span className="text-[11px] text-text-secondary font-body mt-0.5">
                Nomor WhatsApp digunakan untuk konfirmasi pesanan dan pengiriman invoice.
              </span>
            </div>
          </div>

          {/* CARD 2: Ganti Kata Sandi */}
          <div className="bg-white rounded-[22px] p-5 shadow-card border border-gray-100/90 flex flex-col gap-4">
            <div className="pb-2 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock size={18} className="text-brand-blue" />
                <h3 className="font-heading font-black text-[15px] text-text-primary">
                  Ubah Kata Sandi
                </h3>
              </div>
            </div>

            <p className="text-[11.5px] text-text-secondary font-body bg-amber-50/70 border border-amber-200/60 p-2.5 rounded-[10px]">
              Kosongkan bagian ini jika Anda tidak ingin mengubah kata sandi akun Anda.
            </p>

            {/* Kata Sandi Saat Ini */}
            <div className="flex flex-col gap-1.5">
              <label className="font-body font-bold text-[12px] text-text-primary">
                Kata Sandi Saat Ini
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-text-secondary">
                  <Lock size={16} />
                </div>
                <input
                  type={showCurrentPw ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Masukkan kata sandi lama"
                  className="w-full pl-9.5 pr-10 py-2.5 rounded-[12px] border border-gray-200 bg-gray-50/50 font-body text-[13px] text-text-primary focus:outline-none focus:border-brand-gold focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-3 text-text-secondary hover:text-text-primary cursor-pointer p-1"
                >
                  {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Kata Sandi Baru */}
            <div className="flex flex-col gap-1.5">
              <label className="font-body font-bold text-[12px] text-text-primary">
                Kata Sandi Baru
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-text-secondary">
                  <Lock size={16} />
                </div>
                <input
                  type={showNewPw ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full pl-9.5 pr-10 py-2.5 rounded-[12px] border border-gray-200 bg-gray-50/50 font-body text-[13px] text-text-primary focus:outline-none focus:border-brand-gold focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3 text-text-secondary hover:text-text-primary cursor-pointer p-1"
                >
                  {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Konfirmasi Kata Sandi Baru */}
            <div className="flex flex-col gap-1.5">
              <label className="font-body font-bold text-[12px] text-text-primary">
                Konfirmasi Kata Sandi Baru
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-text-secondary">
                  <Lock size={16} />
                </div>
                <input
                  type={showConfirmPw ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang kata sandi baru"
                  className="w-full pl-9.5 pr-10 py-2.5 rounded-[12px] border border-gray-200 bg-gray-50/50 font-body text-[13px] text-text-primary focus:outline-none focus:border-brand-gold focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw(!showConfirmPw)}
                  className="absolute right-3 text-text-secondary hover:text-text-primary cursor-pointer p-1"
                >
                  {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-brand-gold hover:bg-brand-gold-dark text-white font-body font-bold text-[14px] rounded-[14px] shadow-sm active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Menyimpan Perubahan...</span>
              </>
            ) : (
              <>
                <Save size={18} />
                <span>Simpan Perubahan</span>
              </>
            )}
          </button>
        </form>
      </main>

      {/* Confirmation Modal on Discarding Unsaved Changes */}
      {isConfirmDiscardOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] p-6 shadow-elevated border border-gray-100/90 w-full max-w-[340px] text-center transform animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-amber-500/10 text-brand-gold flex items-center justify-center mx-auto mb-3.5 border border-brand-gold/30">
              <AlertTriangle size={28} />
            </div>
            <h3 className="font-heading font-black text-[17px] text-text-primary leading-snug mb-1.5">
              Perubahan Belum Disimpan
            </h3>
            <p className="font-body text-[12.5px] text-text-secondary leading-relaxed mb-6">
              Anda telah mengubah data profil. Apakah Anda ingin tetap lanjut mengedit atau membuang perubahan ini?
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => setIsConfirmDiscardOpen(false)}
                className="w-full py-3 bg-brand-gold hover:bg-brand-gold-dark text-white font-body font-bold text-[13.5px] rounded-[14px] shadow-sm active:scale-[0.99] transition-all cursor-pointer"
              >
                Lanjut Mengedit
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsConfirmDiscardOpen(false);
                  doGoBack();
                }}
                className="w-full py-2.5 bg-transparent hover:bg-red-50 text-brand-red font-body font-semibold text-[13px] rounded-[12px] transition-all cursor-pointer flex items-center justify-center gap-1.5 hover:underline"
              >
                Buang Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

