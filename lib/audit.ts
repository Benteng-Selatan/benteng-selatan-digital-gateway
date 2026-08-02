import { randomUUID } from "node:crypto";
import { desc } from "drizzle-orm";

import type { AdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";

export interface AuditActorIdentity {
  id: string;
  username: string;
  name: string;
  role: string;
}

export interface AuditContext {
  ipAddress: string;
  userAgent: string;
}

export function auditContextFromRequest(request?: Request): AuditContext {
  if (!request) return { ipAddress: "unknown", userAgent: "" };
  const forwarded = request.headers.get("x-forwarded-for");
  return {
    ipAddress: forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown",
    userAgent: request.headers.get("user-agent")?.slice(0, 500) || "",
  };
}

export function auditValues(input: {
  actor?: AdminSession | null;
  actorIdentity?: AuditActorIdentity;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  context?: AuditContext;
}) {
  return {
    id: randomUUID(),
    actorId: input.actor?.userId || input.actorIdentity?.id || null,
    actorUsername: input.actor?.username || input.actorIdentity?.username || "anonymous",
    actorName: input.actor?.fullName || input.actorIdentity?.name || "Anonymous",
    actorRole: input.actor?.role || input.actorIdentity?.role || "anonymous",
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId || "",
    metadata: input.metadata || {},
    ipAddress: input.context?.ipAddress || "unknown",
    userAgent: input.context?.userAgent || "",
    createdAt: new Date(),
  };
}

export async function recordAudit(input: Parameters<typeof auditValues>[0]) {
  await db.insert(auditLogs).values(auditValues(input));
}

export async function listAuditLogs(limit = 200) {
  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(Math.trunc(limit), 1), 500) : 200;
  const rows = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(safeLimit);
  return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
}
