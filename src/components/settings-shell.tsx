"use client";

import { SettingsAccount } from "@/components/settings-account";
import { SettingsDevices } from "@/components/settings-devices";
import { SettingsLanguage } from "@/components/settings-language";
import { SettingsPayment } from "@/components/settings-payment";

export function SettingsShell() {
  return (
    <div className="divide-y divide-border/60">
      <div className="pb-8">
        <SettingsAccount />
      </div>
      <div className="py-8">
        <SettingsDevices />
      </div>
      <div className="py-8">
        <SettingsPayment />
      </div>
      <div className="pt-8">
        <SettingsLanguage />
      </div>
    </div>
  );
}
