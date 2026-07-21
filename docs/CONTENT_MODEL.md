# Model Konten

Data utama tersimpan di `data/site-data.json`.

- `site`: identitas portal, hero, dan tombol utama.
- `profile`: profil wilayah, masyarakat, potensi, fasilitas, dan pemerintahan.
- `contact`: alamat dan kanal resmi.
- `services`: informasi layanan publik.
- `socialStatistics`: statistik sosial agregat.
- `socialContent`: narasi anonim, alur, rekomendasi, dan catatan privasi.
- `umkm`: direktori usaha dengan kontrol izin kontak.
- `mapLocations`: titik fasilitas dan potensi yang aman dipublikasikan.
- `stories`: wisata, budaya, sejarah, dan kearifan lokal.

Setiap konten dinamis memiliki `status`:

- `draft`: tersimpan di CMS, tidak muncul pada website publik.
- `published`: muncul pada website publik.
