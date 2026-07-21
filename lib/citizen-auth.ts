import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const CITIZEN_SESSION_COOKIE = "benteng_citizen_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

export interface CitizenSession {
  userId: string;
  email: string;
  expiresAt: number;
}

function getSecret(): string {
  const value = process.env.CITIZEN_SESSION_SECRET || process.env.CMS_SESSION_SECRET;
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error("CITIZEN_SESSION_SECRET atau CMS_SESSION_SECRET wajib tersedia di production.");
  }
  return value || "development-citizen-session-secret";
}

function sign(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  return aBuffer.length === bBuffer.length && timingSafeEqual(aBuffer, bBuffer);
}

export function createCitizenSessionToken(userId: string, email: string): string {
  const payload = Buffer.from(JSON.stringify({
    userId,
    email,
    expiresAt: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS,
  })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyCitizenSessionToken(token?: string): CitizenSession | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return null;
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as CitizenSession;
    if (!decoded.userId || !decoded.email || decoded.expiresAt <= Math.floor(Date.now() / 1000)) return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function getCitizenSession(): Promise<CitizenSession | null> {
  const store = await cookies();
  return verifyCitizenSessionToken(store.get(CITIZEN_SESSION_COOKIE)?.value);
}

export const citizenSessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_DURATION_SECONDS,
};
