/** Display module heading without redundant "Modul N:" prefix from catalog data. */
export function formatModuleTitle(title: string): string {
  return title.replace(/^Modul\s*\d+\s*:\s*/i, "").trim() || title;
}
