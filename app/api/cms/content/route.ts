import { revalidatePath } from "next/cache";
import { isAuthenticated } from "@/lib/auth";
import { CmsConflictError, getSiteData, validateSiteData, writeSiteData } from "@/lib/cms";
import { sameOriginErrorResponse } from "@/lib/request-security";

export async function GET() {
  if (!(await isAuthenticated())) return Response.json({ message: "Tidak terautentikasi." }, { status: 401 });
  return Response.json({ data: await getSiteData() });
}

export async function PUT(request: Request) {
  const originError = sameOriginErrorResponse(request);
  if (originError) return originError;
  if (!(await isAuthenticated())) return Response.json({ message: "Tidak terautentikasi." }, { status: 401 });
  try {
    const payload = await request.json().catch(() => null);
    if (!validateSiteData(payload)) return Response.json({ message: "Struktur data CMS tidak valid." }, { status: 400 });
    const data = await writeSiteData(payload);
    revalidatePath("/", "layout");
    return Response.json({ data });
  } catch (error) {
    if (error instanceof CmsConflictError) {
      return Response.json({ message: error.message }, { status: 409 });
    }
    return Response.json({ message: error instanceof Error ? error.message : "Konten gagal disimpan." }, { status: 400 });
  }
}
