import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "benteng_cms_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 8;

function requiredEnv(name: "CMS_SESSION_SECRET" | "CMS_USERNAME" | "CMS_PASSWORD", developmentFallback: string): string {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`${name} wajib tersedia di environment production.`);
  }
  return value || developmentFallback;
}

function getSecret(): string {
  return requiredEnv("CMS_SESSION_SECRET", "development-only-secret-change-before-production");
}

function sign(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.length !== bBuffer.length) return false;
  return timingSafeEqual(aBuffer, bBuffer);
}

export function credentialsAreValid(username: string, password: string): boolean {
  const expectedUsername = requiredEnv("CMS_USERNAME", "admin");
  const expectedPassword = requiredEnv("CMS_PASSWORD", "admin123");
  return safeEqual(username, expectedUsername) && safeEqual(password, expectedPassword);
}

export function createSessionToken(username: string): string {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS;
  const payload = Buffer.from(JSON.stringify({ username, expiresAt })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token?: string): boolean {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return false;

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      username: string;
      expiresAt: number;
    };
    return Boolean(decoded.username) && decoded.expiresAt > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_DURATION_SECONDS,
};
