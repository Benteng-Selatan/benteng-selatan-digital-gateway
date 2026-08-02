import { del, get, put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { and, count, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { pendingUploads } from "@/lib/db/schema";
import type { SanitizedImage } from "@/lib/image-security";
import { safeImageBaseName } from "@/lib/image-security";

const PREVIEW_PREFIX = "/api/citizen/uploads/";
const MAX_ACTIVE_PENDING_UPLOADS = 10;

function privateBlobToken(): string {
  const token = process.env.CITIZEN_BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error("Penyimpanan privat untuk unggahan warga belum dikonfigurasi.");
  return token;
}

function publicBlobToken(): string {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error("Penyimpanan publik CMS belum dikonfigurasi.");
  return token;
}

export function pendingUploadIdFromUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = value.trim().match(/^\/api\/citizen\/uploads\/([0-9a-f-]{36})$/i);
  return match?.[1] || null;
}

export async function createPendingUpload(input: {
  citizenId: string;
  originalName: string;
  image: SanitizedImage;
}) {
  const [active] = await db
    .select({ total: count() })
    .from(pendingUploads)
    .where(and(eq(pendingUploads.citizenId, input.citizenId), eq(pendingUploads.status, "pending")));
  if (Number(active?.total || 0) >= MAX_ACTIVE_PENDING_UPLOADS) {
    throw new Error("Batas unggahan yang belum digunakan telah tercapai. Kirim kontribusi yang tertunda atau tunggu petugas membersihkan berkas lama.");
  }

  const id = randomUUID();
  const year = new Date().getFullYear();
  const pathname = `citizen-pending/${year}/${input.citizenId}/${id}-${safeImageBaseName(input.originalName)}${input.image.extension}`;
  const blob = await put(pathname, new Blob([input.image.bytes.slice().buffer as ArrayBuffer], { type: input.image.mimeType }), {
    access: "private",
    addRandomSuffix: false,
    token: privateBlobToken(),
    cacheControlMaxAge: 60,
  });
  const now = new Date();
  await db.insert(pendingUploads).values({
    id,
    citizenId: input.citizenId,
    privateUrl: blob.url,
    pathname: blob.pathname,
    contentType: input.image.mimeType,
    size: input.image.bytes.length,
    width: input.image.width,
    height: input.image.height,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  });
  return {
    id,
    url: `${PREVIEW_PREFIX}${id}`,
    contentType: input.image.mimeType,
    size: input.image.bytes.length,
    width: input.image.width,
    height: input.image.height,
  };
}

export async function findPendingUpload(id: string) {
  const [row] = await db.select().from(pendingUploads).where(eq(pendingUploads.id, id)).limit(1);
  return row || null;
}

export async function fetchPendingUploadStream(id: string) {
  const row = await findPendingUpload(id);
  if (!row) return null;
  const result = await get(row.privateUrl, { access: "private", token: privateBlobToken() });
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  return { row, stream: result.stream };
}

export async function assertPendingUploadOwnership(citizenId: string, previewUrl: string) {
  const id = pendingUploadIdFromUrl(previewUrl);
  if (!id) return null;
  const [row] = await db
    .select()
    .from(pendingUploads)
    .where(and(eq(pendingUploads.id, id), eq(pendingUploads.citizenId, citizenId)))
    .limit(1);
  if (!row || row.status !== "pending" || row.submissionId) {
    throw new Error("Gambar kontribusi tidak ditemukan atau tidak dapat digunakan.");
  }
  return row;
}

export async function preparePendingUploadPublication(previewUrl: unknown, submissionId: string): Promise<{ uploadId: string; publicUrl: string; newlyPromoted: boolean } | null> {
  const id = pendingUploadIdFromUrl(previewUrl);
  if (!id) return null;
  const [row] = await db
    .select()
    .from(pendingUploads)
    .where(and(eq(pendingUploads.id, id), eq(pendingUploads.submissionId, submissionId)))
    .limit(1);
  if (!row) throw new Error("Berkas privat kontribusi tidak ditemukan.");
  if (row.publishedUrl) return { uploadId: row.id, publicUrl: row.publishedUrl, newlyPromoted: false };

  const privateBlob = await get(row.privateUrl, { access: "private", token: privateBlobToken() });
  if (!privateBlob || privateBlob.statusCode !== 200 || !privateBlob.stream) throw new Error("Berkas privat kontribusi tidak dapat dibaca.");
  const bytes = new Uint8Array(await new Response(privateBlob.stream).arrayBuffer());
  if (bytes.length !== row.size) throw new Error("Ukuran berkas privat berubah dan publikasi dihentikan.");

  const publicBlob = await put(
    `citizen-published/${new Date().getFullYear()}/${submissionId}/${row.pathname.split("/").pop() || `${row.id}.img`}`,
    new Blob([bytes.slice().buffer as ArrayBuffer], { type: row.contentType }),
    {
      access: "public",
      addRandomSuffix: true,
      token: publicBlobToken(),
    }
  );
  await db.update(pendingUploads).set({
    status: "promoted",
    publishedUrl: publicBlob.url,
    updatedAt: new Date(),
  }).where(eq(pendingUploads.id, row.id));
  return { uploadId: row.id, publicUrl: publicBlob.url, newlyPromoted: true };
}

export async function rollbackPendingUploadPromotion(uploadId: string, publicUrl: string): Promise<void> {
  await del(publicUrl, { token: publicBlobToken() });
  await db.update(pendingUploads).set({
    status: "linked",
    publishedUrl: "",
    updatedAt: new Date(),
  }).where(and(
    eq(pendingUploads.id, uploadId),
    eq(pendingUploads.status, "promoted"),
    eq(pendingUploads.publishedUrl, publicUrl)
  ));
}
