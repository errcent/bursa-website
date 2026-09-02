"use client";

import { useCallback, useEffect, useState } from "react";

import {
  DEFAULT_NOTE_PREFS,
  loadNotePrefs,
  saveNotePrefs,
  subscribeNotePrefs,
  type NotePrefs,
} from "@/lib/note/prefs";

export function useNotePrefs() {
  const [prefs, setPrefs] = useState<NotePrefs>(DEFAULT_NOTE_PREFS);

  useEffect(() => {
    setPrefs(loadNotePrefs());
    return subscribeNotePrefs(() => setPrefs(loadNotePrefs()));
  }, []);

  const update = useCallback((patch: Partial<NotePrefs>) => {
    const next: NotePrefs = { ...loadNotePrefs(), ...patch, version: 1 };
    saveNotePrefs(next);
    setPrefs(next);
  }, []);

  return [prefs, update] as const;
}
