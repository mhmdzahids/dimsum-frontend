import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  QrCode,
  Package,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Check,
  Copy,
  Clock,
  User,
  Calendar,
  Sparkles,
  Info,
  Layers,
  ArrowDown,
  Camera,
  CameraOff,
  FlipHorizontal,
  Upload,
  ScanLine,
  Smartphone,
  ExternalLink,
  Factory,
  ArrowUpRight
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import jsQR from 'jsqr';
import api from '../api/client';

export default function AdminScanQR() {
  // Products & Stock Monitor State
  const [products, setProducts] = useState([]);
  const [stockLoading, setStockLoading] = useState(false);

  // Simulation Test State
  const [simProduct, setSimProduct] = useState('');
  const [simQty, setSimQty] = useState(1);
  const [simCustomer, setSimCustomer] = useState('Budi Penguji QR');
  const [simLoading, setSimLoading] = useState(false);
  const [simResult, setSimResult] = useState(null);
  const [simError, setSimError] = useState('');

  // Scanner & Verification State
  const [scanMode, setScanMode] = useState('camera'); // 'camera' | 'upload' | 'manual'
  const [qrTokenInput, setQrTokenInput] = useState('');
  const [checkingOrder, setCheckingOrder] = useState(false);
  const [previewOrder, setPreviewOrder] = useState(null);
  const [previewLot, setPreviewLot] = useState(null);
  const [previewError, setPreviewError] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState(null);
  const [verifyError, setVerifyError] = useState('');

  // Camera Scanner State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (back) | 'user' (front)

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  // Recent Orders List State
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'paid' | 'completed'

  const [copiedToken, setCopiedToken] = useState('');

  const fetchProducts = async () => {
    setStockLoading(true);
    try {
      const res = await api.get('/api/products');
      if (res.success && Array.isArray(res.data)) {
        setProducts(res.data || []);
        if (res.data && res.data.length > 0 && !simProduct) {
          setSimProduct(res.data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setStockLoading(false);
    }
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await api.get('/api/orders', { auth: 'admin' });
      if (res.success && Array.isArray(res.data)) {
        setOrders(res.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, []);

  // Handle Simulation Order Creation
  const handleSimulateOrder = async (e) => {
    e.preventDefault();
    if (!simProduct) return;
    setSimLoading(true);
    setSimError('');
    setSimResult(null);

    try {
      const res = await api.post('/api/orders/simulate-test', {
        product_id: simProduct,
        quantity: parseInt(simQty),
        customer_name: simCustomer
      }, { auth: 'admin' });

      if (res.success && res.data) {
        setSimResult(res.data);
        setQrTokenInput(res.data.order.qr_token);
        fetchProducts();
        fetchOrders();
      } else {
        setSimError(res.error || 'Gagal membuat pesanan simulasi');
      }
    } catch {
      setSimError('Terjadi kesalahan koneksi server');
    } finally {
      setSimLoading(false);
    }
  };

  // Preview Order or Production Lot by QR Token/Payload
  const handleCheckQR = async (tokenToCheck) => {
    const rawToken = tokenToCheck || qrTokenInput;
    if (!rawToken || !rawToken.trim()) {
      setPreviewError('Masukkan atau scan QR token terlebih dahulu');
      return;
    }
    setCheckingOrder(true);
    setPreviewError('');
    setVerifySuccess(null);
    setVerifyError('');
    setPreviewOrder(null);
    setPreviewLot(null);

    const clean = rawToken.trim();

    // Check if it's a LOT STICKER QR (BATCH:...|LOT:...)
    if (clean.startsWith('BATCH:') || clean.includes('|LOT:')) {
      try {
        let batchCode = '';
        let lotInfo = '';
        let qtyInfo = '25';
        let skuInfo = '';
        clean.split('|').forEach(part => {
          if (part.startsWith('BATCH:')) batchCode = part.replace('BATCH:', '');
          if (part.startsWith('LOT:')) lotInfo = part.replace('LOT:', '');
          if (part.startsWith('QTY:')) qtyInfo = part.replace('QTY:', '');
          if (part.startsWith('SKU:')) skuInfo = part.replace('SKU:', '');
        });

        const res = await api.get(`/api/inventory/batches/code/${encodeURIComponent(batchCode || clean)}`, { auth: 'admin' });
        if (res.success && res.data) {
          setPreviewLot({
            ...res.data,
            scanned_lot_info: lotInfo,
            scanned_lot_qty: qtyInfo,
            scanned_sku: skuInfo
          });
        } else {
          setPreviewError(res.error || 'Batch produksi dari stiker LOT tidak ditemukan di database.');
        }
      } catch {
        setPreviewError('Koneksi gagal saat memverifikasi stiker LOT produksi.');
      } finally {
        setCheckingOrder(false);
      }
      return;
    }

    // Standard Customer Order QR
    try {
      const res = await api.get(`/api/orders/check-qr/${encodeURIComponent(clean)}`, { auth: 'admin' });
      if (res.success && res.data) {
        setPreviewOrder(res.data);
      } else {
        setPreviewError(res.error || 'Pesanan dengan QR tersebut tidak ditemukan');
      }
    } catch {
      setPreviewError('Koneksi gagal memeriksa kode QR pesanan');
    } finally {
      setCheckingOrder(false);
    }
  };

  // Cashier Verifies & Completes Pickup
  const handleVerifyPickup = async () => {
    const targetToken = previewOrder ? previewOrder.qr_token : qrTokenInput.trim();
    if (!targetToken) {
      setVerifyError('QR token tidak tersedia');
      return;
    }

    setVerifyLoading(true);
    setVerifyError('');
    try {
      const res = await api.post('/api/orders/verify', { qr_token: targetToken }, { auth: 'admin' });
      if (res.success) {
        setVerifySuccess(res.data || res);
        setPreviewOrder(res.data);
        fetchProducts();
        fetchOrders();
      } else {
        setVerifyError(res.error || 'Gagal memverifikasi pengambilan');
      }
    } catch {
      setVerifyError('Terjadi kesalahan jaringan saat verifikasi');
    } finally {
      setVerifyLoading(false);
    }
  };

  // --- CAMERA SCANNER METHODS ---
  const bindVideoRef = (el) => {
    videoRef.current = el;
    if (el && streamRef.current) {
      if (el.srcObject !== streamRef.current) {
        el.srcObject = streamRef.current;
      }
      el.setAttribute('playsinline', 'true');
      el.setAttribute('muted', 'true');
      el.play().catch((e) => console.warn("Video play error:", e));
    }
  };

  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      videoRef.current.setAttribute('playsinline', 'true');
      videoRef.current.setAttribute('muted', 'true');
      videoRef.current.play().catch((e) => console.warn("Video play error:", e));
    }
  }, [isCameraActive]);

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setCameraLoading(false);
  };

  const startCamera = async (targetFacing = facingMode) => {
    stopCamera();
    setCameraError('');
    setCameraLoading(true);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Browser Anda tidak mendukung akses kamera atau halaman ini tidak dimuat via protokol HTTPS aman.');
      setCameraLoading(false);
      return;
    }

    try {
      // Mobile-friendly constraints: avoid rigid landscape resolution constraints
      const constraints = {
        video: {
          facingMode: { ideal: targetFacing }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Mount the video container in the DOM
      setIsCameraActive(true);
      setCameraLoading(false);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('muted', 'true');
        try {
          await videoRef.current.play();
        } catch (e) {
          console.warn("Video play error:", e);
        }
      }

      animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraLoading(false);
      setIsCameraActive(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Izin akses kamera ditolak. Silakan izinkan akses kamera di setelan browser atau HP Anda.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('Kamera tidak ditemukan pada perangkat ini.');
      } else {
        setCameraError(`Gagal membuka kamera: ${err.message || err.name}`);
      }
    }
  };

  const scanVideoFrame = () => {
    if (
      !videoRef.current ||
      videoRef.current.readyState < 2 ||
      !videoRef.current.videoWidth ||
      !videoRef.current.videoHeight
    ) {
      animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
      return;
    }

    const video = videoRef.current;
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert'
    });

    if (qrCode && qrCode.data && qrCode.data.trim()) {
      const detectedToken = qrCode.data.trim();
      if (navigator.vibrate) {
        try { navigator.vibrate(100); } catch (_) { }
      }
      stopCamera();
      setQrTokenInput(detectedToken);
      handleCheckQR(detectedToken);
      return;
    }

    animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
  };

  const toggleFacingMode = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    if (isCameraActive) {
      startCamera(nextFacing);
    }
  };

  // Handle QR Image File Upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data && code.data.trim()) {
          const detected = code.data.trim();
          setQrTokenInput(detected);
          handleCheckQR(detected);
        } else {
          setPreviewError('QR Code tidak dapat dibaca dari gambar yang diunggah. Pastikan QR code terlihat jelas dan tidak buram.');
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(text);
    setTimeout(() => setCopiedToken(''), 2000);
  };

  const formatCurrency = (val) => {
    return 'Rp' + Number(val || 0).toLocaleString('id-ID');
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'all') return true;
    return o.status === statusFilter;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. LIVE STOCK MONITOR (Papan Pantau Stok Terkini) */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => { fetchProducts(); fetchOrders(); }}
          disabled={stockLoading || ordersLoading}
          className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-gray-50 shadow-xs transition-colors"
        >
          <RefreshCw size={14} className={stockLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>
      <section className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold font-heading text-text-primary flex items-center gap-2">
              <Package size={18} className="text-brand-blue" />
              Stok Terkini
            </h2>
          </div>
          <span className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Live Database
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {products.map((p) => {
            const isLow = p.stock_qty <= 5;
            const isOut = p.stock_qty <= 0;
            return (
              <div
                key={p.id}
                className={`p-3.5 rounded-2xl border text-center transition-all ${isOut
                  ? 'bg-red-50/50 border-red-200'
                  : isLow
                    ? 'bg-amber-50/50 border-amber-200'
                    : 'bg-gray-50/80 border-gray-200'
                  }`}
              >
                <p className="text-xs font-semibold text-text-primary truncate" title={p.name}>
                  {p.name}
                </p>
                <div className="text-2xl font-bold font-heading mt-1 text-brand-blue">
                  {p.stock_qty}
                </div>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md mt-1 inline-block ${isOut
                    ? 'bg-red-100 text-red-700'
                    : isLow
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                    }`}
                >
                  {isOut ? 'Habis' : isLow ? 'Stok Kritis' : 'Tersedia'}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. DUA KOLOM: SIMULATOR PESANAN (Kiri) & SCANNER KAMERA HP / VERIFIKASI (Kanan) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">

        {/* A. TESTING SIMULATOR (5/12) */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-bold font-heading text-text-primary flex items-center gap-2">
                  <Sparkles size={18} className="text-brand-gold" />
                  Simulasi Pesanan & Tes Stok
                </h2>
                <span className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-md font-semibold uppercase">
                  Testing Tool
                </span>
              </div>
              <p className="text-xs text-text-secondary mb-4">
                Buat pesanan tes untuk menguji scan QR.
              </p>

              {simError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{simError}</span>
                </div>
              )}

              <form onSubmit={handleSimulateOrder} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Pilih Produk Dimsum
                  </label>
                  <select
                    value={simProduct}
                    onChange={(e) => setSimProduct(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-blue bg-white"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id} disabled={p.stock_qty <= 0}>
                        {p.name} (Stok: {p.stock_qty} pcs) - {formatCurrency(p.price)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">
                      Jumlah Beli (Qty)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={simQty}
                      onChange={(e) => setSimQty(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">
                      Nama Pembeli
                    </label>
                    <input
                      type="text"
                      value={simCustomer}
                      onChange={(e) => setSimCustomer(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-blue"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={simLoading || products.length === 0}
                  className="w-full py-2.5 bg-brand-gold hover:bg-brand-gold-dark text-white rounded-xl font-semibold text-xs transition-colors shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <ShoppingBag size={15} />
                  {simLoading ? 'Memproses...' : 'Buat Pesanan Tes'}
                </button>
              </form>

              {/* HASIL SIMULASI TEST */}
              {simResult && (
                <div className="mt-5 p-4 bg-gray-50 rounded-2xl border border-gray-200 animate-fadeIn">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-brand-blue flex items-center gap-1.5">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      Pesanan Siap Diambil Terbuat!
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      Status: Paid
                    </span>
                  </div>

                  {/* Bukti Pengurangan Stok */}
                  <div className="bg-white p-3 rounded-xl border border-gray-200 mb-3 text-xs">
                    <div className="font-semibold text-text-primary mb-1">
                      Perubahan Stok:
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center pt-1">
                      <div className="p-2 bg-gray-50 rounded-lg">
                        <span className="text-[10px] text-text-secondary block">Stok Sebelum</span>
                        <span className="text-sm font-bold text-gray-700">
                          {simResult.stock_test.stock_before} pcs
                        </span>
                      </div>
                      <div className="p-2 bg-red-50 rounded-lg">
                        <span className="text-[10px] text-red-600 block">Dipotong</span>
                        <span className="text-sm font-bold text-red-600">
                          -{simResult.stock_test.decremented_by} pcs
                        </span>
                      </div>
                      <div className="p-2 bg-emerald-50 rounded-lg">
                        <span className="text-[10px] text-emerald-700 block">Stok Terkini</span>
                        <span className="text-sm font-bold text-emerald-700">
                          {simResult.stock_test.stock_after} pcs
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* QR Code Pembeli Tampil Langsung untuk Discan Kamera HP */}
                  <div className="bg-white p-4 rounded-xl border border-gray-200 text-center flex flex-col items-center">
                    <p className="text-xs font-bold text-brand-blue mb-2">
                      Scan QR ini untuk verifikasi:
                    </p>
                    <div className="p-3 bg-white rounded-2xl border-2 border-brand-blue/30 shadow-md">
                      <QRCodeSVG value={simResult.order.qr_token} size={150} />
                    </div>
                    <div className="mt-2 text-[11px] font-mono text-gray-500 flex items-center gap-1">
                      <span>Token: {simResult.order.qr_token.substring(0, 16)}...</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(simResult.order.qr_token)}
                        className="text-brand-blue hover:underline"
                        title="Salin Token QR"
                      >
                        <Copy size={12} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setQrTokenInput(simResult.order.qr_token);
                        handleCheckQR(simResult.order.qr_token);
                      }}
                      className="mt-3 px-3 py-1.5 bg-brand-blue text-white rounded-xl text-xs font-semibold hover:bg-brand-blue-dark transition-colors flex items-center gap-1.5"
                    >
                      <QrCode size={13} />
                      Muat ke Kasir Scanner
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* B. SCANNER KAMERA HP & VERIFIKASI PENGAMBILAN KASIR (7/12) */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-bold font-heading text-text-primary flex items-center gap-2">
                  <Camera size={18} className="text-brand-blue" />
                  Scanner & Verifikasi
                </h2>
                <span className="text-[10px] px-2 py-0.5 bg-brand-blue/10 text-brand-blue border border-brand-blue/20 rounded-md font-semibold uppercase">
                  Kamera Aktif
                </span>
              </div>
              <p className="text-xs text-text-secondary mb-4">
                Pindai QR Code dari layar HP pembeli secara langsung menggunakan kamera HP Anda, atau unggah foto QR.
              </p>

              {/* Tabs Mode Scanner */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-gray-100 rounded-2xl mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setScanMode('camera');
                    if (!isCameraActive) startCamera();
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${scanMode === 'camera'
                    ? 'bg-white text-brand-blue shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                    }`}
                >
                  <Camera size={14} />
                  Kamera HP
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setScanMode('upload');
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${scanMode === 'upload'
                    ? 'bg-white text-brand-blue shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                    }`}
                >
                  <Upload size={14} />
                  Upload Foto
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setScanMode('manual');
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${scanMode === 'manual'
                    ? 'bg-white text-brand-blue shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                    }`}
                >
                  <QrCode size={14} />
                  Ketik Token
                </button>
              </div>

              {/* MODE 1: KAMERA HP LIVE STREAM */}
              {scanMode === 'camera' && (
                <div className="mb-5">
                  {cameraError && (
                    <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold block">Gagal Akses Kamera</span>
                        <span>{cameraError}</span>
                        <span className="block mt-1 text-[11px] text-red-600">
                          Tips: Pastikan membuka portal kasir melalui tautan HTTPS tunneling ngrok di browser HP Anda.
                        </span>
                      </div>
                    </div>
                  )}

                  {!isCameraActive ? (
                    <div className="p-6 border-2 border-dashed border-gray-200 rounded-2xl text-center bg-gray-50/60">
                      <div className="w-14 h-14 bg-brand-blue/10 text-brand-blue rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs">
                        <Camera size={28} />
                      </div>
                      <h3 className="text-sm font-bold text-text-primary mb-1">
                        Kamera Belum Aktif
                      </h3>
                      <p className="text-xs text-text-secondary max-w-sm mx-auto mb-4">
                        Klik tombol di bawah untuk mengaktifkan kamera belakang HP kasir Anda dan mulai memindai QR Code pembeli.
                      </p>
                      <button
                        type="button"
                        onClick={() => startCamera()}
                        disabled={cameraLoading}
                        className="px-5 py-2.5 bg-brand-blue hover:bg-brand-blue-dark text-white rounded-xl text-xs font-semibold shadow-xs transition-colors inline-flex items-center gap-2"
                      >
                        <Camera size={15} />
                        {cameraLoading ? 'Menghubungkan Kamera...' : 'Buka Kamera Scanner HP'}
                      </button>
                    </div>
                  ) : (
                    <div className="relative rounded-2xl overflow-hidden bg-black aspect-video sm:aspect-4/3 max-h-[300px] shadow-md flex items-center justify-center">
                      <video
                        ref={bindVideoRef}
                        className="w-full h-full object-cover"
                        playsInline={true}
                        muted={true}
                        autoPlay={true}
                        onLoadedMetadata={(e) => {
                          e.target.play().catch(() => { });
                        }}
                      />

                      {/* Viewfinder Reticle Overlay */}
                      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                        <div className="w-48 h-48 sm:w-56 sm:h-56 border-2 border-dashed border-white/70 rounded-2xl relative flex items-center justify-center shadow-lg">
                          <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-brand-gold rounded-tl-lg" />
                          <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-brand-gold rounded-tr-lg" />
                          <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-brand-gold rounded-bl-lg" />
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-brand-gold rounded-br-lg" />

                          {/* Laser scanning line */}
                          <div className="w-full h-0.5 bg-brand-gold/90 shadow-[0_0_8px_rgba(201,162,61,0.9)] animate-bounce" />
                        </div>
                        <span className="text-[11px] text-white font-semibold bg-black/60 px-3 py-1 rounded-full mt-3 backdrop-blur-xs">
                          Arahkan ke QR Code Pembeli
                        </span>
                      </div>

                      {/* Camera Floating Controls */}
                      <div className="absolute top-3 right-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={toggleFacingMode}
                          className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-xl backdrop-blur-xs transition-colors"
                          title="Putar Kamera (Depan / Belakang)"
                        >
                          <FlipHorizontal size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="p-2 bg-red-600/80 hover:bg-red-600 text-white rounded-xl backdrop-blur-xs transition-colors"
                          title="Tutup Kamera"
                        >
                          <CameraOff size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* MODE 2: UPLOAD FOTO QR */}
              {scanMode === 'upload' && (
                <div className="mb-5 p-6 border-2 border-dashed border-gray-200 rounded-2xl text-center bg-gray-50/60">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="w-12 h-12 bg-brand-blue/10 text-brand-blue rounded-xl flex items-center justify-center mx-auto mb-2">
                    <Upload size={24} />
                  </div>
                  <h3 className="text-xs font-bold text-text-primary mb-1">
                    Unggah Gambar / Tangkapan Layar QR
                  </h3>
                  <p className="text-[11px] text-text-secondary max-w-xs mx-auto mb-3">
                    Pilih foto atau screenshot QR Code dari galeri HP Anda untuk dipindai otomatis.
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-brand-blue text-white rounded-xl text-xs font-semibold hover:bg-brand-blue-dark transition-colors inline-flex items-center gap-1.5"
                  >
                    <Upload size={14} />
                    Pilih Foto QR dari HP
                  </button>
                </div>
              )}

              {/* MODE 3: KETIK / TEMPEL TOKEN MANUAL */}
              {scanMode === 'manual' && (
                <div className="space-y-2 mb-5">
                  <label className="block text-xs font-semibold text-text-secondary">
                    Token QR Pembeli
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={qrTokenInput}
                      onChange={(e) => setQrTokenInput(e.target.value)}
                      placeholder="Scan atau tempelkan QR token pembeli / stiker Lot (BATCH:...)..."
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono text-text-primary focus:outline-none focus:border-brand-blue"
                    />
                    <button
                      type="button"
                      onClick={() => handleCheckQR()}
                      disabled={checkingOrder || !qrTokenInput.trim()}
                      className="px-4 py-2.5 bg-brand-blue text-white rounded-xl text-xs font-semibold hover:bg-brand-blue-dark transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <RefreshCw size={13} className={checkingOrder ? 'animate-spin' : ''} />
                      Cek
                    </button>
                  </div>
                </div>
              )}

              {previewError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{previewError}</span>
                </div>
              )}

              {/* PREVIEW HASIL SCAN STIKER LOT PRODUKSI FISIK */}
              {previewLot && (
                <div className="bg-blue-50/70 rounded-2xl p-5 border-2 border-brand-blue/30 animate-fadeIn space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-blue-200/60">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="px-2 py-0.5 rounded-md bg-brand-blue text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                          <Factory size={11} />
                          Stiker Lot Fisik Terverifikasi
                        </span>
                        <span className="text-[11px] font-mono text-text-secondary">
                          {previewLot.batch_code}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-text-primary font-heading flex items-center gap-1.5">
                        <span>{previewLot.product_name || 'Dimsum'}</span>
                        {previewLot.product_sku && (
                          <span className="text-xs text-text-secondary font-mono">({previewLot.product_sku})</span>
                        )}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 size={13} />
                        QC Disetujui (Om Yosi)
                      </span>
                    </div>
                  </div>

                  {/* Informasi Lot & Kapasitas Fisik */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div className="bg-white p-3 rounded-xl border border-blue-100">
                      <span className="text-[10px] text-text-secondary block">Nomor Lot</span>
                      <span className="font-bold text-brand-blue text-sm">
                        {previewLot.scanned_lot_info ? `Lot ${previewLot.scanned_lot_info}` : 'Lot Standar'}
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-blue-100">
                      <span className="text-[10px] text-text-secondary block">Isi Mika / Lot</span>
                      <span className="font-bold text-text-primary text-sm">
                        {previewLot.scanned_lot_qty || previewLot.lot_size || 25} pcs
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-blue-100">
                      <span className="text-[10px] text-text-secondary block">Total Batch</span>
                      <span className="font-bold text-text-primary text-sm">
                        {previewLot.actual_lots || 0} Lot ({previewLot.produced_qty || 0} pcs)
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-blue-100">
                      <span className="text-[10px] text-text-secondary block">Sisa Stok Batch</span>
                      <span className="font-bold text-emerald-700 text-sm">
                        {previewLot.remaining_qty || 0} pcs
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-text-secondary pt-1">
                    <span>Waktu Selesai Verifikasi QC:</span>
                    <span className="font-semibold text-text-primary">
                      {previewLot.completed_at ? new Date(previewLot.completed_at).toLocaleString('id-ID') : 'Hari ini'}
                    </span>
                  </div>

                  {/* Tombol Aksi Cepat */}
                  <div className="pt-2 flex flex-col sm:flex-row gap-2">
                    <Link
                      to={`/admin/stock-out?product_id=${previewLot.product_id || ''}&lots=1`}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <ArrowUpRight size={15} />
                      <span>Keluarkan Stok Lot Ini (Shopee/TikTok/PO)</span>
                    </Link>
                    <Link
                      to="/admin/production"
                      className="px-4 py-2.5 border border-gray-300 hover:bg-gray-100 text-text-primary rounded-xl font-medium text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Factory size={14} />
                      <span>Portal Produksi</span>
                    </Link>
                  </div>
                </div>
              )}

              {/* PREVIEW PESANAN PEMBELI */}
              {previewOrder && (
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 animate-fadeIn space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-200">
                    <div>
                      <span className="text-[10px] text-text-secondary uppercase tracking-wider block">
                        ID Pesanan: {previewOrder.id.substring(0, 8)}...
                      </span>
                      <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5 mt-0.5">
                        <User size={14} className="text-brand-blue" />
                        {previewOrder.notes || 'Pelanggan Walk-In'}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg ${previewOrder.status === 'completed'
                          ? 'bg-gray-200 text-gray-700'
                          : previewOrder.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                          }`}
                      >
                        Status: {previewOrder.status === 'completed' ? 'Selesai' : previewOrder.status === 'paid' ? 'Siap Diambil' : previewOrder.status}
                      </span>
                    </div>
                  </div>

                  {/* Rincian Item yang Dipesan */}
                  <div>
                    <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                      Item Pesanan & Status Stok di Kasir
                    </h4>
                    <div className="space-y-2">
                      {previewOrder.items && previewOrder.items.map((it, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200 text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-lg bg-brand-blue/10 text-brand-blue font-bold flex items-center justify-center text-xs">
                              {it.quantity}x
                            </span>
                            <div>
                              <span className="font-bold text-text-primary block">
                                {it.product_name || 'Dimsum'}
                              </span>
                              <span className="text-[11px] text-text-secondary">
                                Harga: {formatCurrency(it.unit_price)}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-text-secondary block">
                              Sisa Stok Nyata di DB:
                            </span>
                            <span className="font-bold text-brand-blue text-xs">
                              {it.current_stock !== undefined ? `${it.current_stock} pcs` : 'Tercatat'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-text-secondary">Waktu Pickup:</span>
                    <span className="font-semibold text-text-primary flex items-center gap-1">
                      <Clock size={13} className="text-brand-gold" />
                      {previewOrder.pickup_time || 'Segera'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-200">
                    <span className="font-bold text-text-primary">Total Pembayaran:</span>
                    <span className="font-bold text-brand-blue text-base font-heading">
                      {formatCurrency(previewOrder.total_amount)}
                    </span>
                  </div>

                  {/* TOMBOL VERIFIKASI PENGAMBILAN */}
                  {previewOrder.status === 'paid' ? (
                    <div className="pt-2">
                      {verifyError && (
                        <div className="mb-2 p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-1.5">
                          <AlertCircle size={14} />
                          <span>{verifyError}</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={handleVerifyPickup}
                        disabled={verifyLoading}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs transition-colors shadow-xs flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 size={16} />
                        {verifyLoading ? 'Memverifikasi...' : 'Verifikasi Pengambilan (Serahkan Pesanan)'}
                      </button>
                    </div>
                  ) : previewOrder.status === 'completed' ? (
                    <div className="p-3 bg-gray-100 border border-gray-200 rounded-xl text-center text-xs text-gray-600 font-semibold flex items-center justify-center gap-2">
                      <Check size={16} className="text-emerald-600" />
                      Pesanan ini sudah selesai diambil. Stok produk tetap aman tanpa pemotongan ganda.
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center text-xs text-amber-700 font-semibold">
                      Pesanan belum dapat diambil (Status: {previewOrder.status}). Menunggu konfirmasi pembayaran.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. TABEL DAFTAR PESANAN TERBARU & QUICK TEST ACTION */}
      <section className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-base font-bold font-heading text-text-primary flex items-center gap-2">
              <Clock size={18} className="text-brand-blue" />
              Daftar Transaksi Pesanan Terbaru ({orders.length})
            </h2>
            <p className="text-xs text-text-secondary">
              Klik tombol "Uji Scan QR" pada pesanan berstatus Siap Diambil untuk langsung mengujinya di scanner kasir.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${statusFilter === 'all' ? 'bg-white text-brand-blue shadow-xs' : 'text-text-secondary'
                }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('paid')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${statusFilter === 'paid' ? 'bg-white text-emerald-700 shadow-xs' : 'text-text-secondary'
                }`}
            >
              Siap Diambil (Paid)
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${statusFilter === 'completed' ? 'bg-white text-gray-700 shadow-xs' : 'text-text-secondary'
                }`}
            >
              Selesai (Completed)
            </button>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
            <ShoppingBag size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-xs font-semibold text-text-secondary">
              Tidak ada pesanan dengan filter status ini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-text-secondary font-semibold">
                  <th className="pb-3 pl-2">Waktu</th>
                  <th className="pb-3">ID / Catatan</th>
                  <th className="pb-3">Item Pesanan</th>
                  <th className="pb-3">Total</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right pr-2">Aksi Pengujian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((ord) => {
                  const isPaid = ord.status === 'paid';
                  const isCompleted = ord.status === 'completed';

                  return (
                    <tr key={ord.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 pl-2 text-text-secondary whitespace-nowrap">
                        {new Date(ord.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        <span className="block text-[10px] text-gray-400">
                          {new Date(ord.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="font-mono text-gray-500 font-bold block">
                          {ord.id.substring(0, 8)}...
                        </span>
                        <span className="text-[11px] text-text-secondary truncate max-w-[150px] block" title={ord.notes}>
                          {ord.notes || 'Tanpa catatan'}
                        </span>
                      </td>
                      <td className="py-3">
                        {ord.items && ord.items.map((it, i) => (
                          <span key={i} className="block text-text-primary">
                            {it.quantity}x {it.product_name}
                          </span>
                        ))}
                      </td>
                      <td className="py-3 font-semibold text-text-primary whitespace-nowrap">
                        {formatCurrency(ord.total_amount)}
                      </td>
                      <td className="py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${isPaid
                            ? 'bg-emerald-100 text-emerald-800'
                            : isCompleted
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-amber-100 text-amber-800'
                            }`}
                        >
                          {isPaid ? 'Siap Diambil' : isCompleted ? 'Selesai' : ord.status}
                        </span>
                      </td>
                      <td className="py-3 pr-2 text-right whitespace-nowrap">
                        {ord.qr_token ? (
                          <button
                            type="button"
                            onClick={() => {
                              setQrTokenInput(ord.qr_token);
                              handleCheckQR(ord.qr_token);
                              window.scrollTo({ top: 400, behavior: 'smooth' });
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ml-auto ${isPaid
                              ? 'bg-brand-blue text-white hover:bg-brand-blue-dark shadow-xs'
                              : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                              }`}
                          >
                            <QrCode size={13} />
                            <span>{isPaid ? 'Uji Scan QR' : 'Lihat Detail'}</span>
                          </button>
                        ) : (
                          <span className="text-gray-400 text-[11px] italic">QR belum terbit</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
