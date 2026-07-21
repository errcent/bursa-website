import {
  DEVICE_SCENE_HEIGHT,
  DEVICE_SCENE_WIDTH,
} from "@/components/home/device-frame-shells";
import { DEVICE_SCENE_INSETS } from "@/data/device-insets";

const screen = DEVICE_SCENE_INSETS.ipad.screen;

/** iPad screen hole size on the 920×707 design canvas (px). */
export const DEVICE_SCREEN_INSET_PX = {
  width: (DEVICE_SCENE_WIDTH * screen.w) / 100,
  height: (DEVICE_SCENE_HEIGHT * screen.h) / 100,
} as const;

/** Logical UI width — app layouts are authored at this width then scaled into the inset. */
export const DEVICE_SCREEN_DESIGN_WIDTH = 1024;

/** Matches inset aspect ratio so scaled content fills the screen hole vertically. */
export const DEVICE_SCREEN_DESIGN_HEIGHT = Math.round(
  DEVICE_SCREEN_DESIGN_WIDTH *
    (DEVICE_SCREEN_INSET_PX.height / DEVICE_SCREEN_INSET_PX.width),
);

/** scale(design) → inset width: insetW / designW */
export const DEVICE_SCREEN_CONTENT_SCALE =
  DEVICE_SCREEN_INSET_PX.width / DEVICE_SCREEN_DESIGN_WIDTH;

export const DEVICE_SCREEN_SCALE = {
  designWidth: DEVICE_SCREEN_DESIGN_WIDTH,
  designHeight: DEVICE_SCREEN_DESIGN_HEIGHT,
  scale: DEVICE_SCREEN_CONTENT_SCALE,
  insetWidth: DEVICE_SCREEN_INSET_PX.width,
  insetHeight: DEVICE_SCREEN_INSET_PX.height,
} as const;
