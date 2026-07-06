# 💸 Smart Money Tracker

Aplikasi pencatat keuangan pribadi (income & expense tracker) berbasis web, dengan tampilan mobile-first ala aplikasi native. Semua data tersimpan langsung di perangkat pengguna (`localStorage`) — tanpa backend, tanpa akun, tanpa server database.

Dibangun dengan **TanStack Start** (React 19) dan di-generate/dikembangkan menggunakan [Lovable](https://lovable.dev).

## ✨ Fitur

- **Catat transaksi cepat** — tombol tambah (FAB) dengan numpad kustom untuk input nominal, kategori, tanggal, dan catatan.
- **Beranda / Dashboard** — ringkasan saldo, total pemasukan & pengeluaran bulan berjalan, transaksi terbaru, dan progres budget per kategori.
- **Riwayat transaksi** — pencarian, filter berdasarkan tipe (pemasukan/pengeluaran) dan kategori, dikelompokkan per tanggal.
- **Kategori & Budget** — kelola kategori pemasukan/pengeluaran (ikon & warna kustom) dan atur limit budget bulanan/mingguan per kategori beserta progresnya.
- **Laporan & Analisis** — grafik donut pengeluaran per kategori, tren pemasukan vs pengeluaran per bulan (bar chart), dan tren saldo (line chart), dengan filter periode (minggu, bulan, 3 bulan, semua).
- **Export data**, tersedia dalam 4 format:
  - **PDF** — laporan keuangan siap cetak (ringkasan + rincian pemasukan/pengeluaran).
  - **Excel (XLSX)** — 3 sheet: Summary, Transaksi, dan Breakdown per Kategori.
  - **CSV**
  - **JSON** (backup lengkap, termasuk kategori & budget)
- **Backup & Restore** — export seluruh data ke JSON dan import kembali kapan saja.
- **Reset data** dengan konfirmasi, untuk mulai dari awal.
- **Multi-currency** — dukungan format mata uang IDR, USD, dan EUR.
- Sepenuhnya **client-side**, data privat di perangkat masing-masing pengguna (tidak dikirim ke server mana pun).

## 🛠️ Tech Stack

| Kategori | Teknologi |
| --- | --- |
| Framework | [TanStack Start](https://tanstack.com/start) + React 19 |
| Routing | TanStack Router (file-based routing) |
| State management | Zustand (dengan `persist` middleware ke `localStorage`) |
| Styling | Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com/) (Radix UI primitives) |
| Grafik | Recharts |
| Form & Validasi | React Hook Form + Zod |
| Export | jsPDF & jspdf-autotable (PDF), SheetJS/xlsx (Excel) |
| Icon | Lucide React |
| Bahasa | TypeScript |
| Package manager | [Bun](https://bun.sh/) |

## 📂 Struktur Proyek

```
src/
├── components/        # Komponen UI (AppShell, BottomNav, AddTransactionSheet, dll.)
│   └── ui/             # Komponen shadcn/ui
├── hooks/              # Custom React hooks
├── lib/                # Helper (format angka/tanggal, export PDF/Excel, tipe data, default kategori)
├── routes/             # Halaman aplikasi (file-based routing TanStack Router)
│   ├── index.tsx        # Beranda / Dashboard
│   ├── history.tsx      # Riwayat transaksi
│   ├── categories.tsx   # Kategori & Budget
│   ├── reports.tsx      # Laporan & grafik
│   └── settings.tsx     # Pengaturan, backup/restore, reset
├── store/              # Zustand store (useFinance) — sumber data utama aplikasi
├── router.tsx / server.ts / start.ts   # Konfigurasi TanStack Start
└── styles.css          # Global styles (Tailwind)
```

## 🚀 Menjalankan Secara Lokal

### Prasyarat

- [Bun](https://bun.sh/) (disarankan) — atau bisa juga npm/pnpm/yarn.
- Node.js versi terbaru (LTS) jika tidak menggunakan Bun.

### Instalasi

```bash
# clone repository
git clone https://github.com/ridhoauliama97/smart-money-tracker-expenses.git
cd smart-money-tracker-expenses

# install dependencies
bun install
```

### Menjalankan mode development

```bash
bun run dev
```

Aplikasi akan berjalan di `http://localhost:3000` (port default Vite/TanStack Start, sesuaikan bila berbeda pada output terminal).

### Build untuk production

```bash
bun run build
bun run preview
```

### Script lain yang tersedia

| Perintah | Keterangan |
| --- | --- |
| `bun run dev` | Menjalankan server development |
| `bun run build` | Build aplikasi untuk production |
| `bun run build:dev` | Build dengan mode development |
| `bun run preview` | Preview hasil build secara lokal |
| `bun run lint` | Menjalankan ESLint |
| `bun run format` | Merapikan format kode dengan Prettier |

> Catatan: jika lebih nyaman menggunakan npm, jalankan `npm install` lalu ganti `bun run <script>` menjadi `npm run <script>`.

## 💾 Penyimpanan Data

Aplikasi ini **tidak menggunakan backend/database server**. Seluruh transaksi, kategori, budget, dan pengaturan disimpan di `localStorage` browser pengguna melalui Zustand `persist` middleware. Artinya:

- Data bersifat privat dan hanya tersimpan di perangkat/browser yang digunakan.
- Membersihkan cache/data browser akan menghapus seluruh data — disarankan rutin melakukan **backup (Export JSON)** melalui halaman **Pengaturan**.
- Untuk memindahkan data ke perangkat/browser lain, gunakan fitur **Export JSON** lalu **Import** di perangkat tujuan.

## 🗺️ Roadmap (opsional)

- [ ] Sinkronisasi data lintas perangkat (cloud sync / akun pengguna)
- [ ] Notifikasi/reminder budget mendekati limit
- [ ] Dukungan multi-dompet/akun
- [ ] Dark mode toggle manual

## 🤝 Kontribusi

Kontribusi, issue, dan pull request sangat terbuka. Silakan fork repository ini dan ajukan PR untuk perbaikan atau fitur baru.

## 📄 Lisensi

Belum ditentukan. Tambahkan file `LICENSE` sesuai kebutuhan (misal MIT) jika ingin membuka proyek ini untuk penggunaan publik.
