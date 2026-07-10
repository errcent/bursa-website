import type { Article } from "@/lib/articles/content";

export function ArticleContent({ article }: { article: Article }) {
  return (
    <article className="max-w-3xl">
      <header className="border-b border-border/60 pb-8">
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>{article.publishedAt}</span>
          <span aria-hidden="true">·</span>
          <span>{article.readTimeMinutes} menit baca</span>
          <span aria-hidden="true">·</span>
          <span>{article.author}</span>
        </div>
        <h1 className="page-hero-title mt-4 text-2xl sm:text-3xl">{article.title}</h1>
        <p className="section-copy mt-3">{article.excerpt}</p>
      </header>

      <div className="mt-10 flex flex-col gap-6">
        {article.blocks.map((block, index) => {
          switch (block.type) {
            case "paragraph":
              return (
                <p key={index} className="section-copy">
                  {block.text}
                </p>
              );
            case "heading":
              if (block.level === 2) {
                return (
                  <h2 key={index} className="section-title mt-2">
                    {block.text}
                  </h2>
                );
              }
              return (
                <h3 key={index} className="font-heading text-lg font-medium">
                  {block.text}
                </h3>
              );
            case "bullets":
              return (
                <ul key={index} className="flex flex-col gap-2 pl-5">
                  {block.items.map((item, i) => (
                    <li key={i} className="list-disc text-sm leading-relaxed text-muted-foreground">
                      {item}
                    </li>
                  ))}
                </ul>
              );
            case "quote":
              return (
                <blockquote
                  key={index}
                  className="rounded-xl border-l-2 border-accent/60 bg-accent-soft/30 px-5 py-4 text-sm italic leading-relaxed text-foreground/90"
                >
                  {block.text}
                </blockquote>
              );
            default:
              return null;
          }
        })}
      </div>

      <div className="mt-12 rounded-2xl border border-border/60 bg-surface/40 p-5">
        <p className="text-sm text-muted-foreground">
          Materi edukasi, bukan rekomendasi investasi. Trading mengandung risiko kerugian modal.
          Keputusan sepenuhnya tanggung jawab pembaca.
        </p>
      </div>
    </article>
  );
}
