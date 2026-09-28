import React, { useState, useEffect, useRef } from 'react';
import {
  Store,
  QrCode,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  Printer,
  Share2,
  Coins,
  CreditCard,
  ArrowRight,
  Flame,
  Check,
  X,
  Camera,
  CameraOff,
  Upload,
  User,
  Phone,
  FileText,
  UtensilsCrossed,
  PackageCheck,
  ChevronRight,
  ShoppingBag,
  Layers,
  Sparkles,
  ExternalLink,
  RotateCcw,
  Maximize2,
  LogOut,
  LayoutDashboard,
  Copy,
  ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BANK_OPTIONS = [
  { code: 'BCAVA', name: 'BCA', desc: 'BCA Virtual Account' },
  { code: 'MANDIRIVA', name: 'Mandiri', desc: 'Mandiri Virtual Account' },
  { code: 'BRIVA', name: 'BRI', desc: 'BRI Virtual Account' },
  { code: 'BNIVA', name: 'BNI', desc: 'BNI Virtual Account' },
  { code: 'PERMATAVA', name: 'Permata', desc: 'Permata / Semua Bank' },
  { code: 'BSIVA', name: 'BSI', desc: 'Bank Syariah Indonesia' }
];
import { QRCodeSVG } from 'qrcode.react';
import jsQR from 'jsqr';
import api from '../api/client';
import { getAdminUser, getAdminRole } from '../utils/adminAuth';
import SwipeToConfirm from '../components/ui/SwipeToConfirm';
import logoImg from '../assets/logo.webp';

export default function AdminPOS() {
  const navigate = useNavigate();
  const adminUser = getAdminUser();
  const userRole = getAdminRole() || 'staff';

  const handleLogout = async () => {
    if (window.confirm('Yakin ingin keluar dari akun kasir?')) {
      try {
        await api.post('/api/auth/logout', {}, { auth: 'admin' });
      } catch {
        // Ignore network error on logout
      } finally {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/admin/login');
      }
    }
  };

  // Mode switcher: 'pos' (Beli di Tempat) vs 'pickup' (Ambil Pesanan Web)
  const [activeMode, setActiveMode] = useState('pos');

  // Clock
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- CATALOG & PRODUCTS STATE ---
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const res = await api.get('/api/products');
      if (res.success && Array.isArray(res.data)) {
        setProducts(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // --- CART STATE (With localStorage persistence) ---
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('dimsum_pos_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [customerName, setCustomerName] = useState(() => {
    try {
      return localStorage.getItem('dimsum_pos_customer_name') || '';
    } catch {
      return '';
    }
  });
  const [customerPhone, setCustomerPhone] = useState(() => {
    try {
      return localStorage.getItem('dimsum_pos_customer_phone') || '';
    } catch {
      return '';
    }
  });
  const [orderNotes, setOrderNotes] = useState(() => {
    try {
      return localStorage.getItem('dimsum_pos_order_notes') || '';
    } catch {
      return '';
    }
  });
  const [nameError, setNameError] = useState(false);

  // Sync cart & customer info to localStorage to protect against reloads
  useEffect(() => {
    try {
      if (cart.length > 0) {
        localStorage.setItem('dimsum_pos_cart', JSON.stringify(cart));
      } else {
        localStorage.removeItem('dimsum_pos_cart');
      }
    } catch { /* ignore */ }
  }, [cart]);

  useEffect(() => {
    try {
      if (customerName) {
        localStorage.setItem('dimsum_pos_customer_name', customerName);
      } else {
        localStorage.removeItem('dimsum_pos_customer_name');
      }
    } catch { /* ignore */ }
  }, [customerName]);

  useEffect(() => {
    try {
      if (customerPhone) {
        localStorage.setItem('dimsum_pos_customer_phone', customerPhone);
      } else {
        localStorage.removeItem('dimsum_pos_customer_phone');
      }
    } catch { /* ignore */ }
  }, [customerPhone]);

  useEffect(() => {
    try {
      if (orderNotes) {
        localStorage.setItem('dimsum_pos_order_notes', orderNotes);
      } else {
        localStorage.removeItem('dimsum_pos_order_notes');
      }
    } catch { /* ignore */ }
  }, [orderNotes]);

  // --- PAYMENT MODAL STATE ---
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash', 'qris', 'transfer'
  const [cashReceived, setCashReceived] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Payment Gateway State (Paywuz QRIS & VA Transfer)
  const [qrisData, setQrisData] = useState(null);
  const [vaData, setVaData] = useState(null);
  const [selectedBank, setSelectedBank] = useState('BCAVA');
  const [copiedVa, setCopiedVa] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [checkingPayment, setCheckingPayment] = useState(false);

  // Success Receipt Modal State
  const [completedOrder, setCompletedOrder] = useState(null);
  const [completedPayment, setCompletedPayment] = useState(null);
  const [waSending, setWaSending] = useState(false);
  const [waSentMsg, setWaSentMsg] = useState('');

  // --- PICKUP MODE STATE ---
  const [qrTokenInput, setQrTokenInput] = useState('');
  const [checkingOrder, setCheckingOrder] = useState(false);
  const [previewOrder, setPreviewOrder] = useState(null);
  const [previewError, setPreviewError] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [verifySuccess, setVerifySuccess] = useState(null);

  // Camera State for Pickup
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);

  // --- CART OPERATIONS ---
  const addToCart = (product) => {
    if (!product || product.stock_qty <= 0) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_qty) {
          alert(`Stok produk "${product.name}" hanya tersedia ${product.stock_qty} pcs.`);
          return prev;
        }
        return prev.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          sku: product.sku,
          price: Number(product.price),
          image_url: product.image_url,
          stock_qty: product.stock_qty,
          quantity: 1
        }
      ];
    });
  };

  const updateQuantity = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product_id === productId) {
            const nextQty = item.quantity + delta;
            if (nextQty > item.stock_qty) {
              alert(`Stok "${item.name}" hanya tersedia ${item.stock_qty} pcs.`);
              return item;
            }
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.product_id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCashReceived('');
    setPaymentError('');
  };

  const handleResetOrder = () => {
    if (cart.length === 0 && !customerName && !customerPhone) return;
    if (window.confirm('Kosongkan semua pesanan di keranjang?')) {
      clearCart();
      setCustomerName('');
      setCustomerPhone('');
      setNameError(false);
    }
  };

  // Live Clock Formatting in Indonesian
  const formattedDateTime =
    currentTime.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }) +
    ' · ' +
    currentTime.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });

  // Calculations
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalAmount = cartSubtotal; // Walk-in direct order total

  const cashVal = parseFloat(String(cashReceived).replace(/\D/g, '')) || 0;
  const cashChange = cashVal - totalAmount;

  // Categories
  const categories = [
    { id: 'all', label: 'All' },
    { id: 'Steamed', label: 'Dimsum Kukus' },
    { id: 'Fried', label: 'Dimsum Goreng' },
    { id: 'Vakum', label: 'Vakum / Frozen' },
    { id: 'Minuman', label: 'Minuman' }
  ];

  const getCategoryCount = (catId) => {
    if (catId === 'all') return products.length;
    return products.filter(
      (p) =>
        (p.category && p.category.toLowerCase().includes(catId.toLowerCase())) ||
        (p.name && p.name.toLowerCase().includes(catId.toLowerCase()))
    ).length;
  };

  const filteredProducts = products.filter((p) => {
    const matchCat =
      selectedCategory === 'all' ||
      (p.category && p.category.toLowerCase().includes(selectedCategory.toLowerCase())) ||
      (p.name && p.name.toLowerCase().includes(selectedCategory.toLowerCase()));
    const matchSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const formatCurrency = (num) => {
    return 'Rp' + Number(num || 0).toLocaleString('id-ID');
  };

  // --- SUBMIT POS ORDER ---
  const handleOpenPayment = () => {
    if (cart.length === 0) return;
    if (!customerName.trim()) {
      setNameError(true);
      return;
    }
    setNameError(false);
    setPaymentError('');
    setCashReceived('');
    setPaymentMethod('cash');
    setQrisData(null);
    setVaData(null);
    setSelectedBank('BCAVA');
    setCopiedVa(false);
    setPaymentModalOpen(true);
  };

  const handleProcessOrder = async () => {
    if (cart.length === 0) return;
    setPaymentError('');

    if (paymentMethod === 'cash') {
      if (!cashReceived || cashVal < totalAmount) {
        setPaymentError(`Uang tunai kurang! Minimal pembayaran: ${formatCurrency(totalAmount)}`);
        return;
      }
    }

    setSubmittingOrder(true);
    try {
      const payload = {
        items: cart.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity
        })),
        payment_method: paymentMethod,
        bank_code: paymentMethod === 'transfer' ? selectedBank : undefined,
        cash_received: paymentMethod === 'cash' ? cashVal : null,
        customer_name: customerName.trim() || '',
        customer_phone: customerPhone.trim() || null,
        order_type: 'direct',
        notes: orderNotes.trim() || null
      };

      const res = await api.post('/api/orders/pos', payload, { auth: 'admin' });
      if (res.success && res.data) {
        const { order, payment } = res.data;

        if (paymentMethod === 'qris' && payment?.paywuz) {
          // Keep modal open, show QRIS code on screen
          setQrisData(payment.paywuz);
          setVaData(null);
          setActiveOrderId(order.id);
        } else if (paymentMethod === 'transfer' && payment?.paywuz) {
          // Keep modal open, show Virtual Account code on screen
          setVaData(payment.paywuz);
          setQrisData(null);
          setActiveOrderId(order.id);
        } else {
          // Cash complete!
          setCompletedOrder(order);
          setCompletedPayment(payment);
          setPaymentModalOpen(false);
          setCart([]);
          setCashReceived('');
          setCustomerName('');
          setCustomerPhone('');
          setOrderNotes('');
          setNameError(false);
          fetchProducts(); // Refresh stocks
        }
      } else {
        setPaymentError(res.error || 'Gagal memproses pesanan kasir');
      }
    } catch {
      setPaymentError('Koneksi terputus saat memproses pesanan kasir');
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Handle successful QRIS or Transfer VA payment (auto or manual)
  const handleGatewayPaymentSuccess = (orderData, method = paymentMethod) => {
    setCompletedOrder(orderData);
    setCompletedPayment({ payment_method: method, total_amount: orderData.total_amount });
    setQrisData(null);
    setVaData(null);
    setActiveOrderId(null);
    setPaymentModalOpen(false);
    setCart([]);
    setCashReceived('');
    setCustomerName('');
    setCustomerPhone('');
    setOrderNotes('');
    setNameError(false);
    fetchProducts();
  };

  // Check Gateway Payment Status (Manual fallback)
  const handleCheckGatewayStatus = async (isManual = true) => {
    if (!activeOrderId) return;
    setCheckingPayment(true);
    try {
      const res = await api.get(`/api/orders/${activeOrderId}`, { auth: 'admin' });
      if (res.success && res.data) {
        if (res.data.status === 'completed' || res.data.status === 'paid') {
          handleGatewayPaymentSuccess(res.data, paymentMethod);
        } else if (isManual) {
          alert('Pembayaran belum terkonfirmasi oleh sistem bank. Silakan coba sesaat lagi.');
        }
      }
    } catch {
      if (isManual) {
        alert('Gagal memeriksa status pembayaran');
      }
    } finally {
      setCheckingPayment(false);
    }
  };

  // Auto-polling for QRIS & Transfer VA payment in background (every 3 seconds)
  useEffect(() => {
    if (!paymentModalOpen || !activeOrderId || (!qrisData && !vaData)) {
      return;
    }

    let isSubscribed = true;

    const pollInterval = setInterval(async () => {
      if (document.hidden) return; // Pause polling if window is hidden
      try {
        const res = await api.get(`/api/orders/${activeOrderId}`, { auth: 'admin' });
        if (!isSubscribed) return;

        if (res.success && res.data) {
          if (res.data.status === 'completed' || res.data.status === 'paid') {
            handleGatewayPaymentSuccess(res.data, paymentMethod);
          }
        }
      } catch (err) {
        console.warn('Auto-detecting gateway payment error:', err);
      }
    }, 3000);

    return () => {
      isSubscribed = false;
      clearInterval(pollInterval);
    };
  }, [paymentModalOpen, paymentMethod, activeOrderId, qrisData, vaData]);

  // Send WhatsApp Digital Receipt
  const handleSendWhatsAppReceipt = async (orderId, phone) => {
    if (!orderId || !phone) return;
    setWaSending(true);
    setWaSentMsg('');
    try {
      const res = await api.post(
        `/api/orders/${orderId}/send-receipt`,
        { phone },
        { auth: 'admin' }
      );
      if (res.success) {
        setWaSentMsg(`Struk berhasil dikirim ke nomor WhatsApp ${phone}!`);
      } else {
        alert(res.error || 'Gagal mengirim struk via WhatsApp');
      }
    } catch {
      alert('Koneksi gagal mengirim WhatsApp');
    } finally {
      setWaSending(false);
    }
  };

  // Thermal Print Handler
  const handlePrintReceipt = () => {
    window.print();
  };

  // --- PICKUP WEB SCANNER LOGIC ---
  const handleCheckQR = async (tokenToCheck) => {
    const rawToken = tokenToCheck || qrTokenInput;
    if (!rawToken || !rawToken.trim()) {
      setPreviewError('Masukkan atau scan QR token pembeli terlebih dahulu');
      return;
    }
    setCheckingOrder(true);
    setPreviewError('');
    setVerifySuccess(null);
    setVerifyError('');
    setPreviewOrder(null);

    try {
      const res = await api.get(`/api/orders/check-qr/${encodeURIComponent(rawToken.trim())}`, {
        auth: 'admin'
      });
      if (res.success && res.data) {
        setPreviewOrder(res.data);
      } else {
        setPreviewError(res.error || 'Pesanan dengan kode QR tersebut tidak ditemukan.');
      }
    } catch {
      setPreviewError('Koneksi gagal memeriksa kode QR pesanan.');
    } finally {
      setCheckingOrder(false);
    }
  };

  const handleVerifyPickup = async () => {
    if (!previewOrder?.qr_token) return;
    setVerifyLoading(true);
    setVerifyError('');

    try {
      const res = await api.post(
        '/api/orders/verify',
        { qr_token: previewOrder.qr_token },
        { auth: 'admin' }
      );
      if (res.success) {
        setVerifySuccess(res.data || res);
        setPreviewOrder(res.data);
        fetchProducts();
      } else {
        setVerifyError(res.error || 'Gagal memverifikasi pengambilan');
      }
    } catch {
      setVerifyError('Terjadi kesalahan jaringan saat verifikasi');
    } finally {
      setVerifyLoading(false);
    }
  };

  // Camera setup for pickup mode
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
        try {
          navigator.vibrate(100);
        } catch (_) { }
      }
      stopCamera();
      setQrTokenInput(detectedToken);
      handleCheckQR(detectedToken);
      return;
    }

    animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
  };

  const startCamera = async () => {
    stopCamera();
    setCameraError('');
    setCameraLoading(true);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Browser Anda tidak mendukung akses kamera.');
      setCameraLoading(false);
      return;
    }

    try {
      const constraints = {
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setIsCameraActive(true);
      setCameraLoading(false);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('muted', 'true');
        await videoRef.current.play().catch((e) => console.warn(e));
      }
      animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
    } catch (err) {
      console.error(err);
      setCameraLoading(false);
      setIsCameraActive(false);
      setCameraError('Izin akses kamera ditolak atau kamera tidak ditemukan.');
    }
  };

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
          setPreviewError('QR Code tidak dapat dibaca dari gambar.');
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-bg-cream font-body text-text-primary antialiased p-3 sm:p-4 lg:p-5 flex flex-col w-full max-w-[1720px] mx-auto">

      {/* ========================================================================= */}
      {/* 1. TOP BAR KHUSUS POS (Sesuai Referensi Gambar) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-gray-200/90 shadow-xs p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-3 sm:gap-4 shrink-0 mb-3 sm:mb-4">
        {/* Left: Brand Logo + Mode Switcher */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap sm:flex-nowrap">
          {/* Brand Official Logo */}
          <div className="pr-3 sm:pr-4 border-r border-gray-200 flex items-center h-10">
            <img
              src={logoImg}
              alt="Makan Dimsum Indonesia"
              className="h-12 sm:h-12 w-auto object-contain drop-shadow-xs"
            />
          </div>

          {/* Segmented Mode Switcher (Green Arrow: Beli di Tempat / Dine-in, Red Arrow: Scan QR) */}
          <div className="flex items-center bg-gray-100/90 p-1 rounded-2xl border border-gray-200">
            <button
              type="button"
              onClick={() => setActiveMode('pos')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeMode === 'pos'
                ? 'bg-white text-brand-red shadow-xs font-extrabold'
                : 'text-gray-500 hover:text-gray-900'
                }`}
            >
              <UtensilsCrossed size={14} />
              <span>Beli di Tempat (POS)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMode('pickup')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeMode === 'pickup'
                ? 'bg-white text-brand-blue shadow-xs font-extrabold'
                : 'text-gray-500 hover:text-gray-900'
                }`}
            >
              <QrCode size={14} />
              <span>Scan QR Pickup</span>
            </button>
          </div>
        </div>

        {/* Right: Date/Time + Refresh Button + User Account with Integrated Logout */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          {/* Live Date & Time */}
          <div className="flex items-center gap-2 text-xs font-medium text-gray-600 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
            <Clock size={13} className="text-gray-400" />
            <span className="capitalize">{formattedDateTime}</span>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchProducts}
            disabled={productsLoading}
            title="Muat ulang menu & stok"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={13} className={productsLoading ? 'animate-spin text-brand-red' : ''} />
            <span>Refresh</span>
          </button>

          {/* Admin Dashboard shortcut if admin */}
          {userRole === 'admin' && (
            <button
              type="button"
              onClick={() => navigate('/admin')}
              title="Kembali ke Dashboard Admin"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <LayoutDashboard size={14} />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
          )}

          {/* Cashier User Pill with Integrated Logout Button */}
          <div className="flex items-center gap-2 pl-3 pr-1.5 py-1 bg-gray-50 border border-gray-200 rounded-2xl">
            <div className="w-7 h-7 rounded-full bg-brand-blue text-white font-bold text-xs flex items-center justify-center shadow-2xs shrink-0">
              {(adminUser?.full_name || 'K').charAt(0).toUpperCase()}
            </div>
            <div className="text-left pr-1.5 border-r border-gray-200">
              <div className="text-xs font-bold text-text-primary leading-tight">
                {adminUser?.full_name || 'Kasir Toko'}
              </div>
              <div className="text-[10px] text-text-secondary capitalize">
                {userRole}
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="Keluar dari akun kasir"
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE A: BELI DI TEMPAT (WALK-IN POS) */}
      {/* ========================================================================= */}
      {activeMode === 'pos' && (
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* LEFT COLUMN: MENU CATALOG (7/12 on lg, 8/12 on xl) */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col min-h-0 h-full">
            {/* Filter Categories & Search Bar (Sticky at top of menu column) */}
            <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-gray-200 shadow-xs space-y-3 shrink-0 mb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h2 className="font-heading font-black text-lg text-text-primary">
                    Menu
                  </h2>
                  <span className="text-xs text-text-secondary font-medium">
                    ({filteredProducts.length} produk)
                  </span>
                </div>

                {/* Search Input */}
                <div className="relative w-full sm:w-64">
                  <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari menu dimsum..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-brand-red bg-gray-50/60"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Category Pills (All 27, Steamed 14, etc.) */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {categories.map((cat) => {
                  const count = getCategoryCount(cat.id);
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${isActive
                        ? 'bg-brand-red text-white shadow-xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                      <span>{cat.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-white text-gray-600'
                          }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Product Grid Area (Independently scrollable) */}
            <div className="flex-1 min-h-0 overflow-y-auto pt-3 px-2 pb-6 no-scrollbar">
              {productsLoading ? (
                <div className="bg-white p-12 rounded-3xl border border-gray-200 text-center">
                  <RefreshCw size={24} className="animate-spin text-brand-red mx-auto mb-2" />
                  <p className="text-xs text-text-secondary font-medium">Memuat katalog menu...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-gray-200 text-center">
                  <PackageCheck size={36} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-gray-700">Tidak ada produk ditemukan</p>
                  <p className="text-xs text-gray-400 mt-1">Coba gunakan kata kunci pencarian lain.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
                  {filteredProducts.map((p) => {
                    const isOutOfStock = p.stock_qty <= 0;
                    const inCartItem = cart.find((it) => it.product_id === p.id);
                    const inCartQty = inCartItem ? inCartItem.quantity : 0;
                    const hasDiscount = Boolean(p.is_discount && p.discount_percent > 0);

                    return (
                      <div
                        key={p.id}
                        onClick={() => !isOutOfStock && addToCart(p)}
                        className={`relative bg-white rounded-2xl border p-3 flex flex-col justify-between transition-all select-none group ${isOutOfStock
                          ? 'border-gray-200 opacity-60 cursor-not-allowed bg-gray-50'
                          : 'border-gray-200 hover:border-brand-red/60 hover:shadow-md cursor-pointer active:scale-[0.98]'
                          }`}
                      >
                        {/* Cart Quantity Badge */}
                        {inCartQty > 0 && (
                          <div className="absolute -top-2 -right-2 bg-brand-red text-white font-black text-[11px] min-w-6 h-6 px-1.5 rounded-full flex items-center justify-center shadow-md border-2 border-white z-20 animate-scaleIn">
                            {inCartQty}
                          </div>
                        )}

                        {/* Product Thumbnail */}
                        <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-gray-100 border border-gray-200 mb-2">
                          {p.image_url ? (
                            <img
                              src={p.image_url}
                              alt={p.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs font-semibold">
                              No Photo
                            </div>
                          )}

                          {/* Expand/View Icon matching reference */}
                          <div className="absolute top-1.5 right-1.5 w-8 h-8 rounded-lg bg-white/80 backdrop-blur-xs flex items-center justify-center text-gray-500 shadow-2xs opacity-90 group-hover:opacity-100 transition-opacity">
                            <Maximize2 size={18} />
                          </div>

                          {hasDiscount && (
                            <span className="absolute top-1.5 left-1.5 bg-brand-red text-white text-[9px] font-black italic px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-xs">
                              <Flame size={9} className="fill-white" />
                              {p.discount_percent}%
                            </span>
                          )}

                          {isOutOfStock && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center text-white text-xs font-bold">
                              Habis
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="min-w-0">
                          <h3 className="font-bold text-text-primary text-xs leading-snug line-clamp-2">
                            {p.name}
                          </h3>
                          <div className="mt-1 flex items-center justify-between">
                            <span
                              className={`text-[10px] font-semibold ${p.stock_qty < 70
                                ? 'text-red-600'
                                : p.stock_qty <= 100
                                  ? 'text-amber-600'
                                  : 'text-emerald-700'
                                }`}
                            >
                              ● {p.stock_qty} pcs
                            </span>
                          </div>
                        </div>

                        {/* Price & Quick Add Button (Black '+' button matching reference) */}
                        <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between">
                          <div>
                            <span className="font-heading font-black text-sm text-text-primary">
                              {formatCurrency(p.price)}
                            </span>
                            {hasDiscount && p.original_price && (
                              <span className="block text-[9px] text-gray-400 line-through">
                                {formatCurrency(p.original_price)}
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            disabled={isOutOfStock}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isOutOfStock) addToCart(p);
                            }}
                            className="w-7 h-7 rounded-lg bg-gray-900 hover:bg-brand-red text-white flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                            title="Tambah ke Keranjang"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: ORDER DETAILS (Frozen in place, non-scrollable container) */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col min-h-0 h-full">
            <div className="bg-white rounded-3xl border border-gray-200 shadow-xs p-4 sm:p-5 flex flex-col justify-between h-full min-h-0 overflow-hidden">
              <div className="flex flex-col flex-1 min-h-0">
                {/* Header: Order Details & Reset Order (Dine-in dropdown REMOVED) */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-200 shrink-0">
                  <div className="flex items-center gap-2">
                    <ShoppingBag size={18} className="text-brand-red" />
                    <h2 className="font-heading font-black text-base text-text-primary">
                      Detail Pemesanan
                    </h2>
                    <span className="bg-brand-red/10 text-brand-red text-xs font-bold px-2 py-0.5 rounded-full">
                      {cartItemCount}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetOrder}
                    disabled={cart.length === 0 && !customerName && !customerPhone}
                    className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-semibold px-2 py-1 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                  >
                    <RotateCcw size={13} />
                    <span>Reset Order</span>
                  </button>
                </div>

                {/* Customer Information (Mandatory Nama Pembeli & Optional WhatsApp) */}
                <div className="my-3 p-3.5 bg-gray-50/80 rounded-2xl border border-gray-200/80 space-y-3 shrink-0">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                        <User size={13} className="text-gray-400" />
                        <span>Nama Pembeli</span>
                        <span className="text-red-500">*</span>
                      </label>
                      {nameError && (
                        <span className="text-[11px] font-bold text-red-600 animate-pulse">
                          Wajib diisi!
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        if (nameError && e.target.value.trim()) setNameError(false);
                      }}
                      placeholder="Contoh: Budi Santoso"
                      className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm font-semibold focus:outline-none transition-all ${nameError
                        ? 'border-red-500 ring-2 ring-red-100 bg-red-50/30'
                        : 'border-gray-200 focus:border-brand-red'
                        }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                      <Phone size={13} className="text-gray-400" />
                      <span>No. WhatsApp</span>
                      <span className="text-gray-400 font-normal text-[11px]">(Opsional - e-Struk)</span>
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="081234567890"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-brand-red"
                    />
                  </div>
                </div>

                {/* Cart Items List */}
                {cart.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-gray-200 rounded-2xl my-2">
                    <ShoppingBag size={40} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-gray-500">
                      Keranjang kasir masih kosong
                    </p>
                    <p className="text-xs text-gray-400 mt-1 max-w-[220px]">
                      Klik menu produk di samping untuk menambahkan pesanan.
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 no-scrollbar my-2 min-h-0 max-h-[calc(100vh-450px)]">
                    {cart.map((item) => (
                      <div
                        key={item.product_id}
                        className="p-3 bg-gray-50/90 hover:bg-white rounded-2xl border border-gray-200 hover:border-gray-300 shadow-2xs flex items-center justify-between gap-3 text-xs transition-all"
                      >
                        {/* Thumbnail */}
                        <div className="w-14 h-14 rounded-xl bg-gray-200 overflow-hidden shrink-0 border border-gray-200">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 font-bold">
                              DS
                            </div>
                          )}
                        </div>

                        {/* Title & Price */}
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-text-primary text-sm leading-snug line-clamp-2">
                            {item.name}
                          </p>
                          <p className="text-xs font-bold text-brand-gold font-heading mt-1">
                            {formatCurrency(item.price)}
                            {item.quantity > 1 && (
                              <span className="text-[11px] font-normal text-gray-400 font-mono ml-1.5">
                                ({formatCurrency(item.price * item.quantity)})
                              </span>
                            )}
                          </p>
                        </div>

                        {/* Touch-Friendly Stepper Controls */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center bg-white border border-gray-200 rounded-xl p-0.5 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.product_id, -1)}
                              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg hover:bg-gray-100 active:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors cursor-pointer"
                              title="Kurangi"
                            >
                              <Minus size={15} />
                            </button>
                            <span className="font-black text-sm sm:text-base w-7 sm:w-8 text-center font-mono text-gray-900 select-none">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.product_id, 1)}
                              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg hover:bg-gray-100 active:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors cursor-pointer"
                              title="Tambah"
                            >
                              <Plus size={15} />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFromCart(item.product_id)}
                            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-red-500 hover:bg-red-600 active:bg-red-700 text-white shadow-xs flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
                            title="Hapus item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Price Calculation & Pay Now Trigger (Select Table REMOVED) */}
              <div className="pt-3 border-t border-gray-200 space-y-3 mt-auto shrink-0">
                <div className="space-y-1.5 text-xs text-text-secondary">
                  <div className="flex justify-between">
                    <span>Sub Total ({cartItemCount} item):</span>
                    <span className="font-semibold text-text-primary">
                      {formatCurrency(cartSubtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold pt-2 border-t border-gray-200 text-text-primary">
                    <span>Total Payment:</span>
                    <span className="text-xl font-black text-brand-blue font-heading">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleOpenPayment}
                  disabled={cart.length === 0}
                  className="w-full py-3.5 bg-gradient-to-r from-brand-red to-red-600 hover:from-red-700 hover:to-red-800 text-white font-extrabold text-sm rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.99]"
                >
                  <Coins size={17} />
                  <span>Checkout ({formatCurrency(totalAmount)})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE B: AMBIL PESANAN WEB (SCAN QR / PICKUP) */}
      {/* ========================================================================= */}
      {activeMode === 'pickup' && (
        <div className="flex-1 min-h-0 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pr-1 pb-4">
          {/* Scanner & Input Column (Left: 6/12) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold font-heading text-text-primary flex items-center gap-2">
                  <Camera size={18} className="text-brand-blue" />
                  Pemindai QR Code Pembeli
                </h2>
                <div className="flex items-center gap-2">
                  {isCameraActive ? (
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-bold flex items-center gap-1.5 hover:bg-red-100"
                    >
                      <CameraOff size={13} /> Tutup Kamera
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startCamera}
                      disabled={cameraLoading}
                      className="px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-100"
                    >
                      <Camera size={13} /> Buka Kamera HP
                    </button>
                  )}
                </div>
              </div>

              {cameraError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{cameraError}</span>
                </div>
              )}

              {/* Camera Video Viewport */}
              {isCameraActive && (
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border-2 border-brand-blue mb-4 flex items-center justify-center">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    playsInline
                    muted
                  />
                  <div className="absolute inset-0 border-2 border-emerald-400/80 rounded-2xl pointer-events-none animate-pulse" />
                  <div className="absolute bottom-2 bg-black/60 text-white text-[11px] px-3 py-1 rounded-full font-medium">
                    Arahkan kamera ke QR Code pembeli...
                  </div>
                </div>
              )}

              {/* Upload image fallback */}
              <div className="mb-4 flex items-center gap-3">
                <label className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-xl text-xs font-semibold text-gray-700 text-center cursor-pointer flex items-center justify-center gap-2 transition-colors">
                  <Upload size={14} />
                  <span>Unggah Foto QR</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>

              {/* Manual Token Input */}
              <div className="pt-3 border-t border-gray-100">
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Ketik Token QR Code (Jika Scanner Gagal)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={qrTokenInput}
                    onChange={(e) => setQrTokenInput(e.target.value)}
                    placeholder="Contoh: MGh0XQfVwDgQVAE..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono focus:outline-none focus:border-brand-blue"
                  />
                  <button
                    type="button"
                    onClick={() => handleCheckQR(qrTokenInput)}
                    disabled={checkingOrder}
                    className="px-4 py-2.5 bg-brand-blue text-white rounded-xl text-xs font-bold hover:bg-brand-blue-dark transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <RefreshCw size={13} className={checkingOrder ? 'animate-spin' : ''} />
                    <span>Cek</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Order Details & Verification Column (Right: 6/12) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs">
              <h2 className="text-base font-bold font-heading text-text-primary mb-4 flex items-center gap-2">
                <FileText size={18} className="text-brand-blue" />
                Detail Pesanan Pembeli
              </h2>

              {previewError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{previewError}</span>
                </div>
              )}

              {verifySuccess && (
                <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs">
                  <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-bold text-sm">Pengambilan Berhasil Diverifikasi!</p>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      Pesanan selesai diserahkan ke pembeli. Stok tercatat aman tanpa duplikasi.
                    </p>
                  </div>
                </div>
              )}

              {!previewOrder ? (
                <div className="py-16 text-center border-2 border-dashed border-gray-200 rounded-2xl">
                  <QrCode size={36} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-gray-500">
                    Belum ada QR pesanan yang diperiksa
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Scan QR code pembeli di sebelah kiri untuk melihat data pesanan.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Order Metadata */}
                  <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-gray-500 text-[11px]">
                        ID: {previewOrder.id.substring(0, 13)}...
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${previewOrder.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : previewOrder.status === 'completed'
                            ? 'bg-gray-200 text-gray-700'
                            : 'bg-amber-100 text-amber-800'
                          }`}
                      >
                        Status: {previewOrder.status}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t border-gray-200/60 font-semibold text-text-primary">
                      <span>Nama Pembeli:</span>
                      <span>{previewOrder.customer_name || 'Pembeli Web'}</span>
                    </div>

                    {previewOrder.customer_phone && (
                      <div className="flex justify-between items-center text-gray-500">
                        <span>WhatsApp:</span>
                        <span className="font-mono">{previewOrder.customer_phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Items Ordered */}
                  <div>
                    <h3 className="font-bold text-xs text-gray-700 mb-2">Item yang Harus Diserahkan:</h3>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto no-scrollbar">
                      {previewOrder.items?.map((it, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between text-xs"
                        >
                          <span className="font-bold text-text-primary">
                            {it.quantity}x {it.product_name || 'Dimsum'}
                          </span>
                          <span className="text-gray-500 font-mono">
                            {formatCurrency(it.unit_price * it.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Verification Slider */}
                  {previewOrder.status === 'paid' ? (
                    <div className="pt-2 space-y-2">
                      {verifyError && (
                        <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-1.5">
                          <AlertCircle size={14} />
                          <span>{verifyError}</span>
                        </div>
                      )}
                      <SwipeToConfirm
                        onConfirm={handleVerifyPickup}
                        loading={verifyLoading}
                        text="Geser untuk Verifikasi (Serahkan Pesanan)"
                        loadingText="Memverifikasi Pengambilan..."
                        successText="Pengambilan Selesai!"
                        resetTrigger={verifyError || previewOrder.id}
                      />
                      <p className="text-[10px] text-center text-gray-400">
                        Geser tombol slider ke kanan hingga penuh untuk konfirmasi penyerahan makanan
                      </p>
                    </div>
                  ) : previewOrder.status === 'completed' ? (
                    <div className="p-3 bg-gray-100 border border-gray-200 rounded-xl text-center text-xs text-gray-600 font-semibold flex items-center justify-center gap-2">
                      <Check size={16} className="text-emerald-600" />
                      Pesanan ini sudah selesai diambil sebelumnya.
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center text-xs text-amber-700 font-semibold">
                      Pesanan belum lunas (Status: {previewOrder.status}). Menunggu konfirmasi pembayaran.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL PEMBAYARAN KASIR */}
      {/* ========================================================================= */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-lg w-full p-6 animate-scaleIn">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Coins className="text-brand-red" size={20} />
                <h3 className="font-bold text-lg font-heading text-text-primary">
                  Pembayaran Kasir
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Total tagihan */}
            <div className="my-4 p-4 bg-gray-50 rounded-2xl border border-gray-200 flex justify-between items-center">
              <span className="text-xs font-semibold text-text-secondary">Total yang Harus Dibayar:</span>
              <span className="text-xl font-black text-brand-blue font-heading">
                {formatCurrency(totalAmount)}
              </span>
            </div>

            {/* Payment Method Selector Tabs */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-xl mb-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => { setPaymentMethod('cash'); setQrisData(null); setVaData(null); }}
                className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${paymentMethod === 'cash' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-600'
                  }`}
              >
                <Coins size={14} /> Tunai
              </button>
              <button
                type="button"
                onClick={() => { setPaymentMethod('qris'); setVaData(null); }}
                className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${paymentMethod === 'qris' ? 'bg-white text-brand-blue shadow-xs' : 'text-gray-600'
                  }`}
              >
                <QrCode size={14} /> QRIS
              </button>
              <button
                type="button"
                onClick={() => { setPaymentMethod('transfer'); setQrisData(null); }}
                className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${paymentMethod === 'transfer' ? 'bg-white text-purple-700 shadow-xs' : 'text-gray-600'
                  }`}
              >
                <CreditCard size={14} /> Transfer VA
              </button>
            </div>

            {paymentError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{paymentError}</span>
              </div>
            )}

            {/* CASH PAYMENT SECTION */}
            {paymentMethod === 'cash' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Uang Tunai Diterima (Rp)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold text-gray-400 font-mono select-none pointer-events-none">
                      Rp
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={cashReceived ? Number(cashReceived).toLocaleString('id-ID') : ''}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '');
                        setCashReceived(raw ? String(parseInt(raw, 10)) : '');
                      }}
                      placeholder="0"
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 text-lg font-bold text-gray-800 focus:outline-none focus:border-brand-red font-mono"
                    />
                  </div>
                </div>

                {/* Quick Cash Chips */}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setCashReceived(totalAmount.toString())}
                    className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700"
                  >
                    Uang Pas
                  </button>
                  {[20000, 50000, 100000, 200000].map((nominal) => (
                    <button
                      key={nominal}
                      type="button"
                      onClick={() => setCashReceived(nominal.toString())}
                      className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 font-mono"
                    >
                      {formatCurrency(nominal)}
                    </button>
                  ))}
                </div>

                {/* Live Change Indicator */}
                {cashReceived && (
                  <div
                    className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between font-bold ${cashChange >= 0
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border-red-200 text-red-700'
                      }`}
                  >
                    <span>{cashChange >= 0 ? 'Kembalian:' : 'Uang Kurang:'}</span>
                    <span className="text-base font-black font-mono">
                      {cashChange >= 0 ? formatCurrency(cashChange) : formatCurrency(Math.abs(cashChange))}
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleProcessOrder}
                  disabled={submittingOrder || cashVal < totalAmount}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 size={16} />
                  <span>{submittingOrder ? 'Menyimpan Transaksi...' : 'Selesaikan Transaksi Tunai'}</span>
                </button>
              </div>
            )}

            {/* QRIS PAYMENT SECTION (PAYWUZ) */}
            {paymentMethod === 'qris' && (
              <div className="space-y-4 text-center">
                {!qrisData ? (
                  <div className="py-4">
                    <p className="text-xs text-text-secondary mb-3">
                      Sistem akan membuat QRIS dinamis via Paywuz untuk nominal pesanan ini.
                    </p>
                    <button
                      type="button"
                      onClick={handleProcessOrder}
                      disabled={submittingOrder}
                      className="w-full py-3 bg-brand-blue hover:bg-brand-blue-dark text-white font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
                    >
                      <QrCode size={16} />
                      <span>{submittingOrder ? 'Membuat QRIS...' : 'Tampilkan QRIS di Layar'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex flex-col items-center">
                    <p className="text-xs font-bold text-gray-700 mb-2">Scan QRIS untuk Membayar:</p>
                    <div className="p-3 bg-white rounded-2xl border-2 border-brand-blue/30 shadow-md">
                      <QRCodeSVG value={qrisData.qr_string || qrisData.id} size={180} />
                    </div>
                    <p className="text-[11px] text-gray-500 font-mono mt-2">
                      Nominal: <strong>{formatCurrency(totalAmount)}</strong>
                    </p>

                    {/* Auto-detect badge indicator */}
                    <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-emerald-700 font-medium bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200/80 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                      <span>Mendeteksi pembayaran otomatis...</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCheckGatewayStatus(true)}
                      disabled={checkingPayment}
                      className="mt-3 w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-gray-200"
                    >
                      <RefreshCw size={14} className={checkingPayment ? 'animate-spin text-brand-blue' : 'text-gray-500'} />
                      <span>Cek Manual</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TRANSFER VIRTUAL ACCOUNT PAYMENT SECTION (PAYWUZ) */}
            {paymentMethod === 'transfer' && (
              <div className="space-y-4">
                {!vaData ? (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">
                      Pilih Bank Transfer (Virtual Account Paywuz):
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                      {BANK_OPTIONS.map((b) => {
                        const isSelected = selectedBank === b.code;
                        return (
                          <button
                            key={b.code}
                            type="button"
                            onClick={() => setSelectedBank(b.code)}
                            className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex flex-col gap-0.5 ${isSelected
                              ? 'border-purple-600 bg-purple-50 text-purple-900 shadow-xs ring-1 ring-purple-600'
                              : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                              }`}
                          >
                            <span className="font-extrabold text-sm">{b.name}</span>
                            <span className="text-[10px] font-normal text-gray-500 line-clamp-1">{b.desc}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="p-3 bg-purple-50/70 border border-purple-200/60 rounded-xl text-xs text-purple-950 flex items-start gap-2 mb-4">
                      <ShieldCheck size={18} className="text-purple-600 shrink-0 mt-0.5" />
                      <p className="leading-relaxed">
                        Nomor Virtual Account resmi diterbitkan langsung oleh <strong>Paywuz</strong>. Transaksi otomatis terkonfirmasi begitu dana masuk ke rekening toko.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleProcessOrder}
                      disabled={submittingOrder}
                      className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
                    >
                      <CreditCard size={16} />
                      <span>{submittingOrder ? 'Membuat Virtual Account...' : 'Tampilkan No. Virtual Account'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex flex-col items-center text-center">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold mb-3">
                      <CreditCard size={13} />
                      <span>{vaData.paymentMethod || selectedBank} Virtual Account</span>
                    </div>

                    <p className="text-xs text-gray-500 mb-1">Nomor Rekening Virtual Account:</p>
                    <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-gray-300 shadow-xs">
                      <span className="text-lg font-black font-mono tracking-wider text-gray-900 select-all">
                        {vaData.paymentNumber || '-'}
                      </span>
                      {vaData.paymentNumber && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(vaData.paymentNumber);
                            setCopiedVa(true);
                            setTimeout(() => setCopiedVa(false), 2000);
                          }}
                          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-purple-600 transition-colors"
                          title="Salin No. Rekening"
                        >
                          {copiedVa ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                        </button>
                      )}
                    </div>
                    {copiedVa && (
                      <span className="text-[11px] text-emerald-600 font-semibold mt-1">Nomor VA berhasil disalin!</span>
                    )}

                    <div className="mt-3 text-xs text-gray-600">
                      <span>Total yang Harus Ditransfer: </span>
                      <strong className="text-sm font-black text-gray-900 font-mono">
                        {formatCurrency(vaData.totalPayment || totalAmount)}
                      </strong>
                    </div>

                    {/* Live Auto-Detect status indicator */}
                    <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-emerald-700 font-medium bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200/80 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                      <span>Mendeteksi transfer otomatis dari bank...</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCheckGatewayStatus(true)}
                      disabled={checkingPayment}
                      className="mt-3 w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-gray-200"
                    >
                      <RefreshCw size={14} className={checkingPayment ? 'animate-spin text-purple-600' : 'text-gray-500'} />
                      <span>Cek Manual</span>
                    </button>

                    <p className="text-[10px] text-gray-400 mt-2">
                      Sistem terhubung langsung ke Paywuz. Anti struk transfer palsu.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL STRUK KASIR (THERMAL RECEIPT) */}
      {/* ========================================================================= */}
      {completedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-sm w-full p-6 animate-scaleIn">
            <div className="text-center pb-4 border-b border-gray-200">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-2">
                <Check size={24} />
              </div>
              <h3 className="font-black text-lg font-heading text-text-primary">
                Transaksi Sukses!
              </h3>
              <p className="text-[11px] text-text-secondary mt-0.5 font-mono">
                Order ID: {completedOrder.id.substring(0, 13)}
              </p>
            </div>

            {/* Printable Thermal Slip Area */}
            <div className="my-4 p-4 bg-gray-50/80 rounded-2xl border border-dashed border-gray-300 font-mono text-xs space-y-2">
              <div className="text-center font-bold text-gray-800">
                MAKAN DIMSUM INDONESIA
                <div className="text-[10px] font-normal text-gray-500">Meja Kasir & Outlet Toko</div>
              </div>

              <div className="text-[10px] text-gray-500 border-t border-b border-gray-200 py-1">
                <div>Waktu: {new Date(completedOrder.created_at).toLocaleString('id-ID')}</div>
                <div>Kasir: {adminUser?.full_name || 'Staff'}</div>
                {completedOrder.customer_name ? (
                  <div>Pelanggan: {completedOrder.customer_name}</div>
                ) : null}
                <div>Layanan: Pembelian Langsung (Outlet)</div>
              </div>

              {/* Items */}
              <div className="space-y-1 py-1">
                {completedOrder.items?.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <span>{it.quantity}x {it.product_name || 'Dimsum'}</span>
                    <span>{formatCurrency(it.unit_price * it.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Total & Change */}
              <div className="border-t border-gray-200 pt-1 space-y-0.5 text-[11px]">
                <div className="flex justify-between font-bold">
                  <span>TOTAL:</span>
                  <span>{formatCurrency(completedOrder.total_amount)}</span>
                </div>
                {completedPayment?.cash_received && (
                  <>
                    <div className="flex justify-between text-gray-600">
                      <span>Tunai Diterima:</span>
                      <span>{formatCurrency(completedPayment.cash_received)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-emerald-700">
                      <span>Kembalian:</span>
                      <span>{formatCurrency(completedPayment.cash_change)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {waSentMsg && (
              <div className="mb-3 p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] rounded-xl text-center font-semibold">
                {waSentMsg}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <Printer size={14} />
                  <span>Cetak Struk</span>
                </button>

                {completedOrder.customer_phone ? (
                  <button
                    type="button"
                    onClick={() => handleSendWhatsAppReceipt(completedOrder.id, completedOrder.customer_phone)}
                    disabled={waSending}
                    className="py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 border border-emerald-200"
                  >
                    <Share2 size={14} />
                    <span>{waSending ? 'Mengirim...' : 'Kirim WA'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const hp = prompt('Masukkan nomor WhatsApp pembeli (contoh: 08123456789):');
                      if (hp) handleSendWhatsAppReceipt(completedOrder.id, hp);
                    }}
                    className="py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 border border-emerald-200"
                  >
                    <Share2 size={14} />
                    <span>Kirim WA</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setCompletedOrder(null)}
                className="w-full py-3 bg-brand-red hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-colors"
              >
                Kembali
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
