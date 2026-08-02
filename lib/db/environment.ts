export type DatabaseTargetEnvironment = "development" | "preview" | "production" | "test";

function appEnvironment(): DatabaseTargetEnvironment {
  if (process.env.NODE_ENV === "test") return "test";
  const value = (process.env.VERCEL_ENV || process.env.APP_ENV || "development").toLowerCase();
  if (value === "production" || value === "preview" || value === "development") return value;
  throw new Error(`APP_ENV/VERCEL_ENV tidak valid: ${value}.`);
}

function targetEnvironment(): DatabaseTargetEnvironment {
  const value = (process.env.DATABASE_TARGET_ENV || "").toLowerCase();
  if (value === "production" || value === "preview" || value === "development" || value === "test") return value;
  if (process.env.NODE_ENV === "test") return "test";
  throw new Error("DATABASE_TARGET_ENV wajib diisi: development, preview, atau production.");
}

function allowedHosts(): string[] {
  return (process.env.DATABASE_ALLOWED_HOSTS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function assertDatabaseEnvironment(databaseUrl: string): { hostname: string; appEnv: DatabaseTargetEnvironment; targetEnv: DatabaseTargetEnvironment } {
  let hostname = "";
  try {
    hostname = new URL(databaseUrl).hostname.toLowerCase();
  } catch {
    throw new Error("DATABASE_URL tidak valid.");
  }

  const appEnv = appEnvironment();
  const targetEnv = targetEnvironment();
  if (appEnv !== targetEnv && !(appEnv === "test" && targetEnv === "test")) {
    throw new Error(`Koneksi database diblokir: environment aplikasi ${appEnv} tidak sama dengan DATABASE_TARGET_ENV ${targetEnv}.`);
  }
  if (!process.env.VERCEL && targetEnv === "production") {
    throw new Error("Koneksi database Production diblokir dari lingkungan lokal.");
  }

  const hosts = allowedHosts();
  if (hosts.length === 0 && targetEnv !== "test") {
    throw new Error("DATABASE_ALLOWED_HOSTS wajib berisi hostname database yang diizinkan.");
  }
  if (hosts.length > 0 && !hosts.includes(hostname)) {
    throw new Error("Hostname DATABASE_URL tidak termasuk DATABASE_ALLOWED_HOSTS. Proses dihentikan untuk mencegah salah target database.");
  }
  return { hostname, appEnv, targetEnv };
}
