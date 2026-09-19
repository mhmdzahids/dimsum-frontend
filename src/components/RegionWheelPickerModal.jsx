import React, { useState, useEffect, useMemo } from 'react';
import { X, CheckCircle2, MapPin, ChevronRight } from 'lucide-react';
import { INDONESIA_REGIONS, findRegionCoordinates } from '../data/indonesiaRegions';

export default function RegionWheelPickerModal({
  isOpen,
  onClose,
  onSelect,
  initialProvince = '',
  initialCity = '',
  initialDistrict = '',
  initialPostalCode = ''
}) {
  // Available provinces
  const provinces = useMemo(() => INDONESIA_REGIONS, []);

  // Selected states
  const [selectedProvName, setSelectedProvName] = useState(() => {
    return initialProvince || provinces[0]?.name || '';
  });

  // Current province object
  const currentProvince = useMemo(() => {
    return provinces.find((p) => p.name === selectedProvName) || provinces[0];
  }, [provinces, selectedProvName]);

  // Available cities in selected province
  const cities = useMemo(() => {
    return currentProvince?.cities || [];
  }, [currentProvince]);

  const [selectedCityName, setSelectedCityName] = useState(() => {
    return initialCity || cities[0]?.name || '';
  });

  // Current city object
  const currentCity = useMemo(() => {
    return cities.find((c) => c.name === selectedCityName) || cities[0];
  }, [cities, selectedCityName]);

  // Available districts in selected city
  const districts = useMemo(() => {
    return currentCity?.districts || [];
  }, [currentCity]);

  const [selectedDistrictName, setSelectedDistrictName] = useState(() => {
    return initialDistrict || districts[0]?.name || '';
  });

  // Current district object
  const currentDistrict = useMemo(() => {
    return districts.find((d) => d.name === selectedDistrictName) || districts[0];
  }, [districts, selectedDistrictName]);

  // Available postcodes in selected district
  const postcodes = useMemo(() => {
    return currentDistrict?.postcodes || [];
  }, [currentDistrict]);

  const [selectedPostalCode, setSelectedPostalCode] = useState(() => {
    return initialPostalCode || postcodes[0] || '';
  });

  // Sync when modal opens with initial values
  useEffect(() => {
    if (isOpen) {
      const pName = initialProvince || provinces[0]?.name || '';
      setSelectedProvName(pName);

      const pObj = provinces.find((p) => p.name === pName) || provinces[0];
      const cList = pObj?.cities || [];
      const cName = (cList.some((c) => c.name === initialCity) ? initialCity : cList[0]?.name) || '';
      setSelectedCityName(cName);

      const cObj = cList.find((c) => c.name === cName) || cList[0];
      const dList = cObj?.districts || [];
      const dName = (dList.some((d) => d.name === initialDistrict) ? initialDistrict : dList[0]?.name) || '';
      setSelectedDistrictName(dName);

      const dObj = dList.find((d) => d.name === dName) || dList[0];
      const pcList = dObj?.postcodes || [];
      const pc = (pcList.includes(initialPostalCode) ? initialPostalCode : pcList[0]) || '';
      setSelectedPostalCode(pc);
    }
  }, [isOpen, initialProvince, initialCity, initialDistrict, initialPostalCode, provinces]);

  // Handlers for cascading selections
  const handleSelectProvince = (provName) => {
    setSelectedProvName(provName);
    const pObj = provinces.find((p) => p.name === provName);
    const firstCity = pObj?.cities[0];
    const firstCityName = firstCity?.name || '';
    setSelectedCityName(firstCityName);

    const firstDistrict = firstCity?.districts[0];
    const firstDistrictName = firstDistrict?.name || '';
    setSelectedDistrictName(firstDistrictName);

    const firstPc = firstDistrict?.postcodes[0] || '';
    setSelectedPostalCode(firstPc);
  };

  const handleSelectCity = (cityName) => {
    setSelectedCityName(cityName);
    const cObj = cities.find((c) => c.name === cityName);
    const firstDistrict = cObj?.districts[0];
    const firstDistrictName = firstDistrict?.name || '';
    setSelectedDistrictName(firstDistrictName);

    const firstPc = firstDistrict?.postcodes[0] || '';
    setSelectedPostalCode(firstPc);
  };

  const handleSelectDistrict = (districtName) => {
    setSelectedDistrictName(districtName);
    const dObj = districts.find((d) => d.name === districtName);
    const firstPc = dObj?.postcodes[0] || '';
    setSelectedPostalCode(firstPc);
  };

  const handleConfirm = () => {
    const coords = findRegionCoordinates(selectedProvName, selectedCityName, selectedDistrictName);
    if (onSelect) {
      onSelect({
        province: selectedProvName,
        city: selectedCityName,
        district: selectedDistrictName,
        postalCode: selectedPostalCode,
        coordinates: coords
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs animate-fade-in"
        onClick={onClose}
      />

      {/* Bottom Sheet Card */}
      <div className="relative bg-white w-full max-w-[480px] mx-auto rounded-t-[26px] shadow-2xl flex flex-col overflow-hidden animate-slide-up z-10 max-h-[85vh]">
        {/* Header */}
        <div className="p-4.5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-gold/15 text-brand-gold-dark flex items-center justify-center">
              <MapPin size={16} />
            </div>
            <div>
              <h3 className="font-heading font-black text-[16px] text-text-primary leading-tight">
                Pilih Wilayah Pengiriman
              </h3>
              <p className="font-body text-[11px] text-text-secondary">
                Pilih kombinasi Provinsi, Kota, Kecamatan & Kode Pos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-text-secondary cursor-pointer transition-colors"
          >
            <X size={16} strokeWidth={2.2} />
          </button>
        </div>

        {/* Selected Summary Breadcrumb */}
        <div className="bg-[#E8F0F4]/70 border-b border-brand-blue/15 px-4 py-2 flex items-center gap-1.5 text-[11.5px] font-body text-brand-blue overflow-x-auto hide-scrollbar shrink-0">
          <span className="font-bold shrink-0">{selectedProvName}</span>
          <ChevronRight size={13} className="shrink-0 opacity-60" />
          <span className="font-bold shrink-0">{selectedCityName}</span>
          <ChevronRight size={13} className="shrink-0 opacity-60" />
          <span className="font-bold shrink-0">{selectedDistrictName}</span>
          {selectedPostalCode && (
            <>
              <ChevronRight size={13} className="shrink-0 opacity-60" />
              <span className="bg-brand-blue text-white px-1.5 py-0.2 rounded font-bold text-[10px] shrink-0">
                {selectedPostalCode}
              </span>
            </>
          )}
        </div>

        {/* Multi-Column Revolving Lock / Drum Wheel Picker */}
        <div className="flex flex-1 h-[270px] overflow-hidden bg-gray-50/40 relative">
          {/* 1. Kolom Provinsi */}
          <div className="flex-1 flex flex-col border-r border-gray-200/60 overflow-hidden">
            <div className="py-1.5 px-2 bg-gray-100/90 text-center font-body font-bold text-[10.5px] text-text-secondary uppercase tracking-wider shrink-0 border-b border-gray-200/60">
              Provinsi
            </div>
            <div className="flex-1 overflow-y-auto hide-scrollbar p-1.5 space-y-1">
              {provinces.map((prov) => {
                const isSelected = prov.name === selectedProvName;
                return (
                  <button
                    key={prov.name}
                    type="button"
                    onClick={() => handleSelectProvince(prov.name)}
                    className={`w-full py-2 px-1.5 text-center rounded-[8px] font-body text-[11.5px] transition-all cursor-pointer truncate block ${
                      isSelected
                        ? 'bg-brand-gold text-white font-bold shadow-xs'
                        : 'text-text-primary hover:bg-gray-100 font-medium'
                    }`}
                  >
                    {prov.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Kolom Kota / Kabupaten */}
          <div className="flex-1 flex flex-col border-r border-gray-200/60 overflow-hidden">
            <div className="py-1.5 px-2 bg-gray-100/90 text-center font-body font-bold text-[10.5px] text-text-secondary uppercase tracking-wider shrink-0 border-b border-gray-200/60">
              Kota/Kab
            </div>
            <div className="flex-1 overflow-y-auto hide-scrollbar p-1.5 space-y-1">
              {cities.map((city) => {
                const isSelected = city.name === selectedCityName;
                return (
                  <button
                    key={city.name}
                    type="button"
                    onClick={() => handleSelectCity(city.name)}
                    className={`w-full py-2 px-1.5 text-center rounded-[8px] font-body text-[11.5px] transition-all cursor-pointer truncate block ${
                      isSelected
                        ? 'bg-brand-gold text-white font-bold shadow-xs'
                        : 'text-text-primary hover:bg-gray-100 font-medium'
                    }`}
                  >
                    {city.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Kolom Kecamatan */}
          <div className="flex-1 flex flex-col border-r border-gray-200/60 overflow-hidden">
            <div className="py-1.5 px-2 bg-gray-100/90 text-center font-body font-bold text-[10.5px] text-text-secondary uppercase tracking-wider shrink-0 border-b border-gray-200/60">
              Kecamatan
            </div>
            <div className="flex-1 overflow-y-auto hide-scrollbar p-1.5 space-y-1">
              {districts.map((dist) => {
                const isSelected = dist.name === selectedDistrictName;
                return (
                  <button
                    key={dist.name}
                    type="button"
                    onClick={() => handleSelectDistrict(dist.name)}
                    className={`w-full py-2 px-1.5 text-center rounded-[8px] font-body text-[11.5px] transition-all cursor-pointer truncate block ${
                      isSelected
                        ? 'bg-brand-gold text-white font-bold shadow-xs'
                        : 'text-text-primary hover:bg-gray-100 font-medium'
                    }`}
                  >
                    {dist.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Kolom Kode Pos */}
          <div className="w-[84px] flex flex-col overflow-hidden shrink-0">
            <div className="py-1.5 px-2 bg-gray-100/90 text-center font-body font-bold text-[10.5px] text-text-secondary uppercase tracking-wider shrink-0 border-b border-gray-200/60">
              Kode Pos
            </div>
            <div className="flex-1 overflow-y-auto hide-scrollbar p-1.5 space-y-1">
              {postcodes.map((pc) => {
                const isSelected = pc === selectedPostalCode;
                return (
                  <button
                    key={pc}
                    type="button"
                    onClick={() => setSelectedPostalCode(pc)}
                    className={`w-full py-2 px-1 text-center rounded-[8px] font-body text-[11.5px] transition-all cursor-pointer block ${
                      isSelected
                        ? 'bg-brand-gold text-white font-bold shadow-xs'
                        : 'text-text-primary hover:bg-gray-100 font-medium'
                    }`}
                  >
                    {pc}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 pt-3 border-t border-gray-100 bg-white shrink-0 flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-[12px] border border-brand-blue/30 text-brand-blue font-body font-bold text-[13px] hover:bg-brand-blue/5 active:scale-[0.98] transition-all cursor-pointer text-center"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-[2] py-2.5 rounded-[12px] bg-brand-gold hover:bg-brand-gold-dark text-white font-body font-bold text-[13px] shadow-sm active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 size={16} />
            <span>Pilih Wilayah Ini</span>
          </button>
        </div>
      </div>
    </div>
  );
}
