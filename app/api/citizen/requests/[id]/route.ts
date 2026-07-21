import { getCitizenRequest, getCurrentCitizen } from "@/lib/portal";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const citizen = await getCurrentCitizen();
  if (!citizen) return Response.json({ message: "Tidak terautentikasi." }, { status: 401 });
  const { id } = await params;
  const request = await getCitizenRequest(citizen.id, id);
  if (!request) return Response.json({ message: "Pengajuan tidak ditemukan." }, { status: 404 });
  return Response.json({ request });
}
