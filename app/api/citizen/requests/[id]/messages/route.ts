import { addCitizenMessage, getCurrentCitizen } from "@/lib/portal";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const citizen = await getCurrentCitizen();
  if (!citizen) return Response.json({ message: "Tidak terautentikasi." }, { status: 401 });
  try {
    const payload = await request.json().catch(() => null) as { message?: string } | null;
    const { id } = await params;
    await addCitizenMessage(citizen.id, id, payload?.message);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ message: error instanceof Error ? error.message : "Pesan gagal dikirim." }, { status: 400 });
  }
}
