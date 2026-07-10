import Link from "next/link";
import { Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { Article } from "@/lib/articles/content";
import { cn } from "@/lib/utils";

export function ArticleCard({ article, className }: { article: Article; className?: string }) {
  return (
    <Link
      href={`/artikel/${article.slug}`}
      className={cn(
        "surface-card-hover group flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-colors",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="accent">{article.category}</Badge>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="size-3" />
          {article.readTimeMinutes} menit
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2">
        <h2 className="font-heading text-base font-medium leading-snug transition-colors group-hover:text-accent">
          {article.title}
        </h2>
        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {article.excerpt}
        </p>
      </div>

      <p className="text-xs text-muted-foreground">{article.publishedAt}</p>
    </Link>
  );
}
