import { requireAdminPermission } from "@/lib/auth";
import { auditContextFromRequest } from "@/lib/audit";
import { updateStaffUser } from "@/lib/staff";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminPermission("staff:manage");
  if (!session) return Response.json({ message: "Akses ditolak." }, { status: 403 });
  try {
    const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!payload) throw new Error("Data akun tidak valid.");
    const { id } = await params;
    await updateStaffUser(id, payload, session, auditContextFromRequest(request));
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ message: error instanceof Error ? error.message : "Akun gagal diperbarui." }, { status: 400 });
  }
}
