import { randomUUID } from "node:crypto";
import { and, asc, count, eq, ne } from "drizzle-orm";

import { ADMIN_ROLES, type AdminRole } from "@/lib/admin-permissions";
import type { AdminSession } from "@/lib/auth";
import { auditValues, type AuditContext } from "@/lib/audit";
import { db, sql } from "@/lib/db";
import { staffUsers } from "@/lib/db/schema";
import { hashPassword } from "@/lib/security";

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function normalizeUsername(value: unknown): string {
  return clean(value, 80).toLowerCase();
}

function validateUsername(username: string) {
  if (!/^[a-z0-9._-]{3,80}$/.test(username)) {
    throw new Error("Nama pengguna minimal 3 karakter dan hanya boleh berisi huruf kecil, angka, titik, garis bawah, atau tanda hubung.");
  }
}

function validatePassword(password: string) {
  if (password.length < 12) throw new Error("Kata sandi petugas minimal 12 karakter.");
}

export async function listStaffUsers() {
  const rows = await db.select({
    id: staffUsers.id,
    username: staffUsers.username,
    fullName: staffUsers.fullName,
    role: staffUsers.role,
    isActive: staffUsers.isActive,
    lastLoginAt: staffUsers.lastLoginAt,
    createdAt: staffUsers.createdAt,
    updatedAt: staffUsers.updatedAt,
  }).from(staffUsers).orderBy(asc(staffUsers.fullName));
  return rows.map((row) => ({
    ...row,
    lastLoginAt: row.lastLoginAt?.toISOString() || null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export async function createStaffUser(
  input: Record<string, unknown>,
  actor: AdminSession,
  context: AuditContext
) {
  const username = normalizeUsername(input.username);
  const fullName = clean(input.fullName, 120);
  const password = clean(input.password, 256);
  const role = clean(input.role, 40) as AdminRole;
  validateUsername(username);
  validatePassword(password);
  if (fullName.length < 3) throw new Error("Nama petugas wajib diisi.");
  if (!ADMIN_ROLES.includes(role)) throw new Error("Role petugas tidak valid.");
  const [existing] = await db.select({ id: staffUsers.id }).from(staffUsers).where(eq(staffUsers.username, username)).limit(1);
  if (existing) throw new Error("Nama pengguna tersebut sudah dipakai.");

  const id = randomUUID();
  const now = new Date();
  const audit = auditValues({ actor, context, action: "staff.create", entityType: "staff_user", entityId: id, metadata: { username, fullName, role } });
  await sql.transaction([
    sql`INSERT INTO staff_users (id, username, password_hash, full_name, role, is_active, session_version, created_at, updated_at)
        VALUES (${id}, ${username}, ${hashPassword(password)}, ${fullName}, ${role}, true, 1, ${now}, ${now})`,
    sql`INSERT INTO audit_logs (id, actor_id, actor_username, actor_name, actor_role, action, entity_type, entity_id, metadata, ip_address, user_agent, created_at)
        VALUES (${audit.id}, ${audit.actorId}, ${audit.actorUsername}, ${audit.actorName}, ${audit.actorRole}, ${audit.action}, ${audit.entityType}, ${audit.entityId}, ${JSON.stringify(audit.metadata)}::jsonb, ${audit.ipAddress}, ${audit.userAgent}, ${audit.createdAt})`,
  ]);
  return { id };
}

export async function updateStaffUser(
  id: string,
  input: Record<string, unknown>,
  actor: AdminSession,
  context: AuditContext
) {
  const [current] = await db.select().from(staffUsers).where(eq(staffUsers.id, id)).limit(1);
  if (!current) throw new Error("Akun petugas tidak ditemukan.");

  const fullName = clean(input.fullName, 120) || current.fullName;
  const role = (clean(input.role, 40) || current.role) as AdminRole;
  const isActive =
    typeof input.isActive === "boolean"
      ? input.isActive
      : typeof input.isActive === "string"
        ? input.isActive === "true"
        : current.isActive;
  const password = clean(input.password, 256);
  if (fullName.length < 3) throw new Error("Nama petugas wajib diisi.");
  if (!ADMIN_ROLES.includes(role)) throw new Error("Role petugas tidak valid.");
  if (password) validatePassword(password);
  if (actor.userId === id && !isActive) throw new Error("Anda tidak dapat menonaktifkan akun sendiri.");

  if (current.role === "super_admin" && (role !== "super_admin" || !isActive)) {
    const [{ total }] = await db.select({ total: count() }).from(staffUsers).where(and(eq(staffUsers.role, "super_admin"), eq(staffUsers.isActive, true), ne(staffUsers.id, id)));
    if (Number(total) < 1) throw new Error("Minimal satu Super Admin aktif harus dipertahankan.");
  }

  const securityChanged = Boolean(password) || role !== current.role || isActive !== current.isActive;
  const sessionVersion = current.sessionVersion + (securityChanged ? 1 : 0);
  const now = new Date();
  const passwordHash = password ? hashPassword(password) : current.passwordHash;
  const audit = auditValues({ actor, context, action: "staff.update", entityType: "staff_user", entityId: id, metadata: { username: current.username, previousRole: current.role, role, previousActive: current.isActive, isActive, passwordChanged: Boolean(password) } });
  await sql.transaction([
    sql`UPDATE staff_users SET full_name=${fullName}, role=${role}, is_active=${isActive}, password_hash=${passwordHash}, session_version=${sessionVersion}, updated_at=${now} WHERE id=${id}`,
    sql`INSERT INTO audit_logs (id, actor_id, actor_username, actor_name, actor_role, action, entity_type, entity_id, metadata, ip_address, user_agent, created_at)
        VALUES (${audit.id}, ${audit.actorId}, ${audit.actorUsername}, ${audit.actorName}, ${audit.actorRole}, ${audit.action}, ${audit.entityType}, ${audit.entityId}, ${JSON.stringify(audit.metadata)}::jsonb, ${audit.ipAddress}, ${audit.userAgent}, ${audit.createdAt})`,
  ]);
}
