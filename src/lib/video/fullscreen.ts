type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void>;
};

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

type FullscreenVideo = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void;
  webkitDisplayingFullscreen?: boolean;
};

export function getFullscreenElement(): Element | null {
  const doc = document as FullscreenDocument;
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

export function isVideoFullscreen(video: HTMLVideoElement | null): boolean {
  if (!video) return false;
  const webkitVideo = video as FullscreenVideo;
  return Boolean(webkitVideo.webkitDisplayingFullscreen);
}

export async function exitFullscreen(): Promise<void> {
  const doc = document as FullscreenDocument;
  const exit = doc.exitFullscreen?.bind(doc) ?? doc.webkitExitFullscreen?.bind(doc);
  if (!exit) return;
  try {
    await exit();
  } catch {
    // ignore — element may already be out of fullscreen
  }
}

export async function requestVideoFullscreen(
  container: HTMLElement,
  video: HTMLVideoElement | null
): Promise<void> {
  if (getFullscreenElement() || isVideoFullscreen(video)) {
    await exitFullscreen();
    return;
  }

  const requestContainer =
    container.requestFullscreen?.bind(container) ??
    (container as FullscreenElement).webkitRequestFullscreen?.bind(container);

  if (requestContainer) {
    try {
      await requestContainer();
      return;
    } catch {
      // fall through to native video fullscreen (iOS)
    }
  }

  const webkitVideo = video as FullscreenVideo | null;
  if (webkitVideo?.webkitEnterFullscreen) {
    webkitVideo.webkitEnterFullscreen();
  }
}

export function subscribeFullscreenChange(handler: () => void): () => void {
  const events = ["fullscreenchange", "webkitfullscreenchange"] as const;
  events.forEach((event) => document.addEventListener(event, handler));
  return () => events.forEach((event) => document.removeEventListener(event, handler));
}

export function subscribeVideoFullscreenChange(
  video: HTMLVideoElement | null,
  handler: () => void
): () => void {
  if (!video) return () => undefined;

  const onBegin = () => handler();
  const onEnd = () => handler();

  video.addEventListener("webkitbeginfullscreen", onBegin);
  video.addEventListener("webkitendfullscreen", onEnd);

  return () => {
    video.removeEventListener("webkitbeginfullscreen", onBegin);
    video.removeEventListener("webkitendfullscreen", onEnd);
  };
}
