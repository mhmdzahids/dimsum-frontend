import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  UtensilsCrossed,
  Wallet,
  PackageOpen,
  Truck,
  Loader2,
  CircleX,
  Flower2
} from 'lucide-react';
import { getOrderHistory, syncOrderHistoryWithServer } from '../utils/orderHistory';

export default function OrderHistory() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'all';
  const [orders, setOrders] = useState(() => getOrderHistory());
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab); // 'all' | 'pending' | 'processing' | 'delivering' | 'completed'
  const [isTabLoading, setIsTabLoading] = useState(false);
  const loadingTimeoutRef = useRef(null);

  const handleTabChange = (newTab) => {
    if (newTab === activeTab) return;
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    setIsTabLoading(true);
    setActiveTab(newTab);
    loadingTimeoutRef.current = setTimeout(() => {
      setIsTabLoading(false);
      loadingTimeoutRef.current = null;
    }, 280);
  };

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && tabParam !== activeTab) {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      setIsTabLoading(true);
      setActiveTab(tabParam);
      loadingTimeoutRef.current = setTimeout(() => {
        setIsTabLoading(false);
        loadingTimeoutRef.current = null;
      }, 280);
    }
  }, [searchParams]);

  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

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
      .catch(() => { })
      .finally(() => {
        if (isMounted) setIsSyncing(false);
      });

    const handleUpdate = () => {
      setOrders(getOrderHistory());
      try {
        const saved = localStorage.getItem('dimsum_pending_order');
        setPendingOrder(saved ? JSON.parse(saved) : null);
      } catch { }
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
    navigate('/menu', { state: { reorderItems: order.items } });
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    if (activeTab === 'pending') {
      return order.status === 'pending_payment';
    }
    if (activeTab === 'processing') {
      return order.status === 'processing' || order.status === 'paid' || order.status === 'preparing';
    }
    if (activeTab === 'delivering') {
      return order.status === 'delivering' || order.status === 'shipped' || order.status === 'ready';
    }
    if (activeTab === 'completed') {
      return order.status === 'completed' || order.status === 'cancelled';
    }
    return true;
  });

  const pendingCount = orders.filter(o => o.status === 'pending_payment').length;
  const processingCount = orders.filter(o => o.status === 'processing' || o.status === 'paid' || o.status === 'preparing').length;
  const deliveringCount = orders.filter(o => o.status === 'delivering' || o.status === 'shipped' || o.status === 'ready').length;
  const completedCount = orders.filter(o => o.status === 'completed' || o.status === 'cancelled').length;

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
            onClick={() => handleTabChange('all')}
            className={`py-1.5 px-3 rounded-full font-body font-bold text-[12px] transition-all cursor-pointer whitespace-nowrap text-center shrink-0 ${activeTab === 'all'
              ? 'bg-brand-gold text-white shadow-xs'
              : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
              }`}
          >
            Semua ({orders.length})
          </button>
          <button
            onClick={() => handleTabChange('pending')}
            className={`py-1.5 px-3 rounded-full font-body font-bold text-[12px] transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 shrink-0 ${activeTab === 'pending'
              ? 'bg-brand-gold text-white shadow-xs'
              : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
              }`}
          >
            <span>Belum Bayar</span>
            {pendingCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${activeTab === 'pending' ? 'bg-white text-brand-gold' : 'bg-brand-gold text-white'}`}>
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => handleTabChange('processing')}
            className={`py-1.5 px-3 rounded-full font-body font-bold text-[12px] transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 shrink-0 ${activeTab === 'processing'
              ? 'bg-brand-gold text-white shadow-xs'
              : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
              }`}
          >
            <span>Dikemas</span>
            {processingCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${activeTab === 'processing' ? 'bg-white text-brand-gold' : 'bg-gray-200 text-text-secondary'}`}>
                {processingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => handleTabChange('delivering')}
            className={`py-1.5 px-3 rounded-full font-body font-bold text-[12px] transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 shrink-0 ${activeTab === 'delivering'
              ? 'bg-brand-gold text-white shadow-xs'
              : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
              }`}
          >
            <span>Dikirim</span>
            {deliveringCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${activeTab === 'delivering' ? 'bg-white text-brand-gold' : 'bg-gray-200 text-text-secondary'}`}>
                {deliveringCount}
              </span>
            )}
          </button>
          <button
            onClick={() => handleTabChange('completed')}
            className={`py-1.5 px-3 rounded-full font-body font-bold text-[12px] transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 shrink-0 ${activeTab === 'completed'
              ? 'bg-brand-gold text-white shadow-xs'
              : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
              }`}
          >
            <span>Selesai</span>
            {completedCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${activeTab === 'completed' ? 'bg-white text-brand-gold' : 'bg-gray-200 text-text-secondary'}`}>
                {completedCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* 2. Content Area */}
      {isTabLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-28 px-4 text-center">
          <Loader2 size={36} className="text-brand-gold animate-spin mb-3" strokeWidth={2.5} />
          <p className="font-body font-medium text-[13px] text-text-secondary">
            Memuat pesanan...
          </p>
        </div>
      ) : (
        <>
          {/* 3. Active Pending Order Notification Card (if present and viewing all/pending) */}
          {pendingOrder && (activeTab === 'all' || activeTab === 'pending') && (
            <div className="p-4 bg-bg-cream/60 border-b border-gray-100">
              <div className="bg-white border-2 border-brand-gold/60 rounded-[20px] p-4 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="bg-brand-gold text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-xs">
                    <Wallet size={12} strokeWidth={2} />
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
                  const isProcessing = order.status === 'processing' || order.status === 'paid' || order.status === 'preparing' || order.status === 'fulfilling';
                  const isDelivering = order.status === 'delivering' || order.status === 'shipped' || order.status === 'ready';
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
                            <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                              <Wallet size={12} strokeWidth={2} className="text-amber-700" />
                              <span>Menunggu Bayar</span>
                            </span>
                          )}
                          {isProcessing && (
                            <span className="bg-blue-50 text-brand-blue border border-brand-blue/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                              <PackageOpen size={12} strokeWidth={2} className="text-brand-blue" />
                              <span>Dikemas</span>
                            </span>
                          )}
                          {isDelivering && (
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                              <Truck size={12} strokeWidth={2} className="text-emerald-600" />
                              <span>Dikirim</span>
                            </span>
                          )}
                          {isCompleted && (
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                              <CheckCircle2 size={12} strokeWidth={2} className="text-emerald-700" />
                              <span>Selesai</span>
                            </span>
                          )}
                          {isCancelled && (
                            <span className="bg-gray-100 text-gray-600 border border-gray-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                              <XCircle size={12} strokeWidth={2} />
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

                          {(isProcessing || isDelivering) && (
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
                {/* Contextual Empty State Icon (Pendekatan A: Neutral color.text.secondary #6B7B8D with subtle micro-animations) */}
                <div className="mb-5 flex items-center justify-center">
                  {activeTab === 'pending' ? (
                    <Wallet size={56} strokeWidth={1.5} className="text-text-secondary animate-icon-wallet" />
                  ) : activeTab === 'processing' ? (
                    <PackageOpen size={56} strokeWidth={1.5} className="text-text-secondary animate-icon-package" />
                  ) : activeTab === 'delivering' ? (
                    <div className="relative flex items-center justify-center w-48 h-[62px] select-none [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)] overflow-hidden">
                      {/* Garis jalan statis halus */}
                      <div className="absolute bottom-2 w-full h-[1.5px] bg-gray-200/90 rounded-full" />

                      {/* Bunga tunggal (Lucide Flower2) - Tepat berdiri di atas garis jalan */}
                      <div className="absolute left-1/2 bottom-2 flex items-center justify-center animate-roadside-scroll pointer-events-none z-0">
                        <Flower2 size={13} strokeWidth={1.75} className="text-brand-gold shrink-0 drop-shadow-xs" />
                      </div>

                      {/* Truck dengan bodi suspensi naik turun & roda diam menapak jalan */}
                      <div className="absolute bottom-[5.5px] z-10 flex items-center justify-center pointer-events-none">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width={50}
                          height={50}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-text-secondary overflow-visible"
                        >
                          {/* Bodi mobil naik turun (suspensi) */}
                          <path
                            className="animate-truck-body"
                            d="M14 18V6a2 2 0 00-2-2H4a2 2 0 00-2 2v11a1 1 0 001 1h2a2 2 0 014 0h6a2 2 0 014 0h2a1 1 0 001-1v-3.65a1 1 0 00-.22-.624l-3.48-4.35A1 1 0 0017.52 8H14"
                          />
                          {/* Roda mobil tetap diam di tempat menapak tanah */}
                          <circle cx="17" cy="20" r="2" />
                          <circle cx="7" cy="20" r="2" />
                        </svg>
                      </div>
                    </div>
                  ) : activeTab === 'completed' ? (
                    <CircleX size={56} strokeWidth={1.5} className="text-text-secondary animate-icon-cross" />
                  ) : (
                    <ShoppingBag size={56} strokeWidth={1.5} className="text-text-secondary animate-icon-sway" />
                  )}
                </div>

                <h2 className="font-heading font-black text-[18px] text-text-primary mb-2">
                  {activeTab === 'pending'
                    ? 'Tidak ada pesanan menunggu bayar'
                    : activeTab === 'processing'
                      ? 'Belum ada pesanan yang sedang dikemas'
                      : activeTab === 'delivering'
                        ? 'Belum ada pesanan yang sedang dikirim'
                        : activeTab === 'completed'
                          ? 'Belum ada pesanan yang selesai'
                          : 'Kamu belum punya riwayat order'}
                </h2>
                <p className="font-body font-medium text-[13px] text-text-secondary max-w-[280px] leading-relaxed mb-6">
                  {activeTab === 'pending'
                    ? 'Pesanan yang belum diselesaikan pembayarannya akan muncul di sini.'
                    : activeTab === 'processing'
                      ? 'Pesanan yang sedang disiapkan dan dikemas akan muncul di sini.'
                      : activeTab === 'delivering'
                        ? 'Pesanan yang sedang dalam proses pengiriman akan muncul di sini.'
                        : activeTab === 'completed'
                          ? 'Pesanan yang telah selesai akan tercatat di sini.'
                          : 'Pesanan dimsum frozenmu akan tercatat otomatis setelah kamu melakukan transaksi.'}
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
        </>
      )}

    </div>
  );
}
