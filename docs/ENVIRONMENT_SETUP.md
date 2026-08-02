Lanjut. Tahap berikutnya yang paling aman adalah **mendokumentasikan pemisahan environment**, supaya nanti tidak tertukar lagi saat diserahkan atau dikerjakan pengembang lain.

Buat file:

```bash
code docs/ENVIRONMENT_SETUP.md
```

Isi dengan:

````markdown
# Konfigurasi Environment

Proyek menggunakan tiga lingkungan yang terpisah untuk mencegah data pengujian masuk ke database production.

## 1. Local Development

Digunakan saat aplikasi dijalankan melalui:

```bash
npm run dev
````

Konfigurasi disimpan di:

```text
.env.local
```

Database Neon:

```text
rebuild-mvp-development
```

File `.env.local` tidak boleh dimasukkan ke Git.

---

## 2. Vercel Preview

Digunakan untuk deployment branch Git selain branch production.

Untuk branch:

```text
rebuild/mvp
```

Vercel menggunakan child branch Neon:

```text
preview/rebuild/mvp
```

Database Preview terpisah dari database Production.

---

## 3. Vercel Production

Digunakan oleh website resmi yang dipublikasikan melalui Vercel Production.

Database Neon:

```text
production
```

Environment Production hanya boleh digunakan oleh deployment resmi.

---

## Matriks Environment

| Lingkungan        | Git/Vercel            | Neon Database             |
| ----------------- | --------------------- | ------------------------- |
| Local Development | Komputer pengembang   | `rebuild-mvp-development` |
| Preview           | Branch `rebuild/mvp`  | `preview/rebuild/mvp`     |
| Production        | Production deployment | `production`              |

---

## Aturan Keamanan

1. Jangan menggunakan koneksi database Production di `.env.local`.
2. Jangan memasukkan `.env.local` ke Git.
3. Jangan mengirim connection string melalui chat, email, atau dokumen publik.
4. Jangan menjalankan `db:push` pada Preview atau Production; gunakan migration versioned dan periksa hostname target.
5. Gunakan database Preview atau Development untuk pengujian.
6. Lakukan backup sebelum mengubah schema Production.
7. Setelah serah-terima, seluruh password dan secret harus diganti oleh pihak penerima.

---

## Pemeriksaan Sebelum Pengembangan

Pastikan aplikasi lokal tidak menggunakan database Production.

Jalankan:

```bash
npm run dev
```

Aplikasi memiliki pengaman yang akan menolak koneksi Production ketika dijalankan dari lingkungan lokal.

````

Setelah disimpan:

```bash
git add docs/ENVIRONMENT_SETUP.md
git commit -m "docs: document environment database separation"
git push
````

Pastikan commit dan push berhasil. Karena hanya dokumentasi, tidak perlu menjalankan build lagi.
