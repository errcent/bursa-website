import fs from "node:fs";
import path from "node:path";

import { THUMBNAIL_MANIFEST } from "../src/lib/thumbnails/ai-manifest";

const promptsPath = path.join("src", "data", "thumbnail-prompts.json");
const existing = JSON.parse(fs.readFileSync(promptsPath, "utf8"));

const manifestBySlug = new Map(
  THUMBNAIL_MANIFEST.filter((e) => e.kind === "course").map((e) => [e.slug, e])
);

const updated = existing.map((entry) => {
  if (entry.kind !== "course") return entry;
  const manifest = manifestBySlug.get(entry.slug);
  if (!manifest || manifest.style !== "masterclass-portrait") return entry;
  return {
    ...entry,
    style: "masterclass-portrait",
    prompt: manifest.prompt,
  };
});

fs.writeFileSync(promptsPath, JSON.stringify(updated, null, 2) + "\n", "utf8");
console.log("Updated portrait entries in thumbnail-prompts.json");
