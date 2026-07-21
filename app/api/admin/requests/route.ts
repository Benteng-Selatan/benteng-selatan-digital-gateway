import { isAuthenticated } from "@/lib/auth";
import { listStaffRequests } from "@/lib/portal";

export async function GET() {
  if (!(await isAuthenticated())) return Response.json({ message: "Tidak terautentikasi." }, { status: 401 });
  return Response.json({ requests: await listStaffRequests() });
}
