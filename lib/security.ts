import { createCipheriv, createDecipheriv, createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export class SensitiveDataDecryptionError extends Error {
  constructor() {
    super("Data sensitif tidak dapat didekripsi. Periksa konfigurasi kunci enkripsi dan jangan mengubah kunci tanpa proses rotasi.");
    this.name = "SensitiveDataDecryptionError";
  }
}

function deriveKey(source: string): Buffer {
  return createHash("sha256").update(source).digest();
}

function encryptionKey(): Buffer {
  const source = process.env.CITIZEN_DATA_ENCRYPTION_KEY;
  if (!source) {
    throw new Error("CITIZEN_DATA_ENCRYPTION_KEY wajib tersedia dan tidak boleh menggunakan session secret.");
  }
  if (source.length < 32) throw new Error("CITIZEN_DATA_ENCRYPTION_KEY minimal 32 karakter.");
  return deriveKey(source);
}

function legacyEncryptionKey(): Buffer | null {
  const source = process.env.CITIZEN_DATA_LEGACY_ENCRYPTION_KEY;
  return source ? deriveKey(source) : null;
}

function decryptWithKey(parts: string[], key: Buffer): string {
  const [ivPart, tagPart, encryptedPart] = parts;
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivPart, "base64url"));
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedPart, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function encryptSensitive(value: string): string {
  const normalized = value.trim();
  if (!normalized) return "";
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(normalized, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ["v2", iv, tag, encrypted].map((part) => typeof part === "string" ? part : part.toString("base64url")).join(".");
}

export function decryptSensitive(value: string): string {
  if (!value) return "";
  const rawParts = value.split(".");
  const parts = rawParts[0] === "v2" ? rawParts.slice(1) : rawParts;
  if (parts.length !== 3 || parts.some((part) => !part)) throw new SensitiveDataDecryptionError();

  const keys = [encryptionKey(), legacyEncryptionKey()].filter((key): key is Buffer => Boolean(key));
  for (const key of keys) {
    try {
      return decryptWithKey(parts, key);
    } catch {
      // Try the explicitly configured legacy key before reporting a controlled failure.
    }
  }
  throw new SensitiveDataDecryptionError();
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, 64);
  return `scrypt:${salt.toString("base64url")}:${derived.toString("base64url")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [algorithm, saltPart, hashPart] = stored.split(":");
  if (algorithm !== "scrypt" || !saltPart || !hashPart) return false;
  const expected = Buffer.from(hashPart, "base64url");
  const actual = scryptSync(password, Buffer.from(saltPart, "base64url"), expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
