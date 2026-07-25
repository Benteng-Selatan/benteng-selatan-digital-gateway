# Model Konten

Sumber data aktif CMS adalah PostgreSQL, tabel `cms_documents`, dalam satu dokumen JSONB ber-ID `main`. File `data/site-data.seed.json` hanya digunakan untuk inisialisasi ketika dokumen CMS belum tersedia. File `data/site-data.json` bukan lagi sumber data runtime.

- `site`: identitas portal, hero, dan tombol utama.
- `profile`: profil wilayah, masyarakat, potensi, fasilitas, dan pemerintahan.
- `contact`: alamat dan kanal resmi.
- `services`: informasi layanan publik.
- `socialStatistics`: statistik sosial agregat.
- `socialContent`: narasi anonim, alur, rekomendasi, dan catatan privasi.
- `umkm`: direktori usaha dengan kontrol izin kontak.
- `mapLocations`: titik fasilitas dan potensi yang aman dipublikasikan.
- `stories`: wisata, budaya, sejarah, dan kearifan lokal.
- `updatedAt`: revision token untuk optimistic concurrency CMS.

Setiap konten dinamis memiliki `status`:

- `draft`: tersimpan di CMS, tidak muncul pada website publik.
- `published`: muncul pada website publik.

Data transaksi warga disimpan secara relasional pada `citizen_users`, `service_requests`, `service_request_messages`, `service_request_history`, dan `content_submissions`. Catatan publik untuk warga dipisahkan dari catatan internal petugas.
