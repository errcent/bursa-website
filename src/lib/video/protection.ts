import type { Lesson } from "@/lib/types";

const ENROLLMENTS_KEY = "bursa-enrollments";
const TOKEN_SECRET = "bursa-demo-secret-v1";

export type ProtectionViolationType =
  | "screen_capture"
  | "context_menu"
  | "keyboard_shortcut"
  | "tab_blur"
  | "print_screen";

export interface WatermarkSettings {
  text: string;
  opacity: number;
  fontSize: string;
  rotation: number;
  instanceCount: number;
  repositionIntervalMs: number;
}

export interface PlaybackToken {
  token: string;
  expiresAt: string;
  lessonId: string;
  userId: string;
}

export interface EnrollmentRecord {
  userId: string;
  courseId: string;
  enrolledAt: string;
}

function isBrowser() {
  return typeof window !== "undefined";
}

export function isPreviewLesson(lesson: Pick<Lesson, "preview">): boolean {
  return lesson.preview === true;
}

export function readEnrollments(): EnrollmentRecord[] {
  if (!isBrowser()) return [];
  const raw = localStorage.getItem(ENROLLMENTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as EnrollmentRecord[];
  } catch {
    return [];
  }
}

export function enrollUser(userId: string, courseId: string) {
  if (!isBrowser()) return;
  const enrollments = readEnrollments();
  const exists = enrollments.some((e) => e.userId === userId && e.courseId === courseId);
  if (exists) return;
  enrollments.push({ userId, courseId, enrolledAt: new Date().toISOString() });
  localStorage.setItem(ENROLLMENTS_KEY, JSON.stringify(enrollments));
}

export function isEnrolled(userId: string, courseId: string): boolean {
  if (userId === "user-demo-dinda") return true;
  return readEnrollments().some((e) => e.userId === userId && e.courseId === courseId);
}

export function canAccessVideo(
  userId: string | null | undefined,
  courseId: string,
  lesson: Pick<Lesson, "id" | "preview">
): boolean {
  if (isPreviewLesson(lesson)) return true;
  if (!userId) return false;
  return isEnrolled(userId, courseId);
}

function encodeBase64(value: string): string {
  if (typeof btoa !== "undefined") return btoa(value);
  return value;
}

export function generatePlaybackToken(userId: string, lessonId: string): PlaybackToken {
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
  const payload = `${userId}:${lessonId}:${expiresAt}`;
  const signature = encodeBase64(`${payload}:${TOKEN_SECRET}`);
  const token = encodeBase64(`${payload}:${signature}`);

  return { token, expiresAt, lessonId, userId };
}

export function watermarkConfig(userId: string, userEmail: string): WatermarkSettings {
  const shortId = userId.slice(-8).toUpperCase();
  const emailPrefix = userEmail.split("@")[0] ?? userEmail;

  return {
    text: `${emailPrefix} · ${shortId}`,
    opacity: 0.18,
    fontSize: "0.85rem",
    rotation: -24,
    instanceCount: 4,
    repositionIntervalMs: 30_000,
  };
}

export function detectScreenCapture(onDetected: (type: ProtectionViolationType) => void): () => void {
  if (!isBrowser()) return () => undefined;

  const cleanups: Array<() => void> = [];

  const handleKeyDown = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    const isPrintScreen = event.key === "PrintScreen" || key === "printscreen";
    const isScreenshotCombo =
      (event.metaKey || event.ctrlKey) && ["s", "p", "shift"].includes(key);
    const isDevTools =
      event.key === "F12" ||
      ((event.ctrlKey || event.metaKey) && event.shiftKey && ["i", "j", "c"].includes(key));

    if (isPrintScreen || isScreenshotCombo) {
      event.preventDefault();
      onDetected("print_screen");
    }
    if (isDevTools) {
      event.preventDefault();
      onDetected("keyboard_shortcut");
    }
  };

  window.addEventListener("keydown", handleKeyDown, true);
  cleanups.push(() => window.removeEventListener("keydown", handleKeyDown, true));

  const handleVisibility = () => {
    if (document.hidden) {
      onDetected("tab_blur");
    }
  };

  document.addEventListener("visibilitychange", handleVisibility);
  cleanups.push(() => document.removeEventListener("visibilitychange", handleVisibility));

  if ("permissions" in navigator) {
    navigator.permissions
      .query({ name: "display-capture" as PermissionName })
      .then((status) => {
        const onChange = () => {
          if (status.state === "granted") {
            onDetected("screen_capture");
          }
        };
        status.addEventListener("change", onChange);
        cleanups.push(() => status.removeEventListener("change", onChange));
        if (status.state === "granted") onChange();
      })
      .catch(() => undefined);
  }

  let capturePollId: ReturnType<typeof setInterval> | undefined;
  if (navigator.mediaDevices?.enumerateDevices) {
    capturePollId = setInterval(async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasCapture = devices.some(
          (d) => d.kind === "videoinput" && d.label.toLowerCase().includes("screen")
        );
        if (hasCapture) {
          onDetected("screen_capture");
        }
      } catch {
        // enumerateDevices may require permission
      }
    }, 3000);
    cleanups.push(() => {
      if (capturePollId) clearInterval(capturePollId);
    });
  }

  return () => {
    cleanups.forEach((fn) => fn());
  };
}

export function applyVideoProtection(
  playerElement: HTMLElement,
  options: {
    onViolation?: (type: ProtectionViolationType) => void;
    blurOnFocusLoss?: boolean;
  } = {}
): () => void {
  const { onViolation, blurOnFocusLoss = true } = options;
  const cleanups: Array<() => void> = [];

  playerElement.style.userSelect = "none";
  playerElement.style.webkitUserSelect = "none";
  playerElement.style.setProperty("-webkit-touch-callout", "none");

  const handleContextMenu = (event: Event) => {
    event.preventDefault();
    onViolation?.("context_menu");
  };

  playerElement.addEventListener("contextmenu", handleContextMenu);
  cleanups.push(() => playerElement.removeEventListener("contextmenu", handleContextMenu));

  const handleDragStart = (event: Event) => {
    event.preventDefault();
  };

  playerElement.addEventListener("dragstart", handleDragStart);
  cleanups.push(() => playerElement.removeEventListener("dragstart", handleDragStart));

  const video = playerElement.querySelector("video");
  if (video) {
    video.setAttribute("controlsList", "nodownload noremoteplayback");
    video.setAttribute("disablePictureInPicture", "true");
    video.setAttribute("oncontextmenu", "return false;");
    video.controls = false;
  }

  if (blurOnFocusLoss) {
    const handleBlur = () => {
      playerElement.dataset.protectionBlurred = "true";
      onViolation?.("tab_blur");
    };

    const handleFocus = () => {
      delete playerElement.dataset.protectionBlurred;
    };

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) handleBlur();
      else handleFocus();
    });

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    cleanups.push(() => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    });
  }

  const stopCaptureDetection = detectScreenCapture((type) => {
    onViolation?.(type);
  });
  cleanups.push(stopCaptureDetection);

  return () => {
    cleanups.forEach((fn) => fn());
    delete playerElement.dataset.protectionBlurred;
  };
}
