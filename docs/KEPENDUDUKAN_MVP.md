# Data Kependudukan MVP — v0.5.0

## Ruang lingkup

Data kependudukan disimpan sebagai agregat di dokumen CMS `main` pada properti `populationDashboard`. Tidak ada data individu, NIK, nomor KK, nama, alamat, atau nomor telepon pada dashboard ini.

Fitur yang tersedia:

- halaman publik `/kependudukan`;
- kartu total penduduk, laki-laki, perempuan, kepala keluarga, dan RT;
- grafik kelompok usia;
- grafik komposisi jenis kelamin;
- tabel agregat per RW;
- editor pada tab **Kependudukan** di CMS;
- validasi silang total jenis kelamin, usia, RW, RT, dan KK;
- status `draft`/`published` dan penanda `isSimulation`.

## Aturan publikasi

Data seed v0.5.0 adalah data dummy berdasarkan contoh tampilan dan tetap berstatus `draft`. Data simulasi tidak dapat dipublikasikan. Sebelum publikasi, petugas harus:

1. mengganti seluruh angka dengan data resmi;
2. mengisi periode dan sumber data;
3. memastikan hasil validasi tidak memiliki error;
4. menghapus centang **Data masih berupa simulasi/dummy**;
5. mengubah status menjadi `published` dan menyimpan.

## Struktur data

`populationDashboard` berisi ringkasan, `ageGroups`, dan `neighborhoods`. Format JSONB dipilih karena data tahap ini hanya satu snapshot agregat yang dikelola bersama konten CMS. Tabel terstruktur baru diperlukan ketika sistem mulai menyimpan banyak periode atau menjalankan sinkronisasi terjadwal.
