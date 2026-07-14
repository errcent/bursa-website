import { cn } from "@/lib/utils";
import { parseMentionsInText } from "@/lib/chat/mention-utils";
import { TickerMention } from "@/components/chat/ticker-mention";

interface UserMentionProps {
  text: string;
  className?: string;
}

export function UserMention({ text, className }: UserMentionProps) {
  const parts = parseMentionsInText(text);

  return (
    <span className={cn("whitespace-pre-wrap break-words", className)}>
      {parts.map((part, i) => {
        if (part.type === "mention") {
          return (
            <span
              key={`mention-${i}-${part.value}`}
              className="rounded bg-accent/20 px-0.5 font-medium text-accent"
            >
              @{part.value}
            </span>
          );
        }
        return <TickerMention key={`text-${i}`} text={part.value} />;
      })}
    </span>
  );
}
