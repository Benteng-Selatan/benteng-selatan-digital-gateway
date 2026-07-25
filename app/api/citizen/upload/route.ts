import { put } from "@vercel/blob";

import { validateAndSanitizeImage } from "@/lib/image-upload";
import { getCurrentCitizen } from "@/lib/portal";
import { enforceRateLimit, RateLimitError, rateLimitResponse } from "@/lib/rate-limit";
import { sameOriginErrorResponse } from "@/lib/request-security";

export async function POST(request: Request) {
  const originError = sameOriginErrorResponse(request);
  if (originError) return originError;
  const citizen = await getCurrentCitizen();
  if (!citizen) return Response.json({ message: "Tidak terautentikasi." }, { status: 401 });

  try {
    await enforceRateLimit({
      scope: "citizen-upload",
      identifier: citizen.id,
      limit: 20,
      windowSeconds: 60 * 60,
    });

    const data = await request.formData();
    const file = data.get("file");
    if (!(file instanceof File)) throw new Error("File gambar tidak ditemukan.");

    const image = await validateAndSanitizeImage(file);
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) throw new Error("Penyimpanan gambar belum dikonfigurasi.");

    const body = new Blob([new Uint8Array(image.buffer)], { type: image.contentType });
    const pathname = `submissions/${new Date().getFullYear()}/${citizen.id}/${Date.now()}-${image.safeBaseName}${image.extension}`;
    const blob = await put(pathname, body, {
      access: "public",
      addRandomSuffix: true,
      token,
    });

    return Response.json({
      url: blob.url,
      contentType: image.contentType,
      size: image.buffer.length,
      width: image.width,
      height: image.height,
    });
  } catch (error) {
    if (error instanceof RateLimitError) return rateLimitResponse(error);
    return Response.json({ message: error instanceof Error ? error.message : "Upload gagal." }, { status: 400 });
  }
}
