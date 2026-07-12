# 💸 Smart Money Tracker

Aplikasi pencatat keuangan pribadi (income & expense tracker) berbasis web dengan tampilan mobile-first. Data tersimpan di **Supabase** (cloud database) dengan dukungan autentikasi, real-time sync, dan deploy ke **Cloudflare Workers**.

Dibangun dengan **TanStack Start** (React 19).

## ✨ Fitur

- **Autentikasi** — login & register dengan email/password, session management via Supabase Auth.
- **Catat transaksi cepat** — tombol tambah (FAB) dengan numpad kustom untuk input nominal, kategori, tanggal, dan catatan.
- **Beranda / Dashboard** — ringkasan saldo (dengan sparkline), total pemasukan & pengeluaran bulan berjalan, alert budget, dan transaksi terbaru.
- **Riwayat transaksi** — pencarian, filter berdasarkan tipe (pemasukan/pengeluaran) dan kategori, dikelompokkan per tanggal.
- **Kategori & Budget** — kelola kategori pemasukan/pengeluaran (ikon & warna kustom) dan atur limit budget bulanan/mingguan per kategori beserta progresnya.
- **Laporan & Analisis** — grafik donut pengeluaran per kategori, tren pemasukan vs pengeluaran (bar chart), dan tren saldo (line chart), dengan filter periode (7 hari, 30 hari, 90 hari, kustom).
- **Profil Pengguna** — edit nama, upload & crop avatar, hapus akun.
- **Notifikasi** — notifikasi budget mendekati limit (80%), budget terlampaui (100%), transaksi besar, dan pengingat harian. Dapat dikonfigurasi.
- **Onboarding Tour** — tur interaktif 5 langkah pada kunjungan pertama.
- **Tema** — dark, light, atau system (tanpa flash saat load).
- **Feedback** — kirim kritik, saran, atau laporan bug langsung ke database.
- **Export data**, tersedia dalam 4 format:
  - **PDF** — laporan keuangan siap cetak (ringkasan + rincian pemasukan/pengeluaran).
  - **Excel (XLSX)** — 3 sheet: Summary, Transaksi, dan Breakdown per Kategori.
  - **CSV**
  - **JSON** (backup lengkap, termasuk kategori & budget)
- **Backup & Restore** — export seluruh data ke JSON dan import kembali kapan saja.
- **Reset data** dengan konfirmasi, untuk mulai dari awal.
- **Multi-currency** — dukungan format mata uang IDR, USD, dan EUR.
- **Real-time sync** — perubahan data langsung tersinkronisasi antar perangkat via Supabase Realtime.
- **Migrasi otomatis** — data dari localStorage (`money-tracker-v1`) otomatis diimpor ke Supabase saat login pertama.

## 🛠️ Tech Stack

| Kategori         | Teknologi                                                                     |
| ---------------- | ----------------------------------------------------------------------------- |
| Framework        | [TanStack Start](https://tanstack.com/start) + React 19                       |
| Routing          | TanStack Router (file-based routing)                                          |
| State management | Zustand (5 store: useAuth, useFinance, useProfile, useNotifications, useTour) |
| Backend          | [Supabase](https://supabase.com/) (Auth, Database, Realtime, Storage)         |
| Styling          | Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com/) (Radix UI primitives)   |
| Grafik           | Recharts (PieChart, BarChart, LineChart)                                      |
| Form & Validasi  | React Hook Form + Zod                                                         |
| Export           | jsPDF & jspdf-autotable (PDF), SheetJS/xlsx (Excel)                           |
| Toast            | Sonner                                                                        |
| Icon             | Lucide React + @tabler/icons-react                                            |
| Image            | react-easy-crop (avatar cropping)                                             |
| Bahasa           | TypeScript                                                                    |
| Package manager  | [Bun](https://bun.sh/)                                                        |
| Deploy           | Cloudflare Workers (nitro preset `cloudflare-module`)                         |

## 📂 Struktur Proyek

```
src/
├── components/        # Komponen UI (AppShell, AuthGuard, BottomNav, TourGuide, dll.)
│   └── ui/             # 47 komponen shadcn/ui (Radix primitives)
├── hooks/              # Custom React hooks
├── lib/                # Helper (format angka/tanggal, export, tipe data, Supabase client, db-mappers)
├── routes/             # Halaman aplikasi (file-based routing TanStack Router)
│   ├── __root.tsx       # Root layout (query client, theme sync, realtime, toaster)
│   ├── index.tsx        # Beranda / Dashboard
│   ├── login.tsx        # Login
│   ├── register.tsx     # Registrasi
│   ├── history.tsx      # Riwayat transaksi
│   ├── categories.tsx   # Kategori & Budget
│   ├── reports.tsx      # Laporan & grafik
│   ├── settings.tsx     # Pengaturan, tema, backup/restore, reset
│   ├── profile.tsx      # Profil pengguna (avatar, nama, hapus akun)
│   ├── notifications.tsx # Notifikasi & preferensi
│   └── feedback.tsx     # Kirim feedback
├── store/              # Zustand store
│   ├── useAuth.ts       # Auth state & Supabase auth methods
│   ├── useFinance.ts    # Data keuangan utama (transaksi, kategori, budget, settings)
│   ├── useProfile.ts    # Profil pengguna
│   ├── useNotifications.ts # Notifikasi (persist ke localStorage)
│   └── useTour.ts       # Onboarding tour (persist ke localStorage)
├── router.tsx / server.ts / start.ts   # Konfigurasi TanStack Start
└── styles.css          # Global styles (Tailwind v4 + CSS variables tema)
```

## 🚀 Menjalankan Secara Lokal

### Prasyarat

- [Bun](https://bun.sh/) (disarankan) — atau bisa juga npm/pnpm/yarn.
- Node.js versi terbaru (LTS) jika tidak menggunakan Bun.
- Project Supabase (buat di [supabase.com](https://supabase.com/)) dengan tabel: `transactions`, `categories`, `budgets`, `user_settings`, `profiles`, `feedback`.

### Instalasi

```bash
# clone repository
git clone https://github.com/ridhoauliama97/smart-money-tracker-expenses.git
cd smart-money-tracker-expenses

# install dependencies
bun install

# siapkan environment variables
cp .env.example .env
# isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY dari project Supabase
```

### Menjalankan mode development

```bash
bun run dev
```

Aplikasi akan berjalan di `http://localhost:3000`.

### Build untuk production

```bash
bun run build
bun run preview
```

### Preview Cloudflare Worker lokal

```bash
npx wrangler --cwd ./.output dev
```

### Script lain yang tersedia

| Perintah            | Keterangan                            |
| ------------------- | ------------------------------------- |
| `bun run dev`       | Menjalankan server development        |
| `bun run build`     | Build aplikasi untuk production       |
| `bun run build:dev` | Build dengan mode development         |
| `bun run preview`   | Preview hasil build secara lokal      |
| `bun run lint`      | Menjalankan ESLint                    |
| `bun run format`    | Merapikan format kode dengan Prettier |

> Catatan: jika lebih nyaman menggunakan npm, jalankan `npm install` lalu ganti `bun run <script>` menjadi `npm run <script>`.

## 💾 Penyimpanan Data

Aplikasi menggunakan **Supabase** sebagai database utama. Seluruh transaksi, kategori, budget, dan pengaturan disimpan di cloud dan dapat diakses dari perangkat mana pun setelah login.

- **Autentikasi** via Supabase Auth (email/password) — session dikelola otomatis.
- **Real-time sync** — perubahan data langsung tersinkronisasi ke perangkat lain via Supabase Realtime.
- **State lokal** — notifikasi dan status onboarding tour disimpan di `localStorage` via Zustand `persist` middleware.
- **Migrasi dari localStorage** — data dari versi lama (`money-tracker-v1`) otomatis diimpor ke Supabase saat login pertama.
- **Backup** — tetap disarankan melakukan **Export JSON** secara berkala melalui halaman **Pengaturan**.
- **Hapus akun** — semua data pengguna dapat dihapus permanen melalui halaman Profil.

## 🗺️ Roadmap

- [ ] Sinkronasi data lintas perangkat (cloud sync / akun pengguna) ✅ _(Sudah terimplementasi via Supabase)_
- [ ] Notifikasi/reminder budget mendekati limit ✅ _(Sudah terimplementasi)_
- [ ] Dark mode toggle manual ✅ _(Sudah terimplementasi — dark/light/system)_
- [ ] Dukungan multi-dompet/akun
- [ ] Notifikasi push
- [ ] Widget / PWA

## 🤝 Kontribusi

Kontribusi, issue, dan pull request sangat terbuka. Silakan fork repository ini dan ajukan PR untuk perbaikan atau fitur baru.

## 📄 Lisensi

MIT
