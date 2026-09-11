import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ACCESS_TIER_EXPLAINER, AUTH_CTA } from "@/lib/features/auth-surface-copy";
import { buildLoginHref, buildRegisterHref } from "@/lib/auth/redirect";
import { EXISTING_ACCOUNT_PROMPT } from "@/lib/features/registration-copy";

export function AccessTierExplainer({ returnPath = "/pengaturan" }: { returnPath?: string }) {
  return (
    <div className="mt-8 w-full max-w-lg rounded-xl border border-border/70 bg-muted/20 p-5">
      <h3 className="font-heading text-base font-medium">{ACCESS_TIER_EXPLAINER.headline}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{ACCESS_TIER_EXPLAINER.sub}</p>
      <ol className="mt-4 space-y-3">
        {ACCESS_TIER_EXPLAINER.tiers.map((tier, index) => (
          <li key={tier.name} className="flex gap-3 text-sm">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-accent">
              {index + 1}
            </span>
            <div>
              <p className="font-medium">{tier.name}</p>
              <p className="text-muted-foreground">{tier.detail}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-5 flex flex-col gap-3">
        <Button className="btn-primary h-11" render={<Link href={buildRegisterHref(returnPath)} />}>
          {AUTH_CTA.primaryWaitlist}
        </Button>
        <p className="text-sm text-muted-foreground">
          {EXISTING_ACCOUNT_PROMPT}{" "}
          <Link href={buildLoginHref(returnPath)} className="link-accent font-medium">
            {AUTH_CTA.secondarySignIn}
          </Link>
        </p>
      </div>
    </div>
  );
}
