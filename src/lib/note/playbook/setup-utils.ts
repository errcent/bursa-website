import { DEFAULT_SETUP_ID } from "@/lib/note/playbook/defaults";
import type { PlaybookSetup } from "@/lib/note/playbook/types";

export function createBlankSetup(existing: PlaybookSetup[], locale: "id" | "en"): PlaybookSetup {
  const n = existing.length + 1;
  const placeholder =
    locale === "en"
      ? "Describe when this setup is valid - your own style."
      : "Tulis kapan setup ini valid - gaya trade kamu sendiri.";
  return {
    id: `setup-${Date.now()}-${n}`,
    name: locale === "en" ? `Setup ${n}` : `Setup ${n}`,
    condition: { id: placeholder, en: placeholder },
    confidence: "med",
    enabled: true,
  };
}

export function cloneSetupTemplate(template: PlaybookSetup): PlaybookSetup {
  return {
    ...template,
    id: `setup-${Date.now()}`,
    condition: { ...template.condition },
    enabled: true,
  };
}

export function resolveActiveSetupId(
  setups: PlaybookSetup[],
  activeSetupId: string | null
): string | null {
  if (activeSetupId && setups.some((s) => s.id === activeSetupId && s.enabled)) {
    return activeSetupId;
  }
  const first = setups.find((s) => s.enabled);
  return first?.id ?? null;
}

export function afterRemovingSetup(
  setups: PlaybookSetup[],
  removedId: string,
  activeSetupId: string | null
): { setups: PlaybookSetup[]; activeSetupId: string | null } {
  const next = setups.filter((s) => s.id !== removedId);
  if (removedId !== activeSetupId) return { setups: next, activeSetupId };
  return { setups: next, activeSetupId: resolveActiveSetupId(next, null) };
}

export { DEFAULT_SETUP_ID };
