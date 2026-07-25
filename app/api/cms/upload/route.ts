import { put } from "@vercel/blob";

import { isAuthenticated } from "@/lib/auth";
import { validateAndSanitizeImage } from "@/lib/image-upload";
import { clientAddress, enforceRateLimit, RateLimitError, rateLimitResponse } from "@/lib/rate-limit";
import { sameOriginErrorResponse } from "@/lib/request-security";

export async function POST(request: Request): Promise<Response> {
  const originError = sameOriginErrorResponse(request);
  if (originError) return originError;
  if (!(await isAuthenticated())) return Response.json({ message: "Tidak terautentikasi." }, { status: 401 });

  try {
    await enforceRateLimit({
      scope: "cms-upload",
      identifier: clientAddress(request),
      limit: 30,
      windowSeconds: 60 * 60,
    });

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) throw new Error("File gambar tidak ditemukan.");

    const image = await validateAndSanitizeImage(file);
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (!blobToken) return Response.json({ message: "Konfigurasi penyimpanan gambar belum tersedia." }, { status: 500 });

    const pathname = `cms/${new Date().getFullYear()}/${Date.now()}-${image.safeBaseName}${image.extension}`;
    const body = new Blob([new Uint8Array(image.buffer)], { type: image.contentType });
    const blob = await put(pathname, body, {
      access: "public",
      addRandomSuffix: true,
      token: blobToken,
    });

    return Response.json({
      url: blob.url,
      pathname: blob.pathname,
      contentType: image.contentType,
      size: image.buffer.length,
      width: image.width,
      height: image.height,
    });
  } catch (error: unknown) {
    if (error instanceof RateLimitError) return rateLimitResponse(error);
    console.error("Blob upload error:", error);
    return Response.json(
      { message: error instanceof Error ? error.message : "Gambar gagal diunggah ke penyimpanan." },
      { status: 400 },
    );
  }
}
