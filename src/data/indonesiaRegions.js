// Dataset Wilayah Indonesia terstruktur (Provinsi -> Kota/Kabupaten -> Kecamatan -> Kode Pos)
// Dilengkapi koordinat centroid (lat, lng) untuk auto-center peta saat wilayah dipilih

export const INDONESIA_REGIONS = [
  {
    name: 'Bali',
    cities: [
      {
        name: 'Kota Denpasar',
        lat: -8.6705,
        lng: 115.2126,
        districts: [
          { name: 'Denpasar Barat', lat: -8.6600, lng: 115.1950, postcodes: ['80111', '80112'] },
          { name: 'Denpasar Selatan', lat: -8.6950, lng: 115.2200, postcodes: ['80221', '80222'] },
          { name: 'Denpasar Timur', lat: -8.6500, lng: 115.2400, postcodes: ['80231'] },
          { name: 'Denpasar Utara', lat: -8.6300, lng: 115.2100, postcodes: ['80241'] }
        ]
      },
      {
        name: 'Kab. Badung',
        lat: -8.5833,
        lng: 115.1833,
        districts: [
          { name: 'Kuta', lat: -8.7233, lng: 115.1725, postcodes: ['80361'] },
          { name: 'Kuta Selatan', lat: -8.7900, lng: 115.1700, postcodes: ['80363'] },
          { name: 'Kuta Utara', lat: -8.6500, lng: 115.1500, postcodes: ['80362'] },
          { name: 'Mengwi', lat: -8.5500, lng: 115.1700, postcodes: ['80351'] }
        ]
      }
    ]
  },
  {
    name: 'Bangka Belitung',
    cities: [
      {
        name: 'Kota Pangkal Pinang',
        lat: -2.1290,
        lng: 106.1139,
        districts: [
          { name: 'Bukit Intan', lat: -2.1400, lng: 106.1200, postcodes: ['33141'] },
          { name: 'Gerunggang', lat: -2.1100, lng: 106.0900, postcodes: ['33121'] },
          { name: 'Pangkal Balam', lat: -2.1000, lng: 106.1300, postcodes: ['33111'] },
          { name: 'Rangkui', lat: -2.1300, lng: 106.1100, postcodes: ['33131'] }
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
      },
      {
        name: 'Kota Serang',
        lat: -6.1200,
        lng: 106.1500,
        districts: [
          { name: 'Serang', lat: -6.1167, lng: 106.1500, postcodes: ['42111'] },
          { name: 'Cipocok Jaya', lat: -6.1400, lng: 106.1700, postcodes: ['42121'] },
          { name: 'Kasemen', lat: -6.0500, lng: 106.1600, postcodes: ['42191'] }
        ]
      },
      {
        name: 'Kota Cilegon',
        lat: -6.0167,
        lng: 106.0500,
        districts: [
          { name: 'Cilegon', lat: -6.0100, lng: 106.0400, postcodes: ['42411'] },
          { name: 'Cibeber', lat: -6.0300, lng: 106.0700, postcodes: ['42422'] },
          { name: 'Pulomerak', lat: -5.9200, lng: 106.0100, postcodes: ['42431'] }
        ]
      }
    ]
  },
  {
    name: 'Bengkulu',
    cities: [
      {
        name: 'Kota Bengkulu',
        lat: -3.8004,
        lng: 102.2655,
        districts: [
          { name: 'Gading Cempaka', lat: -3.8200, lng: 102.2800, postcodes: ['38221'] },
          { name: 'Ratu Agung', lat: -3.8100, lng: 102.2700, postcodes: ['38223'] },
          { name: 'Teluk Segara', lat: -3.7900, lng: 102.2500, postcodes: ['38114'] }
        ]
      }
    ]
  },
  {
    name: 'DI Yogyakarta',
    cities: [
      {
        name: 'Kota Yogyakarta',
        lat: -7.7956,
        lng: 110.3695,
        districts: [
          { name: 'Danurejan', lat: -7.7940, lng: 110.3720, postcodes: ['55211', '55212'] },
          { name: 'Gondokusuman', lat: -7.7850, lng: 110.3800, postcodes: ['55221'] },
          { name: 'Kotagede', lat: -7.8250, lng: 110.3950, postcodes: ['55171'] },
          { name: 'Mantrijeron', lat: -7.8200, lng: 110.3600, postcodes: ['55141'] },
          { name: 'Umbulharjo', lat: -7.8100, lng: 110.3850, postcodes: ['55161'] }
        ]
      },
      {
        name: 'Kab. Sleman',
        lat: -7.6883,
        lng: 110.3394,
        districts: [
          { name: 'Depok', lat: -7.7700, lng: 110.4000, postcodes: ['55281', '55282'] },
          { name: 'Mlati', lat: -7.7400, lng: 110.3600, postcodes: ['55284'] },
          { name: 'Ngaglik', lat: -7.7100, lng: 110.3900, postcodes: ['55581'] }
        ]
      },
      {
        name: 'Kab. Bantul',
        lat: -7.8890,
        lng: 110.3289,
        districts: [
          { name: 'Bantul', lat: -7.8900, lng: 110.3300, postcodes: ['55711'] },
          { name: 'Sewon', lat: -7.8400, lng: 110.3600, postcodes: ['55188'] },
          { name: 'Kasihan', lat: -7.8200, lng: 110.3300, postcodes: ['55181'] }
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
    name: 'Gorontalo',
    cities: [
      {
        name: 'Kota Gorontalo',
        lat: 0.5435,
        lng: 123.0568,
        districts: [
          { name: 'Kota Selatan', lat: 0.5300, lng: 123.0600, postcodes: ['96111'] },
          { name: 'Kota Barat', lat: 0.5400, lng: 123.0400, postcodes: ['96131'] },
          { name: 'Kota Utara', lat: 0.5600, lng: 123.0700, postcodes: ['96121'] }
        ]
      }
    ]
  },
  {
    name: 'Jambi',
    cities: [
      {
        name: 'Kota Jambi',
        lat: -1.6101,
        lng: 103.6131,
        districts: [
          { name: 'Telanaipura', lat: -1.6000, lng: 103.5800, postcodes: ['36122'] },
          { name: 'Pasar Jambi', lat: -1.5900, lng: 103.6200, postcodes: ['36111'] },
          { name: 'Jelutung', lat: -1.6200, lng: 103.6100, postcodes: ['36136'] }
        ]
      }
    ]
  },
  {
    name: 'Jawa Barat',
    cities: [
      {
        name: 'Kab. Bandung',
        lat: -7.0253,
        lng: 107.5198,
        districts: [
          { name: 'Soreang', lat: -7.0300, lng: 107.5200, postcodes: ['40911'] },
          { name: 'Banjaran', lat: -7.0500, lng: 107.5900, postcodes: ['40377'] },
          { name: 'Dayeuhkolot', lat: -6.9800, lng: 107.6300, postcodes: ['40257'] },
          { name: 'Baleendah', lat: -7.0000, lng: 107.6300, postcodes: ['40375'] }
        ]
      },
      {
        name: 'Kab. Bandung Barat',
        lat: -6.8500,
        lng: 107.5000,
        districts: [
          { name: 'Padalarang', lat: -6.8400, lng: 107.4800, postcodes: ['40553'] },
          { name: 'Lembang', lat: -6.8200, lng: 107.6200, postcodes: ['40391'] },
          { name: 'Ngamprah', lat: -6.8600, lng: 107.5100, postcodes: ['40552'] },
          { name: 'Batujajar', lat: -6.9000, lng: 107.5000, postcodes: ['40561'] }
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
          { name: 'Cikarang Pusat', lat: -6.3600, lng: 107.1700, postcodes: ['17530'] },
          { name: 'Tarumajaya', lat: -6.1500, lng: 106.9833, postcodes: ['17211'] },
          { name: 'Babelan', lat: -6.1600, lng: 107.0400, postcodes: ['17610'] }
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
        name: 'Kab. Ciamis',
        lat: -7.3300,
        lng: 108.3500,
        districts: [
          { name: 'Ciamis', lat: -7.3300, lng: 108.3500, postcodes: ['46211'] },
          { name: 'Kawali', lat: -7.1800, lng: 108.3600, postcodes: ['46253'] }
        ]
      },
      {
        name: 'Kab. Cianjur',
        lat: -6.8200,
        lng: 107.1400,
        districts: [
          { name: 'Cianjur', lat: -6.8200, lng: 107.1400, postcodes: ['43211'] },
          { name: 'Cipanas', lat: -6.7400, lng: 107.0400, postcodes: ['43253'] },
          { name: 'Karangtengah', lat: -6.8000, lng: 107.1800, postcodes: ['43281'] }
        ]
      },
      {
        name: 'Kab. Cirebon',
        lat: -6.7500,
        lng: 108.5500,
        districts: [
          { name: 'Sumber', lat: -6.7600, lng: 108.4800, postcodes: ['45611'] },
          { name: 'Kedawung', lat: -6.7200, lng: 108.5300, postcodes: ['45153'] },
          { name: 'Weru', lat: -6.7100, lng: 108.5000, postcodes: ['45154'] }
        ]
      },
      {
        name: 'Kab. Garut',
        lat: -7.2167,
        lng: 107.9000,
        districts: [
          { name: 'Garut Kota', lat: -7.2100, lng: 107.9000, postcodes: ['44111'] },
          { name: 'Tarogong Kidul', lat: -7.2200, lng: 107.8800, postcodes: ['44151'] }
        ]
      },
      {
        name: 'Kab. Indramayu',
        lat: -6.3300,
        lng: 108.3200,
        districts: [
          { name: 'Indramayu', lat: -6.3300, lng: 108.3200, postcodes: ['45211'] },
          { name: 'Jatibarang', lat: -6.4700, lng: 108.3100, postcodes: ['45273'] }
        ]
      },
      {
        name: 'Kab. Karawang',
        lat: -6.3000,
        lng: 107.3000,
        districts: [
          { name: 'Karawang Barat', lat: -6.3000, lng: 107.2900, postcodes: ['41311'] },
          { name: 'Karawang Timur', lat: -6.3100, lng: 107.3300, postcodes: ['41314'] },
          { name: 'Telukjambe Timur', lat: -6.3400, lng: 107.2900, postcodes: ['41361'] },
          { name: 'Klari', lat: -6.3600, lng: 107.3700, postcodes: ['41371'] }
        ]
      },
      {
        name: 'Kab. Kuningan',
        lat: -6.9800,
        lng: 108.4800,
        districts: [
          { name: 'Kuningan', lat: -6.9800, lng: 108.4800, postcodes: ['45511'] },
          { name: 'Cigugur', lat: -6.9600, lng: 108.4500, postcodes: ['45552'] }
        ]
      },
      {
        name: 'Kab. Majalengka',
        lat: -6.8300,
        lng: 108.2300,
        districts: [
          { name: 'Majalengka', lat: -6.8300, lng: 108.2300, postcodes: ['45411'] },
          { name: 'Jatiwangi', lat: -6.7400, lng: 108.2500, postcodes: ['45454'] }
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
      },
      {
        name: 'Kota Bekasi',
        lat: -6.2383,
        lng: 106.9756,
        districts: [
          { name: 'Bantar Gebang', lat: -6.3214, lng: 106.9922, postcodes: ['17151', '17152'] },
          { name: 'Bekasi Barat', lat: -6.2361, lng: 106.9825, postcodes: ['17144', '17145'] },
          { name: 'Bekasi Selatan', lat: -6.2555, lng: 106.9928, postcodes: ['17148', '17149'] },
          { name: 'Bekasi Timur', lat: -6.2503, lng: 106.9782, postcodes: ['17111', '17112', '17113'] },
          { name: 'Bekasi Utara', lat: -6.2167, lng: 107.0019, postcodes: ['17121', '17122'] },
          { name: 'Jatiasih', lat: -6.2986, lng: 106.9625, postcodes: ['17421', '17422'] },
          { name: 'Jatisampurna', lat: -6.3600, lng: 106.9200, postcodes: ['17433', '17434'] },
          { name: 'Medan Satria', lat: -6.2081, lng: 106.9739, postcodes: ['17131', '17132'] },
          { name: 'Mustika Jaya', lat: -6.2941, lng: 107.0211, postcodes: ['17158', '17159'] },
          { name: 'Pondok Gede', lat: -6.2872, lng: 106.9158, postcodes: ['17411', '17412'] },
          { name: 'Pondok Melati', lat: -6.3100, lng: 106.9300, postcodes: ['17414', '17415'] },
          { name: 'Rawalumbu', lat: -6.2719, lng: 106.9972, postcodes: ['17114', '17115'] }
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
        name: 'Kota Cimahi',
        lat: -6.8700,
        lng: 107.5400,
        districts: [
          { name: 'Cimahi Tengah', lat: -6.8750, lng: 107.5450, postcodes: ['40521'] },
          { name: 'Cimahi Utara', lat: -6.8500, lng: 107.5500, postcodes: ['40511'] },
          { name: 'Cimahi Selatan', lat: -6.8900, lng: 107.5300, postcodes: ['40531'] }
        ]
      },
      {
        name: 'Kota Cirebon',
        lat: -6.7200,
        lng: 108.5500,
        districts: [
          { name: 'Kejaksan', lat: -6.7100, lng: 108.5600, postcodes: ['45121'] },
          { name: 'Kesambi', lat: -6.7300, lng: 108.5400, postcodes: ['45131'] },
          { name: 'Harjamukti', lat: -6.7500, lng: 108.5500, postcodes: ['45141'] }
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
        name: 'Kota Sukabumi',
        lat: -6.9200,
        lng: 106.9300,
        districts: [
          { name: 'Cikole', lat: -6.9100, lng: 106.9300, postcodes: ['43111'] },
          { name: 'Citamiang', lat: -6.9300, lng: 106.9200, postcodes: ['43141'] }
        ]
      },
      {
        name: 'Kota Tasikmalaya',
        lat: -7.3300,
        lng: 108.2200,
        districts: [
          { name: 'Cihideung', lat: -7.3200, lng: 108.2100, postcodes: ['46121'] },
          { name: 'Tawang', lat: -7.3300, lng: 108.2300, postcodes: ['46111'] }
        ]
      }
    ]
  },
  {
    name: 'Jawa Tengah',
    cities: [
      {
        name: 'Kota Semarang',
        lat: -6.9667,
        lng: 110.4167,
        districts: [
          { name: 'Semarang Tengah', lat: -6.9700, lng: 110.4200, postcodes: ['50131'] },
          { name: 'Semarang Selatan', lat: -6.9900, lng: 110.4100, postcodes: ['50241'] },
          { name: 'Banyumanik', lat: -7.0600, lng: 110.4200, postcodes: ['50261'] }
        ]
      },
      {
        name: 'Kota Surakarta',
        lat: -7.5667,
        lng: 110.8167,
        districts: [
          { name: 'Banjarsari', lat: -7.5400, lng: 110.8200, postcodes: ['57131'] },
          { name: 'Jebres', lat: -7.5600, lng: 110.8500, postcodes: ['57126'] },
          { name: 'Laweyan', lat: -7.5600, lng: 110.7900, postcodes: ['57141'] }
        ]
      }
    ]
  },
  {
    name: 'Jawa Timur',
    cities: [
      {
        name: 'Kota Surabaya',
        lat: -7.2575,
        lng: 112.7521,
        districts: [
          { name: 'Tegalsari', lat: -7.2600, lng: 112.7300, postcodes: ['60261'] },
          { name: 'Genteng', lat: -7.2500, lng: 112.7400, postcodes: ['60271'] },
          { name: 'Wonokromo', lat: -7.3000, lng: 112.7300, postcodes: ['60241'] },
          { name: 'Gubeng', lat: -7.2700, lng: 112.7600, postcodes: ['60281'] }
        ]
      },
      {
        name: 'Kota Malang',
        lat: -7.9797,
        lng: 112.6304,
        districts: [
          { name: 'Klojen', lat: -7.9800, lng: 112.6300, postcodes: ['65111'] },
          { name: 'Lowokwaru', lat: -7.9400, lng: 112.6100, postcodes: ['65141'] },
          { name: 'Sukun', lat: -8.0000, lng: 112.6100, postcodes: ['65147'] }
        ]
      }
    ]
  },
  {
    name: 'Kalimantan Barat',
    cities: [
      {
        name: 'Kota Pontianak',
        lat: -0.0263,
        lng: 109.3425,
        districts: [
          { name: 'Pontianak Kota', lat: -0.0300, lng: 109.3300, postcodes: ['78111'] },
          { name: 'Pontianak Selatan', lat: -0.0400, lng: 109.3500, postcodes: ['78121'] },
          { name: 'Pontianak Barat', lat: -0.0100, lng: 109.3100, postcodes: ['78113'] }
        ]
      }
    ]
  },
  {
    name: 'Kalimantan Selatan',
    cities: [
      {
        name: 'Kota Banjarmasin',
        lat: -3.3167,
        lng: 114.5900,
        districts: [
          { name: 'Banjarmasin Tengah', lat: -3.3200, lng: 114.5900, postcodes: ['70111'] },
          { name: 'Banjarmasin Barat', lat: -3.3200, lng: 114.5700, postcodes: ['70115'] },
          { name: 'Banjarmasin Selatan', lat: -3.3400, lng: 114.6000, postcodes: ['70241'] }
        ]
      }
    ]
  },
  {
    name: 'Kalimantan Timur',
    cities: [
      {
        name: 'Kota Samarinda',
        lat: -0.5022,
        lng: 117.1537,
        districts: [
          { name: 'Samarinda Kota', lat: -0.5000, lng: 117.1500, postcodes: ['75111'] },
          { name: 'Samarinda Ulu', lat: -0.4800, lng: 117.1300, postcodes: ['75122'] }
        ]
      },
      {
        name: 'Kota Balikpapan',
        lat: -1.2379,
        lng: 116.8529,
        districts: [
          { name: 'Balikpapan Kota', lat: -1.2600, lng: 116.8300, postcodes: ['76111'] },
          { name: 'Balikpapan Selatan', lat: -1.2400, lng: 116.8700, postcodes: ['76114'] }
        ]
      }
    ]
  },
  {
    name: 'Lampung',
    cities: [
      {
        name: 'Kota Bandar Lampung',
        lat: -5.4294,
        lng: 105.2625,
        districts: [
          { name: 'Tanjung Karang Pusat', lat: -5.4100, lng: 105.2500, postcodes: ['35111'] },
          { name: 'Teluk Betung Selatan', lat: -5.4400, lng: 105.2700, postcodes: ['35221'] },
          { name: 'Kedaton', lat: -5.3800, lng: 105.2600, postcodes: ['35141'] }
        ]
      }
    ]
  },
  {
    name: 'Sumatera Barat',
    cities: [
      {
        name: 'Kota Padang',
        lat: -0.9471,
        lng: 100.4172,
        districts: [
          { name: 'Padang Barat', lat: -0.9500, lng: 100.3600, postcodes: ['25111'] },
          { name: 'Padang Timur', lat: -0.9400, lng: 100.3800, postcodes: ['25121'] },
          { name: 'Koto Tangah', lat: -0.8400, lng: 100.3300, postcodes: ['25586'] }
        ]
      }
    ]
  },
  {
    name: 'Sumatera Utara',
    cities: [
      {
        name: 'Kota Medan',
        lat: 3.5952,
        lng: 98.6722,
        districts: [
          { name: 'Medan Kota', lat: 3.5700, lng: 98.6900, postcodes: ['20211'] },
          { name: 'Medan Baru', lat: 3.5700, lng: 98.6600, postcodes: ['20153'] },
          { name: 'Medan Petisah', lat: 3.5900, lng: 98.6600, postcodes: ['20111'] },
          { name: 'Medan Barat', lat: 3.6000, lng: 98.6700, postcodes: ['20111'] }
        ]
      }
    ]
  }
];

// Helper untuk mencari koordinat wilayah
export function findRegionCoordinates(provinceName, cityName, districtName) {
  const prov = INDONESIA_REGIONS.find((p) => p.name.toLowerCase() === (provinceName || '').toLowerCase());
  if (!prov) return null;

  const city = prov.cities.find((c) => c.name.toLowerCase() === (cityName || '').toLowerCase());
  if (!city) return null;

  if (districtName) {
    const dist = city.districts.find((d) => d.name.toLowerCase() === (districtName || '').toLowerCase());
    if (dist && dist.lat && dist.lng) {
      return { latitude: dist.lat, longitude: dist.lng };
    }
  }

  return { latitude: city.lat, longitude: city.lng };
}
