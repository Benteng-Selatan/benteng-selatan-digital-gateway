import { createHash } from "node:crypto";

import { sqlClient } from "@/lib/db";

export class RateLimitError extends Error {
  readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super("Terlalu banyak percobaan. Silakan coba kembali beberapa saat lagi.");
    this.name = "RateLimitError";
    this.retryAfterSeconds = Math.max(1, Math.ceil(retryAfterSeconds));
  }
}

export function clientAddress(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";
}

function bucketKey(scope: string, identifier: string): string {
  return createHash("sha256").update(`${scope}:${identifier}`).digest("hex");
}

export async function enforceRateLimit({
  scope,
  identifier,
  limit,
  windowSeconds,
}: {
  scope: string;
  identifier: string;
  limit: number;
  windowSeconds: number;
}): Promise<void> {
  const now = new Date();
  const cutoff = new Date(now.getTime() - windowSeconds * 1000);
  const expiresAt = new Date(now.getTime() + windowSeconds * 1000);
  const key = bucketKey(scope, identifier);

  const rows = await sqlClient`
    WITH cleanup AS (
      DELETE FROM rate_limit_buckets
      WHERE expires_at < ${now.toISOString()}::timestamptz
        AND key <> ${key}
      RETURNING key
    )
    INSERT INTO rate_limit_buckets (key, count, window_started_at, expires_at)
    VALUES (${key}, 1, ${now.toISOString()}::timestamptz, ${expiresAt.toISOString()}::timestamptz)
    ON CONFLICT (key) DO UPDATE
    SET count = CASE
          WHEN rate_limit_buckets.window_started_at <= ${cutoff.toISOString()}::timestamptz THEN 1
          ELSE rate_limit_buckets.count + 1
        END,
        window_started_at = CASE
          WHEN rate_limit_buckets.window_started_at <= ${cutoff.toISOString()}::timestamptz
            THEN ${now.toISOString()}::timestamptz
          ELSE rate_limit_buckets.window_started_at
        END,
        expires_at = CASE
          WHEN rate_limit_buckets.window_started_at <= ${cutoff.toISOString()}::timestamptz
            THEN ${expiresAt.toISOString()}::timestamptz
          ELSE rate_limit_buckets.window_started_at + (${windowSeconds} * interval '1 second')
        END
    RETURNING count, window_started_at
  `;

  const row = rows[0] as { count?: number | string; window_started_at?: string | Date } | undefined;
  const count = Number(row?.count || 0);
  if (count <= limit) return;

  const startedAt = row?.window_started_at instanceof Date
    ? row.window_started_at
    : new Date(String(row?.window_started_at || now.toISOString()));
  const retryAt = startedAt.getTime() + windowSeconds * 1000;
  throw new RateLimitError((retryAt - now.getTime()) / 1000);
}

export function rateLimitResponse(error: RateLimitError): Response {
  return Response.json(
    { message: error.message },
    {
      status: 429,
      headers: { "Retry-After": String(error.retryAfterSeconds) },
    },
  );
}
