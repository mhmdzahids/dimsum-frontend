import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ArrowLeft,
  Search,
  X,
  MapPin,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  SearchX,
  Building2
} from 'lucide-react';
import { INDONESIA_REGIONS, findRegionCoordinates } from '../data/indonesiaRegions';

/**
 * ProgressiveRegionPickerModal (Alamat Baru)
 * Mekanisme pemilihan wilayah bertahap (Progressive Stepper):
 * Step 0: Pilih Provinsi
 * Step 1: Pilih Kota / Kabupaten
 * Step 2: Pilih Kecamatan
 * Step 3: Pilih Kode Pos
 * 
 * Dilengkapi fitur:
 * - Timeline "Lokasi Terpilih" dengan tombol "Atur Ulang"
 * - Setiap langkah sebelumnya dapat diklik untuk kembali/edit
 * - Search filter real-time di tiap level
 * - Alphabetical grouping index (A, B, C...)
 * - Tombol shortcut "Gunakan Lokasi Saat Ini" (GPS)
 */
export default function RegionWheelPickerModal({
  isOpen,
  onClose,
  onSelect,
  initialProvince = '',
  initialCity = '',
  initialDistrict = '',
  initialPostalCode = ''
}) {
  // Step: 0 = Provinsi, 1 = Kota/Kab, 2 = Kecamatan, 3 = Kode Pos
  const [step, setStep] = useState(0);

  // Selected entities
  const [selectedProv, setSelectedProv] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedPostalCode, setSelectedPostalCode] = useState('');

  // Search query
  const [searchQuery, setSearchQuery] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const searchInputRef = useRef(null);

  // Inisialisasi saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setLocationError('');

      // Jika sudah ada data awal (misal user edit wilayah yang sudah dipilih)
      if (initialProvince) {
        const provObj = INDONESIA_REGIONS.find(
          (p) => p.name.toLowerCase() === initialProvince.toLowerCase()
        );

        if (provObj) {
          setSelectedProv(provObj);
          const cityObj = provObj.cities.find(
            (c) => c.name.toLowerCase() === (initialCity || '').toLowerCase()
          );

          if (cityObj) {
            setSelectedCity(cityObj);
            const distObj = cityObj.districts.find(
              (d) => d.name.toLowerCase() === (initialDistrict || '').toLowerCase()
            );

            if (distObj) {
              setSelectedDistrict(distObj);
              setSelectedPostalCode(initialPostalCode || distObj.postcodes?.[0] || '');
              setStep(3); // Langsung ke step kode pos atau buka di summary
              return;
            }
            setStep(2);
            return;
          }
          setStep(1);
          return;
        }
      }

      // Default: mulai dari step 0 (Provinsi)
      setStep(0);
      setSelectedProv(null);
      setSelectedCity(null);
      setSelectedDistrict(null);
      setSelectedPostalCode('');
    }
  }, [isOpen, initialProvince, initialCity, initialDistrict, initialPostalCode]);

  // List data aktif berdasarkan step saat ini
  const activeItems = useMemo(() => {
    if (step === 0) {
      return INDONESIA_REGIONS.map((p) => ({
        id: p.name,
        name: p.name,
        raw: p
      }));
    }

    if (step === 1) {
      return (selectedProv?.cities || []).map((c) => ({
        id: c.name,
        name: c.name,
        raw: c
      }));
    }

    if (step === 2) {
      return (selectedCity?.districts || []).map((d) => ({
        id: d.name,
        name: d.name,
        raw: d
      }));
    }

    if (step === 3) {
      return (selectedDistrict?.postcodes || []).map((pc) => ({
        id: pc,
        name: pc,
        raw: pc
      }));
    }

    return [];
  }, [step, selectedProv, selectedCity, selectedDistrict]);

  // Filter pencarian
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return activeItems;
    return activeItems.filter((item) => item.name.toLowerCase().includes(q));
  }, [activeItems, searchQuery]);

  // Grouping alphabet (A, B, C...) saat tidak mencari
  const alphabetGroups = useMemo(() => {
    if (step === 3) {
      // Untuk kode pos, tampilkan flat tanpa huruf abjad
      return [{ letter: '#', items: filteredItems }];
    }

    // Urutkan alfabetis
    const sorted = [...filteredItems].sort((a, b) => a.name.localeCompare(b.name, 'id'));

    const groups = {};
    sorted.forEach((item) => {
      // Ambil huruf pertama
      const cleanName = item.name.replace(/^Kab\.\s*|^Kota\s*/i, '').trim();
      const firstChar = (cleanName[0] || item.name[0] || '').toUpperCase();
      const letter = /[A-Z]/.test(firstChar) ? firstChar : '#';

      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(item);
    });

    return Object.keys(groups)
      .sort()
      .map((letter) => ({
        letter,
        items: groups[letter]
      }));
  }, [filteredItems, step]);

  // Reset semua pilihan kembali ke step 0 (Provinsi)
  const handleReset = () => {
    setStep(0);
    setSelectedProv(null);
    setSelectedCity(null);
    setSelectedDistrict(null);
    setSelectedPostalCode('');
    setSearchQuery('');
  };

  // Navigasi tombol back di header
  const handleBack = () => {
    if (step > 0) {
      setStep((s) => s - 1);
      setSearchQuery('');
    } else {
      onClose();
    }
  };

  // Pilih item pada step aktif
  const handleItemClick = (item) => {
    setSearchQuery('');

    if (step === 0) {
      setSelectedProv(item.raw);
      setSelectedCity(null);
      setSelectedDistrict(null);
      setSelectedPostalCode('');
      setStep(1);
    } else if (step === 1) {
      setSelectedCity(item.raw);
      setSelectedDistrict(null);
      setSelectedPostalCode('');
      setStep(2);
    } else if (step === 2) {
      setSelectedDistrict(item.raw);
      setSelectedPostalCode('');
      setStep(3);
    } else if (step === 3) {
      const pc = item.name;
      setSelectedPostalCode(pc);

      // Selesai -> kirim data ke parent
      const coords = findRegionCoordinates(
        selectedProv?.name,
        selectedCity?.name,
        selectedDistrict?.name
      );

      if (onSelect) {
        onSelect({
          province: selectedProv?.name || '',
          city: selectedCity?.name || '',
          district: selectedDistrict?.name || '',
          postalCode: pc,
          coordinates: coords
        });
      }
      onClose();
    }
  };

  // Deteksi lokasi saat ini via GPS
  const handleDetectLocation = () => {
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError('Perangkat tidak mendukung geolokasi');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          // Reverse geocoding via OpenStreetMap Nominatim
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=id`,
            { headers: { 'User-Agent': 'DimsumFrozenApp/1.0' } }
          );

          if (!res.ok) throw new Error('Gagal mendeteksi wilayah');
          const data = await res.json();
          const addr = data.address || {};

          // Ekstrak nama provinsi, kota/kab, kecamatan
          const rawProv = addr.state || addr.province || '';
          const rawCity = addr.city || addr.town || addr.county || addr.city_district || '';
          const rawDist = addr.suburb || addr.municipality || addr.village || '';
          const rawPc = addr.postcode || '';

          // Cari kesesuaian di dataset kita
          let matchedProv = INDONESIA_REGIONS.find((p) =>
            p.name.toLowerCase().includes(rawProv.toLowerCase()) ||
            rawProv.toLowerCase().includes(p.name.toLowerCase())
          );

          // Fallback ke Jawa Barat jika sekitar Jabodetabek
          if (!matchedProv && (rawCity.toLowerCase().includes('bekasi') || rawCity.toLowerCase().includes('jakarta'))) {
            matchedProv = INDONESIA_REGIONS.find((p) => p.name === 'Jawa Barat') || INDONESIA_REGIONS[0];
          }

          if (matchedProv) {
            setSelectedProv(matchedProv);
            const matchedCity = matchedProv.cities.find((c) =>
              c.name.toLowerCase().includes(rawCity.toLowerCase()) ||
              rawCity.toLowerCase().includes(c.name.toLowerCase().replace(/^(kota|kab\.)\s*/i, ''))
            ) || matchedProv.cities[0];

            if (matchedCity) {
              setSelectedCity(matchedCity);
              const matchedDist = matchedCity.districts.find((d) =>
                d.name.toLowerCase().includes(rawDist.toLowerCase()) ||
                rawDist.toLowerCase().includes(d.name.toLowerCase())
              ) || matchedCity.districts[0];

              if (matchedDist) {
                setSelectedDistrict(matchedDist);
                const pc = matchedDist.postcodes.includes(rawPc) ? rawPc : matchedDist.postcodes[0];
                setSelectedPostalCode(pc);

                // Langsung selesaikan dengan koordinat GPS nyata
                if (onSelect) {
                  onSelect({
                    province: matchedProv.name,
                    city: matchedCity.name,
                    district: matchedDist.name,
                    postalCode: pc,
                    coordinates: { latitude, longitude }
                  });
                }
                setIsLocating(false);
                onClose();
                return;
              }
            }
          }

          setIsLocating(false);
          setLocationError('Lokasi terdeteksi di luar jangkauan wilayah kami');
        } catch (err) {
          setIsLocating(false);
          setLocationError('Gagal membaca detail alamat dari GPS');
        }
      },
      (err) => {
        setIsLocating(false);
        setLocationError('Izin akses lokasi ditolak oleh browser');
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  if (!isOpen) return null;

  // Judul section aktif
  const sectionTitle =
    step === 0
      ? 'Provinsi'
      : step === 1
      ? 'Kota / Kabupaten'
      : step === 2
      ? 'Kecamatan'
      : 'Kode Pos';

  return (
    <div className="fixed inset-0 z-[150] flex flex-col justify-end md:justify-center items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs animate-fade-in"
        onClick={onClose}
      />

      {/* Modal / Bottom Sheet */}
      <div className="relative bg-white w-full max-w-[480px] h-[92vh] max-h-[720px] rounded-t-[28px] md:rounded-[28px] shadow-2xl flex flex-col overflow-hidden animate-slide-up z-10">
        {/* 1. Header: Back + Search Bar + Close */}
        <div className="p-3.5 border-b border-gray-100 flex items-center gap-2.5 bg-white shrink-0">
          <button
            type="button"
            onClick={handleBack}
            className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-text-primary cursor-pointer transition-colors shrink-0"
            title={step > 0 ? 'Kembali ke tahap sebelumnya' : 'Tutup'}
          >
            <ArrowLeft size={20} strokeWidth={2.2} className="text-text-primary" />
          </button>

          {/* Search Bar */}
          <div className="flex-1 relative bg-gray-100/90 rounded-[12px] flex items-center px-3 py-2 border border-transparent focus-within:border-brand-gold/60 focus-within:bg-white focus-within:shadow-xs transition-all">
            <Search size={16} className="text-gray-400 shrink-0 mr-2" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari Kota, Kecamatan, atau Kode Pos"
              className="w-full bg-transparent font-body text-[13px] text-text-primary placeholder:text-gray-400 outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="w-5 h-5 rounded-full bg-gray-300 hover:bg-gray-400 flex items-center justify-center text-white shrink-0 ml-1 cursor-pointer transition-colors"
              >
                <X size={12} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>

        {/* 2. Shortcut: Gunakan Lokasi Saat Ini (Hanya tampil jika step 0 dan tidak sedang search) */}
        {step === 0 && !searchQuery && (
          <div className="p-3.5 pb-2 shrink-0 bg-white">
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={isLocating}
              className="w-full py-2.5 px-4 bg-white border border-gray-200 hover:border-brand-gold/50 rounded-[14px] shadow-xs flex items-center justify-center gap-2 text-text-primary font-body font-bold text-[13px] transition-all active:scale-[0.99] cursor-pointer disabled:opacity-60"
            >
              <MapPin size={16} className="text-red-500 shrink-0" />
              <span>{isLocating ? 'Mendeteksi Lokasi GPS...' : 'Gunakan Lokasi Saat Ini'}</span>
            </button>
            {locationError && (
              <p className="text-[11px] font-body text-red-500 mt-1.5 text-center font-medium">
                {locationError}
              </p>
            )}
          </div>
        )}

        {/* 3. Section "Lokasi Terpilih" (Timeline Stepper) - Muncul jika sudah ada step yang terpilih */}
        {selectedProv && (
          <div className="px-4.5 py-3 border-b border-gray-100 bg-white shrink-0">
            {/* Title + Atur Ulang */}
            <div className="flex items-center justify-between mb-2">
              <span className="font-body text-[12px] text-text-secondary font-medium">
                Lokasi Terpilih
              </span>
              <button
                type="button"
                onClick={handleReset}
                className="font-body font-bold text-[12px] text-brand-gold hover:text-brand-gold-dark cursor-pointer transition-colors flex items-center gap-1"
              >
                <RotateCcw size={12} strokeWidth={2.2} />
                <span>Atur Ulang</span>
              </button>
            </div>

            {/* Stepper Timeline */}
            <div className="space-y-1 relative pl-1">
              {/* Step 0: Provinsi */}
              <div className="flex items-start gap-2.5 relative">
                {/* Connector Line */}
                <div className="flex flex-col items-center shrink-0 w-3.5 pt-1.5">
                  <div className="w-2 h-2 rounded-full bg-gray-300" />
                  <div className="w-[1.5px] h-5 bg-gray-200 my-0.5" />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep(0);
                    setSearchQuery('');
                  }}
                  className="font-body font-bold text-[13px] text-text-primary hover:text-brand-gold transition-colors pt-0.5 cursor-pointer uppercase text-left tracking-wide"
                  title="Klik untuk ubah provinsi"
                >
                  {selectedProv.name}
                </button>
              </div>

              {/* Step 1: Kota */}
              <div className="flex items-start gap-2.5 relative">
                {/* Connector Line */}
                <div className="flex flex-col items-center shrink-0 w-3.5 pt-1.5">
                  {step === 1 ? (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-brand-gold bg-white flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-gold" />
                    </div>
                  ) : (
                    <>
                      <div className="w-2 h-2 rounded-full bg-gray-300" />
                      <div className="w-[1.5px] h-5 bg-gray-200 my-0.5" />
                    </>
                  )}
                </div>

                {step === 1 ? (
                  <div className="border border-brand-gold/40 bg-brand-gold/5 text-brand-gold font-body font-bold text-[12.5px] px-3 py-1 rounded-[8px] flex items-center gap-1.5 shadow-2xs">
                    <span>Pilih Kota</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setSearchQuery('');
                    }}
                    className="font-body font-bold text-[13px] text-text-primary hover:text-brand-gold transition-colors pt-0.5 cursor-pointer uppercase text-left tracking-wide"
                    title="Klik untuk ubah kota"
                  >
                    {selectedCity?.name || 'Pilih Kota'}
                  </button>
                )}
              </div>

              {/* Step 2: Kecamatan (Muncul jika step >= 2 atau sudah pilih kota) */}
              {(step >= 2 || selectedDistrict) && (
                <div className="flex items-start gap-2.5 relative">
                  {/* Connector Line */}
                  <div className="flex flex-col items-center shrink-0 w-3.5 pt-1.5">
                    {step === 2 ? (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-brand-gold bg-white flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-gold" />
                      </div>
                    ) : (
                      <>
                        <div className="w-2 h-2 rounded-full bg-gray-300" />
                        <div className="w-[1.5px] h-5 bg-gray-200 my-0.5" />
                      </>
                    )}
                  </div>

                  {step === 2 ? (
                    <div className="border border-brand-gold/40 bg-brand-gold/5 text-brand-gold font-body font-bold text-[12.5px] px-3 py-1 rounded-[8px] flex items-center gap-1.5 shadow-2xs">
                      <span>Pilih Kecamatan</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setStep(2);
                        setSearchQuery('');
                      }}
                      className="font-body font-bold text-[13px] text-text-primary hover:text-brand-gold transition-colors pt-0.5 cursor-pointer uppercase text-left tracking-wide"
                      title="Klik untuk ubah kecamatan"
                    >
                      {selectedDistrict?.name || 'Pilih Kecamatan'}
                    </button>
                  )}
                </div>
              )}

              {/* Step 3: Kode Pos (Muncul jika step === 3) */}
              {step === 3 && (
                <div className="flex items-start gap-2.5 relative">
                  <div className="flex flex-col items-center shrink-0 w-3.5 pt-1.5">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-brand-gold bg-white flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-gold" />
                    </div>
                  </div>
                  <div className="border border-brand-gold/40 bg-brand-gold/5 text-brand-gold font-body font-bold text-[12.5px] px-3 py-1 rounded-[8px] flex items-center gap-1.5 shadow-2xs">
                    <span>Pilih Kode Pos</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. Active List Section Title */}
        <div className="px-4 py-2.5 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between shrink-0">
          <span className="font-body font-bold text-[12.5px] text-text-secondary">
            {sectionTitle}
          </span>
          <span className="font-body text-[11px] text-text-secondary">
            {filteredItems.length} pilihan
          </span>
        </div>

        {/* 5. Scrollable Active List with Alphabet Grouping */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 bg-white">
          {alphabetGroups.length > 0 ? (
            alphabetGroups.map((group) => (
              <div key={group.letter} className="relative">
                {/* Alphabet Header / Group Container */}
                {group.items.map((item, idx) => {
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className="flex items-center px-4 py-3.5 hover:bg-brand-gold/5 active:bg-brand-gold/10 cursor-pointer transition-colors group"
                    >
                      {/* Alphabet Letter Column (Hanya muncul di item pertama grup) */}
                      <div className="w-7 font-body font-bold text-[13px] text-gray-400 shrink-0 select-none">
                        {idx === 0 && group.letter !== '#' ? group.letter : ''}
                      </div>

                      {/* Item Name */}
                      <div className="flex-1 font-body font-bold text-[13.5px] text-text-primary uppercase tracking-wide group-hover:text-brand-gold transition-colors">
                        {item.name}
                      </div>

                      {/* Right Chevron Arrow */}
                      <ChevronRight
                        size={15}
                        className="text-gray-300 group-hover:text-brand-gold group-hover:translate-x-0.5 transition-all shrink-0"
                      />
                    </div>
                  );
                })}
              </div>
            ))
          ) : (
            /* Empty Search State */
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-text-secondary mb-3">
                <SearchX size={24} />
              </div>
              <h4 className="font-heading font-bold text-[14px] text-text-primary mb-1">
                Tidak ada hasil ditemukan
              </h4>
              <p className="font-body text-[12px] text-text-secondary max-w-[220px]">
                Coba periksa kembali ejaan atau gunakan kata kunci lain.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
