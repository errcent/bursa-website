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
        <h2 className="text-sm font-medium">{t.title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t.signedOutDescription}</p>
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
    void logout();
  }

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-medium">{t.title}</h2>

      <div className="surface-card divide-y divide-border/60">
        {currentDevice ? (
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-accent-soft">
                <DeviceIcon name={currentDevice.deviceName} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{currentDevice.deviceName}</p>
                  <Badge variant="accent" className="text-[10px]">
                    Perangkat ini
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatLastActive(currentDevice.lastActiveAt)}
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={handleLogoutCurrent}>
              <LogOut className="size-3.5" />
              Keluar
            </Button>
          </div>
        ) : null}

        {otherDevices.map((device) => (
          <div
            key={device.deviceId}
            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-muted/50">
                <DeviceIcon name={device.deviceName} />
              </div>
              <div>
                <p className="text-sm font-medium">{device.deviceName}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatLastActive(device.lastActiveAt)}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive"
              disabled={revokingId === device.deviceId}
              onClick={() => handleRevokeOther(device.deviceId)}
            >
              <Trash2 className="size-3.5" />
              {revokingId === device.deviceId ? "..." : "Cabut"}
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
