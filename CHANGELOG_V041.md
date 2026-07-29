# Changelog v0.4.1 — Content Polish

## Ringkasan

Patch ini memoles narasi publik agar Website Benteng Selatan siap diluncurkan dan diserahterimakan sebagai portal informasi kelurahan.

## Perubahan

- Mengganti narasi beranda, profil, layanan, UMKM, peta, kontak, dan footer yang masih bernuansa prototipe.
- Menyederhanakan bagian bawah halaman Kesejahteraan menjadi **Rekomendasi umum** dan **Rujukan layanan sosial**.
- Menghapus catatan internal tentang izin publikasi dari tampilan publik UMKM.
- Menyembunyikan label data kosong pada halaman kontak, footer, detail layanan, UMKM, dan Kabar.
- Mengganti label Portal Warga “pilot” dan “persyaratan awal” dengan istilah operasional.
- Menambahkan normalisasi kompatibilitas untuk mengganti hanya teks bawaan lama yang dikenal, termasuk deskripsi beranda lama yang diakhiri “Mantap”.
- Menjadikan konten contoh bawaan berstatus draft pada instalasi baru.

## Keamanan data

- Tidak ada migrasi database.
- Tidak ada reset, seed, truncate, atau penghapusan data Production.
- Kabar, UMKM, Kesejahteraan, layanan, akun, dan audit lama tetap dipertahankan.
- Normalisasi hanya mengganti teks prototipe bawaan yang cocok dengan daftar legacy; teks kustom pengguna tetap dipertahankan.
