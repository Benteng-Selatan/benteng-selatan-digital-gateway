# Layanan Utama dan Integrasi BESTI — v0.4.0

## Tujuan

Rilis ini menjadikan Website Benteng Selatan sebagai portal informasi layanan, sedangkan persyaratan, prosedur lengkap, dan pengajuan administrasi dipusatkan pada BESTI.

URL awal BESTI:

```text
https://besti.is-best.net
```

## Ruang lingkup

1. Menampilkan maksimal 10 layanan utama pada `/layanan`.
2. Menyediakan pencarian layanan sederhana.
3. Mengarahkan prosedur dan pengajuan ke BESTI melalui tautan eksternal.
4. Mengganti tombol navigasi Portal Warga publik menjadi tombol BESTI.
5. Mempertahankan route dan data Portal Warga lama tanpa penghapusan.
6. Menampilkan kontak perangkat kelurahan pada `/kontak`.
7. Menyediakan pengelolaan URL BESTI, layanan utama, dan kontak melalui CMS.

## Sepuluh layanan awal

1. Surat Keterangan Tidak Mampu (SKTM)
2. Surat Keterangan Usaha
3. Surat Keterangan Domisili
4. Surat Keterangan Asal-Usul
5. Surat Keterangan Ahli Waris
6. Surat Keterangan Belum Mendapatkan Buku Nikah
7. Surat Keterangan Pekerjaan
8. Surat Pengantar Keterangan Hilang
9. Surat Keterangan Orang yang Sama
10. Surat Keterangan Domisili Kantor/Organisasi

## Kompatibilitas data lama

- Tidak ada migration database baru.
- Tidak ada perintah reset, truncate, atau seed pada deployment.
- Dokumen CMS lama dinormalisasi secara additive.
- Nilai site, profil, Kabar, Kesejahteraan, UMKM, peta, dan kontak yang sudah ada tetap dipertahankan.
- Field baru `site.bestiUrl`, `service.featured`, dan `contact.officials` mendapat nilai awal hanya bila belum tersedia.
- Layanan utama yang belum ada ditambahkan saat normalisasi tanpa menghapus layanan lama.
- Admin dapat menyembunyikan layanan dengan mengubah status menjadi draft atau mematikan opsi layanan utama.

## Pengelolaan melalui CMS

### URL BESTI

`CMS → Identitas & Profil → URL aplikasi BESTI`

### Layanan utama

`CMS → Layanan Publik`

Aktifkan **Tampilkan sebagai layanan utama** dan status **Terbit**. Halaman publik mengambil maksimal 10 item.

### Kontak perangkat

`CMS → Kontak → Kontak perangkat kelurahan`

Masukkan nama, jabatan, dan nomor yang sudah disetujui untuk dipublikasikan.

## Acceptance test

- `/layanan` menampilkan 10 layanan utama.
- Pencarian layanan berfungsi.
- Setiap tombol BESTI membuka URL yang benar pada tab baru.
- Header dan footer memiliki akses BESTI.
- `/kontak` menampilkan kontak umum dan lima perangkat kelurahan.
- Layout tidak mengalami horizontal scroll pada mobile.
- Route `/warga` dan data lama tetap tersedia.
- Kabar, Kesejahteraan, UMKM, peta, admin, audit, dan operasional tetap berfungsi.

## Rollback

Rollback kode ke tag `v0.3.0-kabar-kesejahteraan`. Karena rilis ini tidak mengubah schema database, tidak diperlukan rollback migration. Field tambahan dalam JSONB aman dibiarkan karena versi lama mengabaikannya.
