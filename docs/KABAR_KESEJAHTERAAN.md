# Implementasi Kabar dan Dashboard Kesejahteraan

Pembaruan ini dibangun di atas rilis `v0.2.0-high-priority` tanpa menambah route publik baru.

## Route yang dipertahankan

- `/kesejahteraan` tetap menjadi halaman kesejahteraan sosial.
- `/wisata` tetap dipakai untuk menjaga tautan lama, tetapi nama menu dan judul halaman berubah menjadi **Kabar**.
- `/wisata/[slug]` tetap menjadi halaman detail artikel.

## Dashboard kesejahteraan

Data awal berasal dari Sheet 2 file `Benteng Selatan.xlsx`:

| Kelompok | Data |
|---|---:|
| Total basis data | 2.838 |
| PBI-JK: Ya | 1.634 |
| PBI-JK: Tidak | 1.204 |
| PKH: Tidak | 2.218 |
| PKH: Keluarga | 473 |
| PKH: Pengurus | 147 |
| Sembako: Tidak | 1.989 |
| Sembako: Keluarga | 632 |
| Sembako: Pengurus | 217 |
| Desil 1–5 | 461, 486, 633, 608, 650 |

Persentase dihitung otomatis. CMS menolak publikasi ketika jumlah PBI-JK, PKH, Sembako, atau Desil tidak sama dengan total basis data.

## Kabar

Kanal Kabar mendukung:

- artikel;
- pengumuman;
- agenda;
- artikel unggulan;
- tanggal publikasi dan tanggal kegiatan;
- kategori tetap;
- filter kategori pada halaman publik;
- kontribusi warga yang tetap melewati moderasi.

Kategori yang tersedia mencakup kegiatan kelurahan, pelayanan publik, pengumuman, pembangunan, sosial dan kesejahteraan, keamanan dan lingkungan, UMKM dan ekonomi, pendidikan dan pemuda, wisata dan budaya, serta prestasi warga.

## Kompatibilitas data lama

`getSiteData()` menormalkan dokumen CMS lama. Jika `socialDashboard` atau metadata artikel belum tersedia di database, nilai awal dan metadata aman akan ditambahkan di memori. Nilai tersebut akan tersimpan permanen saat admin menyimpan CMS berikutnya.

Tidak diperlukan migrasi tabel PostgreSQL baru.
