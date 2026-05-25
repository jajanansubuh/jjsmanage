# 📢 PANDUAN SOSIALISASI FITUR BARU UNTUK SUPPLIER (MITRA)
## JJS Manage - Jajanan Subuh (Versi 2.1.0)

Buku panduan ini merangkum perubahan fitur terbaru yang dirancang untuk mempermudah operasional **Supplier (Mitra)** dan **Admin**. Fitur-fitur ini sangat ramah bagi orang tua dan menjaga performa sistem tetap ringan dan cepat.

---

## ✂️ FITUR 1: Menu Ringkasan Potongan (Transparansi Penuh)

Sebelumnya, Supplier kesulitan memantau akumulasi potongan mingguan/bulanan. Sekarang, Supplier memiliki menu khusus **Potongan** yang bekerja persis seperti Tabungan.

### Apa saja yang bisa dilihat Supplier?
1. **Kartu Akumulasi (Jumlah Total yang Dipotong)**
   Menampilkan nominal rupiah besar dari seluruh akumulasi potongan yang pernah dilakukan.
2. **Rincian Tiga Kolom Potongan**
   Akumulasi nominal dipecah secara transparan agar tidak ada kesalahpahaman:
   * **Barcode**: Potongan dari kode barcode produk.
   * **Service Charge (S.Charge)**: Potongan biaya layanan harian.
   * **Kukuluban**: Potongan biaya titipan kukuluban harian.
3. **Tabel Riwayat Pemotongan**
   Log riwayat lengkap per tanggal transaksi dan nomor nota. Supplier bisa mencocokkan setiap potongan secara mandiri dari HP masing-masing.

---

## 🏷️ FITUR 2: Riwayat Cetak Label (Anti-Lupa & Ramah Orang Tua)

Pada menu **Cetak**, kini terdapat bagian khusus di bawah tabel seleksi bernama **"Riwayat Permintaan Label"**. Fitur ini dirancang agar mitra (khususnya orang tua) tidak lupa barang apa saja yang sudah diajukan atau sudah dicetak.

### Cara Kerja & Tampilan:
1. **Status Jelas dengan Warna Kontras**
   Setiap barang yang diajukan memiliki tanda status yang mudah dibaca sekilas:
   * ⏳ **Antrean (Kuning/Amber)**: Permintaan baru dikirim ke Admin dan sedang menunggu diproses.
   * ✅ **Selesai (Hijau/Emerald)**: Permintaan sudah diekspor/selesai diproses oleh Admin dan label siap digunakan.
2. **Reset Harian Otomatis (Auto-Purge)**
   * Supaya aplikasi tidak lambat dan database tidak penuh, riwayat cetak berstatus **Selesai (Hijau)** akan **dihapus otomatis setiap tengah malam (00:00)**.
   * Setiap pagi, Supplier akan mendapati tabel riwayat bersih dan siap memantau riwayat cetak khusus untuk **hari tersebut saja**.
   * **Antrean PENDING tetap aman**: Pengajuan berstatus **Antrean (Kuning)** tidak akan dihapus otomatis dan tetap menunggu konfirmasi Admin.
3. **Penyegaran Instan (Refresh)**
   Supplier bisa mengetuk tombol penyegaran melingkar ($\circlearrowright$) di sisi kanan riwayat untuk mengecek real-time status label mereka tanpa perlu log-out aplikasi.

---

## 🛠️ ALUR KERJA ADMIN (SINKRONISASI INSTAN)

Admin tidak memerlukan langkah tambahan yang rumit karena sistem telah dikonfigurasi secara otomatis:

1. **Ekspor Excel**: Admin mengunduh daftar cetak label via tombol **Ekspor** seperti biasa.
2. **Konfirmasi Sekali Klik**: Tepat setelah unduhan selesai, sistem akan memunculkan dialog modal modern kustom:
   * *"Ekspor Berhasil! Apakah Anda ingin menandai semua barang yang diekspor sebagai 'Selesai' (DONE)...?"*
3. **Klik "YA, SELESAI"**: Seluruh antrean Admin bersih seketika, dan status riwayat di layar Supplier akan otomatis berganti ke **Selesai (Hijau)** secara real-time.
4. **Tombol "Selesaikan Semua"**: Admin juga dibekali tombol manual berwarna hijau di daftar antrean untuk menandai semua antrean selesai kapan saja secara fleksibel.

---

*Panduan ini dibuat otomatis untuk mempermudah sosialisasi mitra JJS Manage.*
