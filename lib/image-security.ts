import { extname } from "node:path";

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export const MAX_IMAGE_PIXELS = 24_000_000;
export const MAX_IMAGE_DIMENSION = 7000;

export interface SanitizedImage {
  bytes: Uint8Array;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  extension: ".jpg" | ".png" | ".webp";
  width: number;
  height: number;
}

export function safeImageBaseName(filename: string): string {
  const extension = extname(filename).toLowerCase();
  return filename
    .replace(extension, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60) || "gambar";
}

function readUint16BE(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] << 8) | bytes[offset + 1];
}

function readUint32BE(bytes: Uint8Array, offset: number): number {
  return (((bytes[offset] << 24) >>> 0) + (bytes[offset + 1] << 16) + (bytes[offset + 2] << 8) + bytes[offset + 3]) >>> 0;
}

function readUint24LE(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
}

function readUint32LE(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const length = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function validateDimensions(width: number, height: number): void {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new Error("Dimensi gambar tidak dapat diverifikasi.");
  }
  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION || width * height > MAX_IMAGE_PIXELS) {
    throw new Error("Dimensi gambar terlalu besar. Gunakan gambar maksimal 7.000 piksel per sisi dan 24 megapiksel.");
  }
}

function sanitizeJpeg(bytes: Uint8Array): SanitizedImage {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error("File JPG tidak valid.");
  const parts: Uint8Array[] = [bytes.slice(0, 2)];
  let offset = 2;
  let width = 0;
  let height = 0;
  let foundEnd = false;

  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) throw new Error("Struktur JPG rusak.");
    const markerOffset = offset;
    while (bytes[offset] === 0xff) offset += 1;
    const marker = bytes[offset++];
    if (marker === 0xd9) {
      parts.push(bytes.slice(markerOffset, offset));
      foundEnd = true;
      break;
    }
    if (marker === 0xda) {
      const length = readUint16BE(bytes, offset);
      if (length < 2 || offset + length > bytes.length) throw new Error("Struktur JPG rusak.");
      const scanStart = markerOffset;
      let scanOffset = offset + length;
      while (scanOffset + 1 < bytes.length) {
        if (bytes[scanOffset] === 0xff && bytes[scanOffset + 1] === 0xd9) {
          parts.push(bytes.slice(scanStart, scanOffset + 2));
          foundEnd = true;
          offset = scanOffset + 2;
          break;
        }
        scanOffset += 1;
      }
      break;
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      parts.push(bytes.slice(markerOffset, offset));
      continue;
    }
    if (offset + 2 > bytes.length) throw new Error("Struktur JPG rusak.");
    const length = readUint16BE(bytes, offset);
    const segmentEnd = offset + length;
    if (length < 2 || segmentEnd > bytes.length) throw new Error("Struktur JPG rusak.");
    const isSof = [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker);
    if (isSof && length >= 7) {
      height = readUint16BE(bytes, offset + 3);
      width = readUint16BE(bytes, offset + 5);
    }
    const isMetadata = marker === 0xe1 || marker === 0xed || marker === 0xfe;
    if (!isMetadata) parts.push(bytes.slice(markerOffset, segmentEnd));
    offset = segmentEnd;
  }

  if (!foundEnd) throw new Error("File JPG tidak memiliki penutup yang valid.");
  validateDimensions(width, height);
  return { bytes: concat(parts), mimeType: "image/jpeg", extension: ".jpg", width, height };
}

function sanitizePng(bytes: Uint8Array): SanitizedImage {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length < 33 || !signature.every((value, index) => bytes[index] === value)) throw new Error("File PNG tidak valid.");
  const parts: Uint8Array[] = [bytes.slice(0, 8)];
  let offset = 8;
  let width = 0;
  let height = 0;
  let hasIhdr = false;
  let hasIend = false;
  const removable = new Set(["eXIf", "tEXt", "zTXt", "iTXt"]);

  while (offset + 12 <= bytes.length) {
    const length = readUint32BE(bytes, offset);
    const type = String.fromCharCode(...bytes.slice(offset + 4, offset + 8));
    const end = offset + 12 + length;
    if (end > bytes.length) throw new Error("Struktur PNG rusak.");
    if (type === "IHDR") {
      if (hasIhdr || length !== 13) throw new Error("Header PNG tidak valid.");
      hasIhdr = true;
      width = readUint32BE(bytes, offset + 8);
      height = readUint32BE(bytes, offset + 12);
    }
    if (!removable.has(type)) parts.push(bytes.slice(offset, end));
    offset = end;
    if (type === "IEND") {
      hasIend = true;
      break;
    }
  }

  if (!hasIhdr || !hasIend) throw new Error("Struktur PNG tidak lengkap.");
  validateDimensions(width, height);
  return { bytes: concat(parts), mimeType: "image/png", extension: ".png", width, height };
}

function webpDimensions(bytes: Uint8Array, type: string, dataOffset: number): { width: number; height: number } {
  if (type === "VP8X") {
    return { width: readUint24LE(bytes, dataOffset + 4) + 1, height: readUint24LE(bytes, dataOffset + 7) + 1 };
  }
  if (type === "VP8 ") {
    if (bytes[dataOffset + 3] !== 0x9d || bytes[dataOffset + 4] !== 0x01 || bytes[dataOffset + 5] !== 0x2a) throw new Error("Header WEBP VP8 tidak valid.");
    return { width: (bytes[dataOffset + 6] | (bytes[dataOffset + 7] << 8)) & 0x3fff, height: (bytes[dataOffset + 8] | (bytes[dataOffset + 9] << 8)) & 0x3fff };
  }
  if (type === "VP8L") {
    if (bytes[dataOffset] !== 0x2f) throw new Error("Header WEBP VP8L tidak valid.");
    const bits = readUint32LE(bytes, dataOffset + 1);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  return { width: 0, height: 0 };
}

function sanitizeWebp(bytes: Uint8Array): SanitizedImage {
  if (bytes.length < 20 || String.fromCharCode(...bytes.slice(0, 4)) !== "RIFF" || String.fromCharCode(...bytes.slice(8, 12)) !== "WEBP") {
    throw new Error("File WEBP tidak valid.");
  }
  const parts: Uint8Array[] = [];
  let offset = 12;
  let width = 0;
  let height = 0;
  const removable = new Set(["EXIF", "XMP "]);

  while (offset + 8 <= bytes.length) {
    const type = String.fromCharCode(...bytes.slice(offset, offset + 4));
    const size = readUint32LE(bytes, offset + 4);
    const padded = size + (size % 2);
    const end = offset + 8 + padded;
    if (end > bytes.length) throw new Error("Struktur WEBP rusak.");
    if (!width) ({ width, height } = webpDimensions(bytes, type, offset + 8));
    if (!removable.has(type)) parts.push(bytes.slice(offset, end));
    offset = end;
  }

  validateDimensions(width, height);
  const body = concat(parts);
  const header = new Uint8Array(12);
  header.set([0x52, 0x49, 0x46, 0x46], 0);
  const riffSize = body.length + 4;
  header[4] = riffSize & 0xff;
  header[5] = (riffSize >> 8) & 0xff;
  header[6] = (riffSize >> 16) & 0xff;
  header[7] = (riffSize >> 24) & 0xff;
  header.set([0x57, 0x45, 0x42, 0x50], 8);
  return { bytes: concat([header, body]), mimeType: "image/webp", extension: ".webp", width, height };
}

export function sanitizeImageFile(bytes: Uint8Array): SanitizedImage {
  if (bytes.length <= 0 || bytes.length > MAX_IMAGE_BYTES) throw new Error("Ukuran gambar harus di antara 1 byte dan 4 MB.");
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return sanitizeJpeg(bytes);
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return sanitizePng(bytes);
  if (String.fromCharCode(...bytes.slice(0, 4)) === "RIFF") return sanitizeWebp(bytes);
  throw new Error("Isi file harus berupa gambar JPG, PNG, atau WEBP yang valid.");
}
