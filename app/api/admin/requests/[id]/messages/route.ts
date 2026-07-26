import { requireAdminPermission } from "@/lib/auth";
import { auditContextFromRequest } from "@/lib/audit";
import { addStaffMessage } from "@/lib/portal";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminPermission("requests:message");
  if (!session) return Response.json({ message: "Akses ditolak." }, { status: 403 });
  try {
    const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!payload) throw new Error("Data pesan tidak valid.");
    const { id } = await params;
    await addStaffMessage(id, payload, session, auditContextFromRequest(request));
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ message: error instanceof Error ? error.message : "Pesan gagal dikirim." }, { status: 400 });
  }
}
