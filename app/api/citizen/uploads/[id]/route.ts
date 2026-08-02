import { requireAdminPermission } from "@/lib/auth";
import { fetchPendingUploadStream, findPendingUpload } from "@/lib/citizen-uploads";
import { getCurrentCitizen } from "@/lib/portal";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await findPendingUpload(id);
  if (!row) return Response.json({ message: "Gambar tidak ditemukan." }, { status: 404 });

  const citizen = await getCurrentCitizen();
  const admin = citizen ? null : await requireAdminPermission("submissions:view");
  const allowed = citizen?.id === row.citizenId || Boolean(admin);
  if (!allowed) return Response.json({ message: "Akses ditolak." }, { status: 403 });

  const result = await fetchPendingUploadStream(id);
  if (!result) return Response.json({ message: "Gambar tidak dapat dibaca." }, { status: 404 });
  return new Response(result.stream, {
    headers: {
      "Content-Type": result.row.contentType,
      "Content-Length": String(result.row.size),
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
