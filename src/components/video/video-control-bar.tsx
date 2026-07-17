"use client";

import { useRef } from "react";
import {
  Captions,
  CaptionsOff,
  Gauge,
  Maximize,
  Minimize,
  Pause,
  Play,
  Settings,
  Volume2,
  VolumeX,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export const VIDEO_PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

export type VideoQualityValue = "Auto" | "360p" | "540p" | "720p" | "1080p";

export interface VideoQualityOption {
  value: VideoQualityValue;
  label: string;
  hd?: boolean;
  disabled?: boolean;
}

export const DEFAULT_QUALITY_OPTIONS: VideoQualityOption[] = [
  { value: "Auto", label: "Auto" },
  { value: "360p", label: "360p", disabled: true },
  { value: "540p", label: "540p", disabled: true },
  { value: "720p", label: "720p", hd: true, disabled: true },
  { value: "1080p", label: "1080p", hd: true, disabled: true },
];

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

const controlButtonClass =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-md text-white/90 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30";

const menuContentClass =
  "min-w-[9rem] border border-white/10 bg-black/95 p-1 text-white shadow-xl backdrop-blur-md";

const menuItemClass =
  "text-white/90 focus:bg-white/10 focus:text-white data-[disabled]:opacity-40";

interface VideoControlBarProps {
  isPlaying: boolean;
  showControls: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackSpeed: number;
  quality: VideoQualityValue;
  qualityOptions?: VideoQualityOption[];
  isFullscreen: boolean;
  subtitlesEnabled: boolean;
  hasSubtitleTracks: boolean;
  chapterMarkers?: { percent: number; label: string }[];
  onRevealControls: () => void;
  onTogglePlay: () => void;
  onSeek: (clientX: number) => void;
  onToggleMute: () => void;
  onVolumeChange: (value: number) => void;
  onChangeSpeed: (speed: number) => void;
  onChangeQuality: (quality: VideoQualityValue) => void;
  onToggleSubtitles: () => void;
  onToggleFullscreen: () => void;
  className?: string;
}

export function VideoControlBar({
  isPlaying,
  showControls,
  currentTime,
  duration,
  volume,
  isMuted,
  playbackSpeed,
  quality,
  qualityOptions = DEFAULT_QUALITY_OPTIONS,
  isFullscreen,
  subtitlesEnabled,
  hasSubtitleTracks,
  chapterMarkers = [],
  onRevealControls,
  onTogglePlay,
  onSeek,
  onToggleMute,
  onVolumeChange,
  onChangeSpeed,
  onChangeQuality,
  onToggleSubtitles,
  onToggleFullscreen,
  className,
}: VideoControlBarProps) {
  const progressRef = useRef<HTMLDivElement>(null);
  const isScrubbingRef = useRef(false);

  const handleProgressPointer = (clientX: number) => {
    onSeek(clientX);
    onRevealControls();
  };

  return (
    <div
      data-video-controls
      className={cn(
        "absolute inset-x-0 bottom-0 z-40 bg-gradient-to-t from-black/95 via-black/70 to-transparent px-3 pb-2 pt-6 transition-opacity duration-300 sm:px-4",
        showControls || !isPlaying ? "opacity-100" : "pointer-events-none opacity-0",
        className
      )}
      onPointerDown={onRevealControls}
    >
      <div
        ref={progressRef}
        className="group/progress relative mb-2 flex h-3 cursor-pointer touch-none items-center sm:h-1"
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
        <div className="relative h-1 w-full rounded-full bg-white/25 transition-[height] group-hover/progress:h-1.5 sm:h-1">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-white transition-all"
            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          />
          {chapterMarkers.map((marker) => (
            <div
              key={marker.label}
              className="absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70"
              style={{ left: `${marker.percent}%` }}
              title={marker.label}
            />
          ))}
        </div>
      </div>

      <div className="flex h-10 items-center gap-1 sm:h-11 sm:gap-1.5">
        <div className="flex min-w-0 items-center gap-0.5 sm:gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePlay();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className={controlButtonClass}
            aria-label={isPlaying ? "Jeda" : "Putar"}
          >
            {isPlaying ? <Pause className="size-[18px]" /> : <Play className="size-[18px]" />}
          </button>

          <div className="group/volume flex items-center pr-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleMute();
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className={controlButtonClass}
              aria-label={isMuted || volume === 0 ? "Nyalakan suara" : "Bisukan"}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="size-[18px]" />
              ) : (
                <Volume2 className="size-[18px]" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              className="hidden h-1 w-0 cursor-pointer opacity-0 accent-white transition-all duration-200 group-hover/volume:ml-1 group-hover/volume:w-16 group-hover/volume:opacity-100 sm:block"
              aria-label="Volume"
            />
          </div>

          <span className="ml-1 hidden min-w-[5.5rem] font-mono text-[11px] text-white/85 tabular-nums sm:inline">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        <span className="min-w-[4.75rem] font-mono text-[11px] text-white/85 tabular-nums sm:hidden">
          {formatTime(currentTime)}
        </span>

        <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  className={controlButtonClass}
                  aria-label="Kecepatan putar"
                >
                  <Gauge className="size-[18px]" />
                </button>
              }
            />
            <DropdownMenuContent align="end" side="top" className={menuContentClass}>
              <DropdownMenuLabel className="text-[11px] text-white/60">Kecepatan</DropdownMenuLabel>
              {VIDEO_PLAYBACK_SPEEDS.map((speed) => (
                <DropdownMenuItem
                  key={speed}
                  className={cn(menuItemClass, playbackSpeed === speed && "bg-white/10")}
                  onClick={() => onChangeSpeed(speed)}
                >
                  {speed}x
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            type="button"
            disabled={!hasSubtitleTracks}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSubtitles();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className={cn(
              controlButtonClass,
              !hasSubtitleTracks && "cursor-not-allowed opacity-40 hover:bg-transparent",
              hasSubtitleTracks && subtitlesEnabled && "text-white"
            )}
            aria-label={
              hasSubtitleTracks
                ? subtitlesEnabled
                  ? "Matikan subtitle"
                  : "Nyalakan subtitle"
                : "Subtitle tidak tersedia"
            }
            title={hasSubtitleTracks ? undefined : "Subtitle belum tersedia"}
          >
            {subtitlesEnabled && hasSubtitleTracks ? (
              <Captions className="size-[18px]" />
            ) : (
              <CaptionsOff className="size-[18px]" />
            )}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  className={controlButtonClass}
                  aria-label="Pengaturan kualitas"
                >
                  <Settings className="size-[18px]" />
                </button>
              }
            />
            <DropdownMenuContent align="end" side="top" className={menuContentClass}>
              <DropdownMenuLabel className="text-[11px] text-white/60">Kualitas</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={quality}
                onValueChange={(value) => onChangeQuality(value as VideoQualityValue)}
              >
                {qualityOptions.map((option) => (
                  <DropdownMenuRadioItem
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    className={menuItemClass}
                  >
                    <span className="flex items-center gap-1.5">
                      {option.label}
                      {option.hd ? (
                        <span className="rounded bg-white/15 px-1 py-px text-[9px] font-semibold uppercase tracking-wide text-white/80">
                          HD
                        </span>
                      ) : null}
                    </span>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              void onToggleFullscreen();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className={controlButtonClass}
            aria-label={isFullscreen ? "Keluar layar penuh" : "Layar penuh"}
          >
            {isFullscreen ? (
              <Minimize className="size-[18px]" />
            ) : (
              <Maximize className="size-[18px]" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
