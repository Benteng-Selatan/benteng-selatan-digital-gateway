export function sameOriginErrorResponse(request: Request): Response | null {
  const fetchSite = request.headers.get("sec-fetch-site")?.toLowerCase();
  if (fetchSite === "cross-site") {
    return Response.json({ message: "Permintaan lintas situs ditolak." }, { status: 403 });
  }

  const origin = request.headers.get("origin");
  if (!origin) return null;

  try {
    if (new URL(origin).origin !== new URL(request.url).origin) {
      return Response.json({ message: "Asal permintaan tidak valid." }, { status: 403 });
    }
  } catch {
    return Response.json({ message: "Asal permintaan tidak valid." }, { status: 403 });
  }

  return null;
}
