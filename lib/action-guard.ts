import { createHash } from "node:crypto";
import { and, eq, lte } from "drizzle-orm";

import { db, sql } from "@/lib/db";
import { idempotencyRecords } from "@/lib/db/schema";

export interface ActionRateLimitOptions {
  maxAttempts: number;
  windowSeconds: number;
  blockSeconds?: number;
}

export interface ActionRateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

function requestIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";
}

function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function hashRequestPayload(value: unknown): string {
  return digest(typeof value === "string" ? value : JSON.stringify(value));
}

export async function consumeActionRateLimit(
  scope: string,
  actorId: string,
  request: Request,
  options: ActionRateLimitOptions
): Promise<ActionRateLimitResult> {
  const key = digest(`${scope}|${actorId}|${requestIp(request)}`);
  const now = new Date();
  const windowCutoff = new Date(now.getTime() - options.windowSeconds * 1000);
  const blockedUntil = new Date(now.getTime() + (options.blockSeconds ?? options.windowSeconds) * 1000);

  const rows = await sql`
    INSERT INTO action_rate_limits (
      key, scope, actor_id, attempts, window_started_at, blocked_until, updated_at
    ) VALUES (
      ${key}, ${scope}, ${actorId}, 1, ${now}, NULL, ${now}
    )
    ON CONFLICT (key) DO UPDATE SET
      scope = EXCLUDED.scope,
      actor_id = EXCLUDED.actor_id,
      attempts = CASE
        WHEN action_rate_limits.blocked_until IS NOT NULL AND action_rate_limits.blocked_until > ${now}
          THEN action_rate_limits.attempts
        WHEN action_rate_limits.blocked_until IS NOT NULL OR action_rate_limits.window_started_at <= ${windowCutoff}
          THEN 1
        ELSE action_rate_limits.attempts + 1
      END,
      window_started_at = CASE
        WHEN action_rate_limits.blocked_until IS NOT NULL AND action_rate_limits.blocked_until > ${now}
          THEN action_rate_limits.window_started_at
        WHEN action_rate_limits.blocked_until IS NOT NULL OR action_rate_limits.window_started_at <= ${windowCutoff}
          THEN ${now}
        ELSE action_rate_limits.window_started_at
      END,
      blocked_until = CASE
        WHEN action_rate_limits.blocked_until IS NOT NULL AND action_rate_limits.blocked_until > ${now}
          THEN action_rate_limits.blocked_until
        WHEN action_rate_limits.blocked_until IS NOT NULL OR action_rate_limits.window_started_at <= ${windowCutoff}
          THEN NULL
        WHEN action_rate_limits.attempts + 1 > ${options.maxAttempts}
          THEN ${blockedUntil}
        ELSE NULL
      END,
      updated_at = ${now}
    RETURNING attempts, blocked_until
  `;

  const row = rows[0] as { attempts?: number | string; blocked_until?: Date | string | null } | undefined;
  const attempts = Number(row?.attempts || 0);
  const activeBlock = row?.blocked_until ? new Date(row.blocked_until).getTime() : 0;
  const allowed = attempts <= options.maxAttempts && activeBlock <= now.getTime();
  const retryAfterSeconds = allowed
    ? 0
    : Math.max(1, Math.ceil((activeBlock - now.getTime()) / 1000));
  return { allowed, retryAfterSeconds };
}

export class IdempotencyConflictError extends Error {
  constructor(message = "Kunci idempotensi telah digunakan untuk permintaan yang berbeda.") {
    super(message);
    this.name = "IdempotencyConflictError";
  }
}

export class IdempotencyInProgressError extends IdempotencyConflictError {
  constructor() {
    super("Permintaan yang sama sedang diproses. Tunggu sebentar sebelum mencoba kembali.");
    this.name = "IdempotencyInProgressError";
  }
}

function normalizedIdempotencyKey(request: Request): string | null {
  const value = request.headers.get("idempotency-key")?.trim() || "";
  if (!value) return null;
  if (!/^[A-Za-z0-9._:-]{8,160}$/.test(value)) throw new IdempotencyConflictError("Format Idempotency-Key tidak valid.");
  return value;
}

function storedKey(scope: string, actorId: string, rawKey: string): string {
  return digest(`${scope}|${actorId}|${rawKey}`);
}

async function claimIdempotencyRecord(
  key: string,
  scope: string,
  actorId: string,
  requestHash: string
): Promise<boolean> {
  const now = new Date();
  const claimExpiresAt = new Date(now.getTime() + 2 * 60 * 1000);
  await db.delete(idempotencyRecords).where(and(
    eq(idempotencyRecords.key, key),
    lte(idempotencyRecords.expiresAt, now)
  ));
  const inserted = await db.insert(idempotencyRecords).values({
    key,
    scope,
    actorId,
    requestHash,
    responseBody: {},
    statusCode: 0,
    expiresAt: claimExpiresAt,
    createdAt: now,
  }).onConflictDoNothing().returning({ key: idempotencyRecords.key });
  return inserted.length > 0;
}

export async function getIdempotentResponse(
  request: Request,
  scope: string,
  actorId: string,
  requestHash: string
): Promise<{ body: Record<string, unknown>; statusCode: number } | null> {
  const rawKey = normalizedIdempotencyKey(request);
  if (!rawKey) return null;
  const key = storedKey(scope, actorId, rawKey);
  if (await claimIdempotencyRecord(key, scope, actorId, requestHash)) return null;

  const [record] = await db.select().from(idempotencyRecords).where(eq(idempotencyRecords.key, key)).limit(1);
  if (!record) {
    if (await claimIdempotencyRecord(key, scope, actorId, requestHash)) return null;
    throw new IdempotencyInProgressError();
  }
  if (record.requestHash !== requestHash) throw new IdempotencyConflictError();
  if (record.statusCode === 0) throw new IdempotencyInProgressError();
  return { body: record.responseBody, statusCode: record.statusCode };
}

export async function saveIdempotentResponse(
  request: Request,
  scope: string,
  actorId: string,
  requestHash: string,
  body: Record<string, unknown>,
  statusCode: number,
  ttlSeconds = 24 * 60 * 60
): Promise<void> {
  const rawKey = normalizedIdempotencyKey(request);
  if (!rawKey) return;
  const key = storedKey(scope, actorId, rawKey);
  await db.update(idempotencyRecords).set({
    responseBody: body,
    statusCode,
    expiresAt: new Date(Date.now() + ttlSeconds * 1000),
  }).where(and(
    eq(idempotencyRecords.key, key),
    eq(idempotencyRecords.requestHash, requestHash)
  ));
}

export function rateLimitResponse(result: ActionRateLimitResult): Response {
  return Response.json(
    { message: "Terlalu banyak permintaan. Silakan coba kembali setelah jeda." },
    { status: 429, headers: { "Retry-After": String(result.retryAfterSeconds) } }
  );
}
