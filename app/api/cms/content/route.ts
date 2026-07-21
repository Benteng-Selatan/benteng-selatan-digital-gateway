import { revalidatePath } from "next/cache";
import { isAuthenticated } from "@/lib/auth";
import { getSiteData, validateSiteData, writeSiteData } from "@/lib/cms";

export async function GET() {
  if (!(await isAuthenticated())) return Response.json({ message: "Tidak terautentikasi." }, { status: 401 });
  return Response.json({ data: await getSiteData() });
}

export async function PUT(request: Request) {
  if (!(await isAuthenticated())) return Response.json({ message: "Tidak terautentikasi." }, { status: 401 });
  const payload = await request.json().catch(() => null);
  if (!validateSiteData(payload)) return Response.json({ message: "Struktur data CMS tidak valid." }, { status: 400 });
  const data = await writeSiteData(payload);
  revalidatePath("/", "layout");
  return Response.json({ data });
}
