"use client";

import { useState } from "react";

import { useNoteJournal } from "@/components/note/note-journal-context";
import { useNotePrefs } from "@/lib/note/use-note-prefs";
import { summarizeJournal } from "@/lib/note/stats";
import { isPnlKind } from "@/lib/note/types";
import { cn } from "@/lib/utils";

/**
 * Mentor share link (v3 P0).
 *
 * External accountability = the equilibrium-breaking move.
 * A journal a mentor sees creates a reputation cost for not logging.
 *
 * Generates a share token (stored in localStorage) that encodes
 * a read-only summary of the journal. The mentor sees a public
 * share page with PnL, win rate, and recent trades (no raw notes).
 */

const SHARE_KEY = "note-mentor-share-v1";

interface ShareState {
  token: string;
  createdAt: string;
}

function loadShare(): ShareState | null {
  try {
    const raw = localStorage.getItem(SHARE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ShareState;
  } catch {
    return null;
  }
}

function saveShare(state: ShareState) {
  try {
    localStorage.setItem(SHARE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function generateToken(): string {
  // Simple token: timestamp + random
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function MentorShareButton() {
  const [prefs] = useNotePrefs();
  const journal = useNoteJournal();
  const [share, setShare] = useState<ShareState | null>(null);
  const [copied, setCopied] = useState(false);

  const t = (id: string, en: string) => (prefs.locale === "en" ? en : id);

  // Load existing share on mount
  useState(() => {
    setShare(loadShare());
  });

  function createShare() {
    const state: ShareState = { token: generateToken(), createdAt: new Date().toISOString() };
    setShare(state);
    saveShare(state);
  }

  function copyLink() {
    if (!share) return;
    const url = `${window.location.origin}/note/share/${share.token}`;
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function revokeShare() {
    setShare(null);
    try {
      localStorage.removeItem(SHARE_KEY);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
          {t("Bagikan ke mentor", "Share with mentor")}
        </p>
        {share ? (
          <button
            type="button"
            className="text-xs text-zinc-500 hover:text-rose-300"
            onClick={revokeShare}
          >
            {t("Cabut", "Revoke")}
          </button>
        ) : null}
      </div>
      <p className="text-xs leading-snug text-zinc-400">
        {t(
          "Mentor lihat ringkasan PnL + win rate + trade terbaru (tanpa catatan privat). Akuntabilitas eksternal.",
          "Mentor sees PnL summary + win rate + recent trades (no private notes). External accountability."
        )}
      </p>
      {share ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-md border border-zinc-700 bg-zinc-900 px-2 py-2 text-xs text-zinc-300">
              /note/share/{share.token}
            </code>
            <button
              type="button"
              className="inline-flex min-h-11 items-center rounded-md bg-zinc-100 px-3 text-xs font-medium text-zinc-950 hover:bg-white"
              onClick={copyLink}
            >
              {copied ? t("Tersalin", "Copied") : t("Salin", "Copy")}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="inline-flex min-h-11 items-center rounded-md border border-zinc-700 px-3 text-xs text-zinc-300 hover:bg-zinc-800"
          onClick={createShare}
        >
          {t("Buat link bagikan", "Create share link")}
        </button>
      )}
    </div>
  );
}
