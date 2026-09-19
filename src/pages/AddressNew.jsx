import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  ChevronRight,
  Home,
  Store,
  Navigation,
  Loader2,
  Truck,
  CheckCircle2,
  AlertCircle,
  Hash,
  PenLine
} from 'lucide-react';
import {
  getCustomerUser,
  isCustomerLoggedIn,
  updateCustomerUser
} from '../utils/customerAuth';
import {
  OUTLET_COORDS,
  calculateHaversineDistance
} from '../components/LocationPickerModal';
import RegionWheelPickerModal from '../components/RegionWheelPickerModal';
import { findRegionCoordinates } from '../data/indonesiaRegions';

export default function AddressNew() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.returnTo || '/profile';

  // Customer user data for auto-fill and suggestion
  const customerUser = getCustomerUser();
  const profilePhone = customerUser?.phone || (customerUser?.email && !customerUser.email.includes('@') ? customerUser.email : '');
  const profileName = customerUser?.full_name || customerUser?.name || '';

  // Form State
  const [recipientName, setRecipientName] = useState(() => {
    return localStorage.getItem('dimsum_delivery_recipient_name') || profileName;
  });

  const [recipientPhone, setRecipientPhone] = useState(() => {
    return localStorage.getItem('dimsum_delivery_recipient_phone') || '';
  });

  const [isPhoneFocused, setIsPhoneFocused] = useState(false);

  // Region State (Provinsi, Kota, Kecamatan, Kode Pos)
  const [province, setProvince] = useState(() => {
    return localStorage.getItem('dimsum_delivery_province') || 'Jawa Barat';
  });
  const [city, setCity] = useState(() => {
    return localStorage.getItem('dimsum_delivery_city') || 'Kota Bekasi';
  });
  const [district, setDistrict] = useState(() => {
    return localStorage.getItem('dimsum_delivery_district') || 'Bekasi Timur';
  });
  const [postalCode, setPostalCode] = useState(() => {
    return localStorage.getItem('dimsum_delivery_postal') || '17111';
  });

  const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);

  // Street & Detail State
  const [street, setStreet] = useState(() => {
    return localStorage.getItem('dimsum_delivery_street') || '';
  });
  const [detail, setDetail] = useState(() => {
    return localStorage.getItem('dimsum_delivery_detail') || '';
  });

  // Toggle Switch: Rumah vs Toko
  const [addressType, setAddressType] = useState(() => {
    const saved = localStorage.getItem('dimsum_delivery_label');
    return saved === 'Toko' ? 'Toko' : 'Rumah';
  });

  // Map & Coordinates State
  const [coords, setCoords] = useState(() => {
    try {
      const saved = localStorage.getItem('dimsum_delivery_coords');
      if (saved) return JSON.parse(saved);
    } catch { }
    // Default: pusat kecamatan Bekasi Timur dekat outlet
    return { latitude: OUTLET_COORDS.latitude, longitude: OUTLET_COORDS.longitude };
  });

  const [isMapMoving, setIsMapMoving] = useState(false);
  const [isAcquiringGPS, setIsAcquiringGPS] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [formError, setFormError] = useState('');

  // Map refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Hitung jarak ke outlet Makan Dimsum
  const distanceKm = calculateHaversineDistance(
    OUTLET_COORDS.latitude,
    OUTLET_COORDS.longitude,
    coords.latitude,
    coords.longitude
  );

  // Inisialisasi Peta Leaflet
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const startLat = coords.latitude || OUTLET_COORDS.latitude;
    const startLng = coords.longitude || OUTLET_COORDS.longitude;

    const map = L.map(mapContainerRef.current, {
      center: [startLat, startLng],
      zoom: 16,
      zoomControl: false,
      attributionControl: false
    });

    // Tile layer OpenStreetMap Resmi dengan filter CSS clean
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      className: 'dimsum-clean-tiles'
    }).addTo(map);

    // Lingkaran radius area pengantaran (7 km)
    L.circle([OUTLET_COORDS.latitude, OUTLET_COORDS.longitude], {
      radius: 7000,
      color: '#C9A23D',
      weight: 1.5,
      opacity: 0.5,
      fillColor: '#C9A23D',
      fillOpacity: 0.04,
      dashArray: '5, 8'
    }).addTo(map);

    // Marker Outlet Makan Dimsum
    const outletIcon = L.divIcon({
      className: 'custom-outlet-marker',
      html: `
        <div style="background-color: #4E8298; color: white; width: 32px; height: 32px; border-radius: 999px; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 8px rgba(78,130,152,0.4); border: 2px solid white; font-weight: bold; font-size: 13px;">
          🥟
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    L.marker([OUTLET_COORDS.latitude, OUTLET_COORDS.longitude], { icon: outletIcon })
      .addTo(map)
      .bindPopup(`<b>${OUTLET_COORDS.name}</b><br>Outlet Produksi & Pengiriman`);

    mapInstanceRef.current = map;

    const handleMoveStart = () => {
      setIsMapMoving(true);
    };

    const handleMoveEnd = () => {
      setIsMapMoving(false);
      const center = map.getCenter();
      setCoords({ latitude: center.lat, longitude: center.lng });
    };

    map.on('movestart', handleMoveStart);
    map.on('moveend', handleMoveEnd);

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.off('movestart', handleMoveStart);
      map.off('moveend', handleMoveEnd);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handler saat user memilih wilayah dari RegionWheelPickerModal
  const handleRegionSelected = ({ province, city, district, postalCode, coordinates }) => {
    setProvince(province);
    setCity(city);
    setDistrict(district);
    setPostalCode(postalCode);

    // Auto-center peta ke koordinat wilayah yang dipilih
    if (coordinates && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([coordinates.latitude, coordinates.longitude], 16, {
        duration: 1.2
      });
      setCoords({ latitude: coordinates.latitude, longitude: coordinates.longitude });
    }
  };

  // Tombol deteksi lokasi GPS saat ini
  const handleDetectCurrentLocation = () => {
    setGpsError('');
    if (!navigator.geolocation) {
      setGpsError('Perangkat Anda tidak mendukung fitur lokasi otomatis.');
      return;
    }

    setIsAcquiringGPS(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsAcquiringGPS(false);
        const { latitude, longitude } = pos.coords;
        setCoords({ latitude, longitude });

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 17, {
            duration: 1.2
          });
        }
      },
      (err) => {
        setIsAcquiringGPS(false);
        console.warn('GPS Error:', err);
        setGpsError('Gagal mendeteksi lokasi GPS otomatis. Silakan geser peta secara manual.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  // Submit Handler
  const handleSaveAddress = (e) => {
    e.preventDefault();
    setFormError('');

    if (!recipientName.trim()) {
      setFormError('Nama lengkap penerima wajib diisi.');
      return;
    }
    if (!recipientPhone.trim() || recipientPhone.trim().length < 8) {
      setFormError('Nomor telepon penerima tidak valid (minimal 8 digit).');
      return;
    }
    if (!province || !city || !district) {
      setFormError('Silakan pilih Provinsi, Kota, dan Kecamatan Anda.');
      return;
    }
    if (!street.trim()) {
      setFormError('Nama jalan, gedung, dan nomor rumah wajib diisi.');
      return;
    }

    // Format alamat lengkap terstandar
    const parts = [
      street.trim(),
      detail.trim() ? detail.trim() : null,
      `Kec. ${district}`,
      city,
      province,
      postalCode ? postalCode : null
    ].filter(Boolean);

    const fullAddress = parts.join(', ');

    // Simpan ke local storage
    try {
      localStorage.setItem('dimsum_delivery_address', fullAddress);
      localStorage.setItem('dimsum_delivery_recipient_name', recipientName.trim());
      localStorage.setItem('dimsum_delivery_recipient_phone', recipientPhone.trim());
      localStorage.setItem('dimsum_delivery_street', street.trim());
      localStorage.setItem('dimsum_delivery_detail', detail.trim());
      localStorage.setItem('dimsum_delivery_province', province);
      localStorage.setItem('dimsum_delivery_city', city);
      localStorage.setItem('dimsum_delivery_district', district);
      localStorage.setItem('dimsum_delivery_postal', postalCode);
      localStorage.setItem('dimsum_delivery_label', addressType);
      localStorage.setItem('dimsum_delivery_coords', JSON.stringify({
        latitude: coords.latitude,
        longitude: coords.longitude
      }));
      localStorage.setItem('dimsum_delivery_notes', detail.trim());

      // Update akun pengguna jika login
      if (customerUser) {
        updateCustomerUser({ ...customerUser, address: fullAddress });
      }
    } catch { }

    // Navigasi kembali ke halaman pemanggil
    navigate(returnTo, { replace: true });
  };

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-bg-cream flex flex-col shadow-2xl overflow-x-clip relative pb-28">
      {/* 1. Header Navbar */}
      <nav className="sticky top-0 z-40 bg-brand-blue/95 backdrop-blur-md px-4 py-3.5 text-white flex items-center justify-between border-b border-brand-blue-dark shadow-sm">
        <button
          type="button"
          onClick={() => navigate(returnTo)}
          className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 transition-all flex items-center justify-center text-white cursor-pointer"
          aria-label="Kembali"
        >
          <ArrowLeft size={20} strokeWidth={2.2} />
        </button>
        <h1 className="font-heading font-black text-[17px] tracking-wide text-white">
          Alamat Baru
        </h1>
        <div className="w-9" />
      </nav>

      {/* 2. Main Content Form */}
      <main className="px-4 py-4 flex flex-col gap-4">
        {/* Error Notification */}
        {formError && (
          <div className="bg-red-50 border border-brand-red/30 rounded-[14px] p-3 flex items-start gap-2.5 text-brand-red text-[12px] font-body animate-shake">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        {/* SECTION 1: Kontak Penerima */}
        <div className="bg-white rounded-[22px] p-4.5 shadow-card border border-gray-100/90 flex flex-col gap-3.5">
          <div className="flex items-center gap-2 pb-2.5 border-b border-gray-100">
            <User size={16} className="text-brand-blue" />
            <h2 className="font-heading font-black text-[14.5px] text-text-primary">
              Kontak Penerima
            </h2>
          </div>

          {/* Field: Nama Lengkap */}
          <div>
            <label className="font-body font-bold text-[12px] text-text-primary block mb-1">
              Nama Lengkap
            </label>
            <input
              type="text"
              required
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Contoh: Budi Santoso"
              className="w-full px-3.5 py-2.5 rounded-[12px] border border-gray-200 bg-gray-50/60 font-body text-[13px] text-text-primary focus:outline-none focus:border-brand-gold focus:bg-white transition-all"
            />
          </div>

          {/* Field: No Telp */}
          <div>
            <label className="font-body font-bold text-[12px] text-text-primary block mb-1">
              Nomor Telepon
            </label>
            <div>
              <input
                type="tel"
                required
                value={recipientPhone}
                onFocus={() => setIsPhoneFocused(true)}
                onBlur={() => setTimeout(() => setIsPhoneFocused(false), 200)}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full px-3.5 py-2.5 rounded-[12px] border border-gray-200 bg-gray-50/60 font-body text-[13px] text-text-primary focus:outline-none focus:border-brand-gold focus:bg-white transition-all"
              />
            </div>

            {/* Smart Suggestion Card dari No. Telp Profil (Animasi buka-tutup halus saat input fokus) */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${isPhoneFocused && profilePhone && !recipientPhone
                ? 'max-h-16 opacity-100 mt-2 translate-y-0 pointer-events-auto'
                : 'max-h-0 opacity-0 mt-0 -translate-y-1.5 pointer-events-none'
                }`}
            >
              <div
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setRecipientPhone(profilePhone);
                  setIsPhoneFocused(false);
                }}
                className="p-2.5 rounded-[12px] bg-brand-gold/10 border border-brand-gold/25 flex items-center justify-between gap-2 shadow-2xs hover:bg-brand-gold/15 active:scale-[0.99] transition-all cursor-pointer"
              >
                <span className="font-body text-[12.5px] text-text-primary truncate">
                  Gunakan: <strong className="font-bold text-brand-gold-dark">{profilePhone}</strong>
                </span>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setRecipientPhone(profilePhone);
                    setIsPhoneFocused(false);
                  }}
                  className="px-3 py-1 bg-brand-gold hover:bg-brand-gold-dark text-white rounded-[8px] font-body font-bold text-[11.5px] shadow-2xs active:scale-95 transition-all cursor-pointer shrink-0"
                >
                  Gunakan
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Detail Alamat */}
        <div className="bg-white rounded-[22px] p-4.5 shadow-card border border-gray-100/90 flex flex-col gap-3.5">
          <div className="flex items-center gap-2 pb-2.5 border-b border-gray-100">
            <MapPin size={16} className="text-brand-blue" />
            <h2 className="font-heading font-black text-[14.5px] text-text-primary">
              Alamat Lengkap
            </h2>
          </div>

          {/* Field: Wilayah (Provinsi, Kota, Kecamatan, Kode Pos) via Wheel Picker */}
          <div>
            <label className="font-body font-bold text-[12px] text-text-primary block mb-1">
              Provinsi, Kota, Kecamatan, Kode Pos
            </label>
            <div
              onClick={() => setIsRegionModalOpen(true)}
              className="w-full px-3.5 py-3 rounded-[12px] border border-gray-200 bg-gray-50/70 hover:bg-gray-100/80 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between gap-2 group shadow-2xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-body text-[13px] text-text-primary group-hover:text-brand-blue truncate font-medium">
                  {province ? `${province}, ${city}, ${district} (${postalCode})` : 'Pilih Provinsi, Kota, Kecamatan, Kode Pos'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-brand-gold font-body font-bold text-[12px] shrink-0">
                <span>Pilih</span>
                <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>

          {/* Field: Nama Jalan, Gedung, No. Rumah */}
          <div>
            <label className="font-body font-bold text-[12px] text-text-primary block mb-1">
              Nama Jalan, Gedung, No. Rumah
            </label>
            <div>
              {/* <div className="absolute left-3.5 top-3 text-text-secondary">
                <Hash size={15} />
              </div> */}
              <textarea
                rows={2}
                required
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="Contoh: Jl. Anggrek Raya No. 12B, RT 03/RW 05, Kel. Rangkapan Jaya"
                className="w-full px-3.5 py-2.5 rounded-[12px] border border-gray-200 bg-gray-50/60 font-body text-[13px] text-text-primary focus:outline-none focus:border-brand-gold focus:bg-white transition-all resize-none"
              />
            </div>
          </div>

          {/* Field: Detail Lainnya (Opsional) */}
          <div>
            <label className="font-body font-bold text-[12px] text-text-primary block mb-1">
              Detail Lainnya / Patokan Kurir <span className="font-normal text-text-secondary">(Opsional)</span>
            </label>
            <div>
              <input
                type="text"
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="Contoh: Pagar hitam samping warung Madura, ada bel"
                className="w-full px-3.5 py-2.5 rounded-[12px] border border-gray-200 bg-gray-50/60 font-body text-[13px] text-text-primary focus:outline-none focus:border-brand-gold focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: Peta & Titik Spesifik Rumah */}
        <div className="bg-white rounded-[22px] p-4.5 shadow-card border border-gray-100/90 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div>
              <h2 className="font-heading font-black text-[14.5px] text-text-primary leading-tight">
                Titik Pin Lokasi Rumah
              </h2>
              <p className="font-body text-[11px] text-text-secondary mt-0.5">
                Peta otomatis mengarah ke wilayah Anda. Geser pin tepat di depan atap rumah.
              </p>
            </div>
          </div>

          {/* Viewport Peta Interaktif dengan Center Pin */}
          <div className="relative w-full h-[220px] rounded-[16px] overflow-hidden border border-gray-200/80 shadow-2xs select-none">
            <div ref={mapContainerRef} className="w-full h-full z-0" />

            {/* Floating Center Pin Gold */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-20 pointer-events-none flex flex-col items-center">
              <div
                className={`transition-transform duration-200 ease-out ${isMapMoving ? '-translate-y-3.5 scale-110' : 'translate-y-0 scale-100'
                  }`}
              >
                <div className="relative flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-brand-gold text-white flex items-center justify-center shadow-[0_4px_14px_rgba(201,162,61,0.5)] border-2 border-white">
                    <MapPin size={22} className="fill-white text-brand-gold" />
                  </div>
                  <div className="absolute -top-7 bg-text-primary text-white text-[10px] font-body font-bold py-0.5 px-2 rounded-full shadow-md whitespace-nowrap">
                    {isMapMoving ? 'Lepas untuk pilih titik' : 'Titik Rumah Anda'}
                  </div>
                </div>
              </div>
              <div
                className={`w-3.5 h-1.5 bg-black/25 rounded-full blur-[1.5px] transition-all duration-200 mt-0.5 ${isMapMoving ? 'scale-75 opacity-40' : 'scale-100 opacity-90'
                  }`}
              />
            </div>

            {/* Tombol Shortcut Lokasi Saya GPS */}
            <button
              type="button"
              onClick={handleDetectCurrentLocation}
              disabled={isAcquiringGPS}
              className="absolute bottom-3 right-3 z-20 bg-white text-brand-blue hover:bg-gray-50 active:scale-95 transition-transform px-3 py-1.5 rounded-full shadow-md border border-gray-200/80 flex items-center gap-1.5 text-[11px] font-body font-bold cursor-pointer"
            >
              {isAcquiringGPS ? (
                <>
                  <Loader2 size={13} className="animate-spin text-brand-blue" />
                  <span>Mencari GPS...</span>
                </>
              ) : (
                <>
                  <Navigation size={13} className="fill-brand-blue text-brand-blue" />
                  <span>Lokasi Saya</span>
                </>
              )}
            </button>

            {/* Badge Jarak ke Outlet */}
            <div className="absolute bottom-3 left-3 z-20 bg-[#E8F0F4]/95 backdrop-blur-xs text-brand-blue px-2.5 py-1.5 rounded-full shadow-xs border border-brand-blue/20 flex items-center gap-1.5 text-[11px] font-body font-bold">
              <Truck size={13} className="text-brand-blue" />
              <span>~{distanceKm} km dari outlet</span>
            </div>
          </div>

          {gpsError && (
            <p className="text-[11px] font-body text-brand-red flex items-center gap-1 mt-0.5">
              <AlertCircle size={12} />
              <span>{gpsError}</span>
            </p>
          )}
        </div>

        {/* SECTION 4: Toggle Switch (Rumah vs Toko) */}
        <div className="bg-white rounded-[22px] p-4.5 shadow-card border border-gray-100/90 flex items-center justify-between gap-3">
          <div>
            <span className="font-heading font-black text-[14px] text-text-primary block leading-tight">
              Tandai Sebagai
            </span>
            <span className="font-body text-[11px] text-text-secondary block mt-0.5">
              Kategori tujuan pengiriman
            </span>
          </div>

          {/* Toggle Switch 2 Opsi: [ Rumah | Toko ] */}
          <div className="inline-flex p-1 bg-gray-100/90 rounded-[12px] border border-gray-200/60 shrink-0">
            <button
              type="button"
              onClick={() => setAddressType('Rumah')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[9px] font-body font-bold text-[12px] transition-all cursor-pointer ${addressType === 'Rumah'
                ? 'bg-brand-gold text-white shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
                }`}
            >
              <Home size={14} />
              <span>Rumah</span>
            </button>
            <button
              type="button"
              onClick={() => setAddressType('Toko')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[9px] font-body font-bold text-[12px] transition-all cursor-pointer ${addressType === 'Toko'
                ? 'bg-brand-gold text-white shadow-xs'
                : 'text-text-secondary hover:text-text-primary'
                }`}
            >
              <Store size={14} />
              <span>Toko</span>
            </button>
          </div>
        </div>
      </main>

      {/* 3. Sticky Bottom Bar: Simpan Alamat */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white/95 backdrop-blur-md border-t border-[#EAEAEA] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] z-40 p-4">
        <button
          type="button"
          onClick={handleSaveAddress}
          className="w-full py-3.5 bg-brand-gold hover:bg-brand-gold-dark text-white font-body font-bold text-[14px] rounded-[14px] shadow-elevated transition-transform active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
        >
          <CheckCircle2 size={18} />
          <span>Simpan Alamat</span>
        </button>
      </div>

      {/* Modal Pemilih Wilayah Bergaya Gembok Putar */}
      <RegionWheelPickerModal
        isOpen={isRegionModalOpen}
        onClose={() => setIsRegionModalOpen(false)}
        onSelect={handleRegionSelected}
        initialProvince={province}
        initialCity={city}
        initialDistrict={district}
        initialPostalCode={postalCode}
      />
    </div>
  );
}
