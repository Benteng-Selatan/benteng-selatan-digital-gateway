import { put } from "@vercel/blob";
import { extname } from "node:path";

import { isAuthenticated } from "@/lib/auth";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

// Vercel Functions memiliki batas request sekitar 4,5 MB.
// Gunakan 4 MB agar tersedia margin untuk request.
const MAX_BYTES = 4 * 1024 * 1024;

function getFallbackExtension(contentType: string): string {
  switch (contentType) {
    case "image/png":
      return ".png";

    case "image/webp":
      return ".webp";

    default:
      return ".jpg";
  }
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

export async function POST(request: Request): Promise<Response> {
  if (!(await isAuthenticated())) {
    return Response.json(
      {
        message: "Tidak terautentikasi.",
      },
      {
        status: 401,
      },
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
        },
      );
    }

    if (!allowedTypes.has(file.type)) {
      return Response.json(
        {
          message: "Format gambar harus JPG, PNG, atau WEBP.",
        },
        {
          status: 400,
        },
      );
    }

    if (file.size <= 0) {
      return Response.json(
        {
          message: "File gambar kosong.",
        },
        {
          status: 400,
        },
      );
    }

    if (file.size > MAX_BYTES) {
      return Response.json(
        {
          message: "Ukuran gambar maksimal 4 MB.",
        },
        {
          status: 400,
        },
      );
    }

    const extension =
      extname(file.name).toLowerCase() || getFallbackExtension(file.type);

    const safeBaseName = sanitizeFilename(file.name);

    const year = new Date().getFullYear();

    const pathname = `cms/${year}/${Date.now()}-${safeBaseName}${extension}`;

    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

    if (!blobToken) {
      return Response.json(
        {
          message: "Konfigurasi penyimpanan gambar belum tersedia.",
        },
        {
          status: 500,
        },
      );
    }
    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: true,
      token: blobToken,
    });

    return Response.json({
      url: blob.url,
      pathname: blob.pathname,
      contentType: file.type,
      size: file.size,
    });
  } catch (error: unknown) {
    console.error("Blob upload error:", error);

    return Response.json(
      {
        message: "Gambar gagal diunggah ke penyimpanan.",
      },
      {
        status: 500,
      },
    );
  }
}
