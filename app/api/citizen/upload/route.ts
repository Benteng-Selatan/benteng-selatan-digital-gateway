import { put } from "@vercel/blob";
import { extname } from "node:path";
import { getCurrentCitizen } from "@/lib/portal";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 4 * 1024 * 1024;

function safeName(filename: string): string {
  const extension = extname(filename).toLowerCase();
  return filename.replace(extension, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60) || "gambar";
}

export async function POST(request: Request) {
  const citizen = await getCurrentCitizen();
  if (!citizen) return Response.json({ message: "Tidak terautentikasi." }, { status: 401 });
  try {
    const data = await request.formData();
    const file = data.get("file");
    if (!(file instanceof File)) throw new Error("File gambar tidak ditemukan.");
    if (!allowedTypes.has(file.type)) throw new Error("Format harus JPG, PNG, atau WEBP.");
    if (file.size <= 0 || file.size > MAX_BYTES) throw new Error("Ukuran gambar harus di antara 1 byte dan 4 MB.");
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) throw new Error("Penyimpanan gambar belum dikonfigurasi.");
    const extension = extname(file.name).toLowerCase() || (file.type === "image/png" ? ".png" : file.type === "image/webp" ? ".webp" : ".jpg");
    const blob = await put(`submissions/${new Date().getFullYear()}/${citizen.id}/${Date.now()}-${safeName(file.name)}${extension}`, file, {
      access: "public",
      addRandomSuffix: true,
      token,
    });
    return Response.json({ url: blob.url });
  } catch (error) {
    return Response.json({ message: error instanceof Error ? error.message : "Upload gagal." }, { status: 400 });
  }
}
