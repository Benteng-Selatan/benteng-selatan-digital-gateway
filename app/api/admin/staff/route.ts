import { requireAdminPermission } from "@/lib/auth";
import { auditContextFromRequest } from "@/lib/audit";
import { createStaffUser, listStaffUsers } from "@/lib/staff";

export async function GET() {
  const session = await requireAdminPermission("staff:manage");
  if (!session) return Response.json({ message: "Akses ditolak." }, { status: 403 });
  return Response.json({ staff: await listStaffUsers() });
}

export async function POST(request: Request) {
  const session = await requireAdminPermission("staff:manage");
  if (!session) return Response.json({ message: "Akses ditolak." }, { status: 403 });
  try {
    const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!payload) throw new Error("Data akun tidak valid.");
    const result = await createStaffUser(payload, session, auditContextFromRequest(request));
    return Response.json({ ok: true, ...result }, { status: 201 });
  } catch (error) {
    return Response.json({ message: error instanceof Error ? error.message : "Akun gagal dibuat." }, { status: 400 });
  }
}
