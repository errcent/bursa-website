import { NextResponse } from "next/server";

import { THUMBNAIL_PHOTOS_ENABLED } from "@/lib/thumbnails/constants";
import { getThumbnailManifestEntry } from "@/lib/thumbnails/ai-manifest";
import { negativePromptForStyle } from "@/lib/thumbnails/negative-prompts";
import type { ThumbnailKind } from "@/lib/thumbnails/ai-prompt-builder";

export const runtime = "nodejs";

const VALID_KINDS = new Set<ThumbnailKind>(["course", "playlist"]);

function pollinationsUrl(prompt: string, seed: number, negative: string): string {
  const params = new URLSearchParams({
    width: "1280",
    height: "720",
    nologo: "true",
    seed: String(seed),
    model: "turbo",
    negative,
  });
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params.toString()}`;
}

type RouteContext = {
  params: Promise<{ type: string; slug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  if (!THUMBNAIL_PHOTOS_ENABLED) {
    return NextResponse.json({ error: "Thumbnail photos disabled" }, { status: 404 });
  }

  const { type, slug } = await context.params;

  if (!VALID_KINDS.has(type as ThumbnailKind)) {
    return NextResponse.json({ error: "Invalid thumbnail type" }, { status: 400 });
  }

  const entry = getThumbnailManifestEntry(type as ThumbnailKind, slug);
  if (!entry) {
    return NextResponse.json({ error: "Thumbnail not found" }, { status: 404 });
  }

  // MasterClass portraits require pre-generated FLUX assets - Pollinations is not realistic enough.
  if (entry.style === "masterclass-portrait") {
    return NextResponse.json(
      {
        error:
          "Portrait thumbnail requires static asset at public/generated/thumbnails - generate with FLUX.2 Max",
      },
      { status: 404 }
    );
  }

  try {
    const upstream = await fetch(
      pollinationsUrl(
        entry.prompt,
        entry.seed,
        negativePromptForStyle(entry.style)
      ),
      {
        headers: { Accept: "image/*" },
        next: { revalidate: 60 * 60 * 24 * 7 },
      }
    );

    if (!upstream.ok) {
      return NextResponse.json({ error: "Image generation failed" }, { status: 502 });
    }

    const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
    const buffer = await upstream.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400",
        "X-Thumbnail-Prompt-Seed": String(entry.seed),
      },
    });
  } catch {
    return NextResponse.json({ error: "Thumbnail proxy failed" }, { status: 502 });
  }
}
