import { cn } from "@/lib/utils";

/**
 * Renders trust-badge copy instantly and fully legible — no character-by-character
 * typewriter delay. Kept as a dedicated component (rather than inlining a <span>)
 * so hero badges share one place to adjust badge text styling.
 */
export function HeroTyping({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return <span className={cn("font-mono", className)}>{text}</span>;
}
