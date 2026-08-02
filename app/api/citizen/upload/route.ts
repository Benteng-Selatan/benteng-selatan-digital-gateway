import { createHash } from "node:crypto";

import {
  consumeActionRateLimit,
  getIdempotentResponse,
  IdempotencyConflictError,
  rateLimitResponse,
  saveIdempotentResponse,
} from "@/lib/action-guard";
import { auditContextFromRequest, recordAudit } from "@/lib/audit";
import { createPendingUpload } from "@/lib/citizen-uploads";
import { sanitizeImageFile } from "@/lib/image-security";
import { getCurrentCitizen } from "@/lib/portal";

const SCOPE = "citizen.upload";

function imageRequestHash(bytes: Uint8Array, filename: string): string {
  return createHash("sha256")
    .update(filename)
    .update("|")
    .update(bytes)
    .digest("hex");
}

export async function POST(request: Request): Promise<Response> {
  const citizen = await getCurrentCitizen();
  if (!citizen) {
    return Response.json({ message: "Tidak terautentikasi." }, { status: 401 });
  }

  const rateLimit = await consumeActionRateLimit(SCOPE, citizen.id, request, {
    maxAttempts: 10,
    windowSeconds: 60 * 60,
    blockSeconds: 60 * 60,
  });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

  try {
    const data = await request.formData();
    const file = data.get("file");
    if (!(file instanceof File)) throw new Error("File gambar tidak ditemukan.");

    const originalBytes = new Uint8Array(await file.arrayBuffer());
    const requestHash = imageRequestHash(originalBytes, file.name);
    const existing = await getIdempotentResponse(request, SCOPE, citizen.id, requestHash);
    if (existing) return Response.json(existing.body, { status: existing.statusCode });

    const image = sanitizeImageFile(originalBytes);
    const result = await createPendingUpload({
      citizenId: citizen.id,
      originalName: file.name,
      image,
    });
    const body = { upload: result, url: result.url };

    await saveIdempotentResponse(request, SCOPE, citizen.id, requestHash, body, 201);
    await recordAudit({
      actorIdentity: {
        id: citizen.id,
        username: citizen.email,
        name: citizen.fullName,
        role: "citizen",
      },
      action: "citizen.upload_private",
      entityType: "pending_upload",
      entityId: result.id,
      metadata: {
        contentType: result.contentType,
        size: result.size,
        width: result.width,
        height: result.height,
      },
      context: auditContextFromRequest(request),
    });

    return Response.json(body, { status: 201 });
  } catch (error) {
    const status = error instanceof IdempotencyConflictError ? 409 : 400;
    return Response.json(
      { message: error instanceof Error ? error.message : "Upload gagal." },
      { status }
    );
  }
}
