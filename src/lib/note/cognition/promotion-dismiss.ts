const KEY = "note-promotion-dismiss-v1";

export function loadDismissedPromotions(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

export function dismissPromotion(id: string) {
  const set = loadDismissedPromotions();
  set.add(id);
  localStorage.setItem(KEY, JSON.stringify([...set]));
}

export function filterDismissedPromotions<T extends { id: string }>(items: T[]): T[] {
  const dismissed = loadDismissedPromotions();
  return items.filter((i) => !dismissed.has(i.id));
}
