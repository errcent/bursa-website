import { NextResponse } from "next/server";

import { getThumbnailManifestEntry } from "@/lib/thumbnails/ai-manifest";
import type { ThumbnailKind } from "@/lib/thumbnails/ai-prompt-builder";

export const runtime = "nodejs";

const VALID_KINDS = new Set<ThumbnailKind>(["course", "playlist"]);

function pollinationsUrl(prompt: string, seed: number): string {
  const params = new URLSearchParams({
    width: "1280",
    height: "800",
    nologo: "true",
    seed: String(seed),
    model: "flux",
  });
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params.toString()}`;
}

type RouteContext = {
  params: Promise<{ type: string; slug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { type, slug } = await context.params;

  if (!VALID_KINDS.has(type as ThumbnailKind)) {
    return NextResponse.json({ error: "Invalid thumbnail type" }, { status: 400 });
  }

  const entry = getThumbnailManifestEntry(type as ThumbnailKind, slug);
  if (!entry) {
    return NextResponse.json({ error: "Thumbnail not found" }, { status: 404 });
  }

  try {
    const upstream = await fetch(pollinationsUrl(entry.prompt, entry.seed), {
      headers: { Accept: "image/*" },
      next: { revalidate: 60 * 60 * 24 * 7 },
    });

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
