import type { BeliefLink } from "@/lib/note/cognition/types";

const KEY = "note-belief-links-v1";

export function loadBeliefLinks(): Record<string, BeliefLink> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, BeliefLink>;
  } catch {
    return {};
  }
}

export function saveBeliefLink(entryId: string, link: BeliefLink) {
  const all = loadBeliefLinks();
  all[entryId] = { ...all[entryId], ...link };
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function getBeliefLink(entryId: string): BeliefLink | null {
  return loadBeliefLinks()[entryId] ?? null;
}
