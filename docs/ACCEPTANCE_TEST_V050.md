# Acceptance Test v0.5.0

| ID | Skenario | Hasil yang diharapkan |
|---|---|---|
| POP-01 | Buka `/kependudukan` saat status draft | Angka dummy tidak tampil publik |
| POP-02 | Ubah total sehingga tidak konsisten | CMS menolak publikasi dan menunjukkan error |
| POP-03 | `isSimulation=true` lalu pilih published | Simpan ditolak |
| POP-04 | Isi data resmi konsisten dan publish | Kartu, grafik, dan tabel tampil responsif |
| CMS-01 | Dua admin membuka revision sama; admin A menyimpan lalu B menyimpan | Admin B menerima HTTP 409 |
| SEC-01 | URL CMS menggunakan `http:` atau hostname di luar allowlist | Simpan ditolak |
| SEC-02 | Reviewer membuka pengajuan | Identitas/kontak/alamat/pesan tidak ada pada respons |
| SEC-03 | Auditor membuka kontribusi | Identitas dan payload kontribusi tidak ada pada respons |
| UPL-01 | Upload file palsu berekstensi JPG | Ditolak |
| UPL-02 | Upload gambar lebih dari 4 MB/24 MP | Ditolak |
| UPL-03 | Warga A membuka preview milik warga B | HTTP 403 |
| UPL-04 | Kontribusi belum disetujui | URL Blob private tidak muncul pada payload browser |
| UPL-05 | Petugas publish kontribusi | Gambar disalin ke store publik dan tampil di situs |
| RATE-01 | Melebihi batas request/message/upload | HTTP 429 dengan `Retry-After` |
| IDEM-01 | Kirim ulang payload dengan Idempotency-Key sama | Respons lama dikembalikan, tidak membuat data ganda |
| DB-01 | Hostname tidak ada di allowlist | Aplikasi/migration berhenti sebelum query |
| DB-02 | Local menarget Production | Koneksi diblokir |
| MIG-01 | Jalankan migration dua kali pada Development | Keduanya selesai tanpa duplikasi tabel/index |
| UPL-06 | Warga memiliki 10 upload pending tanpa kontribusi lalu mengunggah lagi | Upload ke-11 ditolak |
| UPL-07 | Publikasi mengalami konflik revision CMS | Salinan Blob publik baru dibatalkan secara best-effort dan konten tidak diterbitkan |
| CLEAN-01 | Jalankan cleanup tanpa confirmation phrase | Hanya menampilkan kandidat; tidak menghapus Blob atau row |
