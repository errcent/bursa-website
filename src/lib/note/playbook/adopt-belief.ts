import { createBlankSetup, resolveActiveSetupId } from "@/lib/note/playbook/setup-utils";
import type { PlaybookPersisted } from "@/lib/note/playbook/types";

const MAX_CONDITION = 1200;

function appendRule(existing: string, line: string): string {
  const base = existing.trim();
  if (!base) return line;
  if (base.includes(line)) return base;
  const next = `${base}\n${line}`;
  return next.length <= MAX_CONDITION ? next : `${next.slice(0, MAX_CONDITION - 1)}…`;
}

/** Costly signal: user explicitly commits a Notes pattern into Playbook setup text. */
export function adoptBeliefSnippetToPlaybook(
  state: PlaybookPersisted,
  snippet: string,
  locale: "id" | "en"
): PlaybookPersisted {
  const text = snippet.trim().replace(/\s+/g, " ");
  if (!text) return state;

  const line =
    locale === "en" ? `· From Notes: ${text}` : `· Dari Notes: ${text}`;

  let activeId = resolveActiveSetupId(state.setups, state.activeSetupId);
  let setups = state.setups;

  if (!activeId) {
    const created = createBlankSetup(setups, locale);
    activeId = created.id;
    setups = [...setups, created];
  }

  return {
    ...state,
    activeSetupId: activeId,
    setups: setups.map((s) => {
      if (s.id !== activeId) return s;
      return {
        ...s,
        condition: {
          id: appendRule(s.condition.id, line),
          en: appendRule(s.condition.en, line),
        },
      };
    }),
  };
}
