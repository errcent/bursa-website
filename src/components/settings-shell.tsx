"use client";

import {
  CreditCard,
  Languages,
  Smartphone,
  UserRound,
} from "lucide-react";

import { useLanguage } from "@/components/language-provider";
import { SettingsAccount } from "@/components/settings-account";
import { SettingsDevices } from "@/components/settings-devices";
import { SettingsLanguage } from "@/components/settings-language";
import { SettingsPayment } from "@/components/settings-payment";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const TAB_TRIGGER_CLASS =
  "min-h-11 flex-1 gap-2 px-4 py-2 sm:flex-none sm:min-w-[7.5rem]";

export function SettingsShell() {
  const { messages } = useLanguage();
  const tabs = messages.settings.tabs;

  return (
    <Tabs defaultValue="akun" className="w-full">
      <TabsList
        variant="line"
        className={cn(
          "mb-8 h-auto w-full min-h-11 justify-start gap-1 overflow-x-auto rounded-none border-b border-border/60 bg-transparent p-0 pb-0",
          "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        )}
      >
        <TabsTrigger value="akun" className={TAB_TRIGGER_CLASS}>
          <UserRound className="size-4" />
          {tabs.account}
        </TabsTrigger>
        <TabsTrigger value="perangkat" className={TAB_TRIGGER_CLASS}>
          <Smartphone className="size-4" />
          {tabs.devices}
        </TabsTrigger>
        <TabsTrigger value="pembayaran" className={TAB_TRIGGER_CLASS}>
          <CreditCard className="size-4" />
          {tabs.payment}
        </TabsTrigger>
        <TabsTrigger value="bahasa" className={TAB_TRIGGER_CLASS}>
          <Languages className="size-4" />
          {tabs.language}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="akun" className="mt-0 outline-none">
        <SettingsAccount />
      </TabsContent>
      <TabsContent value="perangkat" className="mt-0 outline-none">
        <SettingsDevices />
      </TabsContent>
      <TabsContent value="pembayaran" className="mt-0 outline-none">
        <SettingsPayment />
      </TabsContent>
      <TabsContent value="bahasa" className="mt-0 outline-none">
        <SettingsLanguage />
      </TabsContent>
    </Tabs>
  );
}
