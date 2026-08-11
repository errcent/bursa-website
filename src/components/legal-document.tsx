import type { LegalDocument } from "@/lib/legal/content";

export function LegalDocumentContent({ document }: { document: LegalDocument }) {
  return (
    <article className="max-w-3xl">
      <p className="text-xs text-muted-foreground">
        Terakhir diperbarui: {document.lastUpdated}
      </p>

      <nav className="mt-8 border-y border-border/60 py-5" aria-label="Daftar isi">
        <p className="text-sm font-medium">Daftar isi</p>
        <ol className="mt-3 flex flex-col gap-2">
          {document.sections.map((section, index) => (
            <li key={section.id}>
              <a href={`#${section.id}`} className="link-muted text-sm">
                <span className="mr-2 font-mono text-[11px] text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {section.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-10 flex flex-col gap-10">
        {document.sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-24">
            <h2 className="section-title">{section.title}</h2>
            <div className="mt-3 flex flex-col gap-3">
              {section.paragraphs.map((paragraph, i) => (
                <p key={i} className="section-copy max-w-prose">
                  {paragraph}
                </p>
              ))}
              {section.bullets && section.bullets.length > 0 && (
                <ul className="mt-1 flex max-w-prose flex-col gap-2 pl-5">
                  {section.bullets.map((bullet, i) => (
                    <li key={i} className="list-disc text-sm leading-relaxed text-muted-foreground">
                      {bullet}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-12 border-t border-border/60 pt-6">
        <p className="text-sm font-medium text-foreground">Butuh bantuan?</p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Ada pertanyaan terkait dokumen ini? Hubungi{" "}
          <a href="mailto:support@bursanalar.com" className="link-muted font-medium text-foreground">
            support@bursanalar.com
          </a>
          .
        </p>
      </div>
    </article>
  );
}
