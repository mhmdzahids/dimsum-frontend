import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, RefreshCw, Check, XCircle, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { updateOrderStatusInHistory, getOrderHistory } from '../utils/orderHistory';

export default function OrderStatus() {
  const location = useLocation();
  const navigate = useNavigate();
  const orderId = location.state?.orderId;
  
  const [status, setStatus] = useState('Checking...');
  const [qrToken, setQrToken] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const qrCodeRef = useRef(null);

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

  const checkStatus = async (isManual = false) => {
    if (!orderId) return;
    if (isManual) setIsRefreshing(true);
    try {
      const historyOrder = getOrderHistory().find(o => o.orderId === orderId);
      const token = location.state?.accessToken || historyOrder?.accessToken || localStorage.getItem('dimsum_current_order_token');
      const headers = {};
      if (token) headers['X-Order-Token'] = token;

      // Manual refresh calls sync-payment fallback; auto-poll calls lightweight local DB endpoint
      const endpoint = isManual ? `/api/orders/${orderId}/sync-payment` : `/api/orders/${orderId}`;
      const method = isManual ? 'POST' : 'GET';
      const res = await fetch(endpoint, { method, headers });
      const data = await res.json();
      if (data.success && data.data) {
        const s = data.data.status;
        setStatus(s);
        if (s === 'paid' || s === 'fulfilling' || s === 'completed') {
          localStorage.removeItem('dimsum_pending_order');
          localStorage.removeItem('dimsum_cart');
          localStorage.removeItem('dimsum_checkout_items');
          localStorage.removeItem('dimsum_order_notes');
        }
        if (data.data.qr_token) {
          setQrToken(data.data.qr_token);
        }
        updateOrderStatusInHistory(orderId, s, { qrToken: data.data.qr_token });
      }
    } catch (e) {
      console.error("Failed to check order status:", e);
    } finally {
      if (isManual) setIsRefreshing(false);
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

  useEffect(() => {
    if (!orderId) return;
    
    // Initial fetch
    checkStatus(false);

    // If already finalized, do not schedule polling
    if (status === 'paid' || status === 'fulfilling' || status === 'completed' || status === 'cancelled') {
      return;
    }

    let attempts = 0;
    let timerId;

    const scheduleNextCheck = () => {
      attempts++;
      // Stop polling after ~3 minutes (max 25 attempts)
      if (attempts > 25) return;

      // 4s for the first 12 checks (~48s), then 8s thereafter
      const delay = attempts <= 12 ? 4000 : 8000;
      timerId = setTimeout(async () => {
        await checkStatus(false);
        scheduleNextCheck();
      }, delay);
    };

    scheduleNextCheck();
    return () => clearTimeout(timerId);
  }, [orderId, status]);

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
    return <div className="p-8 text-center text-text-secondary">No order ID found</div>;
  }

  return (
    <div className="max-w-[480px] mx-auto min-h-screen relative shadow-2xl overflow-x-hidden bg-[#F8F9FA] flex flex-col items-center pt-16 px-6 pb-12">
      <h1 className="font-body font-black text-[22px] mb-6 text-text-primary">Order Status</h1>
      
      <div className="bg-white p-6 rounded-[24px] shadow-elevated w-full max-w-[340px] flex flex-col items-center">
        {status === 'paid' || status === 'fulfilling' ? (
          <>
            {/* Animated Checkmark Badge */}
            <div className="flex items-center justify-center mb-3">
              <svg 
                className="w-16 h-16 text-green-500 animate-check-bounce"
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

            <h2 className="font-body font-bold text-[18px] mb-1 text-text-primary">Pembayaran Berhasil!</h2>
            <p className="font-body text-[13px] text-center text-text-secondary mb-4">
              Tunjukkan QR Code ini ke kasir untuk mengambil pesanan Anda:
            </p>

            <div 
              ref={qrCodeRef}
              className="bg-white p-4 rounded-[20px] border border-gray-100 shadow-sm flex flex-col items-center justify-center w-full my-1"
            >
              {qrToken ? (
                <QRCodeSVG 
                  value={qrToken} 
                  size={200}
                  level="M"
                />
              ) : (
                <div className="w-[200px] h-[200px] flex flex-col items-center justify-center text-text-secondary gap-2">
                  <RefreshCw size={24} className="text-brand-gold animate-spin" />
                  <span className="text-[12px]">Memuat QR Code...</span>
                </div>
              )}
            </div>


            {/* Action Buttons: Unduh QR & Kembali ke Beranda */}
            {qrToken && (
              <button 
                type="button"
                onClick={handleDownloadQR}
                className="mt-3 w-full py-3 px-4 bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20 border border-brand-blue/30 font-body font-bold text-[13px] rounded-[14px] shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {downloadSuccess ? (
                  <>
                    <Check size={16} className="text-green-600" />
                    <span className="text-green-600">QR Berhasil Diunduh!</span>
                  </>
                ) : (
                  <>
                    <Download size={16} strokeWidth={2.2} />
                    <span>Unduh QR Code</span>
                  </>
                )}
              </button>
            )}

            <button 
              onClick={handleBackHome} 
              className="mt-2.5 w-full py-3 bg-brand-gold text-white font-body font-bold text-[14px] rounded-[14px] shadow-elevated transition-transform active:scale-95"
            >
              Kembali ke Beranda
            </button>
          </>
        ) : status === 'completed' ? (
          <>
            <CheckCircle2 size={56} className="text-brand-gold mb-3" />
            <h2 className="font-body font-bold text-[18px] mb-1 text-text-primary">Pesanan Selesai!</h2>
            <p className="font-body text-[13px] text-center text-text-secondary mb-6">
              Pesanan telah berhasil diverifikasi dan diambil. Selamat menikmati santapan Anda!
            </p>
            <button 
              onClick={handleBackHome} 
              className="w-full py-3 bg-brand-gold text-white font-body font-bold text-[14px] rounded-[14px] shadow-elevated transition-transform active:scale-95"
            >
              Kembali ke Beranda
            </button>
          </>
        ) : status === 'cancelled' ? (
          <>
            <XCircle size={56} className="text-red-500 mb-3" />
            <h2 className="font-body font-bold text-[18px] mb-1 text-text-primary">Order Cancelled</h2>
            <p className="font-body text-[13px] text-center text-text-secondary mb-6">
              Pesanan ini telah dibatalkan atau kedaluwarsa.
            </p>
            <button 
              onClick={handleBackHome} 
              className="w-full py-3 border border-gray-300 text-text-primary font-body font-bold text-[14px] rounded-[14px] transition-transform active:scale-95"
            >
              Kembali ke Beranda
            </button>
          </>
        ) : (
          <>
            <RefreshCw size={44} className="text-brand-gold animate-spin mb-4" />
            <h2 className="font-body font-bold text-[18px] mb-2 text-text-primary">Waiting for Payment...</h2>
            <p className="font-body text-[14px] text-center text-text-secondary mb-4">
              Status Anda saat ini: <strong>{status}</strong>
            </p>
            <button 
              onClick={() => checkStatus(true)} 
              disabled={isRefreshing}
              className="border border-brand-gold text-brand-gold px-5 py-2.5 rounded-xl font-body font-bold text-[14px] transition-transform active:scale-95 flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
              <span>{isRefreshing ? "Checking..." : "Refresh Status"}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
