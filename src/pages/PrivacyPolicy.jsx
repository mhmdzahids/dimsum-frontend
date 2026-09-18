import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle } from 'lucide-react';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="max-w-[480px] mx-auto min-h-screen relative shadow-2xl overflow-x-clip bg-white flex flex-col">
      {/* 1. Sticky Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-brand-blue px-4 py-3.5 text-white flex items-center justify-between shadow-xs">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 transition-all flex items-center justify-center text-white cursor-pointer"
          aria-label="Kembali"
        >
          <ArrowLeft size={20} strokeWidth={2.2} />
        </button>
        <span className="font-heading font-bold text-[17px] tracking-wide text-white">
          Kebijakan Privasi
        </span>
        <div className="w-9" />
      </nav>

      {/* 2. Document Content */}
      <main className="px-5 py-6 flex-1 flex flex-col gap-6 max-w-[480px]">
        {/* Intro Statement (No card wrapper) */}
        <div className="pb-1">
          <span className="font-body font-medium text-[11.5px] text-text-secondary uppercase tracking-wider block mb-2">
            Terakhir diperbarui: September 2026
          </span>
          <p className="font-body text-[13.5px] text-text-secondary leading-relaxed">
            Selamat datang di <strong className="text-text-primary font-semibold">Makan Dimsum Indonesia</strong>. Kami berkomitmen menjaga privasi dan keamanan informasi pribadi Anda saat melakukan pemesanan produk dimsum melalui platform kami.
          </p>
        </div>

        {/* Section 1: Data Collection */}
        <section className="pb-6 border-b border-[#EAEAEA]">
          <h2 className="font-body font-bold text-[15px] text-text-primary mb-2.5">
            1. Informasi yang Kami Kumpulkan
          </h2>
          <p className="font-body text-[13px] text-text-secondary leading-relaxed mb-3">
            Kami hanya mengumpulkan data yang esensial dan Anda berikan secara langsung saat melakukan pemesanan:
          </p>
          <ul className="space-y-2 pl-4 list-disc marker:text-brand-blue text-[13px] font-body text-text-secondary leading-relaxed">
            <li>
              <strong className="text-text-primary font-semibold">Nama Pemesan:</strong> Digunakan untuk identifikasi pada antrean pesanan dan etiket kemasan.
            </li>
            <li>
              <strong className="text-text-primary font-semibold">Nomor WhatsApp:</strong> Digunakan untuk konfirmasi pesanan, instruksi pembayaran, dan bukti QR pengambilan.
            </li>
            <li>
              <strong className="text-text-primary font-semibold">Alamat Email (Opsional):</strong> Sebagai alternatif pengiriman salinan nota elektronik atas permintaan Anda.
            </li>
          </ul>
        </section>

        {/* Section 2: Payment Security */}
        <section className="pb-6 border-b border-[#EAEAEA]">
          <h2 className="font-body font-bold text-[15px] text-text-primary mb-2.5">
            2. Keamanan Transaksi QRIS
          </h2>
          <p className="font-body text-[13px] text-text-secondary leading-relaxed">
            Seluruh transaksi pembayaran digital diproses melalui payment gateway berlisensi resmi Bank Indonesia (Paywuz QRIS). Makan Dimsum Indonesia <strong className="text-text-primary font-semibold">tidak pernah mencatat atau menyimpan</strong> data kartu kredit/debit, nomor rekening bank, maupun nomor PIN rahasia Anda.
          </p>
        </section>

        {/* Section 3: Local Storage */}
        <section className="pb-6 border-b border-[#EAEAEA]">
          <h2 className="font-body font-bold text-[15px] text-text-primary mb-2.5">
            3. Penyimpanan Data Lokal Peramban (Local Storage)
          </h2>
          <p className="font-body text-[13px] text-text-secondary leading-relaxed">
            Aplikasi kami menggunakan teknologi <em>Local Storage</em> pada peramban untuk menyimpan keranjang belanja aktif, catatan pesanan, dan preferensi nama Anda secara lokal agar Anda tidak perlu mengulang pengisian dari awal pada pesanan berikutnya.
          </p>
        </section>

        {/* Section 4: Privacy Guarantee */}
        <section className="pb-6 border-b border-[#EAEAEA]">
          <h2 className="font-body font-bold text-[15px] text-text-primary mb-2.5">
            4. Kerahasiaan Data Tanpa Pihak Ketiga
          </h2>
          <p className="font-body text-[13px] text-text-secondary leading-relaxed">
            Informasi kontak dan riwayat pesanan Anda semata-mata digunakan untuk kepentingan operasional transaksi. Kami menjamin bahwa data pribadi Anda <strong className="text-text-primary font-semibold">tidak akan pernah diperjualbelikan, disewakan, atau disebarluaskan</strong> kepada pihak ketiga mana pun di luar pemrosesan pesanan resmi Anda.
          </p>
        </section>

        {/* Section 5: Customer Support CTA (Aligned to Gold Primary Token) */}
        <div className="pt-1 pb-8 flex flex-col gap-3">
          <p className="font-body text-[13px] text-text-secondary leading-relaxed">
            Jika Anda memiliki pertanyaan mengenai privasi atau ingin mengajukan pembaruan data pesanan, silakan hubungi tim kami langsung:
          </p>
          <a
            href="https://wa.me/6289531190238"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 bg-brand-gold hover:bg-brand-gold-dark text-white font-body font-bold text-[14px] rounded-[12px] shadow-sm transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <MessageCircle size={18} />
            <span>Hubungi Customer Service</span>
          </a>
        </div>
      </main>
    </div>
  );
}

