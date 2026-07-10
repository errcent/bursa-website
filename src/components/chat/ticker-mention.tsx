import { cn } from "@/lib/utils";

const TICKER_PATTERN = /\$([A-Z]{2,6}(?:USD|JPY|EUR)?)\b/g;

interface TickerMentionProps {
  text: string;
  className?: string;
}

export function TickerMention({ text, className }: TickerMentionProps) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const regex = new RegExp(TICKER_PATTERN);

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <span
        key={`${match.index}-${match[1]}`}
        className="inline-flex items-center rounded-md bg-accent/15 px-1 py-0.5 font-mono text-xs font-medium text-accent"
      >
        ${match[1]}
      </span>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <span className={cn("whitespace-pre-wrap break-words", className)}>{parts}</span>;
}

export function extractTickers(text: string): string[] {
  const tickers = new Set<string>();
  let match: RegExpExecArray | null;
  const regex = new RegExp(TICKER_PATTERN);
  while ((match = regex.exec(text)) !== null) {
    tickers.add(match[1]);
  }
  return Array.from(tickers);
}
