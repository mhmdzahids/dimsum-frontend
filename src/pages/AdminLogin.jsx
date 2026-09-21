import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShieldCheck, Lock, Eye, EyeOff, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import api from '../api/client';
import { getAdminDefaultRoute } from '../utils/adminAuth';

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto redirect if already logged in with admin token
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      const defaultDest = getAdminDefaultRoute();
      navigate(defaultDest, { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/api/auth/login', { email, password }, { auth: false });

      if (res.success && res.data?.token) {
        const user = res.data.user;
        if (user?.role === 'customer') {
          setError('Akses ditolak. Akun ini adalah akun pelanggan, bukan staf internal toko.');
          setLoading(false);
          return;
        }

        localStorage.setItem('adminToken', res.data.token);
        if (user) {
          localStorage.setItem('adminUser', JSON.stringify(user));
        }

        const defaultDest = getAdminDefaultRoute(user?.role);
        const destination = location.state?.from?.pathname || defaultDest;
        navigate(destination, { replace: true });
      } else {
        setError(res.error || 'Login gagal. Periksa kembali email dan password.');
      }
    } catch {
      setError('Koneksi ke server gagal. Periksa jaringan Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-cream flex flex-col justify-center items-center px-4 py-12 font-body selection:bg-brand-gold selection:text-white">
      <div className="w-full max-w-md">
        {/* Back link */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-text-secondary hover:text-brand-blue transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-elevated border border-gray-100">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-brand-blue/10 text-brand-blue rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xs">
              <ShieldCheck size={32} />
            </div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-brand-gold font-body block mb-1">
              Kasir & Manajemen POS
            </span>
            <h1 className="text-2xl font-bold font-heading text-text-primary">
              Portal Admin
            </h1>
            <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
              Masuk dengan akun admin untuk mengelola katalog, pesanan, kupon, dan banner.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
              <span className="leading-snug">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1.5">
                Email Admin
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@dimsum.id"
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all placeholder:text-gray-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 transition-all placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-text-primary transition-colors p-1"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 bg-brand-blue hover:bg-brand-blue-dark text-white rounded-xl font-semibold text-sm transition-all shadow-xs hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Memproses Masuk...</span>
                </>
              ) : (
                <>
                  <Lock size={16} />
                  <span>Masuk Portal Admin</span>
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="mt-8 pt-4 border-t border-gray-100 text-center">
            <p className="text-[11px] text-text-secondary">
              Akses terbatas hanya untuk personel operasional & kasir resmi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
