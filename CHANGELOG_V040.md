# Changelog v0.4.0 — Layanan BESTI

## Ditambahkan

- Panel Pusat Layanan pada beranda.
- Daftar 10 layanan utama dengan pencarian sederhana.
- Tombol BESTI pada header, beranda, halaman layanan, detail layanan lama, dan footer.
- Pengaturan URL BESTI melalui CMS.
- Lima kontak perangkat Kelurahan Benteng Selatan pada halaman Kontak.
- Pengelolaan kontak perangkat melalui CMS.
- Opsi **Tampilkan sebagai layanan utama** pada setiap layanan.
- Normalizer data terpisah dan dapat diuji tanpa koneksi database.

## Diubah

- Halaman `/layanan` kini berfungsi sebagai direktori ringkas, bukan tempat menampilkan prosedur lengkap.
- Navigasi publik **Portal Warga** diganti menjadi **BESTI**.
- Detail layanan lama mengarahkan pengurusan ke BESTI agar informasi prosedur tidak ganda.
- Form CMS layanan menyembunyikan field legacy di bagian lanjutan agar pelatihan admin lebih sederhana.

## Dipertahankan

- Route dan database Portal Warga lama.
- Kabar, Kesejahteraan, UMKM, peta, profil, audit, akun petugas, dan operasional.
- Seluruh konten yang sudah tersimpan pada database Production.

## Database

Tidak ada migration schema, reset, seed, truncate, atau penghapusan data.
