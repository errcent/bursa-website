import type { LegalLocale } from "@/lib/hosts/hosts";
import {
  CONTROL_GROUPS,
  controlStampClass,
  controlStampLabel,
  trustCopy,
} from "@/lib/trust/public-posture";

export function TrustControls({
  locale,
  preview = false,
}: {
  locale: LegalLocale;
  preview?: boolean;
}) {
  const t = trustCopy(locale);
  const groups = preview ? CONTROL_GROUPS.map((g) => ({ ...g, items: g.items.slice(0, 4) })) : CONTROL_GROUPS;

  return (
    <div className="flex flex-col gap-8">
      {!preview && (
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{t.controlsLead}</p>
      )}
      <div className="grid gap-5 lg:grid-cols-2">
        {groups.map((group) => (
          <section key={group.id} className="trust-card p-5">
            <h3 className="trust-serif text-lg font-semibold">
              {locale === "en" ? group.enTitle : group.idTitle}
            </h3>
            <ul className="mt-4 flex flex-col gap-3">
              {group.items.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {locale === "en" ? item.enLabel : item.idLabel}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {locale === "en" ? item.enDetail : item.idDetail}
                    </p>
                  </div>
                  <span className={controlStampClass(item.status)}>
                    {controlStampLabel(item.status, locale)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
