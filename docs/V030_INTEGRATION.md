# Integrasi v0.3.0 Kabar dan Kesejahteraan

Versi ini dibangun di atas `v0.2.0-high-priority`.

## Dampak database

Tidak ada tabel atau indeks baru. Struktur baru disimpan di dokumen JSON `cms_documents.data` dan dinormalisasi otomatis ketika data lama dibaca.

Sebelum deployment tetap lakukan backup database sesuai SOP proyek.

## Urutan integrasi

1. Buat branch dari `rebuild/mvp` atau tag `v0.2.0-high-priority`.
2. Salin seluruh isi source v0.3.0 ke repository tanpa menimpa `.git` dan `.env.local`.
3. Jalankan:

```bash
npm ci
npm run lint
npm run typecheck
npm run build
```

4. Jalankan lokal dengan database Development.
5. Periksa `/kesejahteraan`, `/wisata`, `/wisata/[slug]`, CMS tab Kesejahteraan, dan CMS tab Kabar.
6. Simpan CMS satu kali untuk mempersistensikan `socialDashboard` dan metadata Kabar ke dokumen database.
7. Deploy ke Preview dan lakukan smoke test.
8. Setelah Preview lulus, gunakan staged Production deployment sebelum promote.

## Acceptance test ringkas

- PBI-JK menampilkan 1.634 penerima dan 57,58%.
- PKH menampilkan 620 data penerima dan 21,85%.
- Sembako menampilkan 849 data penerima dan 29,92%.
- Jumlah Desil 1–5 sama dengan 2.838.
- CMS menolak status terbit ketika jumlah kategori tidak sama dengan total.
- Menu publik dan CMS menampilkan nama `Kabar`.
- Filter kategori Kabar bekerja.
- Artikel utama, artikel, pengumuman, dan agenda dapat diterbitkan.
- Kontribusi warga Kabar tetap melalui moderasi dan tidak membuat duplikasi saat diterbitkan ulang.
