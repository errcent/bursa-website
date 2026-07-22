import sharp from "sharp";

/**
 * Mitigate libvips CVEs in sharp <0.35.0 (GHSA-f88m-g3jw-g9cj) for GIF/TIFF/VIPS
 * decoders. Safe for JPEG/PNG/WebP paths used by avatars and Next image optimization.
 */
let configured = false;

export function configureSharpSecurity(): void {
  if (configured) return;
  configured = true;

  sharp.block({
    operation: ["VipsForeignLoadNsgif", "VipsForeignLoadTiff", "VipsForeignLoadVips"],
  });
}

configureSharpSecurity();
