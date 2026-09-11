import Link from "next/link";

import { Button } from "@/components/ui/button";
import { AUTH_CTA, AUTH_SURFACE_COPY } from "@/lib/features/auth-surface-copy";
import { buildLoginHref, buildRegisterHref } from "@/lib/auth/redirect";

const copy = AUTH_SURFACE_COPY.guest_locked_content;

export function GuestLockedContentPanel({
  returnPath,
  previewHref,
}: {
  returnPath: string;
  previewHref?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4 p-6 text-center">
      <p className="font-medium">{copy.headline}</p>
      <p className="text-sm text-muted-foreground">{copy.sub}</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        {previewHref ? (
          <Button size="sm" variant="outline" render={<Link href={previewHref} />}>
            {copy.primaryCta}
          </Button>
        ) : null}
        <Button size="sm" className="btn-primary" render={<Link href={buildRegisterHref(returnPath)} />}>
          {AUTH_CTA.primaryWaitlist}
        </Button>
      </div>
      <Link href={buildLoginHref(returnPath)} className="text-xs text-muted-foreground hover:text-foreground">
        {AUTH_CTA.secondaryExistingAccount} {AUTH_CTA.secondarySignIn}
      </Link>
    </div>
  );
}
