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
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
    'SUNDAY'
  ];

  const currentDayStr = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-white shadow-2xl overflow-x-hidden">
      {/* Header */}
      <div className="bg-white flex items-center px-4 py-4 border-b border-gray-100 relative z-10">
        <button onClick={() => navigate(-1)} className="text-text-primary p-1">
          <ArrowLeft size={24} strokeWidth={2.5} />
        </button>
        <div className="absolute left-1/2 -translate-x-1/2 font-heading font-bold text-[18px] text-text-primary">
          Outlet Info
        </div>
      </div>

      {/* Main Info Section */}
      <div className="px-4 py-5 bg-white">
        <h2 className="font-heading font-bold text-[20px] text-brand-blue mb-4">
          Makan Dimsum Cabang Utama
        </h2>

        {/* Map Embed */}
        <div className="w-full h-[200px] rounded-[12px] overflow-hidden mb-4 border border-gray-100">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d31728.883391158637!2d106.9768224743164!3d-6.249177599999995!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e698fef21452755%3A0x268f2990efbd61a8!2sMAKAN%20DIMSUM%20INDONESIA%20(PRODUSEN%20DIMSUM)!5e0!3m2!1sen!2sid!4v1789376442109!5m2!1sen!2sid"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade">
          </iframe>
        </div>

        <div className="flex gap-3 mb-6 items-start">
          <div className="text-text-secondary mt-0.5 shrink-0">
            <MapPin size={20} />
          </div>
          <p className="font-body text-[14px] text-text-secondary leading-relaxed flex-1">
            Jl. Insinyur H. Juanda No.194, RT.03/RW.01, Duren Jaya, Kec. Bekasi Tim., Kota Bks, Jawa Barat 17111
          </p>
          <button
            onClick={handleShare}
            className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-text-primary shrink-0 transition-colors active:bg-gray-50"
          >
            <Share2 size={18} />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <a
            href="https://wa.me/6289531190238"
            target="_blank"
            rel="noreferrer"
            className="flex-1 border border-gray-200 rounded-[10px] py-2.5 flex items-center justify-center gap-2 text-text-primary font-body font-medium text-[14px] active:bg-gray-50 transition-colors"
          >
            <Phone size={18} />
            Contact us
          </a>
          <a
            href="https://maps.app.goo.gl/ZiJJDa2YRvGW8SKc9"
            target="_blank"
            rel="noreferrer"
            className="flex-1 border border-gray-200 rounded-[10px] py-2.5 flex items-center justify-center gap-2 text-text-primary font-body font-medium text-[14px] active:bg-gray-50 transition-colors"
          >
            <Map size={18} />
            Visit us
          </a>
        </div>
      </div>

      {/* Thick Separator */}
      <div className="h-2 w-full bg-gray-50"></div>

      {/* Operational Hours */}
      <div className="px-4 py-5 bg-white">
        <h3 className="font-heading font-bold text-[18px] text-text-primary mb-2">
          Operational Hours
        </h3>
        <div className="flex flex-col">
          {days.map((day, index) => {
            const isToday = day === currentDayStr;
            return (
              <div 
                key={day} 
                className={`flex justify-between items-center py-4 ${index !== days.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <span className={`font-body text-[14px] tracking-wide ${isToday ? 'font-bold text-text-primary' : 'text-text-secondary font-medium'}`}>
                  {day}
                </span>
                <span className={`font-body text-[14px] ${isToday ? 'font-bold text-text-primary' : 'text-text-secondary'}`}>
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
