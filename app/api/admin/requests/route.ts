import { requireAdminPermission } from "@/lib/auth";
import { listStaffRequests } from "@/lib/portal";

export async function GET() {
  const session = await requireAdminPermission("requests:view");
  if (!session) return Response.json({ message: "Akses ditolak." }, { status: 403 });
  return Response.json({ requests: await listStaffRequests() });
}
