import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  RefreshCw,
  Check,
  XCircle,
  Download,
  Home as HomeIcon,
  Bike,
  MapPin
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { updateOrderStatusInHistory, getOrderHistory } from '../utils/orderHistory';
import HappyDimsumCharacter from '../components/HappyDimsumCharacter';
import api from '../api/client';
import usePolling from '../hooks/usePolling';

export default function OrderStatus() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const orderId = location.state?.orderId || queryParams.get('orderId');

  const [status, setStatus] = useState('Checking...');
  const [qrToken, setQrToken] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isVerifyingTransition, setIsVerifyingTransition] = useState(false);
  const isTransitioningRef = useRef(false);
  const qrCodeRef = useRef(null);

  // Auto scroll to top on mount and whenever status changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [status]);

  const handleDownloadQR = () => {
    try {
      const svg = qrCodeRef.current?.querySelector('svg');
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
        a.download = `QR-Pengambilan-MakanDimsum-${orderId || 'pickup'}.png`;
        a.href = pngUrl;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 2500);
      };

      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);
    } catch (err) {
      console.error('Download QR error:', err);
    }
  };

  const [isManualSyncing, setIsManualSyncing] = useState(false);

  // Prepare order token header
  const historyOrder = getOrderHistory().find(o => o.orderId === orderId);
  const token = location.state?.accessToken || historyOrder?.accessToken || localStorage.getItem('dimsum_current_order_token');
  const headers = token ? { 'X-Order-Token': token } : {};

  const handleOrderData = (data) => {
    if (!data) return;
    const s = data.status;
    setOrderDetail(data);
    if (s === 'paid' || s === 'fulfilling' || s === 'completed') {
      localStorage.removeItem('dimsum_pending_order');
      localStorage.removeItem('dimsum_cart');
      localStorage.removeItem('dimsum_checkout_items');
      localStorage.removeItem('dimsum_order_notes');
    }
    if (data.qr_token) {
      setQrToken(data.qr_token);
    }
    updateOrderStatusInHistory(orderId, s, { qrToken: data.qr_token });

    // If cashier just scanned QR and status changed to completed: show branded loading screen transition first!
    if (s === 'completed' && (status === 'paid' || status === 'fulfilling') && !isTransitioningRef.current) {
      isTransitioningRef.current = true;
      setIsVerifyingTransition(true);
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      setTimeout(() => {
        setIsVerifyingTransition(false);
        setStatus('completed');
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }, 900);
    } else if (!isTransitioningRef.current) {
      setStatus(s);
    }
  };

  // Resilient real-time polling with Page Visibility API & AbortController
  const { isPolling, isRefreshing: isPollRefreshing } = usePolling(
    orderId ? `/api/orders/${orderId}` : null,
    {
      headers,
      interval: (d, attempt) => (d?.status === 'paid' || d?.status === 'fulfilling') ? 2500 : (attempt <= 12 ? 4000 : 8000),
      stopWhen: (d) => d?.status === 'completed' || d?.status === 'cancelled',
      pauseOnHidden: true,
      onData: handleOrderData
    }
  );

  const isRefreshing = isManualSyncing || isPollRefreshing;

  // Manual refresh calls sync-payment fallback for Midtrans/real-time payment sync
  const handleManualRefresh = async () => {
    if (!orderId) return;
    setIsManualSyncing(true);
    try {
      const res = await api.post(`/api/orders/${orderId}/sync-payment`, {}, { headers });
      if (res.success && res.data) {
        handleOrderData(res.data);
      }
    } catch (e) {
      console.error('Failed to sync payment:', e);
    } finally {
      setIsManualSyncing(false);
    }
  };

  // 4-second timeout: if checking from QRIS (or pending order exists) and not confirmed, return to QRIS UI
  useEffect(() => {
    if (!orderId) return;
    const hasPendingOrder = !!localStorage.getItem('dimsum_pending_order');
    const isFromQris = location.state?.fromQris || hasPendingOrder;
    if (!isFromQris) return;

    const returnTimer = setTimeout(() => {
      setStatus(currentStatus => {
        if (currentStatus !== 'paid' && currentStatus !== 'fulfilling' && currentStatus !== 'completed') {
          navigate('/payment', {
            state: {
              resumePending: true,
              notPaidNotice: 'Pembayaran belum terdeteksi. Silakan selesaikan pembayaran QRIS terlebih dahulu.'
            },
            replace: true
          });
        }
        return currentStatus;
      });
    }, 4000);

    return () => clearTimeout(returnTimer);
  }, [orderId, navigate, location.state]);

  const handleBackHome = () => {
    localStorage.removeItem('dimsum_cart');
    localStorage.removeItem('dimsum_checkout_items');
    localStorage.removeItem('dimsum_time');
    localStorage.removeItem('dimsum_order_notes');
    localStorage.removeItem('dimsum_pending_order');
    localStorage.removeItem('dimsum_applied_voucher');
    localStorage.removeItem('dimsum_payment_method');
    navigate('/');
  };

  if (!orderId) {
    return (
      <div className="max-w-[480px] mx-auto min-h-screen bg-bg-cream flex flex-col items-center justify-center p-6 text-center">
        <p className="font-body font-bold text-text-secondary mb-4">ID Pesanan tidak ditemukan</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 bg-brand-gold text-white font-bold rounded-xl shadow-elevated"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  // Branded Loading Screen transition right after QR is scanned by cashier
  // (Identical style to Home -> Menu transition: gold spinner, cream bg, pulsing text)
  if (isVerifyingTransition) {
    return (
      <div className="max-w-[480px] mx-auto min-h-screen relative shadow-2xl bg-bg-cream flex flex-col items-center justify-center z-50 animate-fade-in">
        <div className="w-12 h-12 border-4 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 font-body font-bold text-[14px] text-brand-blue animate-pulse">
          Memverifikasi Pengambilan...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[480px] mx-auto min-h-screen relative shadow-2xl overflow-x-hidden bg-bg-cream flex flex-col items-center pt-8 px-5 pb-16">

      {/* Top Brand Bar */}
      <div className="w-full flex items-center justify-between mb-4 px-1">
        <button
          onClick={handleBackHome}
          className="w-10 h-10 rounded-full bg-white text-brand-blue shadow-sm flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all"
          title="Kembali ke Beranda"
        >
          <HomeIcon size={18} />
        </button>
        <span className="font-heading font-black text-[17px] text-brand-blue tracking-wide">
          Status Pesanan
        </span>
        <button
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="w-10 h-10 rounded-full bg-white text-brand-blue shadow-sm flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50"
          title="Perbarui Status"
        >
          <RefreshCw size={17} className={isRefreshing ? "animate-spin text-brand-gold" : ""} />
        </button>
      </div>

      {/* Main Status Container */}
      <div className="bg-white p-6 rounded-[28px] shadow-elevated w-full max-w-[360px] flex flex-col items-center border border-gray-100 relative overflow-hidden animate-fade-in">

        {/* CASE 1: ORDER PAID / WAITING FOR CASHIER PICKUP SCAN */}
        {status === 'paid' || status === 'fulfilling' ? (
          <>
            {/* Animated Checkmark Badge */}
            <div className="flex items-center justify-center mb-2">
              <svg
                className="w-14 h-14 text-green-500 animate-check-bounce"
                viewBox="0 0 52 52"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="26"
                  cy="26"
                  r="24"
                  className="fill-green-50"
                />
                <circle
                  cx="26"
                  cy="26"
                  r="24"
                  className="stroke-green-500 animate-circle-draw"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray="160"
                  strokeDashoffset="160"
                />
                <path
                  d="M16 26.5L23 33.5L36 19.5"
                  className="stroke-green-500 animate-check-draw"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="36"
                  strokeDashoffset="36"
                />
              </svg>
            </div>

            {/* Delivery vs Pick Up Flow */}
            {(() => {
              const historyOrder = getOrderHistory().find(o => o.orderId === orderId);
              const isDelivery = (orderDetail?.order_type === 'delivery') || (historyOrder?.orderType === 'delivery');
              const deliveryAddressText = orderDetail?.delivery_address || historyOrder?.deliveryAddress;

              if (isDelivery) {
                return (
                  <div className="flex flex-col items-center w-full">
                    <h2 className="font-heading font-black text-[20px] text-text-primary text-center mb-1">
                      Pembayaran Berhasil!
                    </h2>
                    <p className="font-body text-[12.5px] text-center text-text-secondary mb-3 leading-relaxed">
                      Pesanan <strong>Delivery Order</strong> Anda sedang diproses oleh dapur dan akan segera diantar kurir.
                    </p>

                    {/* Delivery Address Card */}
                    <div className="w-full bg-amber-50/50 border border-brand-gold/30 rounded-[18px] p-3.5 my-2 text-left flex items-start gap-2.5 shadow-2xs">
                      <div className="w-8 h-8 rounded-full bg-brand-gold/20 flex items-center justify-center text-brand-gold shrink-0 mt-0.5">
                        <MapPin size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-body font-bold text-[12px] text-text-primary block">
                          Tujuan Pengantaran
                        </span>
                        <p className="font-body text-[11px] text-text-secondary leading-snug mt-0.5 break-words">
                          {deliveryAddressText || 'Alamat tujuan terdaftar'}
                        </p>
                      </div>
                    </div>

                    {/* Live Delivery Status Indicator */}
                    <div className="flex items-center gap-2 py-1.5 px-3.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-[11px] font-semibold my-2.5 shadow-xs">
                      <Bike size={15} className="text-amber-600 animate-pulse shrink-0" />
                      <span>Dapur sedang menyiapkan menu lezatmu...</span>
                    </div>

                    {/* Auto WhatsApp Sent Indicator */}
                    <div className="flex items-center gap-2 py-1.5 px-3.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[11px] font-semibold my-1 shadow-2xs">
                      <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                      <span>Struk pesanan telah dikirim ke WhatsApp</span>
                    </div>

                    <button
                      onClick={handleBackHome}
                      className="mt-3 w-full py-3 bg-brand-gold hover:bg-brand-gold-dark text-white font-body font-bold text-[14px] rounded-[14px] shadow-elevated transition-transform active:scale-95 cursor-pointer"
                    >
                      Kembali ke Beranda
                    </button>
                  </div>
                );
              }

              return (
                <>
                  <h2 className="font-heading font-black text-[20px] text-text-primary text-center mb-1">
                    Pembayaran Berhasil!
                  </h2>
                  <p className="font-body text-[12.5px] text-center text-text-secondary mb-3 leading-relaxed">
                    Tunjukkan QR Code ini ke kasir di outlet untuk mengambil pesananmu:
                  </p>

                  {/* QR Code Container with subtle gold accent border */}
                  <div
                    ref={qrCodeRef}
                    className="bg-white p-4 rounded-[22px] border-2 border-dashed border-brand-gold/30 shadow-card flex flex-col items-center justify-center w-full my-1 relative group"
                  >
                    {qrToken ? (
                      <>
                        <QRCodeSVG
                          value={qrToken}
                          size={200}
                          level="M"
                          includeMargin={true}
                        />
                        <span className="font-mono text-[11px] text-text-secondary mt-2 tracking-wider">
                          #{orderId.slice(0, 8)}...
                        </span>
                      </>
                    ) : (
                      <div className="w-[200px] h-[200px] flex flex-col items-center justify-center text-text-secondary gap-2">
                        <RefreshCw size={26} className="text-brand-gold animate-spin" />
                        <span className="text-[12px] font-medium">Menyiapkan QR Code...</span>
                      </div>
                    )}
                  </div>

                  {/* Gap !!DO NOT DELETE THIS!! */}
                  <div className="flex items-center gap-2 py-1.5 px-3.5 text-amber-800 text-[11px] font-semibold my-3">
                  </div>

                  {/* Auto WhatsApp Sent Indicator & Unduh QR */}
                  <div className="w-full flex flex-col gap-2.5 mt-2">
                    <div className="flex items-center justify-center gap-1.5 text-emerald-700 text-[11.5px] font-semibold py-1 px-3 bg-emerald-50/80 border border-emerald-200/60 rounded-full">
                      <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                      <span>Struk & QR Code otomatis dikirim ke WhatsApp</span>
                    </div>

                    {qrToken && (
                      <button
                        type="button"
                        onClick={handleDownloadQR}
                        className="w-full py-3 px-4 bg-brand-blue/10 hover:bg-brand-blue/15 text-brand-blue border border-brand-blue/25 font-body font-bold text-[13px] rounded-[14px] shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {downloadSuccess ? (
                          <>
                            <Check size={16} className="text-green-600" />
                            <span className="text-green-600">QR Berhasil Diunduh!</span>
                          </>
                        ) : (
                          <>
                            <Download size={16} strokeWidth={2.2} />
                            <span>Unduh QR Code ke Galeri</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <button
                    onClick={handleBackHome}
                    className="mt-2.5 w-full py-3 bg-brand-gold hover:bg-brand-gold-dark text-white font-body font-bold text-[14px] rounded-[14px] shadow-elevated transition-transform active:scale-95 cursor-pointer"
                  >
                    Kembali ke Beranda
                  </button>
                </>
              );
            })()}
          </>
        ) : status === 'completed' ? (
          /* CASE 2: QR SCANNED & PICKUP COMPLETED — SIMPLE CELEBRATION SCREEN */
          <div className="flex flex-col items-center w-full animate-fade-in text-center py-2">

            {/* Happy Dimsum Bao Character Animation */}
            <div className="my-2">
              <HappyDimsumCharacter size={170} />
            </div>

            {/* Joyful Headline & Thank You Text */}
            <h1 className="font-heading font-black text-[22px] sm:text-[24px] text-brand-blue tracking-wide leading-tight mb-2">
              Terima Kasih Sudah Order!
            </h1>
            <p className="font-body font-medium text-[13px] text-text-secondary leading-relaxed max-w-[290px] mb-6">
              Pesanan dimsum frozenmu telah berhasil diverifikasi oleh kasir. Selamat menikmati kelezatan spesial dari Makan Dimsum Indonesia!
            </p>

            {/* Single clean action button */}
            <button
              onClick={handleBackHome}
              className="w-full py-3.5 bg-brand-gold hover:bg-brand-gold-dark text-white font-body font-bold text-[14px] rounded-[14px] shadow-elevated transition-transform active:scale-95 cursor-pointer"
            >
              Kembali ke Beranda
            </button>
          </div>
        ) : status === 'cancelled' ? (
          /* CASE 3: CANCELLED */
          <div className="flex flex-col items-center w-full py-2">
            <XCircle size={56} className="text-red-500 mb-3 animate-bounce" />
            <h2 className="font-heading font-black text-[18px] mb-1 text-text-primary">Pesanan Dibatalkan</h2>
            <p className="font-body text-[13px] text-center text-text-secondary mb-6 leading-relaxed">
              Pesanan ini telah dibatalkan atau waktu pembayaran telah habis.
            </p>
            <button
              onClick={handleBackHome}
              className="w-full py-3 bg-brand-gold text-white font-body font-bold text-[14px] rounded-[14px] shadow-elevated transition-transform active:scale-95"
            >
              Kembali ke Beranda
            </button>
          </div>
        ) : (
          /* CASE 4: CHECKING / REFRESHING */
          <div className="flex flex-col items-center w-full py-4">
            <RefreshCw size={44} className="text-brand-gold animate-spin mb-4" />
            <h2 className="font-heading font-black text-[18px] mb-1 text-text-primary text-center">
              Memeriksa Pembayaran...
            </h2>
            <p className="font-body text-[13px] text-center text-text-secondary mb-5">
              Status saat ini: <strong className="text-brand-blue capitalize">{status}</strong>
            </p>
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="border-2 border-brand-gold text-brand-gold px-5 py-2.5 rounded-xl font-body font-bold text-[13.5px] transition-transform active:scale-95 flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
              <span>{isRefreshing ? "Memeriksa..." : "Refresh Status"}</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
