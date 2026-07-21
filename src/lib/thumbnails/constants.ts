/** Native dimensions for AI-generated course/playlist thumbnails (Pollinations 1280×800). */
export const AI_THUMBNAIL_WIDTH = 1280;
export const AI_THUMBNAIL_HEIGHT = 800;
export const AI_THUMBNAIL_ASPECT_RATIO = AI_THUMBNAIL_WIDTH / AI_THUMBNAIL_HEIGHT;

/** Tailwind aspect utility matching native thumbnail ratio (frame, not img). */
export const AI_THUMBNAIL_ASPECT_CLASS = "aspect-[16/10]" as const;

/** Shared thumbnail frame class — aspect-ratio lives on the wrapper, not the img. */
export const AI_THUMBNAIL_FRAME_CLASS = "ai-thumbnail" as const;

/** Media fill — duplicates critical object-fit sizing as Tailwind utilities. */
export const AI_THUMBNAIL_MEDIA_CLASS =
  "ai-thumbnail__media h-full w-full max-w-none object-cover object-center" as const;

export type ThumbnailObjectFit = "cover" | "contain";
