"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { GripHorizontal, Play, X } from "lucide-react";

type PipSession = {
  lessonHref: string;
  returnPath: string;
  courseTitle: string;
};

type MobileLearningPipContextValue = {
  session: PipSession | null;
  enterDetached: (input: PipSession & { video: HTMLVideoElement | null }) => Promise<void>;
  expandToLesson: () => void;
  dismiss: () => void;
};

const MobileLearningPipContext = createContext<MobileLearningPipContextValue | null>(null);

export function useMobileLearningPip() {
  const ctx = useContext(MobileLearningPipContext);
  if (!ctx) {
    throw new Error("useMobileLearningPip must be used within MobileLearningPipProvider");
  }
  return ctx;
}

export function useMobileLearningPipOptional() {
  return useContext(MobileLearningPipContext);
}

const MINI_MARGIN = 10;
const MINI_BOTTOM_SAFE = 72;
const MINI_WIDTH = 156;

async function tryEnterNativePiP(video: HTMLVideoElement | null) {
  if (!video || typeof document === "undefined") return;
  if (!document.pictureInPictureEnabled) return;
  try {
    if (document.pictureInPictureElement !== video) {
      await video.requestPictureInPicture();
    }
  } catch {
    // PiP denied or unsupported - playback stays in-page until unmount.
  }
}

function MobileLearningPipOverlay({
  session,
  onExpand,
  onDismiss,
}: {
  session: PipSession;
  onExpand: () => void;
  onDismiss: () => void;
}) {
  const pathname = usePathname() ?? "";
  const onBelajar = pathname.startsWith("/belajar/");

  if (onBelajar) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[92] lg:hidden"
      aria-hidden={false}
    >
      <div
        className="pointer-events-auto absolute overflow-hidden rounded-[14px] border border-white/20 bg-black shadow-[0_12px_40px_rgba(0,0,0,0.55)]"
        style={{
          width: MINI_WIDTH,
          height: MINI_WIDTH * (9 / 16) + 44,
          right: MINI_MARGIN,
          bottom: MINI_BOTTOM_SAFE,
        }}
      >
        <button
          type="button"
          className="flex w-full flex-col"
          onClick={onExpand}
        >
          <div
            className="relative flex aspect-video w-full items-center justify-center bg-black/80"
            data-float-drag
          >
            <Play className="size-9 text-white/85" aria-hidden />
          </div>
        </button>
        <div className="flex items-center gap-1 border-t border-white/10 bg-black/90 px-1.5 py-1">
          <button
            type="button"
            onClick={onExpand}
            className="inline-flex size-8 flex-1 items-center justify-center rounded-md text-white/80"
            aria-label="Buka video penuh"
          >
            <GripHorizontal className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="inline-flex size-8 items-center justify-center rounded-md bg-white/10 text-white"
            aria-label="Tutup mini player"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
        <p className="pointer-events-none absolute -bottom-6 left-0 right-0 truncate px-0.5 text-[10px] text-muted-foreground">
          {session.courseTitle}
        </p>
      </div>
    </div>
  );
}

export function MobileLearningPipProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const [session, setSession] = useState<PipSession | null>(null);

  const dismiss = useCallback(() => {
    if (typeof document !== "undefined" && document.pictureInPictureElement) {
      void document.exitPictureInPicture().catch(() => undefined);
    }
    setSession(null);
  }, []);

  const enterDetached = useCallback(
    async (input: PipSession & { video: HTMLVideoElement | null }) => {
      setSession({
        lessonHref: input.lessonHref,
        returnPath: input.returnPath,
        courseTitle: input.courseTitle,
      });
      void tryEnterNativePiP(input.video);
    },
    []
  );

  const expandToLesson = useCallback(() => {
    if (!session) return;
    if (typeof document !== "undefined" && document.pictureInPictureElement) {
      void document.exitPictureInPicture().catch(() => undefined);
    }
    const href = session.lessonHref;
    setSession(null);
    router.push(href);
  }, [router, session]);

  const value = useMemo(
    () => ({
      session,
      enterDetached,
      expandToLesson,
      dismiss,
    }),
    [dismiss, enterDetached, expandToLesson, session]
  );

  return (
    <MobileLearningPipContext.Provider value={value}>
      {children}
      {session ? (
        <MobileLearningPipOverlay
          session={session}
          onExpand={expandToLesson}
          onDismiss={dismiss}
        />
      ) : null}
    </MobileLearningPipContext.Provider>
  );
}

