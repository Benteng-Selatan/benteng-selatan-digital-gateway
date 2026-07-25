import { createCipheriv, createDecipheriv, createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const ENCRYPTION_VERSION = "v1";

export class SensitiveDataDecryptionError extends Error {
  constructor() {
    super("Data sensitif tidak dapat didekripsi. Periksa konfigurasi kunci enkripsi.");
    this.name = "SensitiveDataDecryptionError";
  }
}

function requiredProductionSecret(name: "CITIZEN_DATA_ENCRYPTION_KEY", developmentFallback: string): string {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`${name} wajib tersedia di environment production.`);
  }
  if (value && process.env.NODE_ENV === "production" && value.length < 32) {
    throw new Error(`${name} minimal 32 karakter di environment production.`);
  }
  return value || developmentFallback;
}

function encryptionKey(): Buffer {
  const source = requiredProductionSecret("CITIZEN_DATA_ENCRYPTION_KEY", "development-citizen-data-key");
  return createHash("sha256").update(source).digest();
}

function derivePassword(password: string, salt: Buffer, length: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, length, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

export function encryptSensitive(value: string): string {
  const normalized = value.trim();
  if (!normalized) return "";
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(normalized, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [ENCRYPTION_VERSION, iv, tag, encrypted].map((part) => typeof part === "string" ? part : part.toString("base64url")).join(".");
}

export function decryptSensitive(value: string): string {
  if (!value) return "";

  const parts = value.split(".");
  const versioned = parts.length === 4;
  const version = versioned ? parts[0] : "legacy";
  const [ivPart, tagPart, encryptedPart] = versioned ? parts.slice(1) : parts;

  if ((version !== ENCRYPTION_VERSION && version !== "legacy") || !ivPart || !tagPart || !encryptedPart) {
    throw new SensitiveDataDecryptionError();
  }

  try {
    const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivPart, "base64url"));
    decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(encryptedPart, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch (error) {
    console.error("Sensitive data decryption failed:", error instanceof Error ? error.name : "unknown");
    throw new SensitiveDataDecryptionError();
  }
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await derivePassword(password, salt, 64);
  return `scrypt:${salt.toString("base64url")}:${derived.toString("base64url")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algorithm, saltPart, hashPart] = stored.split(":");
  if (algorithm !== "scrypt" || !saltPart || !hashPart) return false;
  const expected = Buffer.from(hashPart, "base64url");
  const actual = await derivePassword(password, Buffer.from(saltPart, "base64url"), expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
