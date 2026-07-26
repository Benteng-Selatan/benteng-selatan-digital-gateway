import { put } from "@vercel/blob";
import { extname } from "node:path";

import { getCurrentCitizen } from "@/lib/portal";

const MAX_BYTES = 4 * 1024 * 1024;

interface DetectedImageType {
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  extension: ".jpg" | ".png" | ".webp";
}

function safeName(filename: string): string {
  const extension = extname(filename).toLowerCase();

  return (
    filename
      .replace(extension, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60) || "gambar"
  );
}

function detectImageType(bytes: Uint8Array): DetectedImageType | null {
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

export async function POST(request: Request) {
  const citizen = await getCurrentCitizen();

  if (!citizen) {
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
    const data = await request.formData();
    const file = data.get("file");

    if (!(file instanceof File)) {
      throw new Error("File gambar tidak ditemukan.");
    }

    if (file.size <= 0 || file.size > MAX_BYTES) {
      throw new Error(
        "Ukuran gambar harus di antara 1 byte dan 4 MB."
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const detectedType = detectImageType(bytes);

    if (!detectedType) {
      throw new Error(
        "Isi file harus berupa gambar JPG, PNG, atau WEBP yang valid."
      );
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;

    if (!token) {
      throw new Error(
        "Penyimpanan gambar belum dikonfigurasi."
      );
    }

    const validatedImage = new Blob([bytes], {
      type: detectedType.mimeType,
    });

    const blob = await put(
      `submissions/${new Date().getFullYear()}/${citizen.id}/${Date.now()}-${safeName(file.name)}${detectedType.extension}`,
      validatedImage,
      {
        access: "public",
        addRandomSuffix: true,
        token,
      }
    );

    return Response.json({
      url: blob.url,
    });
  } catch (error) {
    return Response.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Upload gagal.",
      },
      {
        status: 400,
      }
    );
  }
}