"use client";

import Link from "next/link";
import { CreditCard, MonitorSmartphone, User, type LucideIcon } from "lucide-react";

import { useLanguage } from "@/components/language-provider";
import { cn } from "@/lib/utils";

export type SettingsTab = "account" | "devices" | "payment";

const TAB_ICONS: Record<SettingsTab, LucideIcon> = {
  account: User,
  devices: MonitorSmartphone,
  payment: CreditCard,
};

interface SettingsNavProps {
  active: SettingsTab;
}

export function SettingsNav({ active }: SettingsNavProps) {
  const { messages } = useLanguage();
  const tabs = messages.settings.tabs;

  const items: { id: SettingsTab; label: string }[] = [
    { id: "account", label: tabs.account },
    { id: "devices", label: tabs.devices },
    { id: "payment", label: tabs.payment },
  ];

  return (
    <>
      <nav
        className="flex gap-1 overflow-x-auto pb-1 lg:hidden"
        aria-label="Bagian pengaturan"
      >
        {items.map((item) => {
          const Icon = TAB_ICONS[item.id];
          const selected = active === item.id;
          return (
            <Link
              key={item.id}
              href={`/pengaturan?tab=${item.id}`}
              scroll={false}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                selected
                  ? "border-foreground/15 bg-foreground/5 text-foreground"
                  : "border-transparent bg-muted/40 text-muted-foreground hover:text-foreground"
              )}
              aria-current={selected ? "page" : undefined}
            >
              <Icon className="size-3.5" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <nav className="hidden lg:block" aria-label="Bagian pengaturan">
        <ul className="flex flex-col gap-0.5">
          {items.map((item) => {
            const Icon = TAB_ICONS[item.id];
            const selected = active === item.id;
            return (
              <li key={item.id}>
                <Link
                  href={`/pengaturan?tab=${item.id}`}
                  scroll={false}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    selected
                      ? "bg-foreground/5 text-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                  aria-current={selected ? "page" : undefined}
                >
                  <Icon className="size-4 shrink-0 opacity-70" aria-hidden />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
