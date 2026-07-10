"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Laptop, LogOut, MonitorSmartphone, Smartphone, Trash2 } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { useLanguage } from "@/components/language-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatLastActive,
  getCurrentDeviceId,
  getDeviceSessions,
  MAX_DEVICES_PER_ACCOUNT,
  revokeDeviceSession,
  touchDeviceSession,
  type DeviceSession,
} from "@/lib/auth/devices";
import { buildLoginHref } from "@/lib/auth/redirect";

function DeviceIcon({ name }: { name: string }) {
  const lower = name.toLowerCase();
  if (lower.includes("android") || lower.includes("ios")) {
    return <Smartphone className="size-4 shrink-0 text-muted-foreground" />;
  }
  if (lower.includes("macos") || lower.includes("windows") || lower.includes("linux")) {
    return <Laptop className="size-4 shrink-0 text-muted-foreground" />;
  }
  return <MonitorSmartphone className="size-4 shrink-0 text-muted-foreground" />;
}

export function SettingsDevices() {
  const { session, isLoading, logout } = useAuth();
  const { messages } = useLanguage();
  const t = messages.settings.devices;
  const common = messages.common;
  const [devices, setDevices] = useState<DeviceSession[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState("");
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (!session) {
      setDevices([]);
      return;
    }
    touchDeviceSession(session.userId);
    setCurrentDeviceId(getCurrentDeviceId());
    setDevices(getDeviceSessions(session.userId));
  }, [session]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (isLoading) {
    return <div className="h-32 animate-pulse rounded-2xl bg-muted" />;
  }

  if (!session) {
    return (
      <section className="surface-card p-5">
        <h2 className="section-title text-base">{t.title}</h2>
        <p className="section-copy mt-2">{t.signedOutDescription}</p>
        <Button
          size="sm"
          variant="outline"
          className="mt-4"
          render={<Link href={buildLoginHref("/pengaturan")} />}
        >
          {common.signIn}
        </Button>
      </section>
    );
  }

  const otherDevices = devices.filter((d) => d.deviceId !== currentDeviceId);
  const currentDevice = devices.find((d) => d.deviceId === currentDeviceId);
  const slotsLeft = Math.max(0, MAX_DEVICES_PER_ACCOUNT - devices.length);

  function handleRevokeOther(deviceId: string) {
    setRevokingId(deviceId);
    revokeDeviceSession(session!.userId, deviceId);
    refresh();
    setRevokingId(null);
  }

  function handleLogoutCurrent() {
    if (session) {
      revokeDeviceSession(session.userId, getCurrentDeviceId());
    }
    logout();
  }

  return (
    <section>
      <h2 className="section-title">{t.title}</h2>
      <p className="section-copy mt-1">
        {t.description.replace("{max}", String(MAX_DEVICES_PER_ACCOUNT))}
      </p>

      <div className="surface-card mt-6 space-y-4 p-5">
        {currentDevice ? (
          <div className="flex flex-col gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-3">
              <div className="mt-0.5 flex size-9 items-center justify-center rounded-xl bg-accent-soft">
                <DeviceIcon name={currentDevice.deviceName} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{currentDevice.deviceName}</p>
                  <Badge variant="accent">Perangkat ini</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Aktif {formatLastActive(currentDevice.lastActiveAt)}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0"
              onClick={handleLogoutCurrent}
            >
              <LogOut className="size-3.5" />
              Keluar dari perangkat ini
            </Button>
          </div>
        ) : null}

        {otherDevices.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-6 text-center">
            <MonitorSmartphone className="mx-auto size-8 text-muted-foreground/60" />
            <p className="mt-3 text-sm font-medium">Tidak ada perangkat lain</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Hanya perangkat ini yang terhubung ke akunmu.
              {slotsLeft > 0
                ? ` Kamu masih punya slot untuk ${slotsLeft} perangkat lagi.`
                : null}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {otherDevices.map((device) => (
              <li
                key={device.deviceId}
                className="flex flex-col gap-3 rounded-xl border border-border/60 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex gap-3">
                  <div className="mt-0.5 flex size-9 items-center justify-center rounded-xl bg-muted/50">
                    <DeviceIcon name={device.deviceName} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{device.deviceName}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Terakhir aktif {formatLastActive(device.lastActiveAt)}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 text-destructive hover:text-destructive"
                  disabled={revokingId === device.deviceId}
                  onClick={() => handleRevokeOther(device.deviceId)}
                >
                  <Trash2 className="size-3.5" />
                  {revokingId === device.deviceId ? "Mencabut..." : "Cabut akses"}
                </Button>
              </li>
            ))}
          </ul>
        )}

        <p className="text-xs text-muted-foreground">
          Prototype: sesi perangkat disimpan di browser ini (localStorage). Di produksi,
          batas {MAX_DEVICES_PER_ACCOUNT} perangkat akan ditegakkan saat login di server.
        </p>
      </div>
    </section>
  );
}
