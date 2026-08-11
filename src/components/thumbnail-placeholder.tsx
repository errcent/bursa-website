import { cn } from "@/lib/utils";

type ThumbnailPlaceholderProps = {
  label?: string;
  className?: string;
};

export function ThumbnailPlaceholder({ label, className }: ThumbnailPlaceholderProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/15 to-surface-2",
        className
      )}
    >
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(circle at 30% 20%, color-mix(in oklab, var(--accent) 35%, transparent), transparent 62%)",
        }}
      />
      {label ? (
        <span className="absolute inset-0 flex items-center justify-center px-3 text-center font-heading text-xs font-semibold uppercase tracking-wider text-white/75 sm:text-sm">
          {label}
        </span>
      ) : null}
    </div>
  );
}
