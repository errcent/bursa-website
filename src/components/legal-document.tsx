import type { LegalDocument } from "@/lib/legal/content";

export function LegalDocumentContent({ document }: { document: LegalDocument }) {
  return (
    <article className="max-w-3xl">
      <p className="text-xs text-muted-foreground">
        Terakhir diperbarui: {document.lastUpdated}
      </p>

      <nav className="mt-8 rounded-2xl border border-border bg-card/50 p-5 backdrop-blur-sm">
        <p className="text-sm font-medium">Daftar isi</p>
        <ol className="mt-3 flex flex-col gap-2">
          {document.sections.map((section) => (
            <li key={section.id}>
              <a href={`#${section.id}`} className="link-muted text-sm">
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
                <p key={i} className="section-copy">
                  {paragraph}
                </p>
              ))}
              {section.bullets && section.bullets.length > 0 && (
                <ul className="mt-1 flex flex-col gap-2 pl-5">
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

      <div className="mt-12 rounded-2xl border border-border/60 bg-muted/30 p-5 sm:p-6">
        <p className="text-sm font-medium text-foreground">Butuh bantuan?</p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Ada pertanyaan terkait dokumen ini? Hubungi{" "}
          <a href="mailto:support@bursa.id" className="link-muted font-medium text-foreground">
            support@bursa.id
          </a>
          .
        </p>
      </div>
    </article>
  );
}
