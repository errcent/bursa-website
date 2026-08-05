const PDF_MAGIC = Buffer.from([0x25, 0x50, 0x44, 0x46]); // %PDF
const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff]);
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
const WEBP_RIFF = Buffer.from([0x52, 0x49, 0x46, 0x46]);
const WEBP_MARKER = Buffer.from([0x57, 0x45, 0x42, 0x50]);

export type DetectedFileType = {
  mime: string;
  ext: string;
};

function startsWith(buffer: Buffer, magic: Buffer): boolean {
  return buffer.length >= magic.length && buffer.subarray(0, magic.length).equals(magic);
}

/** Sniff file type from magic bytes (not client-supplied MIME). */
export function detectFileType(buffer: Buffer): DetectedFileType | null {
  if (startsWith(buffer, PDF_MAGIC)) {
    return { mime: "application/pdf", ext: "pdf" };
  }
  if (startsWith(buffer, JPEG_MAGIC)) {
    return { mime: "image/jpeg", ext: "jpg" };
  }
  if (startsWith(buffer, PNG_MAGIC)) {
    return { mime: "image/png", ext: "png" };
  }
  if (
    buffer.length >= 12 &&
    startsWith(buffer, WEBP_RIFF) &&
    buffer.subarray(8, 12).equals(WEBP_MARKER)
  ) {
    return { mime: "image/webp", ext: "webp" };
  }
  return null;
}

export function assertDetectedFileType(
  buffer: Buffer,
  allowed: Set<string>
): DetectedFileType {
  const detected = detectFileType(buffer);
  if (!detected || !allowed.has(detected.mime)) {
    throw new Error("UNSUPPORTED_FILE_TYPE");
  }
  return detected;
}
