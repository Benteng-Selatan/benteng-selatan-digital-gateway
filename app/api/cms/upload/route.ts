import { put } from "@vercel/blob";
import { extname } from "node:path";

import { requireAdminPermission } from "@/lib/auth";
import { auditContextFromRequest, recordAudit } from "@/lib/audit";

const MAX_BYTES = 4 * 1024 * 1024;

interface DetectedImageType {
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  extension: ".jpg" | ".png" | ".webp";
}

function sanitizeFilename(filename: string): string {
  const extension = extname(filename).toLowerCase();

  const baseName = filename
    .replace(extension, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);

  return baseName || "gambar";
}

function detectImageType(
  bytes: Uint8Array
): DetectedImageType | null {
  const isJpeg =
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff;

  if (isJpeg) {
    return {
      mimeType: "image/jpeg",
      extension: ".jpg",
    };
  }

  const isPng =
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a;

  if (isPng) {
    return {
      mimeType: "image/png",
      extension: ".png",
    };
  }

  const isWebp =
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50;

  if (isWebp) {
    return {
      mimeType: "image/webp",
      extension: ".webp",
    };
  }

  return null;
}

export async function POST(
  request: Request
): Promise<Response> {
  const session = await requireAdminPermission("cms:edit");
  if (!session) {
    return Response.json(
      {
        message: "Tidak terautentikasi.",
      },
      {
        status: 401,
      }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return Response.json(
        {
          message: "File gambar tidak ditemukan.",
        },
        {
          status: 400,
        }
      );
    }

    if (file.size <= 0) {
      return Response.json(
        {
          message: "File gambar kosong.",
        },
        {
          status: 400,
        }
      );
    }

    if (file.size > MAX_BYTES) {
      return Response.json(
        {
          message: "Ukuran gambar maksimal 4 MB.",
        },
        {
          status: 400,
        }
      );
    }

    const bytes = new Uint8Array(
      await file.arrayBuffer()
    );

    const detectedType = detectImageType(bytes);

    if (!detectedType) {
      return Response.json(
        {
          message:
            "Isi file harus berupa gambar JPG, PNG, atau WEBP yang valid.",
        },
        {
          status: 400,
        }
      );
    }

    const blobToken =
      process.env.BLOB_READ_WRITE_TOKEN;

    if (!blobToken) {
      return Response.json(
        {
          message:
            "Konfigurasi penyimpanan gambar belum tersedia.",
        },
        {
          status: 500,
        }
      );
    }

    const safeBaseName = sanitizeFilename(file.name);
    const year = new Date().getFullYear();

    const pathname =
      `cms/${year}/${Date.now()}-` +
      `${safeBaseName}${detectedType.extension}`;

    const validatedImage = new Blob([bytes], {
      type: detectedType.mimeType,
    });

    const blob = await put(
      pathname,
      validatedImage,
      {
        access: "public",
        addRandomSuffix: true,
        token: blobToken,
      }
    );

    await recordAudit({
      actor: session,
      action: "cms.upload",
      entityType: "blob",
      entityId: blob.pathname,
      metadata: { contentType: detectedType.mimeType, size: file.size },
      context: auditContextFromRequest(request),
    });

    return Response.json({
      url: blob.url,
      pathname: blob.pathname,
      contentType: detectedType.mimeType,
      size: file.size,
    });
  } catch (error: unknown) {
    console.error("Blob upload error:", error);

    return Response.json(
      {
        message:
          "Gambar gagal diunggah ke penyimpanan.",
      },
      {
        status: 500,
      }
    );
  }
}