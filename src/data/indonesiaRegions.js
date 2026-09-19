// Dataset Wilayah Indonesia terstruktur (Provinsi -> Kota/Kabupaten -> Kecamatan -> Kode Pos)
// Dilengkapi koordinat centroid (lat, lng) untuk auto-center peta saat wilayah dipilih

export const INDONESIA_REGIONS = [
  {
    name: 'Jawa Barat',
    cities: [
      {
        name: 'Kota Bekasi',
        lat: -6.2383,
        lng: 106.9756,
        districts: [
          { name: 'Bekasi Timur', lat: -6.2503, lng: 106.9782, postcodes: ['17111', '17112', '17113'] },
          { name: 'Bekasi Barat', lat: -6.2361, lng: 106.9825, postcodes: ['17144', '17145'] },
          { name: 'Bekasi Selatan', lat: -6.2555, lng: 106.9928, postcodes: ['17148', '17149'] },
          { name: 'Bekasi Utara', lat: -6.2167, lng: 107.0019, postcodes: ['17121', '17122'] },
          { name: 'Rawalumbu', lat: -6.2719, lng: 106.9972, postcodes: ['17114', '17115'] },
          { name: 'Mustika Jaya', lat: -6.2941, lng: 107.0211, postcodes: ['17158', '17159'] },
          { name: 'Pondok Gede', lat: -6.2872, lng: 106.9158, postcodes: ['17411', '17412'] },
          { name: 'Jatiasih', lat: -6.2986, lng: 106.9625, postcodes: ['17421', '17422'] },
          { name: 'Medan Satria', lat: -6.2081, lng: 106.9739, postcodes: ['17131', '17132'] },
          { name: 'Bantar Gebang', lat: -6.3214, lng: 106.9922, postcodes: ['17151', '17152'] }
        ]
      },
      {
        name: 'Kab. Bekasi',
        lat: -6.2416,
        lng: 107.1265,
        districts: [
          { name: 'Tambun Selatan', lat: -6.2625, lng: 107.0583, postcodes: ['17510', '17511'] },
          { name: 'Tambun Utara', lat: -6.2083, lng: 107.0667, postcodes: ['17512'] },
          { name: 'Cibitung', lat: -6.2542, lng: 107.0917, postcodes: ['17520'] },
          { name: 'Cikarang Barat', lat: -6.2708, lng: 107.1250, postcodes: ['17530'] },
          { name: 'Cikarang Utara', lat: -6.2611, lng: 107.1694, postcodes: ['17534'] },
          { name: 'Cikarang Selatan', lat: -6.3292, lng: 107.1375, postcodes: ['17550'] },
          { name: 'Tarumajaya', lat: -6.1500, lng: 106.9833, postcodes: ['17211'] }
        ]
      },
      {
        name: 'Kota Depok',
        lat: -6.4025,
        lng: 106.7942,
        districts: [
          { name: 'Pancoran Mas', lat: -6.3986, lng: 106.8167, postcodes: ['16436', '16437'] },
          { name: 'Sukmajaya', lat: -6.4083, lng: 106.8417, postcodes: ['16412', '16413'] },
          { name: 'Beji', lat: -6.3683, lng: 106.8167, postcodes: ['16421', '16422'] },
          { name: 'Cimanggis', lat: -6.3639, lng: 106.8694, postcodes: ['16451', '16452'] },
          { name: 'Cinere', lat: -6.3333, lng: 106.7833, postcodes: ['16514'] },
          { name: 'Sawangan', lat: -6.4167, lng: 106.7583, postcodes: ['16511', '16512'] },
          { name: 'Tapos', lat: -6.4333, lng: 106.8833, postcodes: ['16457'] }
        ]
      },
      {
        name: 'Kota Bogor',
        lat: -6.5971,
        lng: 106.8060,
        districts: [
          { name: 'Bogor Timur', lat: -6.6083, lng: 106.8167, postcodes: ['16141', '16142'] },
          { name: 'Bogor Tengah', lat: -6.5944, lng: 106.7972, postcodes: ['16121', '16122'] },
          { name: 'Bogor Selatan', lat: -6.6333, lng: 106.8083, postcodes: ['16131'] },
          { name: 'Bogor Utara', lat: -6.5667, lng: 106.8167, postcodes: ['16151'] },
          { name: 'Bogor Barat', lat: -6.5833, lng: 106.7667, postcodes: ['16111'] }
        ]
      },
      {
        name: 'Kab. Bogor',
        lat: -6.4833,
        lng: 106.8333,
        districts: [
          { name: 'Cibinong', lat: -6.4833, lng: 106.8500, postcodes: ['16911', '16912'] },
          { name: 'Bojonggede', lat: -6.4917, lng: 106.7917, postcodes: ['16922'] },
          { name: 'Citeureup', lat: -6.4917, lng: 106.8833, postcodes: ['16810'] },
          { name: 'Gunung Putri', lat: -6.4333, lng: 106.9167, postcodes: ['16961'] },
          { name: 'Cileungsi', lat: -6.4000, lng: 106.9500, postcodes: ['16820'] }
        ]
      },
      {
        name: 'Kota Bandung',
        lat: -6.9175,
        lng: 107.6191,
        districts: [
          { name: 'Coblong', lat: -6.8833, lng: 107.6167, postcodes: ['40131', '40132'] },
          { name: 'Sukajadi', lat: -6.8833, lng: 107.5833, postcodes: ['40161'] },
          { name: 'Sumur Bandung', lat: -6.9167, lng: 107.6167, postcodes: ['40111'] },
          { name: 'Lengkong', lat: -6.9333, lng: 107.6250, postcodes: ['40261'] },
          { name: 'Cicendo', lat: -6.9000, lng: 107.5917, postcodes: ['40171'] }
        ]
      }
    ]
  },
  {
    name: 'DKI Jakarta',
    cities: [
      {
        name: 'Jakarta Timur',
        lat: -6.2250,
        lng: 106.9004,
        districts: [
          { name: 'Duren Sawit', lat: -6.2347, lng: 106.9189, postcodes: ['13440', '13450'] },
          { name: 'Jatinegara', lat: -6.2294, lng: 106.8778, postcodes: ['13310', '13320'] },
          { name: 'Pulo Gadung', lat: -6.1953, lng: 106.8967, postcodes: ['13210', '13220'] },
          { name: 'Kramat Jati', lat: -6.2736, lng: 106.8672, postcodes: ['13510', '13520'] },
          { name: 'Cakung', lat: -6.1833, lng: 106.9500, postcodes: ['13910', '13920'] },
          { name: 'Ciracas', lat: -6.3283, lng: 106.8753, postcodes: ['13740', '13750'] },
          { name: 'Pasar Rebo', lat: -6.3211, lng: 106.8611, postcodes: ['13760', '13770'] },
          { name: 'Makasar', lat: -6.2750, lng: 106.8917, postcodes: ['13570'] }
        ]
      },
      {
        name: 'Jakarta Selatan',
        lat: -6.2615,
        lng: 106.8106,
        districts: [
          { name: 'Tebet', lat: -6.2306, lng: 106.8528, postcodes: ['12810', '12820'] },
          { name: 'Kebayoran Baru', lat: -6.2417, lng: 106.7972, postcodes: ['12110', '12120'] },
          { name: 'Kebayoran Lama', lat: -6.2500, lng: 106.7750, postcodes: ['12210', '12220'] },
          { name: 'Cilandak', lat: -6.2917, lng: 106.8000, postcodes: ['12410', '12420'] },
          { name: 'Pasar Minggu', lat: -6.2833, lng: 106.8333, postcodes: ['12510', '12520'] },
          { name: 'Mampang Prapatan', lat: -6.2500, lng: 106.8250, postcodes: ['12710'] },
          { name: 'Pancoran', lat: -6.2500, lng: 106.8417, postcodes: ['12780'] },
          { name: 'Jagakarsa', lat: -6.3333, lng: 106.8250, postcodes: ['12610', '12620'] }
        ]
      },
      {
        name: 'Jakarta Pusat',
        lat: -6.1805,
        lng: 106.8284,
        districts: [
          { name: 'Menteng', lat: -6.1950, lng: 106.8333, postcodes: ['10310', '10320'] },
          { name: 'Tanah Abang', lat: -6.1917, lng: 106.8167, postcodes: ['10210', '10220'] },
          { name: 'Senen', lat: -6.1833, lng: 106.8417, postcodes: ['10410'] },
          { name: 'Cempaka Putih', lat: -6.1833, lng: 106.8667, postcodes: ['10510'] },
          { name: 'Kemayoran', lat: -6.1583, lng: 106.8500, postcodes: ['10610'] }
        ]
      },
      {
        name: 'Jakarta Barat',
        lat: -6.1683,
        lng: 106.7589,
        districts: [
          { name: 'Grogol Petamburan', lat: -6.1667, lng: 106.7833, postcodes: ['11440', '11450'] },
          { name: 'Kebon Jeruk', lat: -6.1917, lng: 106.7667, postcodes: ['11510', '11520'] },
          { name: 'Palmerah', lat: -6.1917, lng: 106.7917, postcodes: ['11480'] },
          { name: 'Kembangan', lat: -6.1833, lng: 106.7333, postcodes: ['11610'] }
        ]
      },
      {
        name: 'Jakarta Utara',
        lat: -6.1384,
        lng: 106.8640,
        districts: [
          { name: 'Kelapa Gading', lat: -6.1583, lng: 106.9083, postcodes: ['14240', '14250'] },
          { name: 'Tanjung Priok', lat: -6.1250, lng: 106.8833, postcodes: ['14310'] },
          { name: 'Penjaringan', lat: -6.1250, lng: 106.7833, postcodes: ['14440'] }
        ]
      }
    ]
  },
  {
    name: 'Banten',
    cities: [
      {
        name: 'Kota Tangerang',
        lat: -6.1783,
        lng: 106.6319,
        districts: [
          { name: 'Tangerang', lat: -6.1750, lng: 106.6333, postcodes: ['15111', '15112'] },
          { name: 'Cipondoh', lat: -6.1833, lng: 106.6833, postcodes: ['15147', '15148'] },
          { name: 'Ciledug', lat: -6.2250, lng: 106.7083, postcodes: ['15151'] },
          { name: 'Karawaci', lat: -6.2000, lng: 106.6167, postcodes: ['15115'] },
          { name: 'Pinang', lat: -6.2167, lng: 106.6667, postcodes: ['15145'] }
        ]
      },
      {
        name: 'Kota Tangerang Selatan',
        lat: -6.2886,
        lng: 106.7179,
        districts: [
          { name: 'Serpong', lat: -6.3167, lng: 106.6667, postcodes: ['15310', '15311'] },
          { name: 'Serpong Utara', lat: -6.2667, lng: 106.6500, postcodes: ['15326'] },
          { name: 'Pondok Aren', lat: -6.2667, lng: 106.7000, postcodes: ['15224'] },
          { name: 'Ciputat', lat: -6.3167, lng: 106.7500, postcodes: ['15411'] },
          { name: 'Pamulang', lat: -6.3417, lng: 106.7333, postcodes: ['15417'] }
        ]
      }
    ]
  }
];

// Helper untuk mencari data wilayah
export function findRegionCoordinates(provinceName, cityName, districtName) {
  const prov = INDONESIA_REGIONS.find((p) => p.name === provinceName);
  if (!prov) return null;

  const city = prov.cities.find((c) => c.name === cityName);
  if (!city) return null;

  if (districtName) {
    const dist = city.districts.find((d) => d.name === districtName);
    if (dist && dist.lat && dist.lng) {
      return { latitude: dist.lat, longitude: dist.lng };
    }
  }

  return { latitude: city.lat, longitude: city.lng };
}
