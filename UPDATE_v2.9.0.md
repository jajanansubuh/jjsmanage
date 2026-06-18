# Catatan Rilis JjsManage v2.9.0 🚀

Dokumen ini merangkum seluruh pembaruan, peningkatan, dan perbaikan bug yang diimplementasikan pada versi **v2.9.0** (pembaruan dari versi v2.1.0). Pembaruan ini berfokus pada **sistem pencetakan label**, **integrasi PWA secara penuh**, **optimasi performa database**, serta **pemolesan UI/UX mobile-first**.

---

## 🌟 Fitur Utama Baru & Peningkatan

### 1. Sistem Antrean & Riwayat Cetak Label (Print Queue & History)
Peningkatan sistem manajemen antrean cetak label agar lebih terpantau dan efisien:
*   **Model Database Baru (`LabelPrintHistory`)**: Menyimpan riwayat pencetakan yang telah diselesaikan (`DONE`) dengan skema JSON terstruktur berisi nama barang, kode, kuantitas, dan waktu cetak selesai.
*   **API Endpoint `/api/print-queue/history`**: Endpoint baru khusus admin untuk menarik data riwayat cetak berdasarkan suplier dan rentang tanggal.
*   **Halaman Riwayat Cetak Admin (`AdminPrintHistory`)**: Antarmuka baru untuk melihat riwayat cetak suplier secara berkelompok per tanggal, dilengkapi fitur pencarian suplier/barang dan pop-up detail transaksi.
*   **Auto-Cleanup Otomatis**: Antrean dengan status `DONE` yang berumur lebih dari 1 hari akan dihapus secara otomatis saat memuat halaman cetak untuk menjaga performa database.
*   **Normalisasi Format Cetak**: Memperbaiki masalah pemotongan tata letak label cetak dan total qty yang berulang.

### 2. Integrasi PWA Penuh (Full PWA Support)
Optimasi aplikasi agar dapat diinstal dengan lancar di perangkat mobile (Android & iOS) layaknya aplikasi native:
*   **Service Worker Manual (`sw.js` & `sw-register.tsx`)**: Mengimplementasikan service worker custom untuk caching aset statis dan memperlancar kemampuan offline.
*   **Perbaikan Manifest & Bypass Auth**: Memasukkan `manifest.json` dan `sw.js` ke dalam daftar bypass middleware otentikasi agar prompt instalasi dapat langsung terpicu tanpa terhalang login screen.
*   **Aset & Ikon Resmi**: Memperbarui semua ikon PWA (`icon-192`, `icon-512`, `apple-touch-icon`, `favicon`) menggunakan branding logo asli `logojjsmanage.png`.
*   **Persistent Install Prompt**: Menyediakan tombol instalasi PWA yang tetap terlihat di mobile sampai pengguna menginstalnya.

### 3. Pemolesan UI & Navigasi Mobile-First
*   **Responsive Mobile Bottom Navigation**: Navigasi bawah lengket (sticky bottom nav) khusus tampilan ponsel untuk memudahkan pengoperasian satu tangan.
*   **Desain Login Baru**: Halaman masuk yang dirombak dengan kartu visual semi-transparan (glassmorphism), tipografi modern, serta ilustrasi hero baru (`login_hero.png`).
*   **Sidebar Footer v2.9.0**: Desain footer profil yang lebih minimalis di sidebar gelap, mencantumkan teks versi `JjsManage v2.9.0`, serta menambahkan tautan aktif ke situs portofolio pembuat (`ndhvbase`).
*   **Transisi Modal Dialog**: Mengubah accordion collapsibles yang kurang responsif pada halaman Riwayat menjadi dialog modal interaktif (`payout-history-modal.tsx`), memberikan kesan aplikasi yang lebih premium.

### 4. Performa & Optimasi Database
*   **Database Indexing**: Menambahkan indeks pada kolom `supplierId` dan `completedAt` di tabel `LabelPrintHistory` untuk mempercepat query pencarian admin.
*   **Optimasi Prisma Connection Pool**: Menyesuaikan pooling koneksi database untuk menangani beban konkurensi tinggi dari 150+ suplier aktif secara bersamaan tanpa menyebabkan timeout.

---

## 📂 Ringkasan Perubahan File

Berikut adalah daftar komponen dan file penting yang ditambahkan atau dimodifikasi dalam update ini:

### 🟢 File Baru / Untracked
*   `src/app/api/print-queue/history/route.ts` — API untuk riwayat cetak label.
*   `src/components/cetak/AdminPrintHistory.tsx` — UI riwayat cetak untuk Admin.
*   `public/sw.js` — Service worker untuk offline support PWA.
*   `public/login_hero.png` — Gambar ilustrasi halaman login.
*   *Ikon branding baru di folder `public/` (`apple-touch-icon.png`, `favicon.ico`, `maskable-icon.png`, dll).*

### 🟡 File yang Dimodifikasi
*   `prisma/schema.prisma` — Penambahan model `LabelPrintHistory` dan relasi ke `Supplier`.
*   `src/components/sidebar.tsx` — Update footer, link `ndhvbase`, dan versi `v2.9.0`.
*   `src/app/login/page.tsx` — Peningkatan desain halaman login.
*   `src/app/layout.tsx` & `src/app/manifest.ts` — Konfigurasi PWA dan pemuatan service worker.
*   `src/components/payout-history-modal.tsx` — Modal baru pengganti accordion di riwayat transaksi.
*   `src/components/ui/` (Button, Dialog, Table, DateRangePicker) — Penyesuaian tema visual gelap (emerald/slate).

---

## ⚙️ Langkah Pasca-Update (Post-Deployment Steps)

1.  **Migrasi Database**:
    Jalankan perintah berikut untuk menerapkan skema tabel baru (`LabelPrintHistory`) ke database:
    ```bash
    npx prisma db push
    # atau jika menggunakan migrasi formal:
    npx prisma migrate dev --name add_label_print_history
    ```
2.  **Generate Prisma Client**:
    ```bash
    npx prisma generate
    ```
3.  **Build Aplikasi**:
    ```bash
    npm run build
    npm run start
    ```
