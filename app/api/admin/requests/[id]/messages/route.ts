import { isAuthenticated } from "@/lib/auth";
import { addStaffMessage } from "@/lib/portal";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated())) return Response.json({ message: "Tidak terautentikasi." }, { status: 401 });
  try {
    const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!payload) throw new Error("Data pesan tidak valid.");
    const { id } = await params;
    await addStaffMessage(id, payload, process.env.CMS_USERNAME || "Petugas Kelurahan");
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ message: error instanceof Error ? error.message : "Pesan gagal dikirim." }, { status: 400 });
  }
}
