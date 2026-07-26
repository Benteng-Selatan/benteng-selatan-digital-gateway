# Model Konten

Data utama aplikasi dan CMS tersimpan di database PostgreSQL Neon.

Struktur data dikelola melalui schema database di folder `lib/db`.
File JSON hanya digunakan sebagai data awal atau keperluan migrasi, bukan sebagai penyimpanan utama saat aplikasi berjalan.

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
