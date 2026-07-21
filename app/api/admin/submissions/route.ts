import { isAuthenticated } from "@/lib/auth";
import { listStaffSubmissions } from "@/lib/portal";

export async function GET() {
  if (!(await isAuthenticated())) return Response.json({ message: "Tidak terautentikasi." }, { status: 401 });
  return Response.json({ submissions: await listStaffSubmissions() });
}
