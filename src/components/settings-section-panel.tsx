"use client";

import type { ReactNode } from "react";

interface SettingsSectionPanelProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function SettingsSectionPanel({
  title,
  description,
  children,
}: SettingsSectionPanelProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-heading text-lg font-semibold tracking-tight">{title}</h2>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </div>
  );
}
