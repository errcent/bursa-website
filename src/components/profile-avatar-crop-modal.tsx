"use client";

import { useCallback, useRef, useState } from "react";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Loader2 } from "lucide-react";

import { FormModal } from "@/components/admin/form-modal";
import { Button } from "@/components/ui/button";

const ASPECT = 1;

function centerAspectCrop(mediaWidth: number, mediaHeight: number) {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, ASPECT, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  );
}

async function cropImageToBlob(
  image: HTMLImageElement,
  crop: PixelCrop,
  mimeType: string
): Promise<Blob> {
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  const pixelWidth = Math.round(crop.width * scaleX);
  const pixelHeight = Math.round(crop.height * scaleY);

  const canvas = document.createElement("canvas");
  canvas.width = pixelWidth;
  canvas.height = pixelHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak tersedia.");

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    pixelWidth,
    pixelHeight
  );

  const outputType = mimeType === "image/png" ? "image/png" : "image/jpeg";
  const quality = outputType === "image/jpeg" ? 0.92 : undefined;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Gagal memproses gambar."))),
      outputType,
      quality
    );
  });
}

interface ProfileAvatarCropModalProps {
  open: boolean;
  imageSrc: string | null;
  originalFile: File | null;
  onClose: () => void;
  onConfirm: (file: File, previewUrl: string) => void;
  onError?: (message: string) => void;
}

export function ProfileAvatarCropModal({
  open,
  imageSrc,
  originalFile,
  onClose,
  onConfirm,
  onError,
}: ProfileAvatarCropModalProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [processing, setProcessing] = useState(false);

  function resetCropState() {
    setCrop(undefined);
    setCompletedCrop(undefined);
    setProcessing(false);
  }

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height));
  }, []);

  async function handleConfirm() {
    if (!imgRef.current || !completedCrop || !originalFile) return;

    setProcessing(true);
    try {
      const blob = await cropImageToBlob(imgRef.current, completedCrop, originalFile.type);
      const ext =
        originalFile.type === "image/png"
          ? "png"
          : originalFile.type === "image/webp"
            ? "webp"
            : "jpg";
      const croppedFile = new File([blob], `avatar-cropped.${ext}`, {
        type: blob.type,
        lastModified: Date.now(),
      });
      const previewUrl = URL.createObjectURL(croppedFile);
      onConfirm(croppedFile, previewUrl);
      resetCropState();
      onClose();
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Gagal memproses gambar.");
    } finally {
      setProcessing(false);
    }
  }

  const canConfirm = Boolean(completedCrop?.width && completedCrop?.height);

  return (
    <FormModal
      open={open}
      onClose={() => {
        resetCropState();
        onClose();
      }}
      title="Atur foto profil"
      description="Sesuaikan area dan ukuran foto sebelum disimpan."
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              resetCropState();
              onClose();
            }}
            disabled={processing}
          >
            Batal
          </Button>
          <Button onClick={handleConfirm} disabled={!canConfirm || processing}>
            {processing ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Memproses…
              </>
            ) : (
              "Gunakan foto ini"
            )}
          </Button>
        </div>
      }
    >
      {imageSrc ? (
        <div className="flex justify-center">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={ASPECT}
            circularCrop
            className="max-h-[50vh]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Pratinjau foto profil"
              onLoad={onImageLoad}
              className="max-h-[50vh] w-auto"
            />
          </ReactCrop>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Memuat gambar…</p>
      )}
    </FormModal>
  );
}
