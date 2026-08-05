"use client";

import { useSearchParams } from "next/navigation";

import { useAuth } from "@/components/auth-provider";
import { useLanguage } from "@/components/language-provider";
import { SettingsAccount } from "@/components/settings-account";
import { SettingsDevices } from "@/components/settings-devices";
import { SettingsNav, type SettingsTab } from "@/components/settings-nav";
import { SettingsPayment } from "@/components/settings-payment";
import { SettingsSectionPanel } from "@/components/settings-section-panel";
import { SettingsSignedOut } from "@/components/settings-signed-out";

const VALID_TABS = new Set<SettingsTab>(["account", "devices", "payment"]);

function parseTab(value: string | null): SettingsTab {
  if (value && VALID_TABS.has(value as SettingsTab)) {
    return value as SettingsTab;
  }
  return "account";
}

export function SettingsShell() {
  const searchParams = useSearchParams();
  const activeTab = parseTab(searchParams.get("tab"));
  const { session, isLoading } = useAuth();
  const { messages } = useLanguage();
  const s = messages.settings;

  if (isLoading) {
    return (
      <div className="grid gap-8 lg:grid-cols-[13.75rem_minmax(0,1fr)]">
        <div className="hidden h-48 animate-pulse rounded-2xl bg-muted lg:block" />
        <div className="h-96 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="grid gap-8 lg:grid-cols-[13.75rem_minmax(0,1fr)] lg:gap-10">
        <SettingsNav active={activeTab} />
        <SettingsSignedOut />
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[13.75rem_minmax(0,1fr)] lg:gap-10">
      <SettingsNav active={activeTab} />

      <div className="min-w-0">
        {activeTab === "account" ? (
          <SettingsSectionPanel
            title={s.account.title}
            description={s.account.signedInDescription}
          >
            <SettingsAccount embedded />
          </SettingsSectionPanel>
        ) : null}

        {activeTab === "devices" ? (
          <SettingsSectionPanel title={s.devices.title} description={s.devices.description.replace("{max}", "3")}>
            <SettingsDevices embedded />
          </SettingsSectionPanel>
        ) : null}

        {activeTab === "payment" ? (
          <SettingsSectionPanel title={s.payment.title} description={s.payment.description}>
            <SettingsPayment embedded />
          </SettingsSectionPanel>
        ) : null}
      </div>
    </div>
  );
}
