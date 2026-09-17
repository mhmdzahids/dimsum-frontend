import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Lock, CreditCard, Smartphone, Database, CheckCircle2, MessageCircle } from 'lucide-react';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="max-w-[480px] mx-auto min-h-screen relative shadow-2xl overflow-x-clip bg-bg-cream flex flex-col">
      {/* 1. Sticky Navbar */}
      <nav className="sticky top-0 z-50 bg-brand-blue/95 backdrop-blur-md px-5 py-3 text-white flex items-center justify-between border-b border-brand-blue-dark shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 transition-all flex items-center justify-center text-white cursor-pointer"
          aria-label="Kembali"
        >
          <ArrowLeft size={20} strokeWidth={2.2} />
        </button>
        <span className="font-heading font-black text-[16px] tracking-wide text-white">
          Kebijakan Privasi
        </span>
        <div className="w-10" />
      </nav>

      {/* 2. Subheader Banner */}
      <header className="bg-brand-blue px-5 pt-2 pb-6 text-white border-b border-brand-blue-dark">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <ShieldCheck size={20} strokeWidth={2.2} className="text-white" />
          </div>
          <div>
            <h1 className="font-heading font-black text-[17px] leading-tight">
              Perlindungan Data & Privasi
            </h1>
            <p className="font-body text-[11px] text-white/80 font-medium">
              Makan Dimsum Indonesia • Terakhir diperbarui: September 2026
            </p>
          </div>
        </div>
      </header>

      {/* 2. Content */}
      <main className="p-5 flex-1 flex flex-col gap-4 pb-16">
        {/* Intro Banner */}
        <div className="bg-white rounded-[20px] p-4 shadow-sm border border-gray-100">
          <p className="font-body font-medium text-[12px] text-text-secondary leading-relaxed">
            Selamat datang di <strong className="text-text-primary">Makan Dimsum Indonesia</strong>. Kami sangat menghargai privasi dan kepercayaan Anda. Kebijakan ini menjelaskan bagaimana data pribadi Anda dikumpulkan, digunakan, dan dilindungi saat memesan produk dimsum melalui platform kami.
          </p>
        </div>

        {/* Section 1: Data Collection */}
        <div className="bg-white rounded-[20px] p-4.5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-brand-blue/10 text-brand-blue flex items-center justify-center shrink-0">
              <Smartphone size={17} strokeWidth={2} />
            </div>
            <h2 className="font-body font-bold text-[14px] text-text-primary">
              1. Informasi yang Kami Kumpulkan
            </h2>
          </div>
          <p className="font-body text-[12px] text-text-secondary leading-relaxed mb-2">
            Kami hanya mengumpulkan informasi yang esensial dan Anda berikan secara langsung saat melakukan pemesanan, meliputi:
          </p>
          <ul className="space-y-1.5 pl-1">
            <li className="flex items-start gap-2 text-[12px] font-body text-text-secondary">
              <CheckCircle2 size={15} className="text-brand-gold shrink-0 mt-0.5" />
              <span><strong>Nama Lengkap:</strong> Untuk identifikasi pemesan pada antrean pesanan.</span>
            </li>
            <li className="flex items-start gap-2 text-[12px] font-body text-text-secondary">
              <CheckCircle2 size={15} className="text-brand-gold shrink-0 mt-0.5" />
              <span><strong>Nomor WhatsApp:</strong> Untuk mengirimkan notifikasi status pesanan dan bukti struk QR.</span>
            </li>
            <li className="flex items-start gap-2 text-[12px] font-body text-text-secondary">
              <CheckCircle2 size={15} className="text-brand-gold shrink-0 mt-0.5" />
              <span><strong>Alamat Email (Opsional):</strong> Sebagai alternatif pengiriman nota elektronik.</span>
            </li>
          </ul>
        </div>

        {/* Section 2: Payment Security */}
        <div className="bg-white rounded-[20px] p-4.5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <CreditCard size={17} strokeWidth={2} />
            </div>
            <h2 className="font-body font-bold text-[14px] text-text-primary">
              2. Keamanan Transaksi QRIS
            </h2>
          </div>
          <p className="font-body text-[12px] text-text-secondary leading-relaxed">
            Pembayaran non-tunai di platform kami diproses secara aman menggunakan payment gateway resmi yang berlisensi Bank Indonesia (Paywuz QRIS). Makan Dimsum Indonesia <strong className="text-text-primary">tidak pernah menyimpan data sensitif perbankan</strong>, nomor kartu kredit/debit, maupun nomor PIN pelanggan.
          </p>
        </div>

        {/* Section 3: Local Storage */}
        <div className="bg-white rounded-[20px] p-4.5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-brand-gold/15 text-brand-gold flex items-center justify-center shrink-0">
              <Database size={17} strokeWidth={2} />
            </div>
            <h2 className="font-body font-bold text-[14px] text-text-primary">
              3. Penyimpanan Data Lokal Peramban
            </h2>
          </div>
          <p className="font-body text-[12px] text-text-secondary leading-relaxed">
            Aplikasi kami menggunakan teknologi <em>Local Storage</em> pada peramban Anda untuk menyimpan keranjang belanja, catatan pesanan, dan preferensi nama Anda secara lokal agar Anda tidak perlu mengisi ulang dari awal pada pesanan berikutnya.
          </p>
        </div>

        {/* Section 4: Privacy & No Third-Party Selling */}
        <div className="bg-white rounded-[20px] p-4.5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-brand-blue/10 text-brand-blue flex items-center justify-center shrink-0">
              <Lock size={17} strokeWidth={2} />
            </div>
            <h2 className="font-body font-bold text-[14px] text-text-primary">
              4. Kerahasiaan Data Tanpa Pihak Ketiga
            </h2>
          </div>
          <p className="font-body text-[12px] text-text-secondary leading-relaxed">
            Kami menjamin bahwa nomor WhatsApp, email, dan rincian transaksi Anda <strong className="text-text-primary">tidak akan pernah diperjualbelikan, disewakan, atau disebarluaskan</strong> kepada pihak ketiga mana pun di luar pemrosesan transaksi pesanan resmi Anda.
          </p>
        </div>

        {/* Support Card */}
        <div className="bg-brand-blue/5 border border-brand-blue/20 rounded-[20px] p-4.5 flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <MessageCircle size={18} className="text-brand-blue" />
            <h3 className="font-body font-bold text-[13px] text-brand-blue">
              Ada Pertanyaan Seputar Privasi?
            </h3>
          </div>
          <p className="font-body text-[12px] text-text-secondary leading-relaxed">
            Jika Anda memiliki pertanyaan mengenai data atau ingin mengajukan penghapusan catatan profil, hubungi tim operasional kami langsung melalui WhatsApp Customer Service.
          </p>
          <a
            href="https://wa.me/6281234567890"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 py-2.5 px-4 bg-brand-blue hover:bg-brand-blue-dark text-white font-body font-bold text-[12px] rounded-[12px] shadow-sm transition-transform active:scale-95 flex items-center justify-center gap-2"
          >
            <span>Hubungi Customer Service</span>
          </a>
        </div>
      </main>
    </div>
  );
}
