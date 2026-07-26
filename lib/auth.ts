import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { count, eq } from "drizzle-orm";

import {
  ADMIN_ROLES,
  type AdminPermission,
  type AdminRole,
  hasAdminPermission,
  permissionsForRole,
} from "@/lib/admin-permissions";
import { db } from "@/lib/db";
import { staffUsers } from "@/lib/db/schema";
import { hashPassword, verifyPassword } from "@/lib/security";

export const SESSION_COOKIE = "benteng_cms_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 8;

export interface PublicAdminSession {
  userId: string;
  username: string;
  fullName: string;
  role: AdminRole;
  permissions: AdminPermission[];
}

export interface AdminSession {
  userId: string;
  username: string;
  fullName: string;
  role: AdminRole;
  sessionVersion: number;
  expiresAt: number;
}

function requiredSecret(): string {
  const value = process.env.CMS_SESSION_SECRET;
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error("CMS_SESSION_SECRET wajib tersedia di environment production.");
  }
  return value || "development-only-secret-change-before-production";
}

function sign(value: string): string {
  return createHmac("sha256", requiredSecret()).update(value).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  return aBuffer.length === bBuffer.length && timingSafeEqual(aBuffer, bBuffer);
}

function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

function bootstrapCredentialsAreValid(username: string, password: string): boolean {
  const expectedUsername = process.env.CMS_USERNAME;
  const expectedPassword = process.env.CMS_PASSWORD;
  if (!expectedUsername || !expectedPassword) return false;
  return safeEqual(normalizeUsername(username), normalizeUsername(expectedUsername)) &&
    safeEqual(password, expectedPassword);
}

async function bootstrapInitialAdmin(username: string, password: string) {
  const [{ total }] = await db.select({ total: count() }).from(staffUsers);
  if (Number(total) > 0 || !bootstrapCredentialsAreValid(username, password)) return null;

  const now = new Date();
  const id = randomUUID();
  const normalized = normalizeUsername(username);
  await db.insert(staffUsers).values({
    id,
    username: normalized,
    passwordHash: hashPassword(password),
    fullName: "Administrator Kelurahan",
    role: "super_admin",
    isActive: true,
    sessionVersion: 1,
    lastLoginAt: now,
    createdAt: now,
    updatedAt: now,
  }).onConflictDoNothing();

  const [created] = await db.select().from(staffUsers).where(eq(staffUsers.username, normalized)).limit(1);
  return created || null;
}

export async function authenticateAdmin(usernameInput: string, password: string) {
  const username = normalizeUsername(usernameInput);
  if (!username || !password) return null;

  const [existingUser] = await db
    .select()
    .from(staffUsers)
    .where(eq(staffUsers.username, username))
    .limit(1);
  const user = existingUser ?? await bootstrapInitialAdmin(username, password);
  if (!user || !user.isActive || !verifyPassword(password, user.passwordHash)) return null;
  if (!ADMIN_ROLES.includes(user.role)) return null;

  const now = new Date();
  await db.update(staffUsers).set({ lastLoginAt: now, updatedAt: now }).where(eq(staffUsers.id, user.id));
  return {
    userId: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    sessionVersion: user.sessionVersion,
  };
}

export function createSessionToken(
  user: Omit<AdminSession, "expiresAt">
): string {
  const payloadData: AdminSession = {
    ...user,
    expiresAt: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS,
  };
  const payload = Buffer.from(JSON.stringify(payloadData)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decodeSessionToken(token?: string): AdminSession | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return null;
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AdminSession;
    if (!decoded.userId || !decoded.username || !ADMIN_ROLES.includes(decoded.role)) return null;
    if (decoded.expiresAt <= Math.floor(Date.now() / 1000)) return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const store = await cookies();
  const decoded = decodeSessionToken(store.get(SESSION_COOKIE)?.value);
  if (!decoded) return null;

  const [user] = await db
    .select({
      id: staffUsers.id,
      username: staffUsers.username,
      fullName: staffUsers.fullName,
      role: staffUsers.role,
      isActive: staffUsers.isActive,
      sessionVersion: staffUsers.sessionVersion,
    })
    .from(staffUsers)
    .where(eq(staffUsers.id, decoded.userId))
    .limit(1);

  if (!user?.isActive || user.sessionVersion !== decoded.sessionVersion) return null;
  return {
    userId: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    sessionVersion: user.sessionVersion,
    expiresAt: decoded.expiresAt,
  };
}

export async function isAuthenticated(): Promise<boolean> {
  return Boolean(await getAdminSession());
}

export async function requireAdminPermission(
  permission: AdminPermission
): Promise<AdminSession | null> {
  const session = await getAdminSession();
  return session && hasAdminPermission(session.role, permission) ? session : null;
}

export function publicAdminSession(session: AdminSession): PublicAdminSession {
  return {
    userId: session.userId,
    username: session.username,
    fullName: session.fullName,
    role: session.role,
    permissions: permissionsForRole(session.role),
  };
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_DURATION_SECONDS,
};
