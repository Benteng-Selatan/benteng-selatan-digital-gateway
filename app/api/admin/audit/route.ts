import { requireAdminPermission } from "@/lib/auth";
import { listAuditLogs } from "@/lib/audit";

export async function GET(request: Request) {
  const session = await requireAdminPermission("audit:view");
  if (!session) return Response.json({ message: "Akses ditolak." }, { status: 403 });
  const limit = Number(new URL(request.url).searchParams.get("limit") || "200");
  return Response.json({ logs: await listAuditLogs(limit) });
}
