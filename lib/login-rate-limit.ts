import { createHash } from "node:crypto";

import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { loginRateLimits } from "@/lib/db/schema";

const MAX_ATTEMPTS = 5;
const WINDOW_DURATION_MS = 15 * 60 * 1000;
const BLOCK_DURATION_MS = 15 * 60 * 1000;

interface RateLimitStatus {
  allowed: boolean;
  retryAfterSeconds: number;
}

function createRateLimitKey(
  scope: string,
  identifier: string,
  ipAddress: string
): string {
  return createHash("sha256")
    .update(`${scope}:${identifier.toLowerCase()}:${ipAddress}`)
    .digest("hex");
}

export function getRequestIpAddress(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export function buildLoginRateLimitKey(
  scope: "cms" | "citizen" | "citizen-register",
  identifier: string,
  request: Request
): string {
  return createRateLimitKey(
    scope,
    identifier.trim(),
    getRequestIpAddress(request)
  );
}

export async function checkLoginRateLimit(
  key: string
): Promise<RateLimitStatus> {
  const [record] = await db
    .select()
    .from(loginRateLimits)
    .where(eq(loginRateLimits.key, key))
    .limit(1);

  if (!record) {
    return {
      allowed: true,
      retryAfterSeconds: 0,
    };
  }

  const now = Date.now();

  if (record.blockedUntil && record.blockedUntil.getTime() > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(
        (record.blockedUntil.getTime() - now) / 1000
      ),
    };
  }

  const windowExpired =
    now - record.windowStartedAt.getTime() >= WINDOW_DURATION_MS;

  if (windowExpired) {
    await clearLoginRateLimit(key);

    return {
      allowed: true,
      retryAfterSeconds: 0,
    };
  }

  return {
    allowed: record.attempts < MAX_ATTEMPTS,
    retryAfterSeconds: 0,
  };
}

export async function recordLoginFailure(key: string): Promise<void> {
  const [record] = await db
    .select()
    .from(loginRateLimits)
    .where(eq(loginRateLimits.key, key))
    .limit(1);

  const now = new Date();

  if (!record) {
    await db.insert(loginRateLimits).values({
      key,
      attempts: 1,
      windowStartedAt: now,
      updatedAt: now,
    });

    return;
  }

  const windowExpired =
    now.getTime() - record.windowStartedAt.getTime() >=
    WINDOW_DURATION_MS;

  const attempts = windowExpired ? 1 : record.attempts + 1;
  const blockedUntil =
    attempts >= MAX_ATTEMPTS
      ? new Date(now.getTime() + BLOCK_DURATION_MS)
      : null;

  await db
    .update(loginRateLimits)
    .set({
      attempts,
      windowStartedAt: windowExpired
        ? now
        : record.windowStartedAt,
      blockedUntil,
      updatedAt: now,
    })
    .where(eq(loginRateLimits.key, key));
}

export async function clearLoginRateLimit(
  key: string
): Promise<void> {
  await db
    .delete(loginRateLimits)
    .where(eq(loginRateLimits.key, key));
}