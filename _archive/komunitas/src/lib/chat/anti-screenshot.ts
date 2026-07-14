export type ScreenshotAttemptMethod =
  | "screen-capture"
  | "visibility"
  | "devtools"
  | "context-menu";

export interface ScreenshotProtectionOptions {
  onScreenshotAttempt?: (method: ScreenshotAttemptMethod) => void;
}

const PROTECTION_STYLE_ID = "bursa-screenshot-protection";

export function applyScreenshotProtection(element: HTMLElement): () => void {
  element.style.userSelect = "none";
  element.style.webkitUserSelect = "none";
  element.setAttribute("draggable", "false");

  const style = document.createElement("style");
  style.id = PROTECTION_STYLE_ID;
  style.textContent = `
    [data-screenshot-protected] {
      -webkit-user-select: none !important;
      user-select: none !important;
      -webkit-touch-callout: none !important;
    }
    [data-screenshot-protected] * {
      -webkit-user-select: none !important;
      user-select: none !important;
      pointer-events: auto;
    }
    [data-screenshot-protected]::selection {
      background: transparent;
    }
  `;
  if (!document.getElementById(PROTECTION_STYLE_ID)) {
    document.head.appendChild(style);
  }

  element.dataset.screenshotProtected = "true";

  return () => {
    element.style.userSelect = "";
    element.style.webkitUserSelect = "";
    element.removeAttribute("draggable");
    delete element.dataset.screenshotProtected;
  };
}

export function watermarkOverlay(
  container: HTMLElement,
  userId: string,
  userName: string
): () => void {
  const overlay = document.createElement("div");
  overlay.setAttribute("aria-hidden", "true");
  overlay.className = "pointer-events-none absolute inset-0 z-20 overflow-hidden";
  overlay.dataset.watermarkOverlay = "true";

  const labels = Array.from({ length: 6 }, () => {
    const span = document.createElement("span");
    span.textContent = `${userName} · ${userId.slice(0, 8)}`;
    span.className =
      "absolute whitespace-nowrap font-mono text-[10px] text-foreground/8 rotate-[-24deg] select-none";
    overlay.appendChild(span);
    return span;
  });

  const positionLabels = () => {
    const { width, height } = container.getBoundingClientRect();
    labels.forEach((label) => {
      const x = Math.random() * Math.max(width - 120, 0);
      const y = Math.random() * Math.max(height - 24, 0);
      label.style.left = `${x}px`;
      label.style.top = `${y}px`;
    });
  };

  positionLabels();
  const interval = window.setInterval(positionLabels, 4000);

  const prevPosition = container.style.position;
  if (!prevPosition || prevPosition === "static") {
    container.style.position = "relative";
  }
  container.appendChild(overlay);

  return () => {
    window.clearInterval(interval);
    overlay.remove();
    if (!prevPosition || prevPosition === "static") {
      container.style.position = prevPosition;
    }
  };
}

export function blockContextMenu(
  element: HTMLElement,
  onAttempt?: (method: ScreenshotAttemptMethod) => void
): () => void {
  const handler = (e: Event) => {
    e.preventDefault();
    onAttempt?.("context-menu");
  };
  element.addEventListener("contextmenu", handler);
  return () => element.removeEventListener("contextmenu", handler);
}

export function detectDevTools(
  onDetected: (method: ScreenshotAttemptMethod) => void
): () => void {
  let devtoolsOpen = false;

  const check = () => {
    const threshold = 160;
    const widthGap = window.outerWidth - window.innerWidth > threshold;
    const heightGap = window.outerHeight - window.innerHeight > threshold;
    const open = widthGap || heightGap;

    if (open && !devtoolsOpen) {
      devtoolsOpen = true;
      onDetected("devtools");
    } else if (!open) {
      devtoolsOpen = false;
    }
  };

  const interval = window.setInterval(check, 1000);
  window.addEventListener("resize", check);

  return () => {
    window.clearInterval(interval);
    window.removeEventListener("resize", check);
  };
}

export function blurOnHidden(element: HTMLElement): () => void {
  const applyBlur = (hidden: boolean) => {
    element.style.filter = hidden ? "blur(12px)" : "";
    element.style.transition = "filter 0.2s ease";
    element.setAttribute("aria-hidden", hidden ? "true" : "false");
  };

  const onVisibility = () => {
    applyBlur(document.hidden);
  };

  const onBlur = () => applyBlur(true);
  const onFocus = () => applyBlur(false);

  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("blur", onBlur);
  window.addEventListener("focus", onFocus);

  return () => {
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("blur", onBlur);
    window.removeEventListener("focus", onFocus);
    applyBlur(false);
  };
}

export function detectScreenCapture(
  onAttempt: (method: ScreenshotAttemptMethod) => void
): () => void {
  const cleanups: Array<() => void> = [];

  const onVisibility = () => {
    if (document.hidden) {
      onAttempt("visibility");
    }
  };
  document.addEventListener("visibilitychange", onVisibility);
  cleanups.push(() => document.removeEventListener("visibilitychange", onVisibility));

  if (typeof navigator !== "undefined" && "mediaDevices" in navigator) {
    const mediaDevices = navigator.mediaDevices as MediaDevices & {
      addEventListener?: (type: string, listener: EventListener) => void;
      removeEventListener?: (type: string, listener: EventListener) => void;
    };

    const onDeviceChange = () => {
      onAttempt("screen-capture");
    };

    if (mediaDevices.addEventListener) {
      mediaDevices.addEventListener("devicechange", onDeviceChange);
      cleanups.push(() => mediaDevices.removeEventListener?.("devicechange", onDeviceChange));
    }
  }

  return () => cleanups.forEach((fn) => fn());
}

export function initScreenshotProtection(
  element: HTMLElement,
  userId: string,
  userName: string,
  options?: ScreenshotProtectionOptions
): () => void {
  const onAttempt = (method: ScreenshotAttemptMethod) => {
    options?.onScreenshotAttempt?.(method);
  };

  const cleanups = [
    applyScreenshotProtection(element),
    watermarkOverlay(element, userId, userName),
    blockContextMenu(element, onAttempt),
    blurOnHidden(element),
    detectDevTools(onAttempt),
    detectScreenCapture(onAttempt),
  ];

  return () => cleanups.forEach((fn) => fn());
}
