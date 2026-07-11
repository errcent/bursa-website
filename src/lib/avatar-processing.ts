import sharp from "sharp";

/** Max raw upload size accepted before processing (5 MB). */
export const AVATAR_MAX_INPUT_BYTES = 5 * 1024 * 1024;

/** Max width/height after resize — profile photos don't need to be huge. */
export const AVATAR_MAX_DIMENSION = 512;

/** Target max file size after compression (400 KB). */
export const AVATAR_MAX_OUTPUT_BYTES = 400 * 1024;

const OUTPUT_MIME = "image/webp";
const OUTPUT_EXT = "webp";

export type ProcessedAvatar = {
  buffer: Buffer;
  mimeType: string;
  ext: string;
  originalBytes: number;
  compressedBytes: number;
};

/**
 * Resize and compress an avatar image to prevent oversized DB payloads.
 * Converts to WebP, auto-orients via EXIF, and iteratively lowers quality
 * until the output fits within AVATAR_MAX_OUTPUT_BYTES.
 */
export async function processAvatarImage(input: Buffer): Promise<ProcessedAvatar> {
  const originalBytes = input.length;

  let pipeline = sharp(input, { failOn: "none" }).rotate();

  const metadata = await pipeline.metadata();
  const width = metadata.width ?? AVATAR_MAX_DIMENSION;
  const height = metadata.height ?? AVATAR_MAX_DIMENSION;

  if (width > AVATAR_MAX_DIMENSION || height > AVATAR_MAX_DIMENSION) {
    pipeline = pipeline.resize(AVATAR_MAX_DIMENSION, AVATAR_MAX_DIMENSION, {
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  let quality = 85;
  let output = await pipeline.webp({ quality }).toBuffer();

  while (output.length > AVATAR_MAX_OUTPUT_BYTES && quality > 40) {
    quality -= 10;
    output = await pipeline.webp({ quality }).toBuffer();
  }

  if (output.length > AVATAR_MAX_OUTPUT_BYTES) {
    output = await sharp(input, { failOn: "none" })
      .rotate()
      .resize(256, 256, { fit: "cover" })
      .webp({ quality: 70 })
      .toBuffer();
  }

  return {
    buffer: output,
    mimeType: OUTPUT_MIME,
    ext: OUTPUT_EXT,
    originalBytes,
    compressedBytes: output.length,
  };
}
