# Makan Dimsum Indonesia — Design System

Source: Brand catalog/flyer Makan Dimsum Indonesia (color-matched from official material)
Adapted from: Mie Gacoan design system structure (layout patterns, spacing, component types)

---

## 1. Color Tokens

### Brand Colors (extracted from brand material)

| Token | Hex | Usage |
|---|---|---|
| `color.brand.blue` | `#4E8298` | Primary structural color — header/footer bg, headings, badges, icon strokes, card accents |
| `color.brand.blue.light` | `#6A9DB3` | Secondary surfaces — banner backgrounds, hover states, lighter UI chrome |
| `color.brand.blue.dark` | `#3A6B80` | Pressed/active states, emphasis text on light backgrounds |
| `color.brand.gold` | `#C9A23D` | Primary CTA fill, price highlights, accent borders, selected states, section badges |
| `color.brand.gold.light` | `#D4B55A` | Hover state for gold elements, subtle accent borders |
| `color.brand.gold.dark` | `#A8862E` | Pressed state for gold CTA buttons |
| `color.brand.red` | `#B5372E` | Discount highlights, promo percentage badges, strikethrough price chips |

### Surface & Background Colors

| Token | Hex | Usage |
|---|---|---|
| `color.bg.cream` | `#F5F1EB` | Page background — warm cream, bukan pure white (memberi kesan premium/artisanal) |
| `color.bg.cream.dark` | `#EDE8DF` | Card background, section alternation (sedikit lebih gelap dari page bg) |
| `color.bg.white` | `#FFFFFF` | Input fields, modal backgrounds, elevated card surfaces |
| `color.bg.blue` | `#4E8298` | Header, footer, full-bleed section backgrounds |

### Text Colors

| Token | Hex | Usage |
|---|---|---|
| `color.text.primary` | `#2C3E50` | Primary body text on light backgrounds (dark blue-gray, bukan pure black) |
| `color.text.secondary` | `#6B7B8D` | Secondary/caption text, timestamps, meta info |
| `color.text.onBlue` | `#FFFFFF` | Text & icons on blue surfaces |
| `color.text.onGold` | `#FFFFFF` | Text on gold CTA buttons |
| `color.text.price` | `#C9A23D` | Price display — gold untuk menarik perhatian |
| `color.text.disabled` | `#9CA3AF` | Disabled/placeholder text |

### Semantic Colors

| Token | Hex | Usage |
|---|---|---|
| `color.success` | `#2D8F5E` | Payment confirmed, order completed, stock sufficient |
| `color.success.bg` | `#E8F5EE` | Success alert background |
| `color.warning` | `#D4A843` | Low stock warning, pending states (reuses gold family) |
| `color.warning.bg` | `#FDF6E3` | Warning alert background |
| `color.error` | `#C0392B` | Validation errors, failed payment, out-of-stock |
| `color.error.bg` | `#FDECEA` | Error alert background |
| `color.info` | `#4E8298` | Info messages (reuses brand blue) |
| `color.info.bg` | `#E8F0F4` | Info alert background |

### Palette Logic

Sistem dua warna brand (**steel blue + warm gold**) di atas kanvas **cream** — menggantikan navy+pink dari Mie Gacoan. Perbedaan kunci:

- **Mie Gacoan**: Navy + Hot Pink = bold, youthful, energik, "spicy vibe"
- **Makan Dimsum**: Steel Blue + Gold = premium, warm, trustworthy, "artisanal food vibe"

Gold dipakai **eksklusif** untuk elemen yang butuh aksi/perhatian: CTA buttons, harga, selected states, dan accent borders. Blue membawa semua struktur (header, footer, heading, badge informational). Cream background memberi warmth dan kesan premium — bukan cold white yang terasa "template".

---

## 2. Typography

| Style | Weight | Size (mobile) | Color | Usage |
|---|---|---|---|---|
| Display / Greeting | Bold | ~28–30px | White | "Selamat Datang!" (on blue header) |
| Subtitle | Medium | ~15px | White (opacity 85%) | Tagline/subheader on blue surfaces |
| Section Heading | Bold | ~24–26px | Blue `#4E8298` | "Katalog Produk", "Pesanan Saya" |
| Badge Label | Bold | ~16px | White on gold | "Produksi Hari Ini", "Promo" |
| Price Large | Bold | ~22px | Gold `#C9A23D` | Harga produk di katalog |
| Price Small | Semibold | ~16px | Gold `#C9A23D` | Harga di keranjang/order summary |
| Body | Regular/Medium | ~15px | Dark `#2C3E50` | Deskripsi produk, isi chat |
| Caption | Medium | ~13px | Secondary `#6B7B8D` | Timestamp, batch code, meta info |
| Button Label | Bold | ~15px | White / Gray (disabled) | CTA buttons, segmented controls |

**Typeface**: Gunakan **Poppins** (Google Fonts) — rounded geometric sans-serif yang friendly tapi tetap clean dan professional. Cocok dengan tone "premium dimsum" yang approachable, bukan kaku/korporat.

Fallback stack: `'Poppins', 'Nunito', system-ui, -apple-system, sans-serif`

---

## 3. Spacing Scale

| Token | px | Usage |
|---|---|---|
| `space.2xs` | 4 | Tight inline gaps (icon-badge separation) |
| `space.xs` | 8 | Icon-to-label gap, compact element spacing |
| `space.sm` | 16 | Inline gaps within a component, list item padding |
| `space.md` | 24 | Card internal padding, form field spacing |
| `space.lg` | 32 | Section vertical padding |
| `space.xl` | 48 | Section-to-section separation |
| `space.2xl` | 64 | Major section breaks (hero to content) |

Content edge-padding: ~5% viewport width (≈20px mobile, ≈32px tablet, max 1200px container desktop).

---

## 4. Radius & Shape

| Token | Value | Usage |
|---|---|---|
| `radius.sm` | 8px | Small chips, tags, input fields |
| `radius.md` | 12px | Product cards, order cards, form cards |
| `radius.lg` | 20px | Banners, modal dialogs, bottom sheets |
| `radius.xl` | 24px | Hero sections, large promotional cards |
| `radius.full` | 999px | Avatar circles, badge pills, circular icon buttons, pagination dots |
| `shape.sheet` | top 24px radius | White/cream content sheet overlapping blue header — "bottom sheet reveal" effect |

---

## 5. Components

### 5.1 Product Card (Katalog)
- White card, rounded (`radius.md`), subtle `color.brand.gold.light` border (1px)
- Product photo (square, rounded top corners)
- Title in blue bold, price in gold bold
- Stock indicator: green dot + "Tersedia" atau red dot + "Habis"
- CTA: gold-filled pill button "Tambah ke Keranjang" (white text, rounded full)
- Out-of-stock: button disabled, gray fill

### 5.2 Order Status Card
- White card, gold left-border (4px accent strip — menunjukkan status penting)
- Status badge pill: `pending_payment` (gold), `paid` (blue), `fulfilling` (blue.light), `completed` (green), `cancelled` (error red)
- QR code preview (small) di kanan atas untuk order yang sudah `paid`

### 5.3 Batch Info Card (Admin)
- Cream card, blue left-border (4px accent strip)
- Batch code displayed in monospace font (untuk readability kode `DIMSUMAYAM-20260913-001`)
- remaining_qty / produced_qty sebagai progress bar (gold fill on cream bg)
- FIFO indicator: badge pill "Ambil Duluan" (gold) pada batch tertua

### 5.4 Navigation / Header
- Full-bleed blue `#4E8298` background
- White logo + nav text
- Mobile: hamburger menu atau bottom tab bar
- Admin: sidebar navigation (blue bg, white text, gold accent on active item)

### 5.5 CTA Button Variants
| Variant | Fill | Text | Border | Usage |
|---|---|---|---|---|
| Primary | Gold `#C9A23D` | White | none | Main actions: "Pesan", "Bayar", "Simpan Produksi" |
| Secondary | Transparent | Blue `#4E8298` | 1px blue | Secondary actions: "Batal", "Lihat Detail" |
| Danger | Error `#C0392B` | White | none | Destructive: "Hapus", "Batalkan Order" |
| Disabled | `#D1D5DB` | `#9CA3AF` | none | Inactive/disabled state |
| Ghost | Transparent | Blue | none | Tertiary actions, links-as-buttons |

### 5.6 Segmented Control (Customer: Pickup selector, Admin: tab switcher)
- Equal-width pill buttons inside a cream container
- **Selected**: gold fill, white icon + label, subtle drop shadow
- **Unselected**: cream/light gray fill, secondary text color, flat

### 5.7 Footer
- Full-bleed blue band
- Logo + address (left), social links with circular icon bubbles (right)
- Floating circular gold FAB (chat/support button) — bottom-right, with icon + "Chat CS" label

### 5.8 Chat Bubble
- Customer message: gold-tinted cream bg (`#FDF6E3`), rounded, right-aligned
- Admin message: white bg, blue left-border, rounded, left-aligned
- Timestamp caption below each bubble

---

## 6. Elevation / Shadow

| Level | CSS Shadow | Usage |
|---|---|---|
| `elevation.none` | `none` | Flat elements, unselected tabs |
| `elevation.sm` | `0 1px 3px rgba(0,0,0,0.08)` | Cards at rest, input fields |
| `elevation.md` | `0 4px 12px rgba(0,0,0,0.10)` | Selected segmented control, hovered cards, dropdowns |
| `elevation.lg` | `0 8px 24px rgba(0,0,0,0.12)` | Modals, FAB button, bottom sheet |
| `elevation.xl` | `0 16px 48px rgba(0,0,0,0.16)` | Overlay dialogs, scan confirmation modal |

Shadow warna: selalu dark neutral (bukan colored shadow) — menjaga kesan clean dan premium.

---

## 7. Layout Pattern

### Customer (Mobile-first)
Single-column, alternating background rhythm:
`blue header → cream sheet (bottom-sheet overlap) → white product cards → cream section → gold-badged section → blue footer`

Blue/cream alternation adalah structural device utama untuk memisahkan zona konten tanpa border atau divider yang berat.

### Admin (Desktop-first, responsive to tablet)
Sidebar + main content layout:
`blue sidebar (fixed) → cream main area → white content cards`

Sidebar: blue background, white text, gold accent bar pada item aktif.

---

## 8. Iconography

Style: **line icons** (stroke, bukan filled) — konsisten dengan tone clean/premium.
Stroke width: 1.5–2px.
Color: blue `#4E8298` on light surfaces, white `#FFFFFF` on blue surfaces, gold `#C9A23D` for highlighted/active icons.
Library recommendation: **Lucide React** (consistent line style, MIT license, tree-shakeable).

---

## 9. Token Coverage — Semantic States

| State | Color | Background | Border | Usage |
|---|---|---|---|---|
| Default | `#2C3E50` | `#FFFFFF` | `#D1D5DB` | Resting input, default card |
| Focus | `#4E8298` | `#FFFFFF` | `#4E8298` (2px) | Focused input field |
| Hover | — | varies | — | Slight darken/lighten of surface |
| Active/Pressed | — | varies (darken 10%) | — | Button press feedback |
| Disabled | `#9CA3AF` | `#F3F4F6` | `#E5E7EB` | Disabled inputs, buttons |
| Selected | `#FFFFFF` | `#C9A23D` | none | Active tab, selected filter |
| Error | `#C0392B` | `#FDECEA` | `#C0392B` | Invalid input, failed operation |
| Success | `#2D8F5E` | `#E8F5EE` | `#2D8F5E` | Verified, completed |

---

## 10. Dark Mode (Future)

Belum diimplementasikan di fase awal. Jika diperlukan nanti:
- `color.bg.cream` → `#1A1A2E` (deep navy-charcoal)
- `color.brand.blue` → `#6AAFCA` (lighter blue for contrast)
- `color.brand.gold` → `#D4B55A` (slightly brighter gold)
- Cards: `#242438` surface
- Text: `#E5E5E5` primary, `#9CA3AF` secondary
