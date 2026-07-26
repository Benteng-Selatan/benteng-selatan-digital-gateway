# Admin Multi-User, Role, dan Audit Log

## Tujuan

Portal petugas tidak lagi bergantung pada satu akun bersama. Setiap petugas mempunyai akun, role, sesi, dan jejak aktivitas masing-masing.

## Bootstrap Super Admin

Pada database yang baru dimigrasikan, tabel `staff_users` masih kosong. Login pertama menggunakan `CMS_USERNAME` dan `CMS_PASSWORD` akan membuat satu akun `super_admin` di database. Setelah akun pertama terbentuk, autentikasi berikutnya menggunakan tabel `staff_users`.

Jangan menghapus `CMS_SESSION_SECRET`. Nilai ini menandatangani cookie sesi. Setelah bootstrap dan serah-terima, `CMS_PASSWORD` sebaiknya dirotasi dan tidak digunakan sebagai kata sandi harian.

## Matriks Hak Akses

| Role | CMS | Pengajuan | NIK/KK lengkap | Pesan/status | Moderasi kontribusi | Kelola petugas | Audit log |
|---|---:|---:|---:|---:|---:|---:|---:|
| Super Admin | Ya | Ya | Ya | Ya | Ya | Ya | Ya |
| Operator Pelayanan | Tidak | Ya | Ya | Ya | Tidak | Tidak | Tidak |
| Editor Konten | Ya | Tidak | Tidak | Tidak | Ya | Tidak | Tidak |
| Reviewer | Tidak | Ya | Ya | Baca saja | Ya | Tidak | Tidak |
| Auditor | Tidak | Ya | Dimasking | Baca saja | Baca saja | Tidak | Ya |

## Pengelolaan Akun

Halaman: `/admin/petugas`

- Hanya Super Admin yang dapat membuat dan mengubah akun.
- Kata sandi petugas minimal 12 karakter.
- Perubahan role, status aktif, atau kata sandi menaikkan `session_version` sehingga sesi lama akun tersebut otomatis tidak berlaku.
- Akun sendiri tidak dapat dinonaktifkan.
- Sistem mencegah penonaktifan atau penurunan role Super Admin terakhir.

## Audit Log

Halaman: `/admin/audit`

Aktivitas yang dicatat meliputi:

- login berhasil dan gagal;
- logout;
- pembukaan detail pengajuan dan data sensitif;
- perubahan status pengajuan;
- pesan petugas dan catatan internal;
- publikasi, penarikan publikasi, serta review kontribusi;
- penyimpanan CMS dan upload gambar CMS;
- pembuatan dan perubahan akun petugas.

Audit menyimpan aktor, role, waktu, alamat IP, entitas, tindakan, dan metadata ringkas. Tidak tersedia endpoint untuk mengubah atau menghapus audit log dari dashboard.
