import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  ShoppingBag, 
  CheckCircle2, 
  ConciergeBell, 
  XCircle, 
  RotateCw, 
  ArrowRight, 
  PenLine,
  UtensilsCrossed
} from 'lucide-react';
import { getOrderHistory, syncOrderHistoryWithServer } from '../utils/orderHistory';

export default function OrderHistory() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState(() => getOrderHistory());
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending' | 'completed'
  const [reorderToast, setReorderToast] = useState('');

  // Active pending order in localStorage
  const [pendingOrder, setPendingOrder] = useState(() => {
    try {
      const saved = localStorage.getItem('dimsum_pending_order');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.expiresAt && new Date(parsed.expiresAt).getTime() <= Date.now()) {
          return null;
        }
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  // Sync with server on mount to ensure real-time status accuracy
  useEffect(() => {
    let isMounted = true;
    setIsSyncing(true);
    syncOrderHistoryWithServer()
      .then(updated => {
        if (isMounted && Array.isArray(updated)) {
          setOrders(updated);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsSyncing(false);
      });

    const handleUpdate = () => {
      setOrders(getOrderHistory());
      try {
        const saved = localStorage.getItem('dimsum_pending_order');
        setPendingOrder(saved ? JSON.parse(saved) : null);
      } catch {}
    };

    window.addEventListener('dimsum_order_history_updated', handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('dimsum_order_history_updated', handleUpdate);
    };
  }, []);

  const handleManualRefresh = async () => {
    setIsSyncing(true);
    try {
      const updated = await syncOrderHistoryWithServer();
      if (Array.isArray(updated)) {
        setOrders(updated);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleReorder = (order) => {
    if (!order.items || order.items.length === 0) {
      navigate('/menu');
      return;
    }

    try {
      const existingCart = JSON.parse(localStorage.getItem('dimsum_cart') || '{}');
      order.items.forEach(item => {
        const pId = item.id || item.product_id;
        if (pId) {
          existingCart[pId] = (existingCart[pId] || 0) + (item.quantity || 1);
        }
      });
      localStorage.setItem('dimsum_cart', JSON.stringify(existingCart));
      setReorderToast('Item telah ditambahkan ke keranjang belanja!');
      setTimeout(() => {
        navigate('/menu');
      }, 1000);
    } catch (e) {
      navigate('/menu');
    }
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    if (activeTab === 'pending') {
      return order.status === 'pending_payment';
    }
    if (activeTab === 'completed') {
      return order.status === 'paid' || order.status === 'fulfilling' || order.status === 'completed' || order.status === 'cancelled';
    }
    return true;
  });

  const pendingCount = orders.filter(o => o.status === 'pending_payment').length;
  const completedCount = orders.filter(o => o.status === 'paid' || o.status === 'fulfilling' || o.status === 'completed').length;

  const formatDate = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).replace(/\./g, ':');
    } catch {
      return '';
    }
  };

  return (
    <div className="max-w-[480px] mx-auto min-h-screen relative shadow-2xl overflow-x-clip bg-[#F8F9FA] flex flex-col">
      {/* 1. Sticky Navbar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-xs border-b border-gray-100">
        <div className="flex items-center justify-between p-4">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Kembali"
          >
            <ArrowLeft size={22} className="text-text-primary" />
          </button>
          <h1 className="font-body font-black text-[18px] text-text-primary">
            Riwayat Pesanan
          </h1>
          <button
            onClick={handleManualRefresh}
            disabled={isSyncing}
            className="p-2 -mr-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer text-brand-blue disabled:opacity-50"
            title="Muat Ulang Status"
          >
            <RotateCw size={19} className={isSyncing ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Segmented Filter Tabs */}
        <div className="flex border-t border-gray-100 bg-white px-3 py-2 gap-2 overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-1.5 px-3 rounded-full font-body font-bold text-[12px] transition-all cursor-pointer whitespace-nowrap text-center ${
              activeTab === 'all'
                ? 'bg-brand-blue text-white shadow-xs'
                : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
            }`}
          >
            Semua ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-1.5 px-3 rounded-full font-body font-bold text-[12px] transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 ${
              activeTab === 'pending'
                ? 'bg-brand-gold text-white shadow-xs'
                : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
            }`}
          >
            <span>Menunggu Bayar</span>
            {pendingCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${activeTab === 'pending' ? 'bg-white text-brand-gold' : 'bg-brand-gold text-white'}`}>
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 py-1.5 px-3 rounded-full font-body font-bold text-[12px] transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 ${
              activeTab === 'completed'
                ? 'bg-brand-blue text-white shadow-xs'
                : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
            }`}
          >
            <span>Selesai</span>
            {completedCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${activeTab === 'completed' ? 'bg-white text-brand-blue' : 'bg-gray-200 text-text-secondary'}`}>
                {completedCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* 2. Reorder Toast */}
      {reorderToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-[380px] animate-toast-in">
          <div className="bg-emerald-600/95 backdrop-blur-xs text-white px-4 py-3 rounded-[16px] shadow-elevated flex items-center gap-3 border border-emerald-400/40">
            <CheckCircle2 size={18} className="text-white shrink-0" />
            <span className="font-body font-bold text-[13px]">{reorderToast}</span>
          </div>
        </div>
      )}

      {/* 3. Active Pending Order Notification Card (if present and viewing all/pending) */}
      {pendingOrder && (activeTab === 'all' || activeTab === 'pending') && (
        <div className="p-4 bg-bg-cream/60 border-b border-gray-100">
          <div className="bg-white border-2 border-brand-gold/60 rounded-[20px] p-4 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="bg-brand-gold text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-xs">
                <Clock size={12} strokeWidth={2.5} />
                <span>Menunggu Pembayaran</span>
              </span>
              <span className="font-body text-[11px] font-bold text-text-secondary">
                #{pendingOrder.orderId?.slice(0, 8)}
              </span>
            </div>

            <div className="mt-2 flex justify-between items-baseline">
              <div>
                <span className="font-body font-black text-[18px] text-text-primary">
                  Rp{Number(pendingOrder.totalAmount || 0).toLocaleString('id-ID')}
                </span>
                <p className="font-body font-medium text-[12px] text-text-secondary mt-0.5 flex items-center gap-1.5">
                  <ConciergeBell size={13} className="text-brand-gold" />
                  <span>{pendingOrder.totalItems || 1} Item • {pendingOrder.confirmedTime || 'Pick Up'}</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/payment', { state: { resumePending: true } })}
              className="mt-3.5 w-full py-2.5 bg-brand-gold hover:bg-brand-gold/90 text-white font-body font-bold text-[13px] rounded-[12px] shadow-sm transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Lanjutkan Pembayaran QRIS</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* 4. Orders List */}
      <div className="flex-1 p-4 pb-20">
        {filteredOrders.length > 0 ? (
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const isPending = order.status === 'pending_payment';
              const isPaid = order.status === 'paid' || order.status === 'fulfilling';
              const isCompleted = order.status === 'completed';
              const isCancelled = order.status === 'cancelled';

              return (
                <div 
                  key={order.orderId}
                  className="bg-white border border-gray-100 rounded-[20px] p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Card Header: Status + ID & Date */}
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      {isPending && (
                        <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Clock size={11} strokeWidth={2.5} />
                          <span>Menunggu Bayar</span>
                        </span>
                      )}
                      {isPaid && (
                        <span className="bg-blue-50 text-brand-blue border border-brand-blue/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 size={11} strokeWidth={2.5} />
                          <span>Sudah Dibayar</span>
                        </span>
                      )}
                      {isCompleted && (
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 size={11} strokeWidth={2.5} />
                          <span>Selesai</span>
                        </span>
                      )}
                      {isCancelled && (
                        <span className="bg-gray-100 text-gray-600 border border-gray-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <XCircle size={11} strokeWidth={2.5} />
                          <span>Dibatalkan</span>
                        </span>
                      )}
                    </div>
                    <span className="font-body font-mono text-[11px] text-text-secondary">
                      #{order.orderId?.slice(0, 8)}
                    </span>
                  </div>

                  {/* Order Date */}
                  <div className="pt-2 text-[11px] font-body text-text-secondary">
                    {formatDate(order.createdAt)}
                  </div>

                  {/* Order Items Preview */}
                  <div className="mt-2.5 space-y-2">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[13px]">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-[8px] bg-bg-cream flex items-center justify-center text-brand-gold shrink-0">
                              <UtensilsCrossed size={14} />
                            </div>
                            <span className="font-body font-bold text-text-primary truncate">
                              {item.name || item.product_name || 'Dimsum'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0 ml-2">
                            <span className="font-body text-[12px] text-text-secondary">
                              {item.quantity}x
                            </span>
                            <span className="font-body font-bold text-text-primary text-[13px]">
                              Rp{(Number(item.price || item.unit_price || 0) * (item.quantity || 1)).toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center gap-2 text-[13px] font-body text-text-primary font-bold">
                        <UtensilsCrossed size={15} className="text-brand-gold" />
                        <span>{order.totalItems || 1} Item Dimsum</span>
                      </div>
                    )}
                  </div>

                  {/* Pick Up Time */}
                  <div className="flex items-center gap-2 text-text-secondary text-[12px] font-body mt-3 pt-2.5 border-t border-dashed border-gray-100">
                    <ConciergeBell size={14} className="text-brand-gold shrink-0" />
                    <span>Waktu Pick Up: <strong>{order.confirmedTime || 'Ambil Sekarang'}</strong></span>
                  </div>

                  {/* Notes (if any) */}
                  {order.notes && (
                    <div className="flex items-start gap-1.5 text-[11px] font-body text-text-secondary italic mt-1.5 bg-gray-50 p-2 rounded-[8px]">
                      <PenLine size={12} className="text-gray-400 mt-0.5 shrink-0" />
                      <span>Catatan: "{order.notes}"</span>
                    </div>
                  )}

                  {/* Card Footer: Total + Action CTA */}
                  <div className="flex items-center justify-between pt-3.5 mt-3 border-t border-gray-100">
                    <div>
                      <span className="font-body text-[11px] text-text-secondary block">Total Pembayaran</span>
                      <span className="font-body font-black text-[16px] text-brand-gold">
                        Rp{Number(order.totalAmount || 0).toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isPending && (
                        <button
                          onClick={() => navigate('/payment', { state: { resumePending: true } })}
                          className="py-1.5 px-3.5 bg-brand-gold hover:bg-brand-gold/90 text-white font-body font-bold text-[12px] rounded-[10px] shadow-xs active:scale-95 transition-transform flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>Bayar QRIS</span>
                          <ArrowRight size={13} />
                        </button>
                      )}

                      {isPaid && (
                        <button
                          onClick={() => navigate('/order-status', { state: { orderId: order.orderId } })}
                          className="py-1.5 px-3.5 bg-brand-blue hover:bg-brand-blue-dark text-white font-body font-bold text-[12px] rounded-[10px] shadow-xs active:scale-95 transition-transform flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>QR Pengambilan</span>
                          <ArrowRight size={13} />
                        </button>
                      )}

                      {(isCompleted || isCancelled) && (
                        <button
                          onClick={() => handleReorder(order)}
                          className="py-1.5 px-3.5 border border-brand-gold/60 text-brand-gold hover:bg-brand-gold hover:text-white font-body font-bold text-[12px] rounded-[10px] active:scale-95 transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <ShoppingBag size={13} />
                          <span>Pesan Lagi</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            {/* Visual Graphic Illustration */}
            <div className="relative w-[180px] h-[160px] flex items-center justify-center mb-5">
              <svg viewBox="0 0 200 180" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="100" cy="110" rx="68" ry="42" fill="#FFF9ED" />
                <circle cx="48" cy="95" r="16" fill="#FDF4E2" opacity="0.6" />
                <circle cx="152" cy="85" r="15" fill="#FDF4E2" opacity="0.6" />
                <g transform="translate(10, 5)">
                  <rect x="45" y="60" width="90" height="52" rx="14" fill="#F5F1EB" stroke="#4E8298" strokeWidth="2.5" />
                  <rect x="52" y="68" width="76" height="36" rx="8" fill="#FFFFFF" stroke="#4E8298" strokeWidth="1.5" strokeDasharray="3 3" />
                  <ellipse cx="72" cy="86" rx="10" ry="7" fill="#C9A23D" opacity="0.85" />
                  <ellipse cx="108" cy="86" rx="10" ry="7" fill="#C9A23D" opacity="0.85" />
                  <ellipse cx="90" cy="80" rx="11" ry="8" fill="#C9A23D" />
                  <g transform="rotate(-8 60 40)">
                    <rect x="42" y="22" width="42" height="55" rx="5" fill="#FFFFFF" stroke="#C9A23D" strokeWidth="2" />
                    <line x1="50" y1="32" x2="76" y2="32" stroke="#6B7B8D" strokeWidth="2" strokeLinecap="round" />
                    <line x1="50" y1="40" x2="70" y2="40" stroke="#6B7B8D" strokeWidth="2" strokeLinecap="round" />
                    <line x1="50" y1="48" x2="65" y2="48" stroke="#6B7B8D" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="70" cy="58" r="7" fill="#E8F5EE" stroke="#2D8F5E" strokeWidth="1.5" />
                    <path d="M67.5 58L69.5 60L73 56" stroke="#2D8F5E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </g>
                  <path d="M78 46 C75 40, 81 35, 78 28" stroke="#C9A23D" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                  <path d="M102 44 C99 38, 105 33, 102 26" stroke="#C9A23D" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                </g>
              </svg>
            </div>

            <h2 className="font-heading font-black text-[18px] text-text-primary mb-2">
              {activeTab === 'pending'
                ? 'Tidak ada pesanan menunggu bayar'
                : activeTab === 'completed'
                ? 'Belum ada pesanan yang selesai'
                : 'Kamu belum punya riwayat order'}
            </h2>
            <p className="font-body font-medium text-[13px] text-text-secondary max-w-[280px] leading-relaxed mb-6">
              Pesanan dimsum hangat dan lezatmu akan tercatat otomatis di sini setelah kamu melakukan transaksi.
            </p>

            <button
              onClick={() => navigate('/menu')}
              className="py-3 px-8 bg-brand-gold hover:bg-brand-gold/90 text-white font-body font-bold text-[13px] rounded-[14px] shadow-elevated transition-transform active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <ShoppingBag size={17} strokeWidth={2} />
              <span>Mulai Order Dimsum</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
