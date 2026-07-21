import { createCipheriv, createDecipheriv, createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

function encryptionKey(): Buffer {
  const source = process.env.CITIZEN_DATA_ENCRYPTION_KEY || process.env.CMS_SESSION_SECRET;
  if (!source && process.env.NODE_ENV === "production") {
    throw new Error("CITIZEN_DATA_ENCRYPTION_KEY atau CMS_SESSION_SECRET wajib tersedia di production.");
  }
  return createHash("sha256").update(source || "development-citizen-data-key").digest();
}

export function encryptSensitive(value: string): string {
  const normalized = value.trim();
  if (!normalized) return "";
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(normalized, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((part) => part.toString("base64url")).join(".");
}

export function decryptSensitive(value: string): string {
  if (!value) return "";
  const [ivPart, tagPart, encryptedPart] = value.split(".");
  if (!ivPart || !tagPart || !encryptedPart) return "";
  try {
    const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivPart, "base64url"));
    decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(encryptedPart, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return "";
  }
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
