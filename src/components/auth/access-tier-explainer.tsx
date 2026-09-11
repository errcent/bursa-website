import Link from "next/link";

import { Button } from "@/components/ui/button";
import { DEMO_WAITLIST_EXPLAINER } from "@/lib/features/auth-surface-copy";
import { buildRegisterHref } from "@/lib/auth/redirect";

export function AccessTierExplainer({ returnPath = "/pengaturan" }: { returnPath?: string }) {
  return (
    <div className="mt-8 w-full max-w-lg rounded-xl border border-border/70 bg-muted/20 p-5">
      <h3 className="font-heading text-base font-medium">{DEMO_WAITLIST_EXPLAINER.headline}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {DEMO_WAITLIST_EXPLAINER.sub}
      </p>
      <Button
        className="btn-primary mt-5 h-11 w-full"
        render={<Link href={buildRegisterHref(returnPath)} />}
      >
        {DEMO_WAITLIST_EXPLAINER.primaryCta}
      </Button>
    </div>
  );
}
