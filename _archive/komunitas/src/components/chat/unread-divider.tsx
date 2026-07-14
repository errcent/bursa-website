import { cn } from "@/lib/utils";

interface UnreadDividerProps {
  className?: string;
}

export function UnreadDivider({ className }: UnreadDividerProps) {
  return (
    <div
      className={cn("relative my-3 flex items-center px-4", className)}
      role="separator"
      aria-label="Pesan baru"
    >
      <div className="h-px flex-1 bg-destructive/50" />
      <span className="mx-3 shrink-0 rounded-full bg-destructive/10 px-3 py-0.5 text-[11px] font-medium text-destructive">
        Pesan baru
      </span>
      <div className="h-px flex-1 bg-destructive/50" />
    </div>
  );
}
