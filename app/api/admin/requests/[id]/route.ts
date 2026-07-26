import { hasAdminPermission } from "@/lib/admin-permissions";
import { requireAdminPermission } from "@/lib/auth";
import { auditContextFromRequest, recordAudit } from "@/lib/audit";
import { getStaffRequest, updateStaffRequest } from "@/lib/portal";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminPermission("requests:view");
  if (!session) return Response.json({ message: "Akses ditolak." }, { status: 403 });
  const { id } = await params;
  const canViewSensitive = hasAdminPermission(session.role, "requests:sensitive");
  const item = await getStaffRequest(id, canViewSensitive);
  if (!item) return Response.json({ message: "Pengajuan tidak ditemukan." }, { status: 404 });
  await recordAudit({
    actor: session,
    action: canViewSensitive ? "request.view_sensitive" : "request.view",
    entityType: "service_request",
    entityId: id,
    context: auditContextFromRequest(request),
  });
  return Response.json({ request: item, canViewSensitive });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminPermission("requests:edit");
  if (!session) return Response.json({ message: "Akses ditolak." }, { status: 403 });
  try {
    const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!payload) throw new Error("Data pembaruan tidak valid.");
    const { id } = await params;
    await updateStaffRequest(id, payload, session, auditContextFromRequest(request));
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ message: error instanceof Error ? error.message : "Pembaruan gagal." }, { status: 400 });
  }
}
