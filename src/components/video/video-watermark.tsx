"use client";

import { useEffect, useMemo, useState } from "react";

import type { WatermarkSettings } from "@/lib/video/protection";
import { cn } from "@/lib/utils";

interface WatermarkInstance {
  id: number;
  top: number;
  left: number;
  rotation: number;
}

function randomPosition(): Pick<WatermarkInstance, "top" | "left" | "rotation"> {
  return {
    top: 8 + Math.random() * 72,
    left: 5 + Math.random() * 75,
    rotation: -30 + Math.random() * 12,
  };
}

function createInstances(count: number): WatermarkInstance[] {
  return Array.from({ length: count }, (_, id) => ({
    id,
    ...randomPosition(),
  }));
}

interface VideoWatermarkProps {
  config: WatermarkSettings;
  className?: string;
  active?: boolean;
}

export function VideoWatermark({ config, className, active = true }: VideoWatermarkProps) {
  const [instances, setInstances] = useState<WatermarkInstance[]>(() =>
    createInstances(config.instanceCount)
  );

  useEffect(() => {
    setInstances(createInstances(config.instanceCount));
  }, [config.instanceCount]);

  useEffect(() => {
    if (!active) return;

    const interval = setInterval(() => {
      setInstances(createInstances(config.instanceCount));
    }, config.repositionIntervalMs);

    return () => clearInterval(interval);
  }, [active, config.instanceCount, config.repositionIntervalMs]);

  const styleVars = useMemo(
    () =>
      ({
        "--wm-opacity": config.opacity,
        "--wm-font-size": config.fontSize,
        "--wm-rotation": `${config.rotation}deg`,
      }) as React.CSSProperties,
    [config.opacity, config.fontSize, config.rotation]
  );

  if (!active) return null;

  return (
    <div
      className={cn("pointer-events-none absolute inset-0 z-20 overflow-hidden", className)}
      style={styleVars}
      aria-hidden
    >
      {instances.map((instance) => (
        <span
          key={instance.id}
          className="absolute whitespace-nowrap font-mono font-medium text-white transition-all duration-1000 ease-in-out"
          style={{
            top: `${instance.top}%`,
            left: `${instance.left}%`,
            opacity: config.opacity,
            fontSize: config.fontSize,
            transform: `rotate(${instance.rotation}deg)`,
            textShadow: "0 1px 2px rgba(0,0,0,0.4)",
            letterSpacing: "0.04em",
          }}
        >
          {config.text}
        </span>
      ))}
    </div>
  );
}
