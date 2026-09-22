"use client";

import { useEffect, useState } from "react";

import { useNoteJournal } from "@/components/note/note-journal-context";
import { useNotePrefs } from "@/lib/note/use-note-prefs";
import { cn } from "@/lib/utils";

/**
 * Auto-backup (v3 P0).
 *
 * Data survival = trust. Local-first IndexedDB dies if browser cleared.
 * This component:
 * 1. Exports journal to a JSON file (download) — zero-cost, no cloud
 * 2. Shows "last backed up" timestamp
 * 3. Reminds if backup is stale (>7 days)
 *
 * Google Drive integration is stubbed (Drive API needs OAuth).
 * For now, file download is the $0 backup mechanism.
 */

const BACKUP_KEY = "note-last-backup-v1";

function loadLastBackup(): string | null {
  try {
    return localStorage.getItem(BACKUP_KEY);
  } catch {
    return null;
  }
}

function saveLastBackup(iso: string) {
  try {
    localStorage.setItem(BACKUP_KEY, iso);
  } catch {
    /* ignore */
  }
}

export function NoteBackupBar() {
  const [prefs] = useNotePrefs();
  const journal = useNoteJournal();
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    setLastBackup(loadLastBackup());
  }, []);

  const t = (id: string, en: string) => (prefs.locale === "en" ? en : id);

  const stale = !lastBackup || Date.now() - Date.parse(lastBackup) > 7 * 24 * 60 * 60 * 1000;

  function exportBackup() {
    if (!journal.data) return;
    setDownloading(true);
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      entries: journal.data.entries ?? [],
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bursa-note-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    const now = new Date().toISOString();
    setLastBackup(now);
    saveLastBackup(now);
    setDownloading(false);
  }

  if (journal.loading || !journal.data) return null;
  const entryCount = (journal.data.entries ?? []).length;
  if (entryCount === 0) return null;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5",
        stale
          ? "border-amber-800/60 bg-amber-950/20"
          : "border-zinc-800/80 bg-zinc-900/30"
      )}
    >
      <div className="min-w-0">
        <p className="text-xs font-medium text-zinc-200">
          {t("Backup jurnal", "Journal backup")}
        </p>
        <p className="text-xs text-zinc-400">
          {lastBackup
            ? t(
                `Terakhir: ${new Date(lastBackup).toLocaleDateString("id-ID")}`,
                `Last: ${new Date(lastBackup).toLocaleDateString("en-US")}`
              )
            : t("Belum pernah backup", "Never backed up")}
          {stale ? ` · ${t("Backup sudah lama", "Backup is stale")}` : ""}
        </p>
      </div>
      <button
        type="button"
        className="inline-flex min-h-9 coarse:min-h-11 items-center rounded-md bg-zinc-100 px-3 text-xs font-medium text-zinc-950 hover:bg-white"
        onClick={exportBackup}
        disabled={downloading}
      >
        {downloading ? t("Mengunduh...", "Downloading...") : t("Backup", "Backup")}
      </button>
    </div>
  );
}
