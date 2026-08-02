````markdown
# Prosedur Backup dan Restore Database

Dokumen ini menjelaskan prosedur backup dan restore database PostgreSQL Neon untuk proyek Benteng Selatan Digital Gateway.

## Persyaratan

Pastikan PostgreSQL Command Line Tools tersedia:

```bash
pg_dump --version
pg_restore --version
````

Versi yang digunakan sebaiknya sama atau lebih baru dari versi PostgreSQL Neon.

## Lingkungan Database

| Lingkungan        | Branch Neon               |
| ----------------- | ------------------------- |
| Local Development | `rebuild-mvp-development` |
| Vercel Preview    | `preview/rebuild/mvp`     |
| Production        | `production`              |

Backup dan pengujian restore harus dilakukan terlebih dahulu pada database development.

---

## Membuat Backup Development

Buat folder backup di luar repository:

```bash
mkdir -p ../database-backups
```

Jalankan backup:

```bash
node --env-file=.env.local <<'NODE'
import { spawnSync } from "node:child_process";
import { mkdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

const connectionString =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Koneksi database tidak ditemukan.");
}

const url = new URL(connectionString);

const stamp = new Date()
  .toISOString()
  .replace(/[-:]/g, "")
  .replace(/\..+/, "")
  .replace("T", "-");

const backupDirectory = resolve("..", "database-backups");

const backupFile = resolve(
  backupDirectory,
  `database-development-${stamp}.dump`
);

mkdirSync(backupDirectory, {
  recursive: true,
});

const result = spawnSync(
  "pg_dump",
  [
    "--host", url.hostname,
    "--port", url.port || "5432",
    "--username", decodeURIComponent(url.username),
    "--dbname", decodeURIComponent(url.pathname.slice(1)),
    "--format=custom",
    "--no-owner",
    "--no-privileges",
    "--file", backupFile,
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      PGPASSWORD: decodeURIComponent(url.password),
      PGSSLMODE: "require",
    },
  }
);

if (result.status !== 0) {
  throw new Error(`Backup gagal dengan kode ${result.status}`);
}

const size = statSync(backupFile).size;

console.log("Backup selesai.");
console.log("Lokasi:", backupFile);
console.log("Ukuran:", `${(size / 1024).toFixed(2)} KB`);
NODE
```

File backup disimpan di luar repository agar tidak masuk ke Git.

---

## Memeriksa Arsip Backup

```bash
LATEST_BACKUP=$(ls -t ../database-backups/*.dump | head -n 1)

pg_restore --list "$LATEST_BACKUP"
```

Backup dinyatakan valid apabila daftar tabel, data, index, dan objek database dapat ditampilkan tanpa error.

---

## Uji Restore

Buat branch Neon sementara:

```text
restore-test
```

Gunakan parent branch:

```text
rebuild-mvp-development
```

Salin Direct Connection String branch tersebut ke file:

```text
.env.restore-test
```

Isi:

```env
RESTORE_DATABASE_URL="direct-connection-string"
```

Jalankan restore:

```bash
LATEST_BACKUP=$(ls -t ../database-backups/*.dump | head -n 1)

node --env-file=.env.restore-test - "$LATEST_BACKUP" <<'NODE'
import { spawnSync } from "node:child_process";

const backupFile = process.argv[2];
const connectionString = process.env.RESTORE_DATABASE_URL;

if (!backupFile || !connectionString) {
  throw new Error("File backup atau koneksi restore tidak tersedia.");
}

const url = new URL(connectionString);

const result = spawnSync(
  "pg_restore",
  [
    "--host", url.hostname,
    "--port", url.port || "5432",
    "--username", decodeURIComponent(url.username),
    "--dbname", decodeURIComponent(url.pathname.slice(1)),
    "--clean",
    "--if-exists",
    "--no-owner",
    "--no-privileges",
    "--exit-on-error",
    backupFile,
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      PGPASSWORD: decodeURIComponent(url.password),
      PGSSLMODE: "require",
    },
  }
);

if (result.status !== 0) {
  throw new Error(`Restore gagal dengan kode ${result.status}`);
}

console.log("Restore selesai.");
NODE
```

---

## Verifikasi Hasil Restore

Bandingkan jumlah data pada database development dan database hasil restore:

```bash
node --env-file=.env.local --env-file=.env.restore-test <<'NODE'
import { neon } from "@neondatabase/serverless";

const development = neon(
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.DATABASE_URL
);

const restored = neon(
  process.env.RESTORE_DATABASE_URL
);

const tables = [
  "cms_documents",
  "citizen_users",
  "service_requests",
  "service_request_messages",
  "service_request_history",
  "content_submissions",
  "login_rate_limits",
  "staff_users",
  "audit_logs",
];

for (const table of tables) {
  const query =
    `SELECT COUNT(*)::int AS total FROM "${table}"`;

  const developmentResult =
    await development.query(query);

  const restoredResult =
    await restored.query(query);

  const developmentCount =
    developmentResult[0].total;

  const restoredCount =
    restoredResult[0].total;

  console.log(
    `${table}: ${
      developmentCount === restoredCount
        ? "MATCH"
        : "BERBEDA"
    }`
  );
}
NODE
```

Restore dinyatakan berhasil apabila seluruh tabel menunjukkan:

```text
MATCH
```

---

## Pembersihan Setelah Pengujian

Hapus file koneksi sementara:

```bash
rm .env.restore-test
```

Kemudian hapus branch Neon:

```text
restore-test
```

File backup tetap disimpan pada lokasi yang aman.

---

## Ketentuan Keamanan

1. Jangan memasukkan file backup ke repository Git.
2. Jangan membagikan connection string database.
3. Gunakan Direct Connection untuk proses backup dan restore.
4. Jangan melakukan restore langsung ke Production.
5. Uji file backup pada branch sementara sebelum digunakan.
6. Pastikan backup dibuat sebelum perubahan schema Production.
7. Simpan backup pada media yang memiliki kontrol akses.


