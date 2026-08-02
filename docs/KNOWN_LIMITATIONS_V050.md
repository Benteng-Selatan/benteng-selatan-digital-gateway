# Known Limitations v0.5.0

1. Data kependudukan baru mendukung satu snapshot agregat dalam CMS. Belum ada histori periode atau sinkronisasi Google Sheets.
2. Sanitasi gambar memeriksa struktur format, dimensi, ukuran, dan menghapus metadata umum; belum melakukan decode lalu re-encode seluruh piksel.
3. Housekeeping unggahan privat tersedia sebagai script manual dan dry-run secara default; belum ada cron terjadwal.
4. Berkas publik dipertahankan ketika konten di-unpublish agar rollback tetap memungkinkan. Kebijakan retensi final perlu ditetapkan.
5. Jika proses server berhenti tepat setelah Blob publik dibuat tetapi sebelum transaksi database selesai, berkas orphan masih mungkin terbentuk. Konflik atau kegagalan transaksi normal sudah memiliki kompensasi penghapusan best-effort.
6. Belum tersedia unit test dan integration test otomatis yang lengkap.
7. Pagination server-side untuk daftar pengajuan dan kontribusi belum diterapkan.
8. Verifikasi email dan reset password warga belum tersedia.
