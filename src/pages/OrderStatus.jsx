import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, RefreshCw } from 'lucide-react';

export default function OrderStatus() {
  const location = useLocation();
  const navigate = useNavigate();
  const orderId = location.state?.orderId;
  
  const [status, setStatus] = useState('Checking...');
  const [qrToken, setQrToken] = useState(null);

  const checkStatus = async () => {
    if (!orderId) return;
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();
      if (data.success) {
        setStatus(data.data.status);
        if (data.data.qr_token) {
          setQrToken(data.data.qr_token);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, [orderId]);

  if (!orderId) {
    return <div className="p-8">No order ID found</div>;
  }

  return (
    <div className="flex flex-col h-full min-h-screen bg-[#F8F9FA] relative items-center pt-20 px-6">
      <h1 className="font-body font-black text-[22px] mb-8 text-text-primary">Order Status</h1>
      
      <div className="bg-white p-6 rounded-[24px] shadow-elevated w-full max-w-[320px] flex flex-col items-center">
        {status === 'paid' ? (
          <>
            <CheckCircle2 size={64} className="text-green-500 mb-4" />
            <h2 className="font-body font-bold text-[18px] mb-2 text-text-primary">Payment Successful!</h2>
            <p className="font-body text-[14px] text-center text-text-secondary mb-6">
              Tunjukkan kode pengambilan ini ke kasir:
            </p>
            <div className="bg-gray-100 p-4 rounded-xl text-center w-full">
              <span className="font-mono text-3xl font-black tracking-widest text-brand-gold">{qrToken || '...'}</span>
            </div>
            <button 
              onClick={() => {
                localStorage.removeItem('dimsum_cart');
                localStorage.removeItem('dimsum_checkout_items');
                localStorage.removeItem('dimsum_time');
                navigate('/');
              }} 
              className="mt-8 text-brand-gold font-body font-bold"
            >
              Kembali ke Beranda
            </button>
          </>
        ) : (
          <>
            <RefreshCw size={48} className="text-brand-gold animate-spin mb-4" />
            <h2 className="font-body font-bold text-[18px] mb-2 text-text-primary">Waiting for Payment...</h2>
            <p className="font-body text-[14px] text-center text-text-secondary mb-4">
              Status Anda saat ini: <strong>{status}</strong>
            </p>
            <button onClick={checkStatus} className="border border-brand-gold text-brand-gold px-4 py-2 rounded-xl font-body font-bold text-[14px]">Refresh Status</button>
          </>
        )}
      </div>
    </div>
  );
}
