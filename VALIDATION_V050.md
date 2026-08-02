# Laporan Validasi v0.5.0

Versi: `v0.5.0-kependudukan-secure-mvp`

## Pemeriksaan yang berhasil dijalankan

| Pemeriksaan | Hasil |
|---|---|
| Ekstraksi dan inventaris source | Berhasil |
| Parsing `package.json`, `package-lock.json`, seed, dan jurnal migration | Berhasil |
| Pemeriksaan sintaks 98 file TypeScript/TSX | Tidak ditemukan kesalahan sintaks |
| Pemeriksaan struktur TypeScript dengan stub lokal | Berhasil; bukan pengganti typecheck dependency-aware |
| Sintaks script migration `.mjs` | Berhasil |
| Konsistensi data kependudukan dummy | Berhasil: seluruh agregat sama dengan 6.088 jiwa |
| Validasi data seed CMS | Tidak ditemukan error |
| Penolakan publikasi data simulasi | Berhasil |
| Penolakan URL eksternal di luar allowlist | Berhasil |
| Uji sanitizer JPG/PNG/WEBP | Berhasil pada berkas uji lokal |
| Uji penolakan gambar palsu dan ukuran berlebih | Berhasil pada berkas uji lokal |
| Uji enkripsi `v2` dan pembacaan legacy key | Berhasil pada pengujian lokal terisolasi |
| Pemindaian file terlarang dan pola secret | Wajib diulang pada ZIP final; hasil dicatat pada checksum manifest |

## Pemeriksaan yang belum dapat dijalankan

| Pemeriksaan | Status | Penyebab |
|---|---|---|
| `npm ci` | Gagal di lingkungan pemeriksaan | Registry paket internal mengembalikan HTTP 404 untuk `zod-validation-error-4.0.2.tgz` |
| `npm run lint` | Belum dijalankan | Dependency belum dapat dipasang |
| `npm run typecheck` sebenarnya | Belum dijalankan | Dependency dan type package belum tersedia |
| `npm run build` | Belum dijalankan | Dependency belum dapat dipasang |
| Dependency vulnerability audit | Belum dijalankan | Instalasi dependency gagal |
| Migration Development/Preview/Production | Tidak dijalankan | Tidak ada koneksi database yang digunakan dan migration memerlukan backup serta konfirmasi target |
| Smoke test browser | Belum dijalankan | Build aplikasi belum tersedia |

Tidak ada klaim bahwa lint, typecheck penuh, build, migration, atau deployment telah lulus. Jalankan seluruh pemeriksaan tersebut pada komputer integrasi setelah target environment diverifikasi.
