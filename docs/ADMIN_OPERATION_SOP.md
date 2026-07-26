# SOP Operasional Portal Petugas

## 1. Tujuan

SOP ini menjadi pedoman dasar penggunaan portal petugas Kelurahan Benteng Selatan agar akses, pelayanan warga, publikasi konten, dan data sensitif dikelola secara tertib dan dapat ditelusuri.

## 2. Penanggung Jawab

- **Super Admin:** mengelola akun, role, keamanan akses, serta meninjau audit log.
- **Operator Pelayanan:** memproses pengajuan surat, berkomunikasi dengan warga, dan membuat catatan internal.
- **Editor Konten:** mengelola CMS dan moderasi kontribusi publik.
- **Reviewer:** melakukan pemeriksaan dan persetujuan tanpa hak mengubah layanan yang tidak menjadi kewenangannya.
- **Auditor:** memantau data operasional dan audit log dalam mode baca saja.

## 3. Pembuatan dan Penutupan Akun

1. Setiap petugas wajib memakai akun sendiri.
2. Super Admin memilih role berdasarkan tugas nyata, bukan jabatan informal.
3. Kata sandi awal minimal 12 karakter dan harus diganti bila pernah dibagikan melalui saluran sementara.
4. Akun petugas yang pindah tugas, berhenti, atau kehilangan kewenangan segera dinonaktifkan.
5. Dilarang menggunakan satu akun bersama untuk beberapa petugas.
6. Minimal satu Super Admin aktif harus selalu tersedia.

## 4. Pengelolaan Data Sensitif

1. NIK dan nomor KK hanya dibuka ketika diperlukan untuk verifikasi layanan.
2. Petugas tidak boleh menyalin NIK/KK ke grup percakapan, dokumen publik, atau perangkat pribadi.
3. Auditor hanya melihat data yang dimasking.
4. Setiap pembukaan detail pengajuan dicatat pada audit log.
5. Data warga tidak boleh digunakan di luar tujuan pelayanan yang diajukan.

## 5. Proses Pengajuan Layanan

1. Buka antrean dan pilih pengajuan yang akan diperiksa.
2. Cocokkan identitas, kontak, alamat, dan data usaha.
3. Tentukan status sesuai hasil pemeriksaan.
4. Gunakan catatan untuk warga bagi informasi yang memang boleh dibaca warga.
5. Gunakan catatan internal hanya untuk koordinasi petugas.
6. Jangan menandai pengajuan selesai sebelum seluruh verifikasi dan dokumen pendukung terpenuhi.
7. Seluruh perubahan status dan pesan harus dilakukan melalui portal agar tercatat.

## 6. Moderasi dan Publikasi Kontribusi

1. Periksa isi, gambar, sumber, lokasi, dan persetujuan kontak publik.
2. Gunakan status `revision_required` bila warga perlu memperbaiki data.
3. Gunakan `approved` bila konten telah disetujui tetapi belum diterbitkan.
4. Gunakan `published` hanya untuk konten yang layak tampil pada website resmi.
5. Perubahan dari `published` ke status lain otomatis menarik konten dari website publik.
6. Penghapusan item kontribusi melalui CMS otomatis mengembalikan submission ke `approved`.
7. Jangan mengubah ID item kontribusi warga secara manual tanpa alasan dan pencatatan yang jelas.

## 7. Peninjauan Audit Log

Super Admin atau Auditor meninjau audit log secara berkala, terutama untuk:

- kegagalan login berulang;
- pembukaan data sensitif;
- perubahan status layanan;
- publikasi atau penarikan konten;
- perubahan role, kata sandi, atau status akun;
- aktivitas dari IP atau perangkat yang tidak dikenali.

Temuan tidak wajar harus segera dicatat dan ditindaklanjuti.

## 8. Backup dan Perubahan Sistem

1. Backup database dibuat sebelum migrasi schema atau deployment besar.
2. Restore selalu diuji pada branch database sementara terlebih dahulu.
3. Preview harus lulus smoke test sebelum dipromosikan ke Production.
4. Jangan menjalankan `db:push` atau `drizzle-kit generate` langsung untuk Production tanpa baseline, backup, dan persetujuan teknis.
5. File `.env`, connection string, secret, dan file backup tidak boleh masuk repository.

## 9. Penanganan Insiden

Jika terjadi dugaan kebocoran akun atau data:

1. nonaktifkan akun terkait;
2. ganti kata sandi dan naikkan versi sesi melalui halaman petugas;
3. periksa audit log;
4. rotasi secret bila diperlukan;
5. simpan bukti waktu, akun, IP, dan tindakan;
6. hentikan deployment bermasalah atau lakukan rollback;
7. laporkan kepada penanggung jawab kelurahan.

## 10. Serah-Terima

Saat sistem diserahkan:

- buat akun resmi untuk petugas penerima;
- ubah kata sandi akun bootstrap;
- rotasi kredensial dan secret yang pernah dipegang pengembang;
- serahkan akses Vercel, Neon, domain, dan penyimpanan Blob melalui akun organisasi;
- pastikan backup terakhir tersedia dan prosedur restore dipahami.
