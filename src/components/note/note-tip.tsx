import type { ReactNode } from "react";

/** Definition-only. Never wrap a button or link. */
export function NoteTip({
  text,
  children,
  align = "center",
  side = "top",
}: {
  text: string;
  children: ReactNode;
  align?: "center" | "left" | "right";
  side?: "top" | "bottom";
}) {
  const pos =
    align === "left"
      ? "left-0 translate-x-0"
      : align === "right"
        ? "right-0 translate-x-0"
        : "left-1/2 -translate-x-1/2";
  const place = side === "bottom" ? "top-[calc(100%+8px)]" : "bottom-[calc(100%+8px)]";

  return (
    <span className="relative inline-flex">
      <span
        tabIndex={0}
        className="peer inline-flex cursor-help border-b border-dotted border-zinc-600 outline-none"
      >
        {children}
      </span>
      <span
        role="tooltip"
        className={`pointer-events-none absolute ${place} z-30 w-max max-w-[16rem] rounded-md border border-zinc-700/80 bg-zinc-900 px-2.5 py-1.5 text-left text-[11px] leading-relaxed text-zinc-300 opacity-0 shadow-sm transition-opacity peer-hover:opacity-100 peer-focus:opacity-100 ${pos}`}
      >
        {text}
      </span>
    </span>
  );
}
