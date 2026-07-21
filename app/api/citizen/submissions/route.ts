import { createContentSubmission, getCurrentCitizen, listCitizenSubmissions } from "@/lib/portal";

export async function GET() {
  const citizen = await getCurrentCitizen();
  if (!citizen) return Response.json({ message: "Tidak terautentikasi." }, { status: 401 });
  return Response.json({ submissions: await listCitizenSubmissions(citizen.id) });
}

export async function POST(request: Request) {
  const citizen = await getCurrentCitizen();
  if (!citizen) return Response.json({ message: "Tidak terautentikasi." }, { status: 401 });
  try {
    const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!payload) throw new Error("Data kontribusi tidak valid.");
    const result = await createContentSubmission(citizen.id, payload);
    return Response.json({ result }, { status: 201 });
  } catch (error) {
    return Response.json({ message: error instanceof Error ? error.message : "Kontribusi gagal dikirim." }, { status: 400 });
  }
}
