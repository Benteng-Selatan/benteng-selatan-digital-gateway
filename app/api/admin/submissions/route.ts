import { requireAdminPermission } from "@/lib/auth";
import { listStaffSubmissions } from "@/lib/portal";

export async function GET() {
  const session = await requireAdminPermission("submissions:view");
  if (!session) return Response.json({ message: "Akses ditolak." }, { status: 403 });
  return Response.json({ submissions: await listStaffSubmissions() });
}
