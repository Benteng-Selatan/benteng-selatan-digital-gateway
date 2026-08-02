# Matriks Role dan Permission v0.5.0

Matriks ini menggambarkan pemeriksaan pada server. Menyembunyikan menu di antarmuka bukan pengganti permission API.

| Permission | Super Admin | Operator | Editor Konten | Reviewer | Auditor |
|---|:---:|:---:|:---:|:---:|:---:|
| Melihat CMS | Ya | Tidak | Ya | Tidak | Tidak |
| Mengubah CMS | Ya | Tidak | Ya | Tidak | Tidak |
| Melihat dashboard operasional | Ya | Ya | Ya | Ya | Ya |
| Melihat daftar pengajuan | Ya | Ya | Tidak | Ya, data minimum | Ya, data minimum |
| Mengubah status pengajuan | Ya | Ya | Tidak | Tidak | Tidak |
| Mengirim pesan pengajuan | Ya | Ya | Tidak | Tidak | Tidak |
| Membuka NIK/KK lengkap | Ya | Ya | Tidak | Tidak | Tidak |
| Melihat kontribusi warga | Ya | Tidak | Ya | Ya, tanpa identitas | Ya, metadata saja |
| Meninjau/menerbitkan kontribusi | Ya | Tidak | Ya | Ya | Tidak |
| Mengelola akun petugas | Ya | Tidak | Tidak | Tidak | Tidak |
| Melihat audit log | Ya | Tidak | Tidak | Tidak | Ya |

## Minimisasi data

- Reviewer dan Auditor tidak menerima nama asli, email, telepon, alamat, NIK/KK, pesan, atau catatan pengajuan.
- Reviewer menerima payload kontribusi untuk pemeriksaan isi, tetapi identitas warga disamarkan.
- Auditor hanya menerima metadata kontribusi dan tidak menerima payload atau identitas warga.
- Pemeriksaan permission dan proyeksi data dilakukan pada server.
