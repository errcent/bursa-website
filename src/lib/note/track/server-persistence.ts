import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { parseTrackStore, emptyTrackStore } from "@/lib/note/track/parse-store";
import type { TrackStore } from "@/lib/note/track/types";

type NoteStoreFile = {
  entitlements?: unknown[];
  entries?: unknown[];
  ssoCodes?: unknown[];
  trackByUser?: Record<string, TrackStore>;
};

function storePath() {
  return path.join(process.cwd(), ".data", "note-local.json");
}

async function readFileStore(): Promise<NoteStoreFile> {
  try {
    const raw = await readFile(storePath(), "utf8");
    return JSON.parse(raw) as NoteStoreFile;
  } catch {
    return {};
  }
}

async function writeFileStore(mutate: (store: NoteStoreFile) => void) {
  const store = await readFileStore();
  mutate(store);
  const dir = path.dirname(storePath());
  await mkdir(dir, { recursive: true });
  await writeFile(storePath(), JSON.stringify(store, null, 2), "utf8");
}

const memoryTrack = new Map<string, TrackStore>();

function useMemoryStore() {
  return process.env.NOTE_REPO === "memory" || Boolean(process.env.VITEST || process.env.NODE_TEST_CONTEXT);
}

export async function readServerTrackStore(apexUserId: string): Promise<TrackStore> {
  if (useMemoryStore()) {
    return memoryTrack.get(apexUserId) ?? emptyTrackStore();
  }
  const file = await readFileStore();
  const raw = file.trackByUser?.[apexUserId];
  return parseTrackStore(raw);
}

export async function writeServerTrackStore(apexUserId: string, store: TrackStore): Promise<void> {
  const parsed = parseTrackStore(store);
  if (useMemoryStore()) {
    memoryTrack.set(apexUserId, parsed);
    return;
  }
  await writeFileStore((file) => {
    file.trackByUser ??= {};
    file.trackByUser[apexUserId] = parsed;
  });
}

export function resetServerTrackMemory() {
  memoryTrack.clear();
}
