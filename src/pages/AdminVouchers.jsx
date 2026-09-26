import React, { useState, useEffect } from 'react';
import {
  Ticket,
  Plus,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  Search,
  Percent,
  Coins,
  Calendar,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Info,
  Eye,
  EyeOff
} from 'lucide-react';
import api from '../api/client';

export default function AdminVouchers() {
  // Vouchers state
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedCode, setCopiedCode] = useState('');

  // Create Form state
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('percent'); // 'percent' | 'fixed'
  const [discountValue, setDiscountValue] = useState('');
  const [minSpend, setMinSpend] = useState('0');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isActive, setIsActive] = useState(true);

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/vouchers', { auth: 'admin' });
      if (res.success && Array.isArray(res.data)) {
        setVouchers(res.data || []);
      }
    } catch (e) {
      console.error("Error fetching vouchers", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const handleCreateVoucher = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!code.trim()) {
      setFormError('Kode promo wajib diisi');
      return;
    }
    if (!discountValue || parseFloat(discountValue) <= 0) {
      setFormError('Nilai diskon harus lebih besar dari 0');
      return;
    }
    if (discountType === 'percent' && parseFloat(discountValue) > 100) {
      setFormError('Diskon persentase tidak boleh melebihi 100%');
      return;
    }

    setFormSubmitting(true);
    try {
      const payload = {
        code: code.trim().toUpperCase(),
        discount_type: discountType,
        discount_value: parseFloat(discountValue),
        min_spend: parseFloat(minSpend || '0'),
        max_discount: maxDiscount ? parseFloat(maxDiscount) : null,
        usage_limit: usageLimit ? parseInt(usageLimit) : null,
        start_date: startDate ? new Date(startDate).toISOString() : null,
        end_date: endDate ? new Date(endDate).toISOString() : null,
        is_public: isPublic,
        is_active: isActive
      };

      const res = await api.post('/api/vouchers', payload, { auth: 'admin' });

      if (res.success && res.data) {
        setFormSuccess(`Voucher ${res.data.code} berhasil dibuat!`);
        setCode('');
        setDiscountValue('');
        setMinSpend('0');
        setMaxDiscount('');
        setUsageLimit('');
        setStartDate('');
        setEndDate('');
        setIsPublic(true);
        fetchVouchers();
      } else {
        setFormError(res.error || 'Gagal membuat voucher');
      }
    } catch {
      setFormError('Terjadi kesalahan jaringan saat membuat voucher');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await api.patch(`/api/vouchers/${id}/toggle`, {}, { auth: 'admin' });
      if (res.success) {
        fetchVouchers();
      } else {
        alert(res.error || 'Gagal mengubah status');
      }
    } catch (e) {
      console.error(e);
      alert('Koneksi ke server gagal');
    }
  };

  const handleTogglePublic = async (id) => {
    try {
      const res = await api.patch(`/api/vouchers/${id}/toggle-public`, {}, { auth: 'admin' });
      if (res.success) {
        fetchVouchers();
      } else {
        alert(res.error || 'Gagal mengubah visibilitas');
      }
    } catch (e) {
      console.error(e);
      alert('Koneksi ke server gagal');
    }
  };

  const handleDelete = async (id, voucherCode) => {
    if (!window.confirm(`Yakin ingin menghapus voucher ${voucherCode}?`)) return;
    try {
      const res = await api.delete(`/api/vouchers/${id}`, { auth: 'admin' });
      if (res.success) {
        fetchVouchers();
      } else {
        alert(res.error || 'Gagal menghapus voucher');
      }
    } catch (e) {
      console.error(e);
      alert('Koneksi ke server gagal');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const formatCurrency = (val) => {
    return 'Rp' + Number(val || 0).toLocaleString('id-ID');
  };

  const filteredVouchers = vouchers.filter((v) =>
    v.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn">

      <button
        onClick={fetchVouchers}
        disabled={loading}
        className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-gray-50 shadow-xs transition-colors"
      >
        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        Refresh
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Buat Voucher Baru (Left Column: 5/12) */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs">
            <h2 className="text-base font-bold font-heading text-text-primary mb-4 flex items-center gap-2">
              <Plus size={18} className="text-brand-blue" />
              Buat Voucher Baru
            </h2>

            {formSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <Check size={16} />
                <span>{formSuccess}</span>
              </div>
            )}

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateVoucher} className="space-y-4">
              {/* Kode Promo */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Kode Promo <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="CONTOH: HEMAT20"
                    maxLength={50}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-bold uppercase tracking-wider text-brand-blue focus:outline-none focus:border-brand-blue"
                  />
                </div>
              </div>

              {/* Tipe Diskon (Tab Segmented) */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Tipe Diskon <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setDiscountType('percent')}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${discountType === 'percent'
                        ? 'bg-white text-brand-blue shadow-xs'
                        : 'text-text-secondary hover:text-text-primary'
                      }`}
                  >
                    <Percent size={14} />
                    Persentase
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('fixed')}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${discountType === 'fixed'
                        ? 'bg-white text-brand-blue shadow-xs'
                        : 'text-text-secondary hover:text-text-primary'
                      }`}
                  >
                    <Coins size={14} />
                    Nominal (Rp)
                  </button>
                </div>
              </div>

              {/* Nilai Diskon */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Besar Potongan ({discountType === 'percent' ? '%' : 'Rupiah'}) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="1"
                    max={discountType === 'percent' ? '100' : '10000000'}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === 'percent' ? '20' : '10000'}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-text-primary focus:outline-none focus:border-brand-blue"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-semibold text-text-secondary">
                    {discountType === 'percent' ? '%' : 'IDR'}
                  </span>
                </div>
              </div>

              {/* Grid Minimal Belanja & Maksimal Diskon */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Min. Belanja (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={minSpend}
                    onChange={(e) => setMinSpend(e.target.value)}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Maks. Diskon (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={discountType !== 'percent'}
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(e.target.value)}
                    placeholder={discountType === 'percent' ? 'Contoh: 15000' : 'Hanya tipe %'}
                    className={`w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-blue ${discountType !== 'percent' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''
                      }`}
                  />
                </div>
              </div>

              {/* Batas Kuota Pemakaian */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Batas Kuota Pemakaian (Kosongkan jika tanpa batas)
                </label>
                <input
                  type="number"
                  min="1"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value)}
                  placeholder="Contoh: 50"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-blue"
                />
              </div>

              {/* Periode Berlaku */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Tanggal Mulai (Opsional)
                  </label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Tanggal Berakhir (Opsional)
                  </label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-brand-blue"
                  />
                </div>
              </div>

              {/* Visibilitas Voucher */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <span className="text-xs font-bold text-text-primary block">Visibilitas</span>
                  <span className="text-[11px] text-text-secondary">
                    {isPublic ? 'Publik (tampil di halaman promo)' : 'Khusus (hanya via kode)'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPublic(!isPublic)}
                  className="text-brand-blue hover:text-brand-blue-dark transition-colors"
                >
                  {isPublic ? (
                    <ToggleRight size={32} className="text-brand-blue" />
                  ) : (
                    <ToggleLeft size={32} className="text-gray-400" />
                  )}
                </button>
              </div>

              {/* Status Aktif */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <span className="text-xs font-bold text-text-primary block">Status Voucher</span>
                  <span className="text-[11px] text-text-secondary">
                    {isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className="text-brand-blue hover:text-brand-blue-dark transition-colors"
                >
                  {isActive ? (
                    <ToggleRight size={32} className="text-brand-blue" />
                  ) : (
                    <ToggleLeft size={32} className="text-gray-400" />
                  )}
                </button>
              </div>

              <button
                type="submit"
                disabled={formSubmitting}
                className="w-full py-3 bg-brand-blue text-white rounded-xl font-semibold text-sm hover:bg-brand-blue-dark transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Plus size={16} />
                {formSubmitting ? 'Menyimpan...' : 'Simpan Voucher'}
              </button>
            </form>
          </div>
        </div>

        {/* Daftar Voucher (Right Column: 7/12) */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="text-base font-bold font-heading text-text-primary">
                  Daftar Voucher ({vouchers.length})
                </h2>
              </div>
              {/* Search input */}
              <div className="relative w-full sm:w-48">
                <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari kode..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-brand-blue"
                />
              </div>
            </div>

            {filteredVouchers.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
                <Ticket size={36} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm font-semibold text-text-secondary">
                  {searchTerm ? 'Tidak ada voucher yang cocok dengan pencarian' : 'Belum ada voucher promo'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Gunakan formulir di sebelah kiri untuk membuat kode voucher pertama Anda.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredVouchers.map((v) => {
                  const isLimitReached = v.usage_limit && v.used_count >= v.usage_limit;
                  const percentUsed = v.usage_limit ? Math.min(100, Math.round((v.used_count / v.usage_limit) * 100)) : 0;

                  return (
                    <div
                      key={v.id}
                      className={`p-4 rounded-2xl border transition-all ${v.is_active && !isLimitReached
                          ? 'bg-white border-gray-200 hover:border-brand-blue/40 shadow-xs'
                          : 'bg-gray-50/70 border-gray-200 opacity-80'
                        }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Left: Code badge & discount details */}
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => copyToClipboard(v.code)}
                            className="group flex items-center gap-1.5 px-3 py-1.5 bg-brand-blue/10 hover:bg-brand-blue/20 text-brand-blue rounded-xl font-bold font-heading text-sm tracking-wider transition-colors"
                            title="Klik untuk menyalin kode"
                          >
                            <span>{v.code}</span>
                            {copiedCode === v.code ? (
                              <Check size={14} className="text-emerald-600" />
                            ) : (
                              <Copy size={13} className="text-brand-blue opacity-60 group-hover:opacity-100" />
                            )}
                          </button>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-text-primary">
                                {v.discount_type === 'percent'
                                  ? `Diskon ${parseFloat(v.discount_value)}%`
                                  : `Potongan ${formatCurrency(v.discount_value)}`}
                              </span>
                              {v.min_spend > 0 && (
                                <span className="text-[11px] text-text-secondary">
                                  • Min. Belanja {formatCurrency(v.min_spend)}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 mt-1 text-[11px] text-text-secondary">
                              {v.max_discount && (
                                <span>Maks. {formatCurrency(v.max_discount)}</span>
                              )}
                              <span>
                                Dibuat: {new Date(v.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Usage count, status, & actions */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                          {/* Quota indicator */}
                          <div className="text-right">
                            <div className="text-xs font-semibold text-text-primary">
                              Terpakai: <span className="text-brand-blue font-bold">{v.used_count}</span>
                              {v.usage_limit ? ` / ${v.usage_limit}` : 'x (Tanpa Batas)'}
                            </div>
                            {v.usage_limit && (
                              <div className="w-24 bg-gray-200 h-1.5 rounded-full mt-1 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${percentUsed >= 100 ? 'bg-red-500' : 'bg-brand-blue'
                                    }`}
                                  style={{ width: `${percentUsed}%` }}
                                />
                              </div>
                            )}
                          </div>

                          {/* Toggle public visibility button */}
                          <button
                            type="button"
                            onClick={() => handleTogglePublic(v.id)}
                            title={v.is_public !== false ? 'Klik untuk sembunyikan dari daftar publik' : 'Klik untuk tampilkan di daftar publik'}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${v.is_public !== false
                                ? 'bg-blue-50 text-brand-blue border border-blue-200 hover:bg-blue-100'
                                : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                              }`}
                          >
                            {v.is_public !== false ? <Eye size={13} /> : <EyeOff size={13} />}
                            <span>{v.is_public !== false ? 'Publik' : 'Tersembunyi'}</span>
                          </button>

                          {/* Toggle active button */}
                          <button
                            type="button"
                            onClick={() => handleToggle(v.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${v.is_active
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
                              }`}
                          >
                            {v.is_active ? 'Aktif' : 'Nonaktif'}
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => handleDelete(v.id, v.code)}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                            title="Hapus voucher"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
