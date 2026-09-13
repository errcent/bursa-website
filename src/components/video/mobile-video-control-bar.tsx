"use client";

import { useRef } from "react";
import {
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Settings,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import {
  DEFAULT_QUALITY_OPTIONS,
  VIDEO_PLAYBACK_SPEEDS,
  type VideoQualityOption,
  type VideoQualityValue,
} from "@/components/video/video-control-bar";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

const iconBtn =
  "inline-flex size-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-colors active:bg-black/65";

const cornerBtn =
  "inline-flex size-8 items-center justify-center rounded-md text-white/90 transition-colors active:bg-white/10";

const menuContentClass =
  "min-w-[9rem] border border-white/10 bg-black/95 p-1 text-white shadow-xl backdrop-blur-md";

const menuItemClass =
  "text-white/90 focus:bg-white/10 focus:text-white data-[disabled]:opacity-40";

type MobileVideoControlBarProps = {
  isPlaying: boolean;
  showControls: boolean;
  currentTime: number;
  duration: number;
  playbackSpeed: number;
  quality: VideoQualityValue;
  qualityOptions?: VideoQualityOption[];
  isFullscreen: boolean;
  subtitlesEnabled: boolean;
  hasSubtitleTracks: boolean;
  onRevealControls: () => void;
  onTogglePlay: () => void;
  onSeek: (clientX: number) => void;
  onSeekBy: (deltaSeconds: number) => void;
  onChangeSpeed: (speed: number) => void;
  onChangeQuality: (quality: VideoQualityValue) => void;
  onToggleSubtitles: () => void;
  onToggleFullscreen: () => void;
  highlightFullscreenControl?: boolean;
};

export function MobileVideoControlBar({
  isPlaying,
  showControls,
  currentTime,
  duration,
  playbackSpeed,
  quality,
  qualityOptions = DEFAULT_QUALITY_OPTIONS,
  isFullscreen,
  subtitlesEnabled,
  hasSubtitleTracks,
  onRevealControls,
  onTogglePlay,
  onSeek,
  onSeekBy,
  onChangeSpeed,
  onChangeQuality,
  onToggleSubtitles,
  onToggleFullscreen,
  highlightFullscreenControl = false,
}: MobileVideoControlBarProps) {
  const progressRef = useRef<HTMLDivElement>(null);
  const isScrubbingRef = useRef(false);

  const handleProgressPointer = (clientX: number) => {
    onSeek(clientX);
    onRevealControls();
  };

  const visible = showControls || !isPlaying;

  return (
    <div
      data-video-controls
      className="pointer-events-none absolute inset-0 z-40 lg:hidden"
    >
      <div
        className={cn(
          "pointer-events-auto absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center justify-center gap-5 px-6 transition-opacity duration-300",
          visible ? "opacity-100" : "opacity-0"
        )}
      >
        <button
          type="button"
          className={iconBtn}
          aria-label="Mundur 10 detik"
          onClick={(e) => {
            e.stopPropagation();
            onSeekBy(-10);
          }}
        >
          <RotateCcw className="size-5" aria-hidden />
          <span className="sr-only">10 detik</span>
        </button>
        <button
          type="button"
          className="inline-flex size-14 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm"
          aria-label={isPlaying ? "Jeda" : "Putar"}
          onClick={(e) => {
            e.stopPropagation();
            onTogglePlay();
          }}
        >
          {isPlaying ? (
            <Pause className="size-7" aria-hidden />
          ) : (
            <Play className="size-7 pl-0.5" aria-hidden />
          )}
        </button>
        <button
          type="button"
          className={iconBtn}
          aria-label="Maju 10 detik"
          onClick={(e) => {
            e.stopPropagation();
            onSeekBy(10);
          }}
        >
          <RotateCw className="size-5" aria-hidden />
        </button>
      </div>

      <div
        className={cn(
          "pointer-events-auto absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/55 to-transparent px-3 pb-2 pt-4 transition-opacity duration-300",
          visible ? "opacity-100" : "opacity-0"
        )}
      >
        <div
          ref={progressRef}
          className="mb-2 flex h-4 cursor-pointer touch-none items-center"
          onClick={(e) => {
            e.stopPropagation();
            handleProgressPointer(e.clientX);
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            isScrubbingRef.current = true;
            progressRef.current?.setPointerCapture(e.pointerId);
            handleProgressPointer(e.clientX);
          }}
          onPointerMove={(e) => {
            if (!isScrubbingRef.current) return;
            handleProgressPointer(e.clientX);
          }}
          onPointerUp={(e) => {
            isScrubbingRef.current = false;
            progressRef.current?.releasePointerCapture(e.pointerId);
          }}
          onPointerCancel={() => {
            isScrubbingRef.current = false;
          }}
          role="slider"
          aria-label="Progres video"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={currentTime}
        >
          <div className="relative h-1 w-full rounded-full bg-white/30">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-white"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="flex h-8 items-center justify-between gap-2">
          <span className="font-mono text-[11px] tabular-nums text-white/90">
            {formatTime(currentTime)}
          </span>
          <div className="flex items-center gap-0.5">
            <span className="mr-1 font-mono text-[11px] tabular-nums text-white/75">
              {formatTime(duration)}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className={cornerBtn}
                    aria-label="Pengaturan video"
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <Settings className="size-[17px]" />
                  </button>
                }
              />
              <DropdownMenuContent align="end" side="top" className={menuContentClass}>
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-[11px] text-white/60">
                    Kecepatan
                  </DropdownMenuLabel>
                  {VIDEO_PLAYBACK_SPEEDS.map((speed) => (
                    <DropdownMenuItem
                      key={speed}
                      className={cn(menuItemClass, playbackSpeed === speed && "bg-white/10")}
                      onClick={() => onChangeSpeed(speed)}
                    >
                      {speed}x
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
                <DropdownMenuRadioGroup
                  value={quality}
                  onValueChange={(value) => onChangeQuality(value as VideoQualityValue)}
                >
                  <DropdownMenuLabel className="text-[11px] text-white/60">
                    Kualitas
                  </DropdownMenuLabel>
                  {qualityOptions.map((option) => (
                    <DropdownMenuRadioItem
                      key={option.value}
                      value={option.value}
                      disabled={option.disabled}
                      className={menuItemClass}
                    >
                      {option.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
                {hasSubtitleTracks ? (
                  <DropdownMenuItem
                    className={menuItemClass}
                    onClick={() => onToggleSubtitles()}
                  >
                    Subtitle: {subtitlesEnabled ? "Nyala" : "Mati"}
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              type="button"
              className={cn(
                cornerBtn,
                highlightFullscreenControl &&
                  "ring-2 ring-white/70 ring-offset-1 ring-offset-black/50"
              )}
              aria-label={isFullscreen ? "Keluar layar penuh" : "Layar penuh"}
              onClick={(e) => {
                e.stopPropagation();
                void onToggleFullscreen();
              }}
            >
              {isFullscreen ? (
                <Minimize className="size-[17px]" />
              ) : (
                <Maximize className="size-[17px]" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
