import React, { useState } from 'react';
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
  CheckCircle2
} from 'lucide-react';

export default function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const confirmedTime = location.state?.confirmedTime || 'Pick Up Now';
  const cartItems = location.state?.cartItems || [];
  const total = location.state?.totalPrice || 0;

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
  const [isLoading, setIsLoading] = useState(false);
  const [qrisData, setQrisData] = useState(null);
  const [orderId, setOrderId] = useState(null);

  const handlePayment = async () => {
    if (!customerName || !customerPhone) {
      alert("Please fill in Name and Phone Number");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { name: customerName, phone: customerPhone, email: customerEmail },
          items: cartItems.map(item => ({ product_id: item.id, quantity: item.quantity }))
        })
      });
      const data = await response.json();
      if (data.success) {
        setQrisData(data.data.paywuz);
        setOrderId(data.data.order.id);
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert("Failed to process payment");
    } finally {
      setIsLoading(false);
    }
  };

  if (qrisData) {
    return (
      <div className="max-w-[480px] mx-auto min-h-screen relative shadow-2xl overflow-x-hidden bg-[#F8F9FA] flex flex-col items-center pt-20 px-6">
        <h2 className="font-body font-black text-[22px] mb-2 text-text-primary">Scan to Pay</h2>
        <p className="font-body font-medium text-[14px] text-text-secondary mb-8">Scan QRIS below using your e-wallet</p>
        
        <div className="bg-white p-6 rounded-[24px] shadow-elevated mb-6 flex justify-center w-full max-w-[320px]">
           <QRCodeSVG value={qrisData.paymentNumber || qrisData.paymentUrl || 'NO_DATA'} size={240} />
        </div>
        
        <p className="font-body font-bold text-[18px] text-brand-gold mb-8">
           Rp{total.toLocaleString('id-ID')}
        </p>

        <button 
           onClick={() => navigate('/order-status', { state: { orderId }})}
           className="w-full max-w-[320px] bg-brand-gold text-white font-body font-black text-[15px] py-4 rounded-[16px] shadow-elevated transition-transform active:scale-95"
        >
           I Have Paid
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] relative">
      {/* 1. Header */}
      <div className="bg-white flex items-center justify-between p-4 sticky top-0 z-50 border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft size={24} className="text-text-primary" />
        </button>
        <h1 className="font-body font-black text-[18px] text-text-primary">
          Payment
        </h1>
        <div className="w-8"></div> {/* Spacer for centering */}
      </div>

      {/* 2. Scrollable Content */}
      <div className="flex-1 overflow-y-auto hide-scrollbar pb-40">
        
        {/* Order Type */}
        <div className="bg-white px-4 py-4 mb-2">
          <div className="border border-brand-gold/30 bg-brand-gold/5 rounded-[12px] p-3 flex justify-between items-center">
            <span className="font-body font-medium text-[14px] text-text-secondary">Order Type</span>
            <div className="flex items-center gap-2 text-brand-gold">
              <span className="font-body font-bold text-[14px]">Pick Up</span>
              <CheckCircle2 size={16} className="fill-brand-gold text-white" />
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="bg-white p-4 mb-2">
          <h2 className="font-body font-bold text-[15px] text-text-primary mb-4">Customer Information</h2>
          
          <div className="flex flex-col gap-4">
            <div>
              <label className="font-body font-medium text-[12px] text-text-secondary mb-1.5 block">Full Name<span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-gray-400" />
                </div>
                <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Full Name" className="w-full border border-gray-200 rounded-[12px] pl-10 pr-4 py-3 font-body text-[14px] focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-colors" />
              </div>
            </div>

            <div>
              <label className="font-body font-medium text-[12px] text-text-secondary mb-1.5 block">Phone Number (for upcoming promos)<span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone size={18} className="text-gray-400" />
                </div>
                <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="Phone Number" className="w-full border border-gray-200 rounded-[12px] pl-10 pr-4 py-3 font-body text-[14px] focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-colors" />
              </div>
            </div>

            <div>
              <label className="font-body font-medium text-[12px] text-text-secondary mb-1.5 block">Send Receipt to Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-gray-400" />
                </div>
                <input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="Email" className="w-full border border-gray-200 rounded-[12px] pl-10 pr-4 py-3 font-body text-[14px] focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-colors" />
              </div>
            </div>
          </div>
        </div>

        {/* You ordered from */}
        <div className="bg-white p-4 mb-2">
          <h2 className="font-body font-bold text-[15px] text-text-primary mb-1">You ordered from</h2>
          <p className="font-body font-medium text-[13px] text-text-secondary mb-3">Makan Dimsum Cabang Utama</p>
          
          <div className="border border-gray-200 rounded-[12px] p-4 flex items-center gap-3">
            <ConciergeBell size={20} className="text-text-primary" />
            <span className="font-body font-bold text-[14px] text-text-primary">{confirmedTime}</span>
          </div>
        </div>

        {/* Complete Payment */}
        <div className="bg-white p-4 pb-8">
          <h2 className="font-body font-medium text-[15px] text-text-primary mb-3">Complete Payment</h2>
          <label className="border border-brand-gold bg-brand-gold/5 rounded-[12px] p-4 flex justify-between items-center cursor-pointer">
            <div className="flex items-center gap-3">
              <QrCode size={20} className="text-text-primary" />
              <span className="font-body font-bold text-[14px] text-text-primary">QRIS</span>
            </div>
            <div className="w-5 h-5 rounded-full border border-brand-gold flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-brand-gold scale-100 transition-transform"></div>
            </div>
          </label>
        </div>

      </div>

      {/* 3. Sticky Bottom Bar */}
      <div className="absolute bottom-0 left-0 w-full bg-white rounded-t-[24px] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-[100]">
        <div className="p-4 flex justify-between items-center border-b border-gray-50 bg-brand-gold/5 rounded-t-[24px] cursor-pointer">
          <div className="flex items-center gap-2">
            <Ticket size={18} className="text-brand-gold" />
            <span className="font-body font-bold text-[13px] text-brand-gold">Add Promos or Vouchers</span>
          </div>
          <ChevronRight size={18} className="text-text-primary" />
        </div>
        
        <div className="p-5 flex justify-between items-center h-[88px] pb-6">
          <div className="flex flex-col">
            <div className="flex items-center gap-1 cursor-pointer">
              <span className="font-body font-medium text-[12px] text-text-secondary">Payment Total</span>
              <ChevronRight size={14} className="text-text-secondary -rotate-90" />
            </div>
            <span className="font-body font-black text-[18px] text-text-primary mt-0.5">
              Rp{total.toLocaleString('id-ID')}
            </span>
          </div>
          <button onClick={handlePayment} disabled={isLoading} className="h-[48px] bg-brand-gold text-white font-body font-bold text-[14px] px-12 rounded-[12px] shadow-elevated transition-transform active:scale-95 disabled:opacity-50">
            {isLoading ? 'Processing...' : 'Pay'}
          </button>
        </div>
      </div>
    </div>
  );
}
