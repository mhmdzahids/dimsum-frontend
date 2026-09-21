import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, X, RefreshCw, AlertCircle, Sparkles, Layers, ShieldCheck } from 'lucide-react';
import api from '../../api/client';

export default function LotStickerModal({ batch, onClose }) {
  const [stickers, setStickers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!batch?.id) return;
    const fetchStickers = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/api/inventory/batches/${batch.id}/stickers`, { auth: 'admin' });
        if (res.success) {
          setStickers(res.data || []);
        } else {
          setError(res.error || 'Gagal mengambil data label stiker');
        }
      } catch {
        setError('Koneksi bermasalah saat memuat stiker label');
      } finally {
        setLoading(false);
      }
    };
    fetchStickers();
  }, [batch?.id]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-gray-100 my-auto animate-scaleUp">
        {/* Modal Header (Hidden on Print) */}
        <div className="flex justify-between items-start mb-6 print:hidden border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-brand-gold/10 text-brand-gold">
                <Layers size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-primary font-heading">
                  Stiker Label QR Lot Produksi
                </h3>
                <p className="text-xs text-text-secondary">
                  Batch: <span className="font-mono font-bold text-brand-blue">{batch.batch_code}</span> ({batch.product_name || 'Dimsum'})
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={loading || stickers.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-blue hover:bg-brand-blue/90 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
            >
              <Printer size={15} />
              <span>Cetak ({stickers.length} Label)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-text-secondary hover:text-text-primary hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Loading / Error State */}
        {loading ? (
          <div className="p-12 text-center text-text-secondary text-xs flex flex-col items-center gap-2 print:hidden">
            <RefreshCw size={24} className="animate-spin text-brand-blue" />
            <span>Menyiapkan stiker label QR...</span>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 flex items-center gap-2 print:hidden">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        ) : stickers.length === 0 ? (
          <div className="p-10 text-center text-text-secondary text-xs print:hidden">
            Tidak ada label stiker yang siap dicetak. Pastikan batch sudah dikonfirmasi oleh Checker.
          </div>
        ) : (
          <div>
            {/* Instruction Banner (Hidden on Print) */}
            <div className="mb-5 p-3.5 bg-blue-50/80 border border-blue-100 rounded-2xl flex items-center justify-between text-xs text-blue-900 print:hidden">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-brand-blue shrink-0" />
                <span>
                  1 Lot = 25 Produk. Tempel 1 label stiker QR pada setiap krat/wadah bundle lot sebelum dimasukkan ke freezer.
                </span>
              </div>
              <span className="font-bold text-xs bg-white px-2.5 py-1 rounded-lg border border-blue-200 shrink-0">
                Total: {stickers.length} Wadah
              </span>
            </div>

            {/* Sticker Printable Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[65vh] overflow-y-auto p-1 print:max-h-none print:overflow-visible print:grid-cols-2 print:gap-4">
              {stickers.map((stk, idx) => (
                <div
                  key={idx}
                  className="bg-white border-2 border-gray-800 rounded-2xl p-4 flex flex-col justify-between shadow-xs print:shadow-none print:border-2 print:border-black print:break-inside-avoid"
                  style={{ minHeight: '210px' }}
                >
                  {/* Brand & Lot Info Header */}
                  <div>
                    <div className="flex justify-between items-center border-b border-gray-300 pb-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-brand-blue print:text-black" />
                        <span className="font-heading font-bold text-xs uppercase tracking-wide">
                          Makan Dimsum ID
                        </span>
                      </div>
                      <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md ${stk.is_loose ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-brand-blue/10 text-brand-blue border border-brand-blue/20 print:border-black print:text-black'}`}>
                        {stk.is_loose ? 'SISA ECERAN' : `LOT ${stk.lot_number} / ${stk.total_lots}`}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-gray-900 leading-tight mb-1">
                      {stk.product_name}
                    </h4>
                    <div className="text-[11px] font-mono text-gray-600 mb-2">
                      Batch: <span className="font-bold text-gray-900">{stk.batch_code}</span>
                    </div>
                  </div>

                  {/* QR Code & Lot Specs */}
                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-dashed border-gray-300">
                    <div className="space-y-1 text-[11px]">
                      <div>
                        <span className="text-gray-500 block text-[10px] uppercase">Isi Wadah:</span>
                        <span className="font-extrabold text-sm text-gray-900">
                          {stk.lot_size} Pack / Mika
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px] uppercase">Waktu Produksi:</span>
                        <span className="font-medium text-gray-700">{stk.produced_at || '-'}</span>
                      </div>
                      <div className="text-[9px] font-semibold text-emerald-700 print:text-black uppercase">
                        ❄ Simpan Beku -18°C
                      </div>
                    </div>

                    {/* QR Code */}
                    <div className="p-1.5 bg-white rounded-xl border border-gray-200 print:border-none shrink-0 flex items-center justify-center">
                      <QRCodeSVG
                        value={stk.qr_payload}
                        size={84}
                        level="M"
                        includeMargin={false}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
