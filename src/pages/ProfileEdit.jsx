import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Save,
  ChevronRight
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import api from '../api/client';

export default function ProfileEdit() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, updateUser, isLoggedIn } = useAuth();

  // Redirect if not logged in (defensive fallback in addition to ProtectedRoute)
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/auth', { replace: true, state: { from: location } });
    }
  }, [isLoggedIn, navigate, location]);

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

  // Accordion state for Ubah Kata Sandi
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);

  // Dirty State Tracker ("mengubah walaupun satu huruf saja")
  const isDirty = (
    fullName !== initialName ||
    email !== initialEmail ||
    phone !== initialPhone ||
    Boolean(currentPassword || newPassword || confirmPassword)
  );

  // Sync state if user data loads asynchronously
  useEffect(() => {
    if (user && !isDirty) {
      setFullName(user.full_name || '');
      setEmail(user.email?.includes('@') ? user.email : '');
      setPhone(user.phone || (user.email && !user.email.includes('@') ? user.email : ''));
    }
  }, [user]);

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

      const res = await api.put('/api/auth/profile', payload);

      if (!res.success) {
        throw new Error(res.error || res.message || 'Gagal memperbarui profil.');
      }

      // Update context and persistent storage
      if (res.data) {
        updateUser(res.data);
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

  return (
    <div className="w-full max-w-[480px] mx-auto min-h-screen bg-bg-cream flex flex-col shadow-2xl overflow-x-clip relative font-body">
      {/* 1. Header: Samakan persis dengan header Profil (warna #4E8298, pola Anyaman Bambu 8%, tinggi, tombol kembali). Judul "Detail Akun" memakai Poppins bold */}
      <header className="w-full bg-brand-blue text-white relative pt-3 pb-8 px-5 overflow-hidden transition-all">
        {/* Motif Anyaman Bambu SVG (Opacity 8%) */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.08] pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="bamboo-weave-profile-edit" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M0 10 L10 0 L20 10 L10 20 Z" fill="none" stroke="#FFFFFF" strokeWidth="1.2" />
              <path d="M10 10 L0 20 M20 0 L10 10" fill="none" stroke="#FFFFFF" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#bamboo-weave-profile-edit)" />
        </svg>

        {/* Top Bar: Tombol Kembali, Judul Detail Akun */}
        <div className="relative z-10 flex items-center justify-between">
          <button
            type="button"
            onClick={handleAttemptBack}
            className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 transition-all flex items-center justify-center text-white cursor-pointer"
            aria-label="Kembali"
          >
            <ArrowLeft size={19} strokeWidth={2.2} />
          </button>
          <h1 className="font-body font-bold text-[18px] text-white tracking-wide">
            Detail Akun
          </h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="w-full flex-1 flex flex-col">
        {/* 2. Main Sheet: Latar Cream, Radius Atas 24px menimpa Header (px-5 sama persis dengan Profile.jsx) */}
        <main className="w-full bg-bg-cream rounded-t-sheet -mt-5 relative z-20 px-5 pt-5 pb-32 flex-1 flex flex-col gap-5">
          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="bg-red-50 border border-brand-red/30 rounded-[12px] p-3.5 flex items-start gap-2.5 text-brand-red animate-in fade-in duration-200">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span className="font-body text-[13px] font-medium leading-snug">
                {errorMessage}
              </span>
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-[12px] p-3.5 flex items-start gap-2.5 text-emerald-800 animate-in fade-in duration-200">
              <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-600" />
              <span className="font-body text-[13px] font-semibold leading-snug">
                {successMessage}
              </span>
            </div>
          )}

          {/* Section 1: Informasi Pribadi (Judul biru #4E8298 Poppins semibold, tanpa ikon dan tanpa garis) */}
          <section aria-labelledby="personal-info-heading">
            <h2
              id="personal-info-heading"
              className="font-heading font-bold text-[15px] text-[#4E8298] mb-3"
            >
              Informasi Pribadi
            </h2>
            <div className="card-surface p-4 flex flex-col gap-4">
              {/* Field: Nama Lengkap */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="full-name-input"
                  className="font-body font-medium text-[13px] text-text-primary"
                >
                  Nama Lengkap <span className="text-brand-red">*</span>
                </label>
                <input
                  id="full-name-input"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => {
                    const filtered = e.target.value.replace(/[^a-zA-Z0-9\s.'-]/g, '').slice(0, 70);
                    setFullName(filtered);
                  }}
                  placeholder="Masukkan nama lengkap"
                  className="w-full min-h-[48px] px-3.5 py-2.5 rounded-input border border-[#D1D5DB] bg-white font-body text-[15px] text-text-primary placeholder:text-gray-400 focus:outline-none focus:border-2 focus:border-[#4E8298] transition-all"
                />
              </div>

              {/* Field: Alamat Email (opsional) */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="email-input"
                  className="font-body font-medium text-[13px] text-text-primary"
                >
                  Alamat Email (opsional)
                </label>
                <input
                  id="email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contoh@email.com"
                  className="w-full min-h-[48px] px-3.5 py-2.5 rounded-input border border-[#D1D5DB] bg-white font-body text-[15px] text-text-primary placeholder:text-gray-400 focus:outline-none focus:border-2 focus:border-[#4E8298] transition-all"
                />
              </div>

              {/* Field: Nomor WhatsApp / Telepon */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="phone-input"
                  className="font-body font-medium text-[13px] text-text-primary"
                >
                  Nomor WhatsApp / Telepon
                </label>
                <input
                  id="phone-input"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    const filtered = e.target.value.replace(/[^\d\+\-\s]/g, '').slice(0, 20);
                    setPhone(filtered);
                  }}
                  placeholder="08123456789"
                  className="w-full min-h-[48px] px-3.5 py-2.5 rounded-input border border-[#D1D5DB] bg-white font-body text-[15px] text-text-primary placeholder:text-gray-400 focus:outline-none focus:border-2 focus:border-[#4E8298] transition-all"
                />
                <span className="text-[13px] text-text-secondary font-body mt-0.5">
                  Nomor WhatsApp digunakan untuk konfirmasi pesanan dan pengiriman invoice.
                </span>
              </div>
            </div>
          </section>

          {/* Section 2: Ubah Kata Sandi (Tampil sebagai satu baris yang bisa diketuk: teks + chevron) */}
          <section aria-labelledby="password-heading">
            <div className="card-surface overflow-hidden">
              <button
                type="button"
                id="password-heading"
                onClick={() => setIsPasswordOpen((prev) => !prev)}
                className="w-full min-h-[48px] px-4 py-3.5 flex items-center justify-between cursor-pointer transition-colors hover:bg-gray-50/50"
                aria-expanded={isPasswordOpen}
              >
                <span className="font-body font-semibold text-[15px] text-[#4E8298]">
                  Ubah Kata Sandi
                </span>
                <ChevronRight
                  size={18}
                  className={`text-[#4E8298] transition-transform duration-200 ${isPasswordOpen ? 'rotate-90' : ''
                    }`}
                />
              </button>

              {isPasswordOpen && (
                <div className="px-4 pb-4 pt-2 flex flex-col gap-4 border-t border-gray-100">
                  {/* Kata Sandi Saat Ini */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="current-pw-input"
                      className="font-body font-medium text-[13px] text-text-primary"
                    >
                      Kata Sandi Saat Ini
                    </label>
                    <div className="relative flex items-center">
                      <input
                        id="current-pw-input"
                        type={showCurrentPw ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Masukkan kata sandi lama"
                        className="w-full min-h-[48px] pl-3.5 pr-11 py-2.5 rounded-input border border-[#D1D5DB] bg-white font-body text-[15px] text-text-primary placeholder:text-gray-400 focus:outline-none focus:border-2 focus:border-[#4E8298] transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPw(!showCurrentPw)}
                        className="absolute right-3.5 text-text-secondary hover:text-text-primary cursor-pointer p-1"
                        aria-label={showCurrentPw ? 'Sembunyikan kata sandi saat ini' : 'Lihat kata sandi saat ini'}
                      >
                        {showCurrentPw ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Kata Sandi Baru */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="new-pw-input"
                      className="font-body font-medium text-[13px] text-text-primary"
                    >
                      Kata Sandi Baru
                    </label>
                    <div className="relative flex items-center">
                      <input
                        id="new-pw-input"
                        type={showNewPw ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimal 6 karakter"
                        className="w-full min-h-[48px] pl-3.5 pr-11 py-2.5 rounded-input border border-[#D1D5DB] bg-white font-body text-[15px] text-text-primary placeholder:text-gray-400 focus:outline-none focus:border-2 focus:border-[#4E8298] transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw(!showNewPw)}
                        className="absolute right-3.5 text-text-secondary hover:text-text-primary cursor-pointer p-1"
                        aria-label={showNewPw ? 'Sembunyikan kata sandi baru' : 'Lihat kata sandi baru'}
                      >
                        {showNewPw ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Konfirmasi Kata Sandi Baru */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="confirm-pw-input"
                      className="font-body font-medium text-[13px] text-text-primary"
                    >
                      Konfirmasi Kata Sandi Baru
                    </label>
                    <div className="relative flex items-center">
                      <input
                        id="confirm-pw-input"
                        type={showConfirmPw ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Ketik ulang kata sandi baru"
                        className="w-full min-h-[48px] pl-3.5 pr-11 py-2.5 rounded-input border border-[#D1D5DB] bg-white font-body text-[15px] text-text-primary placeholder:text-gray-400 focus:outline-none focus:border-2 focus:border-[#4E8298] transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPw(!showConfirmPw)}
                        className="absolute right-3.5 text-text-secondary hover:text-text-primary cursor-pointer p-1"
                        aria-label={showConfirmPw ? 'Sembunyikan konfirmasi kata sandi' : 'Lihat konfirmasi kata sandi'}
                      >
                        {showConfirmPw ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </main>

        {/* 3. Sticky Bottom Bar: Tombol "Simpan Perubahan" (gold #C9A23D, radius 12px, nonaktif #D1D5DB sampai ada perubahan, lengket di bawah layar dengan padding aman untuk iOS) */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white/95 backdrop-blur-md border-t border-[#EAEAEA] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] z-40 px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="submit"
            disabled={!isDirty || isLoading}
            className={`w-full min-h-[48px] py-3 px-4 font-body font-bold text-[15px] rounded-btn transition-all flex items-center justify-center gap-2 ${!isDirty || isLoading
              ? 'bg-[#D1D5DB] text-white cursor-not-allowed border-none shadow-none'
              : 'bg-[#C9A23D] hover:bg-[#A8862E] text-white shadow-xs active:scale-[0.99] cursor-pointer'
              }`}
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
        </div>
      </form>

      {/* Confirmation Modal on Discarding Unsaved Changes */}
      {isConfirmDiscardOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] p-6 shadow-elevated border border-gray-100/90 w-full max-w-[340px] text-center transform animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-amber-500/10 text-brand-gold flex items-center justify-center mx-auto mb-3.5 border border-brand-gold/30">
              <AlertTriangle size={28} />
            </div>
            <h3 className="font-body font-bold text-[17px] text-text-primary leading-snug mb-1.5">
              Perubahan Belum Disimpan
            </h3>
            <p className="font-body text-[15px] text-text-secondary leading-relaxed mb-6">
              Anda telah mengubah data profil. Apakah Anda ingin tetap lanjut mengedit atau membuang perubahan ini?
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => setIsConfirmDiscardOpen(false)}
                className="w-full min-h-[44px] py-2.5 bg-[#C9A23D] hover:bg-[#A8862E] text-white font-body font-bold text-[15px] rounded-[12px] shadow-sm active:scale-[0.99] transition-all cursor-pointer"
              >
                Lanjut Mengedit
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsConfirmDiscardOpen(false);
                  doGoBack();
                }}
                className="w-full min-h-[44px] py-2 bg-transparent hover:bg-red-50 text-brand-red font-body font-medium text-[15px] rounded-[12px] transition-all cursor-pointer flex items-center justify-center gap-1.5 hover:underline"
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
