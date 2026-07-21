import { revalidatePath } from "next/cache";
import { isAuthenticated } from "@/lib/auth";
import { updateStaffSubmission } from "@/lib/portal";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated())) return Response.json({ message: "Tidak terautentikasi." }, { status: 401 });
  try {
    const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!payload) throw new Error("Data pembaruan tidak valid.");
    const { id } = await params;
    await updateStaffSubmission(id, payload);
    revalidatePath("/", "layout");
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ message: error instanceof Error ? error.message : "Pembaruan gagal." }, { status: 400 });
  }
}
