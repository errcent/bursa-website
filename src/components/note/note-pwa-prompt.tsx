"use client";

import { useEffect, useState } from "react";

import { useNotePrefs } from "@/lib/note/use-note-prefs";
import { cn } from "@/lib/utils";

/**
 * PWA install + push notification prompt (v3 P0).
 *
 * - Registers service worker for offline app shell
 * - Asks for push notification permission (habit trigger)
 * - Shows "Add to home screen" prompt when installable
 *
 * The habit trigger: a daily push "Log trade hari ini" breaks
 * the "don't log" equilibrium by pulling the user back even
 * when they're avoidant (loss aversion).
 */

const SW_PATH = "/sw-note.js";
const REMINDER_KEY = "note-push-reminder-opted-v1";

export function NotePwaPrompt() {
  const [prefs] = useNotePrefs();
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [swRegistered, setSwRegistered] = useState(false);
  const [pushStatus, setPushStatus] = useState<"unknown" | "granted" | "denied" | "unsupported">("unknown");
  const [showReminder, setShowReminder] = useState(false);

  const t = (id: string, en: string) => (prefs.locale === "en" ? en : id);

  // Register service worker
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register(SW_PATH, { scope: "/note/" })
      .then(() => setSwRegistered(true))
      .catch(() => {});

    // Check push permission
    if (!("Notification" in window)) {
      setPushStatus("unsupported");
      return;
    }
    setPushStatus(Notification.permission as "granted" | "denied");

    // Check if reminder was already opted
    try {
      const opted = localStorage.getItem(REMINDER_KEY);
      if (!opted && Notification.permission === "default") {
        setShowReminder(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Capture install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function enablePush() {
    if (!("Notification" in window)) {
      setPushStatus("unsupported");
      return;
    }
    const perm = await Notification.requestPermission();
    setPushStatus(perm as "granted" | "denied");
    try {
      localStorage.setItem(REMINDER_KEY, "1");
    } catch {
      /* ignore */
    }
    setShowReminder(false);

    // Subscribe to push via service worker
    if (swRegistered && "serviceWorker" in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        // VAPID key would be needed for real push; for now, local scheduled reminder
        await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: undefined,
        });
      } catch {
        /* push subscription failed — local reminder still works */
      }
    }
  }

  function dismissReminder() {
    setShowReminder(false);
    try {
      localStorage.setItem(REMINDER_KEY, "dismissed");
    } catch {
      /* ignore */
    }
  }

  async function installApp() {
    if (!installEvent) return;
    installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  }

  return (
    <>
      {/* Push reminder banner */}
      {showReminder && pushStatus === "unknown" ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800/80 bg-zinc-900/40 px-3 py-2.5">
          <p className="text-xs text-zinc-300">
            {t(
              "Aktifkan pengingat harian agar tidak lupa log trade.",
              "Enable daily reminders so you don't forget to log trades."
            )}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className="inline-flex min-h-9 coarse:min-h-11 items-center rounded-md bg-zinc-100 px-3 text-xs font-medium text-zinc-950 hover:bg-white"
              onClick={enablePush}
            >
              {t("Aktifkan", "Enable")}
            </button>
            <button
              type="button"
              className="inline-flex min-h-9 coarse:min-h-11 items-center px-2 text-xs text-zinc-500 hover:text-zinc-300"
              onClick={dismissReminder}
            >
              {t("Nanti", "Later")}
            </button>
          </div>
        </div>
      ) : null}

      {/* Install prompt */}
      {installEvent ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800/80 bg-zinc-900/40 px-3 py-2.5">
          <p className="text-xs text-zinc-300">
            {t(
              "Pasang Bursa Note di layar utama untuk akses cepat.",
              "Install Bursa Note to your home screen for quick access."
            )}
          </p>
          <button
            type="button"
            className="inline-flex min-h-9 coarse:min-h-11 items-center rounded-md bg-zinc-100 px-3 text-xs font-medium text-zinc-950 hover:bg-white"
            onClick={installApp}
          >
            {t("Pasang", "Install")}
          </button>
        </div>
      ) : null}
    </>
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
