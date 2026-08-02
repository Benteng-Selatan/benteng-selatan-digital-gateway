import { put } from "@vercel/blob";
import { createHash } from "node:crypto";

import {
  consumeActionRateLimit,
  getIdempotentResponse,
  IdempotencyConflictError,
  rateLimitResponse,
  saveIdempotentResponse,
} from "@/lib/action-guard";
import { requireAdminPermission } from "@/lib/auth";
import { auditContextFromRequest, recordAudit } from "@/lib/audit";
import { safeImageBaseName, sanitizeImageFile } from "@/lib/image-security";

const SCOPE = "cms.upload";

export async function POST(request: Request): Promise<Response> {
  const session = await requireAdminPermission("cms:edit");
  if (!session) return Response.json({ message: "Tidak terautentikasi." }, { status: 401 });

  const rateLimit = await consumeActionRateLimit(SCOPE, session.userId, request, {
    maxAttempts: 30,
    windowSeconds: 60 * 60,
  });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) throw new Error("File gambar tidak ditemukan.");

    const originalBytes = new Uint8Array(await file.arrayBuffer());
    const requestHash = createHash("sha256").update(file.name).update("|").update(originalBytes).digest("hex");
    const existing = await getIdempotentResponse(request, SCOPE, session.userId, requestHash);
    if (existing) return Response.json(existing.body, { status: existing.statusCode });

    const image = sanitizeImageFile(originalBytes);
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) throw new Error("Konfigurasi penyimpanan gambar publik belum tersedia.");

    const year = new Date().getFullYear();
    const pathname = `cms/${year}/${Date.now()}-${safeImageBaseName(file.name)}${image.extension}`;
    const blob = await put(pathname, new Blob([image.bytes.slice().buffer as ArrayBuffer], { type: image.mimeType }), {
      access: "public",
      addRandomSuffix: true,
      token,
    });

    const body = {
      url: blob.url,
      pathname: blob.pathname,
      contentType: image.mimeType,
      size: image.bytes.length,
      width: image.width,
      height: image.height,
    };
    await saveIdempotentResponse(request, SCOPE, session.userId, requestHash, body, 201);
    await recordAudit({
      actor: session,
      action: "cms.upload",
      entityType: "blob",
      entityId: blob.pathname,
      metadata: {
        contentType: image.mimeType,
        size: image.bytes.length,
        width: image.width,
        height: image.height,
        metadataSanitized: true,
      },
      context: auditContextFromRequest(request),
    });

    return Response.json(body, { status: 201 });
  } catch (error) {
    console.error("CMS image upload error:", error);
    const status = error instanceof IdempotencyConflictError ? 409 : 400;
    return Response.json(
      { message: error instanceof Error ? error.message : "Gambar gagal diunggah." },
      { status }
    );
  }
}
