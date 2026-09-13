import type { Viewport } from "next";

/** Keyboard overlays the page instead of resizing layout (avoids whole-page jump on iOS). */
export const viewport: Viewport = {
  interactiveWidget: "overlays-content",
};

export default function BelajarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
