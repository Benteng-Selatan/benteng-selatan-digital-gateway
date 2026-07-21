import { isAuthenticated } from "@/lib/auth";
import { getStaffRequest, updateStaffRequest } from "@/lib/portal";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated())) return Response.json({ message: "Tidak terautentikasi." }, { status: 401 });
  const { id } = await params;
  const request = await getStaffRequest(id);
  if (!request) return Response.json({ message: "Pengajuan tidak ditemukan." }, { status: 404 });
  return Response.json({ request });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated())) return Response.json({ message: "Tidak terautentikasi." }, { status: 401 });
  try {
    const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!payload) throw new Error("Data pembaruan tidak valid.");
    const { id } = await params;
    await updateStaffRequest(id, payload, process.env.CMS_USERNAME || "Petugas Kelurahan");
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ message: error instanceof Error ? error.message : "Pembaruan gagal." }, { status: 400 });
  }
}
