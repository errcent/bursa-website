import { cn } from "@/lib/utils";

export function AuthField({
  label,
  id,
  error,
  helperText,
  children,
  className,
}: {
  label: string;
  id: string;
  error?: string;
  helperText?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      ) : null}
    </div>
  );
}

export const authInputClassName =
  "w-full rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm outline-none backdrop-blur-sm transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-accent/40 focus:shadow-[0_0_20px_var(--glow)] disabled:opacity-50";
