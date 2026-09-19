import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  X,
  MapPin,
  Navigation,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Home,
  Briefcase,
  Tag,
  PenLine,
  Truck,
  Building,
  Hash
} from 'lucide-react';

import { OUTLET_COORDS, calculateHaversineDistance } from '../utils/geo';
export { OUTLET_COORDS, calculateHaversineDistance };

export default function LocationPickerModal({
  isOpen,
  onClose,
  onSave,
  initialAddress = '',
  initialNotes = '',
  initialCoords = null,
  initialLabel = 'Rumah'
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Form states terstruktur ala Shopee
  const [street, setStreet] = useState('');
  const [detail, setDetail] = useState(''); // No. Rumah / Blok / Unit / RT-RW (Wajib)
  const [subdistrict, setSubdistrict] = useState(''); // Kecamatan
  const [city, setCity] = useState(''); // Kota / Kabupaten
  const [postalCode, setPostalCode] = useState(''); // Kode Pos
  const [notes, setNotes] = useState(initialNotes); // Patokan Kurir (Opsional)
  const [label, setLabel] = useState(initialLabel);
  const [detailError, setDetailError] = useState(false);

  const [coords, setCoords] = useState(() => {
    if (initialCoords && initialCoords.latitude && initialCoords.longitude) {
      return initialCoords;
    }
    try {
      const saved = localStorage.getItem('dimsum_delivery_coords');
      if (saved) return JSON.parse(saved);
    } catch { }
    return { latitude: OUTLET_COORDS.latitude, longitude: OUTLET_COORDS.longitude };
  });

  // UI status
  const [isMapMoving, setIsMapMoving] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isAcquiringGPS, setIsAcquiringGPS] = useState(false);
  const [gpsError, setGpsError] = useState('');

  // Jarak ke outlet
  const distanceKm = calculateHaversineDistance(
    OUTLET_COORDS.latitude,
    OUTLET_COORDS.longitude,
    coords.latitude,
    coords.longitude
  );

  // Sync state when modal opened with props / localStorage
  useEffect(() => {
    if (isOpen) {
      const savedStreet = localStorage.getItem('dimsum_delivery_street') || '';
      const savedDetail = localStorage.getItem('dimsum_delivery_detail') || '';
      const savedDistrict = localStorage.getItem('dimsum_delivery_district') || '';
      const savedCity = localStorage.getItem('dimsum_delivery_city') || '';
      const savedPostal = localStorage.getItem('dimsum_delivery_postal') || '';
      const savedNotes = initialNotes || localStorage.getItem('dimsum_delivery_notes') || '';
      const savedLabel = initialLabel || localStorage.getItem('dimsum_delivery_label') || 'Rumah';

      setNotes(savedNotes);
      setLabel(savedLabel);
      setGpsError('');
      setDetailError(false);

      if (savedStreet || savedDetail) {
        setStreet(savedStreet);
        setDetail(savedDetail);
        setSubdistrict(savedDistrict);
        setCity(savedCity);
        setPostalCode(savedPostal);
      } else if (initialAddress) {
        setStreet(initialAddress);
        setDetail('');
      }

      if (initialCoords && initialCoords.latitude && initialCoords.longitude) {
        setCoords(initialCoords);
      } else {
        try {
          const saved = localStorage.getItem('dimsum_delivery_coords');
          if (saved) setCoords(JSON.parse(saved));
        } catch { }
      }
    }
  }, [isOpen, initialAddress, initialNotes, initialCoords, initialLabel]);

  // Inisialisasi peta Leaflet
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    const startLat = coords.latitude || OUTLET_COORDS.latitude;
    const startLng = coords.longitude || OUTLET_COORDS.longitude;

    // Bersihkan instance lama jika ada
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [startLat, startLng],
      zoom: 16,
      zoomControl: false,
      attributionControl: false
    });

    // Tile layer OpenStreetMap Resmi (100% Gratis, Tanpa API Key, Tanpa Watermark)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      className: 'dimsum-clean-tiles',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Lingkaran radius area pengantaran dari outlet (7 km)
    L.circle([OUTLET_COORDS.latitude, OUTLET_COORDS.longitude], {
      radius: 7000,
      color: '#C9A23D',
      weight: 1.5,
      opacity: 0.5,
      fillColor: '#C9A23D',
      fillOpacity: 0.04,
      dashArray: '5, 8'
    }).addTo(map);

    // Marker Outlet Makan Dimsum sebagai referensi
    const outletIcon = L.divIcon({
      className: 'custom-outlet-marker',
      html: `
        <div style="background-color: #4E8298; color: white; width: 34px; height: 34px; border-radius: 999px; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 10px rgba(78,130,152,0.4); border: 2.5px solid white; font-weight: bold; font-size: 14px;">
          🥟
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    L.marker([OUTLET_COORDS.latitude, OUTLET_COORDS.longitude], { icon: outletIcon })
      .addTo(map)
      .bindPopup(`<b>${OUTLET_COORDS.name}</b><br>Outlet Produksi & Pengiriman`);

    mapInstanceRef.current = map;

    // Deteksi saat peta digeser oleh user
    const handleMoveStart = () => {
      setIsMapMoving(true);
    };

    const handleMoveEnd = () => {
      setIsMapMoving(false);
      const center = map.getCenter();
      const newLat = center.lat;
      const newLng = center.lng;

      setCoords({ latitude: newLat, longitude: newLng });

      // Reverse geocoding via Nominatim OpenStreetMap (Debounced 450ms)
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        setIsGeocoding(true);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${newLat}&lon=${newLng}&addressdetails=1`,
            {
              headers: {
                'Accept-Language': 'id-ID, id;q=0.9, en;q=0.8'
              }
            }
          );
          if (res.ok) {
            const data = await res.json();
            if (data && data.address) {
              const addr = data.address;
              const roadName =
                addr.road ||
                addr.pedestrian ||
                addr.residential ||
                addr.neighbourhood ||
                addr.suburb ||
                (data.display_name ? data.display_name.split(',')[0] : '');
              const distName = addr.city_district || addr.subdistrict || addr.suburb || '';
              const cityName = addr.city || addr.town || addr.county || addr.city_district || '';
              const postCode = addr.postcode || '';

              setStreet(roadName);
              setSubdistrict(distName);
              setCity(cityName);
              setPostalCode(postCode);
            }
          }
        } catch (err) {
          console.warn('Geocoding error:', err);
        } finally {
          setIsGeocoding(false);
        }
      }, 450);
    };

    map.on('movestart', handleMoveStart);
    map.on('moveend', handleMoveEnd);

    // Invalidate size setelah render modal selesai agar tiles tidak blank
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      map.off('movestart', handleMoveStart);
      map.off('moveend', handleMoveEnd);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [isOpen]);

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
        console.warn('Geolocation error:', err);
        if (err.code === 1) {
          setGpsError('Izin akses lokasi ditolak. Aktifkan izin lokasi di pengaturan browser HP Anda.');
        } else {
          setGpsError('Gagal mendeteksi lokasi otomatis. Silakan geser peta secara manual.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validasi No. Rumah / Detail Alamat wajib diisi
    if (!detail.trim()) {
      setDetailError(true);
      return;
    }
    if (!street.trim()) {
      return;
    }

    // Gabungkan menjadi format alamat lengkap yang rapi dan standar
    const parts = [];
    if (street.trim()) parts.push(street.trim());
    if (detail.trim()) parts.push(detail.trim());
    if (subdistrict.trim()) parts.push(`Kec. ${subdistrict.trim()}`);
    if (city.trim()) parts.push(city.trim());
    if (postalCode.trim()) parts.push(postalCode.trim());

    const formattedFullAddress = parts.join(', ');

    const locationData = {
      full_address: formattedFullAddress,
      street: street.trim(),
      detail: detail.trim(),
      subdistrict: subdistrict.trim(),
      city: city.trim(),
      postal_code: postalCode.trim(),
      notes: notes.trim(),
      label: label,
      latitude: coords.latitude,
      longitude: coords.longitude,
      distance_km: distanceKm
    };

    // Simpan ke local storage terstruktur
    try {
      localStorage.setItem('dimsum_delivery_address', locationData.full_address);
      localStorage.setItem('dimsum_delivery_street', locationData.street);
      localStorage.setItem('dimsum_delivery_detail', locationData.detail);
      localStorage.setItem('dimsum_delivery_district', locationData.subdistrict);
      localStorage.setItem('dimsum_delivery_city', locationData.city);
      localStorage.setItem('dimsum_delivery_postal', locationData.postal_code);
      localStorage.setItem('dimsum_delivery_notes', locationData.notes);
      localStorage.setItem('dimsum_delivery_coords', JSON.stringify({
        latitude: locationData.latitude,
        longitude: locationData.longitude
      }));
      localStorage.setItem('dimsum_delivery_label', locationData.label);
    } catch { }

    if (onSave) {
      onSave(locationData);
    }
    onClose();
  };

  if (!isOpen) return null;

  const isFormValid = Boolean(street.trim() && detail.trim());

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="w-full max-w-[480px] bg-white rounded-t-[26px] sm:rounded-[24px] shadow-2xl border border-gray-100 flex flex-col max-h-[92vh] overflow-hidden animate-slide-up">
        {/* Header Modal */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center">
              <MapPin size={18} />
            </div>
            <div>
              <h3 className="font-heading font-black text-[16px] text-text-primary leading-tight">
                Tentukan Titik Antar
              </h3>
              <p className="font-body text-[11px] text-text-secondary">
                Geser peta agar pin tepat di lokasi rumah Anda
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-text-secondary cursor-pointer transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Viewport Peta Interaktif dengan Floating Center Pin */}
        <div className="relative w-full h-[200px] sm:h-[220px] bg-gray-100 shrink-0 select-none overflow-hidden">
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Floating Center Pin ala Shopee / Gojek */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-20 pointer-events-none flex flex-col items-center">
            {/* Animasi pin melompat saat peta digeser */}
            <div
              className={`transition-transform duration-200 ease-out ${
                isMapMoving ? '-translate-y-3.5 scale-110' : 'translate-y-0 scale-100'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-brand-gold text-white flex items-center justify-center shadow-[0_4px_14px_rgba(201,162,61,0.5)] border-2 border-white">
                  <MapPin size={22} className="fill-white text-brand-gold" />
                </div>
                {/* Tooltip kecil penunjuk */}
                <div className="absolute -top-7 bg-text-primary text-white text-[10px] font-body font-bold py-0.5 px-2 rounded-full shadow-md whitespace-nowrap">
                  {isMapMoving ? 'Lepas untuk pilih titik' : 'Lokasi Antar'}
                </div>
              </div>
            </div>

            {/* Bayangan pin di tanah yang membesar/mengecil saat diangkat */}
            <div
              className={`w-3.5 h-1.5 bg-black/25 rounded-full blur-[1.5px] transition-all duration-200 mt-0.5 ${
                isMapMoving ? 'scale-75 opacity-40' : 'scale-100 opacity-90'
              }`}
            />
          </div>

          {/* Tombol GPS: Deteksi Lokasi Saat Ini */}
          <button
            type="button"
            onClick={handleDetectCurrentLocation}
            disabled={isAcquiringGPS}
            className="absolute bottom-3 right-3 z-20 bg-white text-brand-blue hover:bg-gray-50 active:scale-95 transition-transform px-3 py-2 rounded-full shadow-md border border-gray-200/80 flex items-center gap-1.5 text-[11.5px] font-body font-bold cursor-pointer"
          >
            {isAcquiringGPS ? (
              <>
                <Loader2 size={14} className="animate-spin text-brand-blue" />
                <span>Mencari GPS...</span>
              </>
            ) : (
              <>
                <Navigation size={14} className="fill-brand-blue text-brand-blue" />
                <span>📍 Lokasi Saya</span>
              </>
            )}
          </button>

          {/* Badge Jarak ke Outlet - Sesuai Design System (color.info.bg #E8F0F4 + text brand blue) */}
          <div className="absolute bottom-3 left-3 z-20 bg-[#E8F0F4]/95 backdrop-blur-xs text-brand-blue px-2.5 py-1.5 rounded-full shadow-xs border border-brand-blue/20 flex items-center gap-1.5 text-[11px] font-body font-bold">
            <Truck size={13} className="text-brand-blue" />
            <span>~{distanceKm} km dari outlet</span>
          </div>

          {/* Loading Indicator saat Reverse Geocoding */}
          {isGeocoding && (
            <div className="absolute top-3 left-3 z-20 bg-text-primary/80 backdrop-blur-xs text-white px-2.5 py-1 rounded-full text-[10px] font-body flex items-center gap-1.5 shadow-sm">
              <Loader2 size={11} className="animate-spin" />
              <span>Memperbarui nama jalan...</span>
            </div>
          )}
        </div>

        {/* GPS Error Alert */}
        {gpsError && (
          <div className="mx-4 mt-2.5 bg-red-50 border border-brand-red/30 rounded-[12px] p-2.5 flex items-start gap-2 text-brand-red text-[11.5px] font-body">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{gpsError}</span>
          </div>
        )}

        {/* Form Detail Alamat Terstruktur ala Shopee */}
        <form onSubmit={handleSubmit} id="location-picker-form" className="p-4 flex-1 overflow-y-auto space-y-3">
          {/* Pilihan Label Alamat */}
          <div>
            <label className="font-body font-bold text-[12px] text-text-primary block mb-1.5">
              Label Alamat
            </label>
            <div className="flex gap-2">
              {[
                { id: 'Rumah', icon: Home },
                { id: 'Kantor', icon: Briefcase },
                { id: 'Lainnya', icon: Tag }
              ].map((item) => {
                const IconComponent = item.icon;
                const isSelected = label === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLabel(item.id)}
                    className={`flex-1 py-1.5 px-2.5 rounded-[10px] font-body font-bold text-[12px] transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                      isSelected
                        ? 'bg-brand-gold text-white border-brand-gold shadow-xs'
                        : 'bg-gray-50 text-text-secondary border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <IconComponent size={13} />
                    <span>{item.id}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 1. Nama Jalan / Area (dari pin geocoding, editable) */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-body font-bold text-[12px] text-text-primary">
                Nama Jalan / Area <span className="text-brand-red">*</span>
              </label>
              <span className="text-[10px] font-body text-text-secondary">
                Auto-fill dari pin, dapat diedit
              </span>
            </div>
            <input
              type="text"
              required
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder="Nama jalan atau kawasan"
              className="w-full px-3 py-2 rounded-[12px] border border-gray-200 bg-gray-50/60 font-body text-[12.5px] text-text-primary focus:outline-none focus:border-brand-gold focus:bg-white transition-all"
            />
          </div>

          {/* 2. No. Rumah / Gedung / Unit (Wajib diisi manual untuk presisi kurir) */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-body font-bold text-[12px] text-text-primary flex items-center gap-1">
                <span>No. Rumah / Gedung / Unit</span>
                <span className="text-brand-red font-black">*</span>
              </label>
              <span className="text-[10px] font-body font-bold text-brand-red">
                Wajib diisi
              </span>
            </div>
            <div className="relative flex items-center">
              <div className="absolute left-3 text-text-secondary">
                <Hash size={14} />
              </div>
              <input
                type="text"
                required
                value={detail}
                onChange={(e) => {
                  setDetail(e.target.value);
                  if (detailError && e.target.value.trim()) {
                    setDetailError(false);
                  }
                }}
                placeholder="Contoh: No. 12B, RT 02/RW 04, Blok C"
                className={`w-full pl-8.5 pr-3 py-2 rounded-[12px] border font-body text-[12.5px] text-text-primary focus:outline-none focus:bg-white transition-all ${
                  detailError && !detail.trim()
                    ? 'border-brand-red bg-red-50/40 focus:border-brand-red'
                    : 'border-gray-200 bg-gray-50/60 focus:border-brand-gold'
                }`}
              />
            </div>
            {detailError && !detail.trim() ? (
              <p className="text-[11px] font-body text-brand-red mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                <span>Mohon isi nomor rumah/unit agar kurir dapat menemukan lokasi Anda.</span>
              </p>
            ) : (
              <p className="text-[10.5px] font-body text-text-secondary mt-1">
                Wajib diisi manual karena GPS tidak dapat menangkap nomor rumah secara otomatis.
              </p>
            )}
          </div>

          {/* 3. Kecamatan & Kota/Kabupaten (Grid 2 Kolom) */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="font-body font-bold text-[12px] text-text-primary block mb-1">
                Kecamatan
              </label>
              <input
                type="text"
                value={subdistrict}
                onChange={(e) => setSubdistrict(e.target.value)}
                placeholder="Contoh: Pancoran Mas"
                className="w-full px-3 py-2 rounded-[12px] border border-gray-200 bg-gray-50/60 font-body text-[12px] text-text-primary focus:outline-none focus:border-brand-gold focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="font-body font-bold text-[12px] text-text-primary block mb-1">
                Kota / Kabupaten
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Contoh: Depok"
                className="w-full px-3 py-2 rounded-[12px] border border-gray-200 bg-gray-50/60 font-body text-[12px] text-text-primary focus:outline-none focus:border-brand-gold focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* 4. Kode Pos */}
          <div>
            <label className="font-body font-bold text-[12px] text-text-primary block mb-1">
              Kode Pos
            </label>
            <input
              type="text"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="Contoh: 16511"
              maxLength={7}
              className="w-full px-3 py-2 rounded-[12px] border border-gray-200 bg-gray-50/60 font-body text-[12px] text-text-primary focus:outline-none focus:border-brand-gold focus:bg-white transition-all"
            />
          </div>

          {/* 5. Catatan / Patokan Kurir (Opsional) */}
          <div>
            <label className="font-body font-bold text-[12px] text-text-primary block mb-1">
              Patokan / Catatan Kurir <span className="font-normal text-text-secondary">(Opsional)</span>
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3 text-text-secondary">
                <PenLine size={14} />
              </div>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Pagar hitam samping warung Madura, ada bel"
                className="w-full pl-8.5 pr-3 py-2 rounded-[12px] border border-gray-200 bg-gray-50/60 font-body text-[12.5px] text-text-primary focus:outline-none focus:border-brand-gold focus:bg-white transition-all"
              />
            </div>
          </div>
        </form>

        {/* Sticky Action Buttons di Bagian Bawah Modal */}
        <div className="p-4 pt-3 border-t border-gray-100 bg-white shrink-0 flex gap-2.5">
          {/* Secondary Button: Batal dengan border biru & text biru sesuai design system */}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-[12px] border border-brand-blue/30 text-brand-blue font-body font-bold text-[13px] hover:bg-brand-blue/5 active:scale-[0.98] transition-all cursor-pointer text-center"
          >
            Batal
          </button>
          {/* Primary Button: Gunakan Lokasi Ini */}
          <button
            type="submit"
            form="location-picker-form"
            disabled={!isFormValid}
            className="flex-[2] py-2.5 rounded-[12px] bg-brand-gold hover:bg-brand-gold-dark text-white font-body font-bold text-[13px] shadow-sm active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 size={16} />
            <span>Gunakan Lokasi Ini</span>
          </button>
        </div>
      </div>
    </div>
  );
}
