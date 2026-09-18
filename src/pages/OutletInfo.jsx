import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Share2, Phone, Map } from 'lucide-react';

function OutletInfo() {
  const navigate = useNavigate();

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Makan Dimsum Cabang Utama',
        text: 'Lokasi Makan Dimsum Cabang Utama',
        url: window.location.href,
      }).catch(console.error);
    }
  };

  const days = [
    'SENIN',
    'SELASA',
    'RABU',
    'KAMIS',
    'JUMAT',
    'SABTU',
    'MINGGU'
  ];

  // Map Sunday (0) to 6, Monday (1) to 0, etc.
  const dayIndexMap = [6, 0, 1, 2, 3, 4, 5];
  const todayIndex = dayIndexMap[new Date().getDay()];

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-white shadow-2xl overflow-x-hidden flex flex-col">
      {/* 1. Header with Share Button */}
      <header className="bg-white flex items-center justify-between px-4 py-3.5 border-b border-gray-100 sticky top-0 z-20">
        <button 
          type="button"
          onClick={() => navigate(-1)} 
          className="text-text-primary p-1.5 rounded-full hover:bg-gray-100 active:scale-95 transition-all cursor-pointer"
          aria-label="Kembali"
        >
          <ArrowLeft size={22} strokeWidth={2.2} />
        </button>
        <h1 className="font-heading font-bold text-[17px] text-text-primary">
          Outlet Info
        </h1>
        <button
          type="button"
          onClick={handleShare}
          className="w-9 h-9 rounded-full flex items-center justify-center text-text-primary hover:bg-gray-100 active:scale-95 transition-all cursor-pointer"
          title="Bagikan Lokasi"
          aria-label="Bagikan Lokasi"
        >
          <Share2 size={18} />
        </button>
      </header>

      {/* 2. Main Info Section */}
      <div className="px-4 py-5 bg-white">
        {/* Branch Title: Primary Dark Text, not hyperlink blue */}
        <h2 className="font-heading font-bold text-[19px] text-text-primary mb-3.5">
          Makan Dimsum Cabang Utama
        </h2>

        {/* Map Embed (Proportional ~165px height) */}
        <div className="relative w-full h-[165px] rounded-[14px] overflow-hidden mb-4 border border-gray-100 bg-gray-100">
          <iframe
            title="Lokasi Makan Dimsum Cabang Utama"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d31728.883391158637!2d106.9768224743164!3d-6.249177599999995!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e698fef21452755%3A0x268f2990efbd61a8!2sMAKAN%20DIMSUM%20INDONESIA%20(PRODUSEN%20DIMSUM)!5e0!3m2!1sid!2sid!4v1789376442109!5m2!1sid!2sid"
            width="100%"
            height="230"
            style={{ border: 0, marginTop: '-52px' }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade">
          </iframe>
        </div>

        {/* Address Row */}
        <div className="flex gap-2.5 mb-5 items-start">
          <div className="text-brand-blue mt-0.5 shrink-0">
            <MapPin size={18} />
          </div>
          <p className="font-body text-[13.5px] text-text-secondary leading-relaxed">
            Jl. Insinyur H. Juanda No.194, RT.03/RW.01, Duren Jaya, Kec. Bekasi Tim., Kota Bks, Jawa Barat 17111
          </p>
        </div>

        {/* Action Buttons: Primary (Gold) for Contact us, Secondary (Blue Border) for Visit us */}
        <div className="flex gap-3">
          <a
            href="https://wa.me/6289531190238"
            target="_blank"
            rel="noreferrer"
            className="flex-1 bg-brand-gold hover:bg-brand-gold-dark text-white rounded-[12px] py-2.5 px-3 flex items-center justify-center gap-2 font-body font-bold text-[14px] shadow-sm transition-transform active:scale-95"
          >
            <Phone size={17} />
            <span>Contact us</span>
          </a>
          <a
            href="https://maps.app.goo.gl/ZiJJDa2YRvGW8SKc9"
            target="_blank"
            rel="noreferrer"
            className="flex-1 border border-brand-blue text-brand-blue hover:bg-brand-blue/5 rounded-[12px] py-2.5 px-3 flex items-center justify-center gap-2 font-body font-semibold text-[14px] transition-transform active:scale-95"
          >
            <Map size={17} />
            <span>Visit us</span>
          </a>
        </div>
      </div>

      {/* Subtle Separator */}
      <div className="h-2 w-full bg-[#F5F1EB]/80 border-y border-gray-100/60"></div>

      {/* 3. Operational Hours */}
      <div className="px-4 py-5 bg-white flex-1">
        <h3 className="font-heading font-bold text-[17px] text-text-primary mb-3">
          Jam Operasional
        </h3>
        <div className="flex flex-col divide-y divide-gray-100">
          {days.map((day, index) => {
            const isToday = index === todayIndex;
            return (
              <div 
                key={day} 
                className="flex justify-between items-center py-3.5"
              >
                <div className="flex items-center gap-2">
                  <span className={`font-body text-[13.5px] tracking-wide ${isToday ? 'font-bold text-text-primary' : 'text-text-secondary font-medium'}`}>
                    {day}
                  </span>
                  {isToday && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-brand-gold/15 text-brand-gold font-body font-bold text-[10px]">
                      Hari ini
                    </span>
                  )}
                </div>
                <span className={`font-body text-[13.5px] ${isToday ? 'font-bold text-text-primary' : 'text-text-secondary'}`}>
                  08:00 - 22:00
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default OutletInfo;
