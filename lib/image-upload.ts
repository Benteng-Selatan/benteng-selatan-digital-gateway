import { extname } from "node:path";

const ALLOWED_DECLARED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_DIMENSION = 12_000;
const MAX_PIXELS = 40_000_000;

export interface ValidatedImage {
  buffer: Buffer;
  contentType: "image/jpeg" | "image/png" | "image/webp";
  extension: ".jpg" | ".png" | ".webp";
  width: number;
  height: number;
  safeBaseName: string;
}

function sanitizeFilename(filename: string): string {
  const extension = extname(filename).toLowerCase();
  return filename
    .replace(extension, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60) || "gambar";
}

function isPng(buffer: Buffer): boolean {
  return buffer.length >= 24 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
}

function isJpeg(buffer: Buffer): boolean {
  return buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
}

function isWebp(buffer: Buffer): boolean {
  return buffer.length >= 30 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
}

function jpegDimensions(buffer: Buffer): { width: number; height: number } | null {
  let offset = 2;
  const sofMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  while (offset + 4 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    while (buffer[offset] === 0xff) offset += 1;
    const marker = buffer[offset];
    offset += 1;
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) continue;
    if (offset + 2 > buffer.length) return null;
    const length = buffer.readUInt16BE(offset);
    if (length < 2 || offset + length > buffer.length) return null;
    if (sofMarkers.has(marker) && length >= 7) {
      return { height: buffer.readUInt16BE(offset + 3), width: buffer.readUInt16BE(offset + 5) };
    }
    if (marker === 0xda) return null;
    offset += length;
  }
  return null;
}

function webpDimensions(buffer: Buffer): { width: number; height: number } | null {
  const chunk = buffer.toString("ascii", 12, 16);
  if (chunk === "VP8X" && buffer.length >= 30) {
    return {
      width: 1 + buffer.readUIntLE(24, 3),
      height: 1 + buffer.readUIntLE(27, 3),
    };
  }
  if (chunk === "VP8L" && buffer.length >= 25 && buffer[20] === 0x2f) {
    const bits = buffer.readUInt32LE(21);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    };
  }
  if (chunk === "VP8 " && buffer.length >= 30 && buffer[23] === 0x9d && buffer[24] === 0x01 && buffer[25] === 0x2a) {
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff,
    };
  }
  return null;
}

function stripJpegMetadata(buffer: Buffer): Buffer {
  const parts: Buffer[] = [buffer.subarray(0, 2)];
  let offset = 2;
  while (offset + 1 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      parts.push(buffer.subarray(offset));
      break;
    }
    const markerStart = offset;
    while (buffer[offset] === 0xff) offset += 1;
    const marker = buffer[offset];
    offset += 1;
    if (marker === 0xda || marker === 0xd9) {
      parts.push(buffer.subarray(markerStart));
      break;
    }
    if ((marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
      parts.push(buffer.subarray(markerStart, offset));
      continue;
    }
    if (offset + 2 > buffer.length) break;
    const length = buffer.readUInt16BE(offset);
    const segmentEnd = offset + length;
    if (length < 2 || segmentEnd > buffer.length) break;
    if (marker !== 0xe1 && marker !== 0xed && marker !== 0xfe) {
      parts.push(buffer.subarray(markerStart, segmentEnd));
    }
    offset = segmentEnd;
  }
  return Buffer.concat(parts);
}

function stripPngMetadata(buffer: Buffer): Buffer {
  const parts: Buffer[] = [buffer.subarray(0, 8)];
  const blocked = new Set(["eXIf", "tEXt", "zTXt", "iTXt"]);
  let offset = 8;
  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const end = offset + 12 + length;
    if (end > buffer.length) throw new Error("Struktur PNG tidak valid.");
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    if (!blocked.has(type)) parts.push(buffer.subarray(offset, end));
    offset = end;
    if (type === "IEND") break;
  }
  return Buffer.concat(parts);
}

function stripWebpMetadata(buffer: Buffer): Buffer {
  const chunks: Buffer[] = [];
  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const type = buffer.toString("ascii", offset, offset + 4);
    const length = buffer.readUInt32LE(offset + 4);
    const paddedLength = length + (length % 2);
    const end = offset + 8 + paddedLength;
    if (end > buffer.length) throw new Error("Struktur WEBP tidak valid.");
    if (type !== "EXIF" && type !== "XMP ") {
      const chunk = Buffer.from(buffer.subarray(offset, end));
      if (type === "VP8X" && length >= 1) chunk[8] &= ~0x0c;
      chunks.push(chunk);
    }
    offset = end;
  }
  const body = Buffer.concat(chunks);
  const header = Buffer.alloc(12);
  header.write("RIFF", 0, "ascii");
  header.writeUInt32LE(body.length + 4, 4);
  header.write("WEBP", 8, "ascii");
  return Buffer.concat([header, body]);
}

export async function validateAndSanitizeImage(file: File, maxBytes = 4 * 1024 * 1024): Promise<ValidatedImage> {
  if (file.size <= 0 || file.size > maxBytes) throw new Error("Ukuran gambar harus di antara 1 byte dan 4 MB.");
  if (file.type && !ALLOWED_DECLARED_TYPES.has(file.type)) throw new Error("Format harus JPG, PNG, atau WEBP.");

  const original = Buffer.from(await file.arrayBuffer());
  let contentType: ValidatedImage["contentType"];
  let extension: ValidatedImage["extension"];
  let dimensions: { width: number; height: number } | null;
  let buffer: Buffer;

  if (isJpeg(original)) {
    contentType = "image/jpeg";
    extension = ".jpg";
    dimensions = jpegDimensions(original);
    buffer = stripJpegMetadata(original);
  } else if (isPng(original)) {
    contentType = "image/png";
    extension = ".png";
    dimensions = { width: original.readUInt32BE(16), height: original.readUInt32BE(20) };
    buffer = stripPngMetadata(original);
  } else if (isWebp(original)) {
    contentType = "image/webp";
    extension = ".webp";
    dimensions = webpDimensions(original);
    buffer = stripWebpMetadata(original);
  } else {
    throw new Error("Isi file bukan gambar JPG, PNG, atau WEBP yang valid.");
  }

  if (file.type && file.type !== contentType) throw new Error("Ekstensi atau tipe file tidak sesuai dengan isi gambar.");
  if (!dimensions || dimensions.width < 1 || dimensions.height < 1) throw new Error("Dimensi gambar tidak dapat dibaca.");
  if (dimensions.width > MAX_DIMENSION || dimensions.height > MAX_DIMENSION || dimensions.width * dimensions.height > MAX_PIXELS) {
    throw new Error("Resolusi gambar terlalu besar.");
  }

  return {
    buffer,
    contentType,
    extension,
    width: dimensions.width,
    height: dimensions.height,
    safeBaseName: sanitizeFilename(file.name),
  };
}
