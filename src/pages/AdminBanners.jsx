import React, { useState, useEffect, useRef } from 'react';
import { 
  Image as ImageIcon, 
  UploadCloud, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Sparkles,
  Eye,
  Calendar
} from 'lucide-react';
import api from '../api/client';

export default function AdminBanners() {
  const [banners, setBanners] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef(null);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/banners', { auth: 'admin' });
      if (res.success && Array.isArray(res.data)) {
        setBanners(res.data);
      }
    } catch {
      setErrorMsg('Gagal memuat daftar banner.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setErrorMsg('');
    }
  };

  const addBanner = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Silakan pilih file banner terlebih dahulu.');
      return;
    }
    
    setUploading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const res = await api.upload('/api/banners', formData, { auth: 'admin' });
      if (res.success) {
        setSuccessMsg('Banner promosi baru berhasil diunggah dan langsung tayang di beranda pelanggan!');
        setSelectedFile(null);
        setPreviewUrl('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchBanners();
      } else {
        setErrorMsg(res.error || 'Gagal menambahkan banner.');
      }
    } catch {
      setErrorMsg('Terjadi kendala jaringan saat mengunggah banner.');
    } finally {
      setUploading(false);
    }
  };

  const deleteBanner = async (id) => {
    if (!window.confirm('Yakin ingin menghapus banner ini dari beranda pelanggan?')) return;
    try {
      const res = await api.delete(`/api/banners/${id}`, { auth: 'admin' });
      if (res.success) {
        setSuccessMsg('Banner berhasil dihapus.');
        fetchBanners();
      } else {
        setErrorMsg(res.error || 'Gagal menghapus banner.');
      }
    } catch {
      setErrorMsg('Terjadi kendala saat menghapus banner.');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 sm:p-7 rounded-card border border-bg-cream-dark/80 shadow-card">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-heading flex items-center gap-2.5">
            <ImageIcon className="text-brand-blue" size={26} />
            <span>Banner Promosi</span>
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Kelola banner promosi beranda.
          </p>
        </div>

        <button
          onClick={fetchBanners}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-btn border border-bg-cream-dark/90 bg-white text-text-secondary hover:text-text-primary hover:bg-bg-cream/60 text-xs font-bold transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 animate-fadeIn">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-800 animate-fadeIn">
          <AlertCircle size={16} className="text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Upload Banner Section */}
      <div className="bg-white p-6 rounded-card border border-bg-cream-dark/80 shadow-card">
        <h2 className="text-base font-bold text-text-primary font-heading mb-3 flex items-center gap-2">
          <UploadCloud size={18} className="text-brand-blue" />
          <span>Unggah Banner Baru</span>
        </h2>

        <form onSubmit={addBanner} className="space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-brand-blue/30 hover:border-brand-blue/60 bg-bg-cream/30 hover:bg-bg-cream/60 rounded-card p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all"
          >
            {previewUrl ? (
              <div className="relative w-full max-w-xl h-44 rounded-xl overflow-hidden shadow-xs border border-bg-cream-dark/80">
                <img src={previewUrl} alt="Preview Banner" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-text-primary/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <span className="bg-white text-text-primary text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                    Klik untuk Ganti Gambar
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-blue/10 text-brand-blue flex items-center justify-center mb-2 shadow-xs">
                  <UploadCloud size={24} />
                </div>
                <p className="text-xs font-bold text-text-primary">
                  Klik untuk memilih file banner gambar
                </p>
                <p className="text-[11px] text-text-secondary mt-1">
                  Mendukung format WebP, PNG, JPG (Maksimal 5MB)
                </p>
              </div>
            )}
            <input
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </div>

          <div className="flex justify-end gap-2">
            {selectedFile && (
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setPreviewUrl('');
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="px-4 py-2.5 rounded-btn border border-bg-cream-dark text-text-secondary hover:bg-bg-cream text-xs font-semibold"
              >
                Batal
              </button>
            )}
            <button
              type="submit"
              disabled={!selectedFile || uploading}
              className="px-5 py-2.5 rounded-btn bg-brand-blue hover:bg-brand-blue-dark text-white text-xs font-bold shadow-xs hover:shadow-md transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {uploading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Mengunggah...</span>
                </>
              ) : (
                <>
                  <UploadCloud size={15} />
                  <span>Simpan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Active Banners Grid */}
      <div className="bg-white p-6 rounded-card border border-bg-cream-dark/80 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-text-primary font-heading">
              Daftar Banner
            </h2>
          </div>
          <span className="text-xs font-bold text-brand-blue bg-brand-blue/10 px-2.5 py-1 rounded-full">
            {banners.length} Aktif
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-text-secondary flex flex-col items-center gap-2">
            <RefreshCw size={24} className="animate-spin text-brand-blue" />
            <span>Memuat banner...</span>
          </div>
        ) : banners.length === 0 ? (
          <div className="py-12 text-center text-xs text-text-secondary">
            Belum ada banner promosi yang diunggah.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {banners.map((b) => (
              <div
                key={b.id}
                className="rounded-2xl border border-bg-cream-dark/90 overflow-hidden bg-bg-cream/20 shadow-xs hover:shadow-card transition-all flex flex-col justify-between"
              >
                <div className="relative aspect-[21/9] w-full bg-brand-blue-light/10 overflow-hidden">
                  <img
                    src={b.image_url}
                    alt="Banner Promosi"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white shadow-xs">
                      Tayang
                    </span>
                  </div>
                </div>

                <div className="p-3.5 flex items-center justify-between gap-3 bg-white">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-text-primary truncate">
                      {b.filename || 'Promo Dimsum'}
                    </p>
                    <p className="text-[10px] text-text-secondary flex items-center gap-1 mt-0.5">
                      <Calendar size={11} />
                      <span>{new Date(b.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => deleteBanner(b.id)}
                    className="p-2 rounded-xl text-text-secondary hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                    title="Hapus Banner"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
