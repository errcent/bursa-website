export function generateDsarReferenceCode(now = new Date()): string {
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `DSR-${date}-${rand}`;
}
