"use client";

import { useEffect, useMemo, useState } from "react";
import { animate, motion } from "motion/react";

import { useMyLearning } from "@/hooks/use-my-learning";
import {
  computePlatformRadarData,
  computeUserRadarData,
  getRadarDataSourceLabel,
  type RadarAxisDatum,
  type RadarDataSource,
} from "@/lib/home/learning-radar-data";
import type { Course, Mentor } from "@/lib/types";
import { cn } from "@/lib/utils";

type LearningRadarChartProps = {
  courses: Course[];
  mentors: Mentor[];
  className?: string;
};

const GRID_LEVELS = [0.25, 0.5, 0.75, 1];

function polarPoint(
  index: number,
  total: number,
  radius: number,
  center: number
): { x: number; y: number } {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
  return {
    x: center + radius * Math.cos(angle),
    y: center + radius * Math.sin(angle),
  };
}

function buildRadarPath(values: number[], maxRadius: number, center: number): string {
  if (values.length === 0) return "";

  const points = values.map((value, index) => {
    const radius = (value / 100) * maxRadius;
    const { x, y } = polarPoint(index, values.length, radius, center);
    return `${x},${y}`;
  });

  return `M ${points.join(" L ")} Z`;
}

function RadarSvg({
  data,
  animProgress,
  size,
}: {
  data: RadarAxisDatum[];
  animProgress: number;
  size: number;
}) {
  const center = size / 2;
  const maxRadius = size * 0.34;
  const labelRadius = maxRadius + (size < 260 ? 18 : 24);
  const animatedValues = data.map((axis) => axis.value * animProgress);
  const polygonPath = buildRadarPath(animatedValues, maxRadius, center);

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="mx-auto w-full max-w-[280px] sm:max-w-[320px]"
      role="img"
      aria-label="Diagram radar minat belajar"
    >
      <defs>
        <radialGradient id="radar-fill" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.42" />
          <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0.08" />
        </radialGradient>
        <filter id="radar-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {GRID_LEVELS.map((level) => {
        const ringPath = buildRadarPath(
          data.map(() => level * 100),
          maxRadius,
          center
        );
        return (
          <path
            key={level}
            d={ringPath}
            fill="none"
            stroke="var(--border)"
            strokeWidth={1}
            opacity={0.55}
          />
        );
      })}

      {data.map((_, index) => {
        const { x, y } = polarPoint(index, data.length, maxRadius, center);
        return (
          <line
            key={`axis-${index}`}
            x1={center}
            y1={center}
            x2={x}
            y2={y}
            stroke="var(--border)"
            strokeWidth={1}
            opacity={0.45}
          />
        );
      })}

      <motion.path
        d={polygonPath}
        fill="url(#radar-fill)"
        stroke="var(--chart-1)"
        strokeWidth={2}
        filter="url(#radar-glow)"
        initial={{ opacity: 0 }}
        animate={{ opacity: animProgress > 0.05 ? 1 : 0 }}
        transition={{ duration: 0.35 }}
      />

      {data.map((axis, index) => {
        const radius = (animatedValues[index] / 100) * maxRadius;
        const { x, y } = polarPoint(index, data.length, radius, center);
        return (
          <motion.circle
            key={axis.key}
            cx={x}
            cy={y}
            r={size < 260 ? 3.5 : 4.5}
            fill="var(--chart-1)"
            stroke="var(--background)"
            strokeWidth={1.5}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: animProgress > 0.2 ? 1 : 0, opacity: animProgress > 0.2 ? 1 : 0 }}
            transition={{ delay: 0.08 + index * 0.05, duration: 0.35 }}
          />
        );
      })}

      {data.map((axis, index) => {
        const { x, y } = polarPoint(index, data.length, labelRadius, center);
        return (
          <text
            key={`label-${axis.key}`}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-muted-foreground font-mono"
            style={{ fontSize: size < 260 ? 8.5 : 9.5 }}
          >
            {axis.label}
          </text>
        );
      })}
    </svg>
  );
}

export function LearningRadarChart({ courses, mentors, className }: LearningRadarChartProps) {
  const { bySlug, loading, isAuthenticated } = useMyLearning();
  const [animProgress, setAnimProgress] = useState(0);

  const { data, source } = useMemo(() => {
    const userData = isAuthenticated ? computeUserRadarData(courses, bySlug) : null;
    if (userData) {
      return { data: userData, source: "user" as RadarDataSource };
    }
    return {
      data: computePlatformRadarData(courses, mentors),
      source: "platform" as RadarDataSource,
    };
  }, [courses, mentors, bySlug, isAuthenticated]);

  const dataSignature = data.map((axis) => `${axis.key}:${axis.value}`).join("|");

  useEffect(() => {
    if (loading && isAuthenticated) return;

    setAnimProgress(0);
    const controls = animate(0, 1, {
      duration: 1.35,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (value) => setAnimProgress(value),
    });

    return () => controls.stop();
  }, [dataSignature, loading, isAuthenticated]);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/60 bg-[#0f1220] p-4 sm:p-6",
        "shadow-[inset_0_1px_0_rgba(123,126,184,0.12)]",
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 35%, rgba(123,126,184,0.18), transparent 68%)",
        }}
      />

      <div className="relative z-10 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-[#9da3d4]">
            Peta minat belajar
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {loading && isAuthenticated ? "Memuat progres..." : getRadarDataSourceLabel(source)}
          </p>
        </div>
        <span className="rounded-full border border-[#7b7eb8]/35 bg-[#7b7eb8]/10 px-3 py-1 font-mono text-[10px] text-[#c5c8e8]">
          {courses.length} kelas aktif
        </span>
      </div>

      <div className="relative z-10 mt-2 sm:mt-4">
        <div className="sm:hidden">
          <RadarSvg data={data} animProgress={animProgress} size={240} />
        </div>
        <div className="hidden sm:block">
          <RadarSvg data={data} animProgress={animProgress} size={300} />
        </div>
      </div>

      <div className="relative z-10 mt-3 grid grid-cols-3 gap-2 border-t border-border/40 pt-3 sm:gap-3 sm:pt-4">
        {data.slice(0, 3).map((axis) => (
          <div key={axis.key} className="text-center">
            <p className="font-mono text-[10px] uppercase tracking-wide text-[#9da3d4]">
              {axis.label}
            </p>
            <p className="font-heading text-sm font-semibold text-foreground sm:text-base">
              {Math.round(axis.value * animProgress)}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
