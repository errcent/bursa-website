"use client";

import type { ReactNode } from "react";

export function PrivacyPolicyShell({ children }: { children: ReactNode }) {
  return (
    <div className="privacy-policy-card">
      <div id="privacy-main" className="container-page px-4 py-8 sm:px-8 sm:py-10">
        {children}
      </div>
    </div>
  );
}
