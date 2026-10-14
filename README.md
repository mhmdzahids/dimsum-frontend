# Dimsum App — Frontend Application (React + Vite)

Aplikasi web Single Page Application (SPA) modern untuk **Makan Dimsum Indonesia**, mencakup:
1. 🛍️ **Storefront Pelanggan**: Katalog menu, keranjang belanja, checkout instan, pembayaran QRIS, pelacakan status pesanan real-time, dan riwayat pesanan (mendukung tamu/guest).
2. 💻 **Point of Sale (POS) Kasir**: Mode layar penuh kasir toko untuk transaksi langsung di outlet, scanner QR produk, dan cetak struk.
3. 📦 **Sistem Produksi & Gudang (Back-Office)**: Perencanaan produksi mingguan/harian, Quality Control (QC), cetak stiker lot, pencatatan resep bahan baku (BOM), dan monitoring stok freezer 2-pool (online vs offline).
4. ⚙️ **Admin CMS**: Manajemen produk, diskon, kupon voucher, banner promosi, manajemen akun pengguna, dan laporan mutasi.

> 📌 **Catatan Migrasi**: Repository ini disiapkan untuk diintegrasikan dengan backend baru berbasis **FastAPI + PostgreSQL + VPS Linux**. Untuk instruksi lengkap migrasi, silakan merujuk pada dokumen [`MIGRATION_TODO_REPORT.md`](../MIGRATION_TODO_REPORT.md).

---

## 🛠️ Tech Stack Frontend

- **Core**: React 19 (`react`, `react-dom`)
- **Bundler & Dev Server**: Vite 8 & Tailwind CSS v4
- **Routing**: React Router v7 (`react-router-dom`)
- **State Management**:
  - Global Client State & Cart: Zustand 5
  - Server State, Caching & Polling: TanStack Query v5 (`@tanstack/react-query`)
  - User Authentication: React Context (`AuthContext`)
- **UI & Komponen**:
  - Iconography: Lucide React (`lucide-react`)
  - QR Code Generator: `qrcode.react`
  - Real-time Camera QR Scanner: `jsqr`
  - Pemilihan Lokasi Outlet: Leaflet (`leaflet`)
  - Google OAuth Login: `@react-oauth/google`
- **Testing**: Vitest (`vitest`) & Happy-DOM

---

## 📁 Hierarki Folder Frontend

```
front-end/
├── public/                         # Aset publik statis (favicon, manifest, logo)
├── src/
│   ├── api/                        # Lapisan integrasi REST API
│   │   ├── client.js               # Centralized Fetch wrapper (auto unwrap envelope, JWT injector, error normalization)
│   │   └── __tests__/              # Unit test client API
│   │
│   ├── assets/                     # Gambar grafis WebP menu, banner, dan logo
│   │
│   ├── components/                 # Komponen antarmuka (reusable)
│   │   ├── guards/                 # Route security guards
│   │   │   ├── ProtectedRoute.jsx  # Guard untuk halaman profil/alamat (harus login)
│   │   │   └── AdminRoute.jsx      # Guard berbasis peran (admin, inventory, checker, staff)
│   │   ├── layouts/                # Wrapper tata letak
│   │   │   ├── AdminLayout.jsx     # Sidebar, Header navigasi, dan footer CMS Admin
│   │   │   └── Header.jsx          # Header customer storefront
│   │   ├── ui/                     # Komponen UI umum (Pagination, DataView, Badge, Modal, Tabs)
│   │   ├── ErrorBoundary.jsx       # Fallback UI saat terjadi error render React
│   │   └── PageLoader.jsx          # Animasi loading saat suspense lazy-load
│   │
│   ├── context/                    # Context React
│   │   └── AuthContext.jsx         # Global user state, token refresh, dan Google auth
│   │
│   ├── hooks/                      # Custom React Hooks
│   │   ├── useAuth.js              # Hook akses user & login/logout
│   │   ├── usePolling.js           # Polling berkala untuk status pesanan real-time
│   │   └── useQuery.js             # Wrapper integrasi TanStack query
│   │
│   ├── pages/                      # Tampilan Halaman (Views)
│   │   │
│   │   ├── [Customer Pages]
│   │   ├── Home.jsx                # Landing page interaktif & promo banner
│   │   ├── Menu.jsx                # Katalog produk lengkap, filter kategori & tambah ke keranjang
│   │   ├── Checkout.jsx            # Formulir pesanan, pilihan pickup, input voucher
│   │   ├── Payment.jsx             # Tampilan QRIS Paywuz dengan hitung mundur pembayaran
│   │   ├── OrderStatus.jsx         # Pelacakan status pesanan real-time & QR pengambilan
│   │   ├── OrderHistory.jsx        # Riwayat pesanan (tersimpan di localStorage)
│   │   ├── OutletInfo.jsx          # Informasi cabang, maps leaflet, dan jam buka
│   │   ├── Vouchers.jsx            # Halaman klaim kupon promo
│   │   ├── Auth.jsx                # Login / Register pelanggan & Google Sign-In
│   │   ├── Profile.jsx             # Profil akun & pengaturan pengguna
│   │   │
│   │   ├── [Admin & Operational Pages]
│   │   ├── AdminLogin.jsx          # Form login khusus staf & manajemen
│   │   ├── AdminDashboard.jsx      # Ringkasan KPI penjualan, omset, dan volume transaksi
│   │   ├── AdminPOS.jsx            # Standalone Full-Screen Kasir POS (Optimasi Touchscreen)
│   │   ├── AdminScanQR.jsx         # Scanner kamera multi-kamera untuk serah-terima pickup pesanan
│   │   ├── AdminProduction.jsx     # Rencana produksi mingguan/harian & cetak stiker lot
│   │   ├── AdminInventoryDashboard.jsx # Dashboard buffer stok produk jadi (Online vs Offline)
│   │   ├── AdminRawMaterials.jsx   # Master bahan baku, resep BOM gilingan, mutasi masuk
│   │   ├── AdminProducts.jsx       # Master produk jadi, varian unit, diskon & edit nama display
│   │   ├── AdminStockOut.jsx       # Mutasi pengeluaran stok multi-channel (Shopee, Offline, Event)
│   │   ├── AdminQCHistory.jsx      # Log riwayat verifikasi QC produksi & cetak ulang label
│   │   ├── AdminTransactions.jsx   # Laporan seluruh transaksi penjualan & status pembayaran
│   │   ├── AdminVouchers.jsx       # Kelola kupon diskon (potongan persen / nominal)
│   │   ├── AdminBanners.jsx        # Kelola banner promosi dan gambar
│   │   └── AdminUsers.jsx          # Manajemen akun tim & pemberian role
│   │
│   ├── stores/                     # State management Zustand
│   │   └── cartStore.js            # Keranjang belanja, quantity item, persistensi session
│   │
│   ├── utils/                      # Helper & Business Logic Client
│   │   ├── adminAuth.js            # Helper pengecekan role dan rute default per-role
│   │   └── formatters.js           # Format mata uang Rupiah, tanggal lokal, dsb.
│   │
│   ├── App.jsx                     # Konfigurasi router, code-splitting (lazy loading)
│   └── main.jsx                    # Root render React DOM
│
├── .env.example                    # Template variabel lingkungan frontend
├── package.json                    # Daftar script dan dependensi npm
├── vite.config.js                  # Konfigurasi Vite & Proxy API ke port 5000
└── eslint.config.js                # Aturan linter ESLint
```

---

## 🚀 Panduan Setup & Menjalankan Lokal

### 1. Prasyarat
- **Node.js 18+** atau **Node.js 20+** (`node -v`)
- **npm** atau **pnpm** package manager

### 2. Install Dependensi
```bash
# Buka direktori front-end
cd front-end

# Install package npm
npm install
```

### 3. Konfigurasi Environment Variables (Opsional)
Salin file `.env.example` ke `.env`:
```bash
# Windows
copy .env.example .env

# Linux / macOS
cp .env.example .env
```

Isi default `.env`:
```ini
# Client ID Google OAuth (opsional untuk dev lokal)
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Base URL API (Biarkan kosong saat dev lokal, Vite otomatis mem-proxy ke port 5000)
VITE_API_BASE_URL=
```

### 4. Jalankan Development Server
```bash
npm run dev
```
Aplikasi frontend akan aktif di **`http://localhost:5173`**.

> 💡 **Info Proxy Vite**: File `vite.config.js` telah dikonfigurasi untuk meneruskan setiap request yang diawali dengan `/api` dan `/static` secara otomatis ke server backend di `http://127.0.0.1:5000`. Pastikan backend Flask sudah menyala!

### 5. Build untuk Produksi
```bash
npm run build
```
Hasil kompilasi siap saji akan dibuat di folder `dist/` (teroptimasi dengan chunking otomatis untuk vendor React, icons, dan pages).

---

## 🧪 Pengujian Unit & Integrasi

Frontend dilengkapi dengan pengujian Vitest:
```bash
# Jalankan seluruh test runner
npm test

# Jalankan test dengan mode watch
npx vitest
```

---

## 🗺️ Peta Navigasi & Hak Akses Pengguna

| Jalur URL | Halaman | Akses Peran | Keterangan |
| :--- | :--- | :--- | :--- |
| `/` | Beranda | Publik | Hero banner, ringkasan produk favorit |
| `/menu` | Menu Produk | Publik | Katalog lengkap, filter varian, tambah ke cart |
| `/checkout` | Checkout | Publik / Tamu | Input penerima, pilih jam pickup, pilih voucher |
| `/payment` | Pembayaran | Publik / Tamu | Tampilan QRIS Paywuz dinamis |
| `/order-status` | Status Order | Publik / Tamu | Tracking proses dapur & QR code pickup |
| `/order-history` | Riwayat Order | Publik / Tamu | Riwayat berbasis `localStorage` perangkat |
| `/admin/login` | Login Petugas | Publik | Akses portal operasional |
| `/admin/pos` | Kasir POS | `admin`, `staff` | UI POS kasir toko (standalone, tanpa sidebar) |
| `/admin/scan-qr` | Scan Pickup QR | `admin`, `staff` | Scanner kamera verifikasi serah-terima pesanan |
| `/admin/production` | Perencanaan Produksi | `admin`, `inventory`, `checker` | Rencana mingguan, stiker lot, input realisasi |
| `/admin/inventory` | Dashboard Stok | `admin`, `inventory`, `checker` | Pemantauan stok online vs offline |
| `/admin/qc-history`| Riwayat QC | `admin`, `checker` | Log hasil inspeksi QC & reprint stiker |
| `/admin/raw-materials`| Bahan Baku & BOM | `admin`, `inventory` | Resep gilingan, stok bahan baku mentah |
| `/admin/stock-out` | Pengeluaran Stok | `admin`, `inventory` | Mutasi stok ke marketplace (Shopee) / offline |
| `/admin/products` | Master Produk | `admin`, `inventory` | Atur harga, status aktif, edit display name |
| `/admin/dashboard`| Dashboard Owner | `admin` | Analitik finansial dan performa bisnis |
| `/admin/transactions`| Transaksi Penjualan| `admin` | Audit log transaksi & rekonsiliasi bayar |
| `/admin/vouchers` | Kelola Kupon | `admin` | Tambah / nonaktifkan voucher promo |
| `/admin/banners` | Kelola Banner | `admin` | Unggah gambar banner promosi |
| `/admin/users` | Kelola Tim | `admin` | Tambah petugas kasir, checker, atau inventory |

---

## 🎯 Catatan Integrasi untuk Migrasi ke FastAPI

Bagi rekan developer yang bertugas mengintegrasikan frontend dengan backend baru:

1. **Format Respon API**: Modul [`src/api/client.js`](src/api/client.js) telah dirancang untuk secara otomatis meng-unwrap format envelope standar:
   ```json
   {
     "success": true,
     "data": <payload>,
     "message": "...",
     "error": null
   }
   ```
   Pastikan endpoint FastAPI mengembalikan response dengan struktur di atas agar komponen frontend langsung dapat membacanya.
2. **CORS & Proxy**: Jika frontend dan backend dijalankan pada domain atau port berbeda saat staging/produksi, pastikan FastAPI mengizinkan origin frontend di middleware `CORSMiddleware`.
3. **State Management**: Keranjang belanja pelanggan dikelola di sisi klien menggunakan Zustand (`src/stores/cartStore.js`), sehingga tidak bergantung pada session server.
4. **Token JWT**: Token disimpan di `localStorage` dan secara otomatis disisipkan ke header `Authorization: Bearer <token>` oleh `client.js`.
