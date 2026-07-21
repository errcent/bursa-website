"use client";

import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";

import { DEVICE_SCENE_INSETS } from "@/data/device-insets";
import { cn } from "@/lib/utils";

const SCENE = DEVICE_SCENE_INSETS;

/** Fixed design canvas — scene scales uniformly from this width. */
export const DEVICE_SCENE_WIDTH = 920;
export const DEVICE_SCENE_HEIGHT = Math.round(
  (DEVICE_SCENE_WIDTH * SCENE.viewBox.h) / SCENE.viewBox.w,
);

export const SCENE_FRAME = {
  src: "/mockups/ipad-pro-scene.png",
  width: SCENE.viewBox.w,
  height: SCENE.viewBox.h,
} as const;

type ScreenInsets = { x: number; y: number; w: number; h: number };

type DeviceScreenSlotProps = {
  children: ReactNode;
  className?: string;
  insets: ScreenInsets;
  viewportRadius?: string;
};

function DeviceScreenSlot({
  children,
  className,
  insets: slotInsets,
  viewportRadius,
}: DeviceScreenSlotProps) {
  const screenStyle: CSSProperties = {
    left: `${slotInsets.x}%`,
    top: `${slotInsets.y}%`,
    width: `${slotInsets.w}%`,
    height: `${slotInsets.h}%`,
  };

  return (
    <div className={cn("device-mockup-screen-slot", className)} style={screenStyle}>
      <div
        className="device-mockup-screen-slot__viewport overflow-hidden bg-black"
        style={viewportRadius ? { borderRadius: viewportRadius } : undefined}
      >
        {children}
      </div>
    </div>
  );
}

export function IpadSceneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="device-mockup-scene" aria-hidden>
      <DeviceScreenSlot
        className="device-mockup-scene__ipad-screen"
        insets={SCENE.ipad.screen}
        viewportRadius="clamp(6px, 0.55vw, 14px)"
      >
        {children}
      </DeviceScreenSlot>

      <Image
        src={SCENE_FRAME.src}
        alt=""
        width={SCENE_FRAME.width}
        height={SCENE_FRAME.height}
        className="device-mockup-scene__frame"
        draggable={false}
        priority
        unoptimized
        sizes="(max-width: 768px) 92vw, 920px"
      />
    </div>
  );
}
