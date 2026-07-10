"use client";

import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

type OrbitNode = {
  label: string;
  count: number;
  radius: number;
  angle: number;
  duration: number;
  color?: string;
  detail?: string;
};

export function OrbitCluster({
  title,
  subtitle,
  centerValue,
  nodes,
  className,
}: {
  title: string;
  subtitle: string;
  centerValue: string;
  nodes: OrbitNode[];
  className?: string;
}) {
  return (
    <div className={cn("orbit-shell", className)}>
      <div className="orbit-nebula" aria-hidden />
      <div className="orbit-grid" aria-hidden />

      <div className="orbit-core">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          {title}
        </p>
        <p className="mt-1 font-heading text-2xl font-semibold tracking-tight">{centerValue}</p>
        <p className="text-[11px] text-muted-foreground">{subtitle}</p>
      </div>

      {nodes.map((node) => (
        <div
          key={node.label}
          className="orbit-path orbit-spin"
          style={
            {
              "--orbit-radius": `${node.radius}%`,
              "--orbit-angle": `${node.angle}deg`,
              "--orbit-duration": `${node.duration}s`,
            } as CSSProperties
          }
        >
          <div className="orbit-node-anchor">
            <div className="orbit-node orbit-counter-spin">
              <span
                className="orbit-node-dot"
                style={{ backgroundColor: node.color ?? "var(--accent)" }}
                aria-hidden
              />
              <p className="font-medium leading-tight text-foreground">{node.label}</p>
              <p className="font-mono text-[10px] text-muted-foreground">
                {node.detail ?? `${node.count} mentor`}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function DeviceOrbit({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={cn("device-orbit-shell", className)}>
      <div className="orbit-nebula" aria-hidden />
      <div className="orbit-grid" aria-hidden />
      <div className="device-orbit-ambient" aria-hidden />
      <div className="device-orbit-spotlight" aria-hidden />

      <div className="orbit-ring orbit-ring-lg" aria-hidden />
      <div className="orbit-ring orbit-ring-sm" aria-hidden />
      <div className="device-orbit-stage" aria-hidden />

      <article className="device-mock device-mock-laptop">
        <div className="device-screen">
          <div className="device-screen-head">
            <span />
            <span />
            <span />
          </div>
          <div className="device-screen-chart" />
          <div className="device-screen-lines">
            <span />
            <span />
            <span />
          </div>
        </div>
        <div className="device-base" />
      </article>

      <article className="device-mock device-mock-tablet orbit-float-slow">
        <div className="device-screen">
          <div className="device-screen-chart device-screen-chart-subtle" />
          <div className="device-screen-lines">
            <span />
            <span />
          </div>
        </div>
      </article>

      <article className="device-mock device-mock-phone orbit-float-fast">
        <div className="device-screen">
          <div className="device-screen-head">
            <span />
            <span />
            <span />
          </div>
          <div className="device-screen-lines">
            <span />
            <span />
          </div>
        </div>
      </article>

      <div className="device-orbit-chip device-orbit-chip-top">Sinkron otomatis</div>
      <div className="device-orbit-chip device-orbit-chip-bottom">Lanjutkan progres</div>
      <div className="device-orbit-shadow" aria-hidden />
    </div>
  );
}
