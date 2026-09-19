import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  ConciergeBell, 
  QrCode, 
  ChevronRight, 
  Ticket,
  CheckCircle2,
  PenLine,
  Download,
  Share2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ScanLine,
  Wallet,
  Clock,
  AlertTriangle,
  AlertCircle,
  X,
  Bike,
  MapPin
} from 'lucide-react';
import { saveOrderToHistory, updateOrderStatusInHistory } from '../utils/orderHistory';
import api from '../api/client';
import usePolling from '../hooks/usePolling';

export default function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const confirmedTime = location.state?.confirmedTime || 'Pick Up Now';
  const cartItems = location.state?.cartItems || [];
  const total = location.state?.totalPrice || 0;
  const locationFinalTotal = location.state?.finalTotal;
  const orderNotes = location.state?.orderNotes || localStorage.getItem('dimsum_order_notes') || '';
  const orderType = location.state?.orderType || (localStorage.getItem('dimsum_order_type') || 'pickup');
  const deliveryAddress = location.state?.deliveryAddress || (localStorage.getItem('dimsum_delivery_address') || null);
  const deliveryNotes = location.state?.deliveryNotes || (localStorage.getItem('dimsum_delivery_notes') || null);
  const deliveryFee = location.state?.deliveryFee !== undefined ? location.state.deliveryFee : (orderType === 'delivery' ? 10000 : 0);

  // Security Route Guard: Prevent direct URL navigation without active order or cart items
  useEffect(() => {
    const savedPending = localStorage.getItem('dimsum_pending_order');
    let hasValidPending = false;
    if (savedPending) {
      try {
        const parsed = JSON.parse(savedPending);
        if (parsed.orderId && (!parsed.expiresAt || new Date(parsed.expiresAt).getTime() > Date.now())) {
          hasValidPending = true;
        }
      } catch (e) {}
    }

    const hasCart = (cartItems && cartItems.length > 0) || (() => {
      try {
        const chk = localStorage.getItem('dimsum_checkout_items');
        return chk ? JSON.parse(chk).length > 0 : false;
      } catch {
        return false;
      }
    })();

    if (!hasValidPending && !hasCart) {
      navigate('/menu', { 
        replace: true, 
        state: { emptyCartNotice: 'Keranjang belanja Anda masih kosong. Silakan pilih menu terlebih dahulu.' } 
      });
    }
  }, [cartItems, navigate]);

  const [customerName, setCustomerName] = useState(() => localStorage.getItem('dimsum_customer_name') || '');
  const [customerPhone, setCustomerPhone] = useState(() => localStorage.getItem('dimsum_customer_phone') || '');
  const [customerEmail, setCustomerEmail] = useState(() => localStorage.getItem('dimsum_customer_email') || '');

  React.useEffect(() => {
    localStorage.setItem('dimsum_customer_name', customerName);
  }, [customerName]);

  React.useEffect(() => {
    localStorage.setItem('dimsum_customer_phone', customerPhone);
  }, [customerPhone]);

  React.useEffect(() => {
    localStorage.setItem('dimsum_customer_email', customerEmail);
  }, [customerEmail]);

  const [pageLoading, setPageLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [qrisData, setQrisData] = useState(null);
  const [orderId, setOrderId] = useState(null);

  // Auto-scroll to top and simulate smooth loading transition matching Menu.jsx
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    const timer = setTimeout(() => {
      setPageLoading(false);
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  // Ensure scroll is at top whenever QRIS data appears
  useEffect(() => {
    if (qrisData) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, [qrisData]);

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(() => {
    // Only restore if returning from Promo/Vouchers page
    const fromPromo = sessionStorage.getItem('dimsum_promo_return_method');
    if (fromPromo) {
      sessionStorage.removeItem('dimsum_promo_return_method');
      return fromPromo;
    }
    return 'qris';
  });
  const [payableAmount, setPayableAmount] = useState(null);
  const [isGuideOpen, setIsGuideOpen] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const qrContainerRef = useRef(null);

  useEffect(() => {
    localStorage.removeItem('dimsum_payment_method');
    const handlePopState = () => {
      sessionStorage.setItem('dimsum_returned_from_payment', 'true');
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  useEffect(() => {
    if (location.state?.notPaidNotice) {
      showToast(typeof location.state.notPaidNotice === 'string'
        ? location.state.notPaidNotice
        : 'Pembayaran belum terdeteksi. Silakan selesaikan pembayaran QRIS terlebih dahulu.');
    }
  }, [location.state?.notPaidNotice]);

  const copyToClipboard = () => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(window.location.href)
        .then(() => showToast('Tautan pembayaran berhasil disalin!'))
        .catch(() => showToast('Gagal menyalin link'));
    } else {
      showToast('Tautan pembayaran disalin!');
    }
  };

  const handleDownloadQR = () => {
    try {
      const svg = qrContainerRef.current?.querySelector('svg');
      if (!svg) return;

      if (!svg.getAttribute('xmlns')) {
        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      }

      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        const scale = 2;
        const padding = 24 * scale;
        canvas.width = (img.width * scale) + (padding * 2);
        canvas.height = (img.height * scale) + (padding * 2);

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, padding, padding, img.width * scale, img.height * scale);

        const pngUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.download = `QRIS-MakanDimsum-${orderId || 'payment'}.png`;
        a.href = pngUrl;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        showToast('QR Code berhasil diunduh!');
      };

      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);
    } catch (err) {
      console.error('Download QR error:', err);
      showToast('Gagal mengunduh QR Code');
    }
  };

  const handleShareQR = async () => {
    const displayAmt = payableAmount || finalTotal || total;
    const shareTitle = 'QRIS Makan Dimsum';
    const shareText = `Scan QRIS untuk pembayaran pesanan Makan Dimsum #${orderId || ''} (Rp${displayAmt.toLocaleString('id-ID')}).`;

    try {
      const svg = qrContainerRef.current?.querySelector('svg');
      if (svg && navigator.canShare) {
        if (!svg.getAttribute('xmlns')) {
          svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        }
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
          const scale = 2;
          const padding = 24 * scale;
          canvas.width = (img.width * scale) + (padding * 2);
          canvas.height = (img.height * scale) + (padding * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, padding, padding, img.width * scale, img.height * scale);

          canvas.toBlob(async (blob) => {
            if (blob) {
              const file = new File([blob], `QRIS-MakanDimsum-${orderId || 'pay'}.png`, { type: 'image/png' });
              if (navigator.canShare({ files: [file] })) {
                try {
                  await navigator.share({
                    title: shareTitle,
                    text: shareText,
                    files: [file]
                  });
                  return;
                } catch (shareErr) {
                  if (shareErr.name === 'AbortError') return;
                }
              }
            }

            if (navigator.share) {
              try {
                await navigator.share({
                  title: shareTitle,
                  text: shareText,
                  url: window.location.href
                });
                return;
              } catch (err) {
                if (err.name === 'AbortError') return;
              }
            }
            copyToClipboard();
          }, 'image/png');
        };

        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);
        return;
      }

      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: window.location.href
        });
        return;
      }
      copyToClipboard();
    } catch (err) {
      if (err.name !== 'AbortError') {
        copyToClipboard();
      }
    }
  };

  // Voucher state & calculation
  const [appliedVoucher, setAppliedVoucher] = useState(() => {
    try {
      const saved = localStorage.getItem('dimsum_applied_voucher');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const discountAmount = React.useMemo(() => {
    if (!appliedVoucher) return 0;
    if (appliedVoucher.discount_type === 'percent') {
      const pct = Number(appliedVoucher.discount_value || 0);
      let disc = (pct / 100) * total;
      if (appliedVoucher.max_discount !== null && appliedVoucher.max_discount !== undefined) {
        disc = Math.min(disc, Number(appliedVoucher.max_discount));
      }
      return Math.round(Math.min(disc, total));
    }
    return Math.round(Math.min(Number(appliedVoucher.discount || appliedVoucher.discount_value || 0), total));
  }, [appliedVoucher, total]);
  const finalTotal = locationFinalTotal !== undefined ? Number(locationFinalTotal) : Math.max(0, total - discountAmount);

  // Countdown timer & expiry state
  const [timeLeft, setTimeLeft] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  // Restore pending order on mount if user returns to page
  useEffect(() => {
    if (qrisData) return;
    const savedPending = localStorage.getItem('dimsum_pending_order');
    if (savedPending) {
      try {
        const parsed = JSON.parse(savedPending);
        // Check expiry against expiresAt or 60 min fallback
        if (parsed.expiresAt && new Date(parsed.expiresAt).getTime() <= Date.now()) {
          localStorage.removeItem('dimsum_pending_order');
          return;
        }
        if (parsed.createdAt && (Date.now() - new Date(parsed.createdAt).getTime() > 60 * 60 * 1000)) {
          localStorage.removeItem('dimsum_pending_order');
          return;
        }
        if (parsed.orderId && parsed.qrisData) {
          setQrisData(parsed.qrisData);
          setOrderId(parsed.orderId);
          setPayableAmount(parsed.totalAmount);
          if (parsed.customerName) setCustomerName(parsed.customerName);
          if (parsed.customerPhone) setCustomerPhone(parsed.customerPhone);
        }
      } catch (err) {
        console.error("Failed to restore pending order:", err);
      }
    }
  }, [qrisData]);

  // Real-time countdown timer for QRIS expiry
  useEffect(() => {
    if (!qrisData) {
      setTimeLeft(null);
      setIsExpired(false);
      return;
    }

    let expiryTimestamp = null;
    if (qrisData.expiresAt) {
      expiryTimestamp = new Date(qrisData.expiresAt).getTime();
    } else {
      const savedPending = localStorage.getItem('dimsum_pending_order');
      if (savedPending) {
        try {
          const parsed = JSON.parse(savedPending);
          if (parsed.expiresAt) {
            expiryTimestamp = new Date(parsed.expiresAt).getTime();
          } else if (parsed.createdAt) {
            expiryTimestamp = new Date(parsed.createdAt).getTime() + 60 * 60 * 1000;
          }
        } catch {
          // ignore
        }
      }
    }

    if (!expiryTimestamp) {
      expiryTimestamp = Date.now() + 60 * 60 * 1000;
    }

    const updateTimer = () => {
      const now = Date.now();
      const diffInSeconds = Math.max(0, Math.floor((expiryTimestamp - now) / 1000));
      setTimeLeft(diffInSeconds);

      if (diffInSeconds <= 0) {
        setIsExpired(true);
        localStorage.removeItem('dimsum_pending_order');
      } else {
        setIsExpired(false);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [qrisData]);

  const formatCountdown = (seconds) => {
    if (seconds === null || seconds === undefined) return '--:--';
    if (seconds <= 0) return '00:00';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Automatically listen for webhook settlement while user is on QRIS screen with usePolling
  const pendingRaw = localStorage.getItem('dimsum_pending_order');
  let orderToken = localStorage.getItem('dimsum_current_order_token');
  if (!orderToken && pendingRaw) {
    try { orderToken = JSON.parse(pendingRaw).accessToken; } catch {}
  }
  const pollHeaders = orderToken ? { 'X-Order-Token': orderToken } : {};

  usePolling(
    orderId && qrisData ? `/api/orders/${orderId}` : null,
    {
      interval: 4000,
      headers: pollHeaders,
      pauseOnHidden: true,
      stopWhen: (d) => d?.status === 'paid' || d?.status === 'fulfilling' || d?.status === 'completed' || d?.status === 'cancelled',
      onData: (data) => {
        const s = data.status;
        if (s === 'paid' || s === 'fulfilling' || s === 'completed') {
          localStorage.removeItem('dimsum_pending_order');
          localStorage.removeItem('dimsum_cart');
          localStorage.removeItem('dimsum_checkout_items');
          localStorage.removeItem('dimsum_order_notes');
          updateOrderStatusInHistory(orderId, s, { qrToken: data.qr_token });
          navigate('/order-status', { state: { orderId, accessToken: orderToken } });
        } else if (s === 'cancelled') {
          setIsExpired(true);
          localStorage.removeItem('dimsum_pending_order');
          updateOrderStatusInHistory(orderId, 'cancelled');
        }
      }
    }
  );

  const handlePayment = async () => {
    if (!customerName?.trim() || !customerPhone?.trim()) {
      showToast("Mohon lengkapi Nama dan Nomor WhatsApp terlebih dahulu");
      return;
    }
    if (!selectedPaymentMethod) {
      showToast("Silakan pilih metode pembayaran (QRIS)");
      return;
    }
    setIsLoading(true);
    try {
      const fullDeliveryAddress = deliveryAddress ? (deliveryAddress + (deliveryNotes ? ` (Patokan: ${deliveryNotes})` : '')) : null;

      const res = await api.post('/api/orders', {
        customer: { name: customerName, phone: customerPhone, email: customerEmail },
        items: cartItems.map(item => ({ product_id: item.id, quantity: item.quantity })),
        notes: orderNotes ? orderNotes.trim() : null,
        voucher_code: appliedVoucher?.code || null,
        pickup_time: orderType === 'delivery' ? null : (confirmedTime || null),
        order_type: orderType,
        delivery_address: orderType === 'delivery' ? fullDeliveryAddress : null
      });

      if (res.success && res.data) {
        const orderObj = res.data.order;
        const paywuzObj = res.data.paywuz;
        const token = orderObj?.access_token;
        if (token) {
          localStorage.setItem('dimsum_current_order_token', token);
        }
        const amt = Math.round(Number(orderObj?.total_amount || paywuzObj?.amount || finalTotal || total || 0));
        const totalItemsCount = cartItems.reduce((acc, it) => acc + (it.quantity || 1), 0);
        const expiresAt = paywuzObj?.expiresAt || new Date(Date.now() + 60 * 60 * 1000).toISOString();

        const pendingObj = {
          orderId: orderObj.id,
          accessToken: token,
          qrisData: paywuzObj,
          totalAmount: amt,
          totalItems: totalItemsCount,
          confirmedTime: orderType === 'delivery' ? 'Delivery Order' : confirmedTime,
          customerName,
          customerPhone,
          orderType,
          deliveryAddress: fullDeliveryAddress,
          notes: orderNotes ? orderNotes.trim() : null,
          createdAt: new Date().toISOString(),
          expiresAt: expiresAt
        };
        localStorage.setItem('dimsum_pending_order', JSON.stringify(pendingObj));
        localStorage.removeItem('dimsum_order_notes');

        // Record order into local order history
        saveOrderToHistory({
          orderId: orderObj.id,
          accessToken: token,
          createdAt: new Date().toISOString(),
          status: 'pending_payment',
          totalAmount: amt,
          totalItems: totalItemsCount,
          confirmedTime: orderType === 'delivery' ? 'Delivery Order' : (confirmedTime || 'Pick Up'),
          customerName,
          customerPhone,
          orderType,
          deliveryAddress: fullDeliveryAddress,
          notes: orderNotes ? orderNotes.trim() : null,
          items: cartItems.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image_url: item.image_url
          }))
        });

        setQrisData(paywuzObj);
        setOrderId(orderObj.id);
        setPayableAmount(amt);
      } else {
        alert(data.message || data.error || "Gagal membuat pesanan. Silakan periksa kembali keranjang dan voucher Anda.");
      }
    } catch (e) {
      alert("Gagal memproses pembayaran. Periksa koneksi internet Anda.");
    } finally {
      setIsLoading(false);
    }
  };

  // Loading Screen matching Menu.jsx
  if (pageLoading || isLoading) {
    return (
      <div className="max-w-[480px] mx-auto min-h-screen relative shadow-2xl bg-bg-cream flex flex-col items-center justify-center z-50">
        <div className="w-12 h-12 border-4 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 font-body font-bold text-[14px] text-brand-blue animate-pulse">
          {isLoading ? 'Menyiapkan QRIS...' : 'Menyiapkan Pembayaran...'}
        </p>
      </div>
    );
  }

  if (qrisData) {
    const displayAmount = Math.round(Number(payableAmount || finalTotal || total || 0));

    const paymentSteps = [
      {
        title: '1. Simpan / Screenshot QR',
        desc: 'Unduh gambar QR dengan tombol di atas atau ambil tangkapan layar (screenshot) ke galeri ponselmu.',
        icon: <Download size={28} strokeWidth={1.8} />,
      },
      {
        title: '2. Buka Aplikasi Pembayaran',
        desc: "Buka BCA Mobile, GoPay, OVO, DANA, ShopeePay, Livin' by Mandiri, atau m-banking lainnya.",
        icon: <Wallet size={28} strokeWidth={1.8} />,
      },
      {
        title: '3. Scan atau Unggah QR',
        desc: 'Pilih menu Bayar / QRIS, lalu unggah gambar QR dari galeri atau scan langsung dengan kamera.',
        icon: <ScanLine size={28} strokeWidth={1.8} />,
      },
      {
        title: '4. Konfirmasi & Selesai',
        desc: `Periksa nominal sudah tepat Rp${displayAmount.toLocaleString('id-ID')} dan masukkan PIN. Sistem otomatis mengonfirmasi pesananmu!`,
        icon: <CheckCircle2 size={28} strokeWidth={1.8} />,
      },
    ];

    return (
      <div className="max-w-[480px] mx-auto min-h-screen relative shadow-2xl overflow-x-hidden bg-bg-cream flex flex-col">
        {/* Floating Toast Notification Banner */}
        {toastMessage && (
          <div className="fixed top-4 left-4 right-4 max-w-[440px] mx-auto z-[250] bg-white rounded-[20px] p-3.5 shadow-elevated border border-amber-200/80 flex items-start gap-3 animate-toast-in">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
              toastMessage.includes('belum') || toastMessage.includes('Gagal')
                ? 'bg-amber-50 text-amber-600 border border-amber-200/60'
                : 'bg-green-50 text-green-600 border border-green-200/60'
            }`}>
              {toastMessage.includes('belum') || toastMessage.includes('Gagal') ? (
                <AlertCircle size={20} strokeWidth={2.2} />
              ) : (
                <CheckCircle2 size={20} strokeWidth={2.2} />
              )}
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <span className="font-heading font-black text-[13px] text-text-primary">
                {toastMessage.includes('belum') ? 'Pembayaran Belum Terdeteksi' : 'Informasi'}
              </span>
              <p className="font-body font-medium text-[12px] text-text-secondary leading-snug mt-0.5">
                {toastMessage}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage('')}
              className="text-gray-400 hover:text-gray-600 p-1 shrink-0 -mr-1"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* 1. Brand Blue Header matching Homepage style */}
        <header className="bg-brand-blue pt-4 px-6 pb-12 text-left relative shrink-0">
          <div className="flex items-center justify-between text-white mb-2">
            <button 
              onClick={() => navigate('/menu')}
              className="w-10 h-10 bg-white/20 text-white rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              title="Kembali ke Menu"
            >
              <ArrowLeft size={20} strokeWidth={2.5} />
            </button>
            <span className="font-heading font-black text-[18px] text-white tracking-wide">
              Pembayaran QRIS
            </span>
            <div className="w-10"></div>
          </div>
          <div className="text-center mt-2">
            <h1 className="font-heading font-black text-[22px] tracking-[0.5px] text-white">Scan to Pay</h1>
            <p className="font-body font-bold text-[11px] text-white/85">Scan QRIS di bawah ini dengan e-wallet atau m-banking</p>
          </div>
        </header>

        {/* 2. Sheet Content (overlapping header with smooth curve, identical to Home.jsx) */}
        <div className="bg-bg-cream rounded-t-[32px] -mt-6 relative flex-1 overflow-y-auto hide-scrollbar px-6 pt-6 pb-16 flex flex-col items-center shadow-[0_-4px_24px_rgba(0,0,0,0.05)]">
          
          {/* QR Card */}
          <div 
            ref={qrContainerRef} 
            className="bg-white rounded-[28px] p-6 shadow-elevated mb-4 flex flex-col items-center w-full max-w-[340px] border border-brand-gold/20 relative overflow-hidden"
          >
            {/* Expired Overlay when timer expires */}
            {isExpired && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                <div className="w-14 h-14 rounded-full bg-red-50 text-red-500 border border-red-200 flex items-center justify-center mb-3">
                  <AlertTriangle size={28} />
                </div>
                <h3 className="font-heading font-black text-[18px] text-text-primary mb-1">
                  QRIS Kedaluwarsa
                </h3>
                <p className="font-body font-medium text-[12px] text-text-secondary leading-relaxed mb-5 max-w-[240px]">
                  Batas waktu pembayaran telah berakhir. Silakan buat pesanan baru.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('dimsum_pending_order');
                    setQrisData(null);
                    navigate('/menu');
                  }}
                  className="bg-brand-gold text-white font-body font-bold text-[13px] py-2.5 px-6 rounded-[14px] shadow-card hover:bg-brand-gold-dark active:scale-95 transition-all"
                >
                  Pesan Ulang
                </button>
              </div>
            )}

            {/* Header label inside card */}
            <div className="flex items-center justify-between w-full mb-3 px-1">
              <div className="flex items-center gap-1.5 bg-brand-gold/10 text-brand-gold px-3 py-1 rounded-full text-[11px] font-body font-bold">
                <QrCode size={13} strokeWidth={2.5} />
                <span>QRIS Nasional</span>
              </div>
              <span className="font-body font-bold text-[11px] text-text-secondary">Makan Dimsum</span>
            </div>

            {/* QR Code Graphic */}
            <div className="bg-white p-2 rounded-[16px] flex justify-center items-center">
              <QRCodeSVG value={qrisData.paymentNumber || qrisData.paymentUrl || 'NO_DATA'} size={210} />
            </div>

            {/* Expiry Countdown Pill */}
            <div className={`mt-3 py-1.5 px-4 rounded-full border flex items-center gap-2 transition-all ${
              isExpired
                ? 'bg-red-50 border-red-200 text-red-600'
                : timeLeft !== null && timeLeft < 300
                  ? 'bg-red-50 border-red-200 text-red-600 animate-pulse'
                  : 'bg-brand-gold/10 border-brand-gold/30 text-brand-gold-dark'
            }`}>
              <Clock size={14} className={isExpired ? 'text-red-500' : 'text-brand-gold animate-ticking shrink-0'} />
              <span className="text-[11px] font-body font-semibold">
                {isExpired ? (
                  <span>Waktu Pembayaran Telah Habis</span>
                ) : (
                  <>
                    Selesaikan dalam <span className="font-mono font-black text-[12px]">{formatCountdown(timeLeft)}</span>
                  </>
                )}
              </span>
            </div>

            {/* Total Price display inside card */}
            <div className="w-full border-t border-gray-100 mt-4 pt-3 flex flex-col items-center">
              <span className="font-body font-bold text-[10px] text-text-secondary uppercase tracking-widest">Total Tagihan</span>
              <span className="font-heading font-black text-[24px] text-brand-gold tracking-tight mt-0.5">
                Rp{displayAmount.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Unduh & Bagikan Action Buttons */}
          <div className={`flex items-center gap-3 w-full max-w-[340px] mb-4 transition-opacity ${isExpired ? 'opacity-40 pointer-events-none' : ''}`}>
            <button
              type="button"
              onClick={handleDownloadQR}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white border border-brand-blue/30 text-brand-blue hover:bg-brand-blue hover:text-white rounded-[16px] font-body font-bold text-[13px] shadow-card transition-all active:scale-95"
            >
              <Download size={17} strokeWidth={2.2} />
              <span>Unduh QR</span>
            </button>

            <button
              type="button"
              onClick={handleShareQR}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white border border-brand-blue/30 text-brand-blue hover:bg-brand-blue hover:text-white rounded-[16px] font-body font-bold text-[13px] shadow-card transition-all active:scale-95"
            >
              <Share2 size={17} strokeWidth={2.2} />
              <span>Bagikan</span>
            </button>
          </div>

          {/* Main Action Button */}
          {isExpired ? (
            <button 
              onClick={() => {
                localStorage.removeItem('dimsum_pending_order');
                setQrisData(null);
                navigate('/menu');
              }}
              className="w-full max-w-[340px] bg-brand-gold text-white font-body font-bold text-[13px] py-3 px-4 rounded-[16px] shadow-elevated transition-all active:scale-95 mb-7 hover:bg-brand-gold-dark flex items-center justify-center gap-1.5"
            >
              <span>Pesan Ulang Menu</span>
              <ChevronRight size={16} />
            </button>
          ) : (
            <button 
              onClick={() => navigate('/order-status', { state: { orderId, fromQris: true }})}
              className="w-full max-w-[340px] bg-brand-gold text-white font-body font-bold text-[13px] py-3 px-4 rounded-[16px] shadow-elevated transition-all active:scale-95 mb-7 hover:bg-brand-gold-dark flex items-center justify-center"
            >
              Cek Status Pembayaran
            </button>
          )}

          {/* Cara Pembayaran (Styled exactly like 5 Langkah Order in Homepage) */}
          <div className="w-full max-w-[340px] bg-white rounded-[28px] p-6 shadow-card">
            <div className="inline-block bg-brand-gold text-white py-1.5 px-5 rounded-full font-heading font-black text-[15px] mb-6 shadow-card">
              4 Langkah Bayar
            </div>
            <div className="flex flex-col gap-6">
              {paymentSteps.map((step, index) => (
                <div key={index} className="flex gap-4 items-start">
                  <div className="text-brand-blue shrink-0 mt-0.5">
                    {step.icon}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <h3 className="font-heading font-black text-[15px] text-brand-gold">
                      {step.title}
                    </h3>
                    <p className="font-body font-bold text-[11px] leading-[1.35] text-text-primary">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Batalkan Pesanan Option */}
          <div className="mt-6 flex flex-col items-center">
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Batalkan pesanan ini dan mulai pesanan baru?")) {
                  localStorage.removeItem('dimsum_pending_order');
                  setQrisData(null);
                  navigate('/menu');
                }
              }}
              className="text-red-500 hover:text-red-600 font-body font-bold text-[13px] py-2 px-5 rounded-full hover:bg-red-50 transition-colors"
            >
              Batalkan Pesanan
            </button>
          </div>

        </div>
      </div>
    );
  }

  // Fallback while redirecting if directly accessed with empty cart and no pending order
  const savedPending = localStorage.getItem('dimsum_pending_order');
  const hasCart = (cartItems && cartItems.length > 0) || (() => {
    try {
      const chk = localStorage.getItem('dimsum_checkout_items');
      return chk ? JSON.parse(chk).length > 0 : false;
    } catch {
      return false;
    }
  })();

  if (!qrisData && !savedPending && !hasCart) {
    return (
      <div className="max-w-[480px] mx-auto min-h-screen bg-[#F5F1EB] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
          <p className="font-body font-bold text-[14px] text-text-secondary">Memeriksa pesanan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[480px] mx-auto min-h-screen relative shadow-2xl overflow-x-clip bg-[#F5F1EB] flex flex-col">
      {/* Floating Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 max-w-[440px] mx-auto z-[250] bg-white rounded-[16px] p-3.5 shadow-elevated border border-amber-200/80 flex items-start gap-3 animate-toast-in">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
            toastMessage.includes('belum') || toastMessage.includes('Gagal') || toastMessage.includes('Mohon') || toastMessage.includes('Silakan')
              ? 'bg-amber-50 text-amber-600 border border-amber-200/60'
              : 'bg-green-50 text-green-600 border border-green-200/60'
          }`}>
            {toastMessage.includes('belum') || toastMessage.includes('Gagal') || toastMessage.includes('Mohon') || toastMessage.includes('Silakan') ? (
              <AlertCircle size={18} strokeWidth={2.2} />
            ) : (
              <CheckCircle2 size={18} strokeWidth={2.2} />
            )}
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <span className="font-body font-bold text-[13px] text-text-primary">
              {toastMessage.includes('Mohon') || toastMessage.includes('Silakan') ? 'Perhatian' : 'Informasi'}
            </span>
            <p className="font-body font-medium text-[12px] text-text-secondary leading-snug mt-0.5">
              {toastMessage}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage('')}
            className="text-gray-400 hover:text-gray-600 p-1 shrink-0 -mr-1 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* 1. Sticky Navbar & Progress Bar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <button onClick={() => {
            sessionStorage.removeItem('dimsum_promo_return_method');
            sessionStorage.setItem('dimsum_returned_from_payment', 'true');
            navigate(-1);
          }} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer">
            <ArrowLeft size={24} className="text-text-primary" />
          </button>
          <h1 className="font-body font-black text-[18px] text-text-primary">
            Pembayaran
          </h1>
          <div className="w-8"></div> {/* Spacer for centering */}
        </div>

        {/* Progress Bar (Full with matching ease animation) */}
        <div className="w-full bg-gray-200 h-1 overflow-hidden">
          <div className="bg-brand-gold h-full animate-bar-fill-full"></div>
        </div>
      </header>

      {/* 2. Scrollable Content */}
      <div className="flex-1 pb-28">
        
        {/* Detail Pengambilan & Outlet Card */}
        <div className="mx-4 mt-3 mb-3 bg-white rounded-[16px] p-4.5 border border-gray-100/90 shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-gray-100/70">
            <span className="font-body text-[13px] text-text-secondary font-medium">Tipe Pesanan</span>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-gold/10 text-brand-gold font-body font-semibold text-[12px]">
              <CheckCircle2 size={13} className="text-brand-gold" />
              <span>{orderType === 'delivery' ? 'Delivery Order (Pesan Antar)' : 'Pick Up di Outlet'}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue shrink-0">
                {orderType === 'delivery' ? <Bike size={18} /> : <ConciergeBell size={18} />}
              </div>
              <div className="flex flex-col">
                <span className="font-body font-bold text-[14px] text-text-primary leading-tight">
                  {orderType === 'delivery' ? 'Dikirim ke Alamat Anda' : 'Makan Dimsum Cabang Utama'}
                </span>
                <span className="font-body text-[12px] text-text-secondary mt-0.5">
                  {orderType === 'delivery' 
                    ? (deliveryAddress || 'Alamat Pengiriman')
                    : <>Waktu: <span className="font-semibold text-text-primary">{confirmedTime}</span></>}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Information Card */}
        <div className="mx-4 mb-3 bg-white rounded-[16px] p-4.5 border border-gray-100/90 shadow-xs">
          <h2 className="font-body font-bold text-[15px] text-text-primary mb-3.5">Data Pemesan</h2>
          
          <div className="flex flex-col gap-3.5">
            <div>
              <label className="font-body font-medium text-[12px] text-text-secondary mb-1.5 block">
                Nama Pemesan <span className="text-red-500 font-bold">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User size={17} className="text-gray-400" />
                </div>
                <input 
                  type="text" 
                  value={customerName} 
                  onChange={e => setCustomerName(e.target.value)} 
                  placeholder="Contoh: Budi Santoso" 
                  className="w-full border border-gray-200 rounded-[12px] pl-10 pr-4 py-2.5 font-body text-[14px] text-text-primary focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-colors" 
                />
              </div>
            </div>

            <div>
              <label className="font-body font-medium text-[12px] text-text-secondary mb-1.5 block">
                Nomor WhatsApp / HP <span className="text-red-500 font-bold">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Phone size={17} className="text-gray-400" />
                </div>
                <input 
                  type="tel" 
                  value={customerPhone} 
                  onChange={e => setCustomerPhone(e.target.value)} 
                  placeholder="Contoh: 081234567890" 
                  className="w-full border border-gray-200 rounded-[12px] pl-10 pr-4 py-2.5 font-body text-[14px] text-text-primary focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-colors" 
                />
              </div>
            </div>

            <div>
              <label className="font-body font-medium text-[12px] text-text-secondary mb-1.5 block">
                Email (opsional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail size={17} className="text-gray-400" />
                </div>
                <input 
                  type="email" 
                  value={customerEmail} 
                  onChange={e => setCustomerEmail(e.target.value)} 
                  placeholder="Untuk bukti pembayaran (opsional)" 
                  className="w-full border border-gray-200 rounded-[12px] pl-10 pr-4 py-2.5 font-body text-[14px] text-text-primary focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-colors" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Order Notes (if added) */}
        {orderNotes && (
          <div className="mx-4 mb-3 bg-white rounded-[16px] p-4 border border-gray-100/90 shadow-xs">
            <div className="flex items-center gap-2 text-text-secondary mb-2">
              <PenLine size={15} />
              <h2 className="font-body font-semibold text-[13px] text-text-primary">Catatan Pesanan</h2>
            </div>
            <div className="rounded-[12px] bg-amber-50/40 border border-brand-gold/20 p-3">
              <p className="font-body text-[13px] text-text-primary italic leading-relaxed break-words">
                "{orderNotes}"
              </p>
            </div>
          </div>
        )}

        {/* Metode Pembayaran Card */}
        <div className="mx-4 mb-4 bg-white rounded-[16px] p-4.5 border border-gray-100/90 shadow-xs">
          <h2 className="font-body font-bold text-[15px] text-text-primary mb-3">Metode Pembayaran</h2>
          <div 
            onClick={() => setSelectedPaymentMethod('qris')}
            className={`border rounded-[14px] p-3.5 flex justify-between items-center cursor-pointer transition-all ${
              selectedPaymentMethod === 'qris' 
                ? 'border-brand-gold bg-brand-gold/5 shadow-xs' 
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                selectedPaymentMethod === 'qris' ? 'bg-brand-gold/10 text-brand-gold' : 'bg-gray-100 text-text-secondary'
              }`}>
                <QrCode size={20} />
              </div>
              <div className="flex flex-col">
                <span className="font-body font-bold text-[14px] text-text-primary">QRIS</span>
                <span className="font-body font-medium text-[11px] text-text-secondary">Scan via BCA, GoPay, OVO, Dana, ShopeePay</span>
              </div>
            </div>
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
              selectedPaymentMethod === 'qris' ? 'border-brand-gold' : 'border-gray-300'
            }`}>
              <div className={`w-2.5 h-2.5 rounded-full bg-brand-gold transition-transform ${
                selectedPaymentMethod === 'qris' ? 'scale-100' : 'scale-0'
              }`}></div>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white/95 backdrop-blur-md border-t border-[#EAEAEA] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] z-[100]">
        <div className="px-5 py-3.5 flex justify-between items-center">
          <div className="flex flex-col justify-center">
            <span className="font-body font-medium text-[11px] text-text-secondary uppercase tracking-wider leading-tight">
              Total Pembayaran
            </span>
            <span className="font-body font-black text-[20px] text-brand-gold leading-tight mt-0.5">
              Rp{finalTotal.toLocaleString('id-ID')}
            </span>
            {appliedVoucher && discountAmount > 0 && (
              <div className="flex items-center gap-1 leading-tight mt-0.5">
                <span className="font-body font-medium text-[11px] text-text-secondary">
                  Hemat
                </span>
                <span className="font-body font-bold text-[11px] text-brand-gold">
                  Rp{discountAmount.toLocaleString('id-ID')}
                </span>
              </div>
            )}
          </div>
          <button 
            type="button"
            onClick={handlePayment} 
            disabled={isLoading} 
            className="h-[48px] font-body font-bold text-[14px] px-8 rounded-[12px] shadow-elevated transition-transform active:scale-95 bg-brand-gold hover:bg-brand-gold-dark text-white cursor-pointer flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Memproses...</span>
              </>
            ) : (
              <span>Bayar Sekarang</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
