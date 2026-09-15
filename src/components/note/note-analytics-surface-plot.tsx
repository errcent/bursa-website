"use client";

import { useMemo } from "react";
import createPlotlyComponent from "react-plotly.js/factory";
import Plotly from "plotly.js-dist-min";

import { NOTE_CHART_COLORS } from "@/lib/note/chart-colors";
import type { SurfaceGrid, SurfaceMetricId } from "@/lib/note/analytics/surface-grid";

const Plot = createPlotlyComponent(Plotly);

function colorscaleForMetric(metric: SurfaceMetricId, zMin: number, zMax: number) {
  if (metric === "win_rate") {
    return [
      [0, NOTE_CHART_COLORS.downStrong],
      [0.42, NOTE_CHART_COLORS.downSoft],
      [0.5, "#3f3f46"],
      [0.58, NOTE_CHART_COLORS.upSoft],
      [1, NOTE_CHART_COLORS.upStrong],
    ] as [number, string][];
  }
  if (metric === "count") {
    return [
      [0, "#27272a"],
      [0.35, NOTE_CHART_COLORS.infoSoft],
      [1, NOTE_CHART_COLORS.infoStrong],
    ] as [number, string][];
  }
  return [
    [0, NOTE_CHART_COLORS.downStrong],
    [0.5, "#52525b"],
    [1, NOTE_CHART_COLORS.upStrong],
  ] as [number, string][];
}

type Props = {
  grid: SurfaceGrid;
  metric: SurfaceMetricId;
  locale: "id" | "en";
  height?: number;
};

export function NoteAnalyticsSurfacePlot({ grid, metric, locale, height = 360 }: Props) {
  const plot = useMemo(() => {
    const zDisplay = grid.z.map((row) => row.map((v) => (v == null ? NaN : v)));

    return {
      data: [
        {
          type: "surface" as const,
          x: grid.xLabels,
          y: grid.yLabels,
          z: zDisplay,
          customdata: grid.counts,
          colorscale: colorscaleForMetric(metric, grid.zMin, grid.zMax),
          cmin: metric === "win_rate" ? 0 : grid.zMin,
          cmax: metric === "win_rate" ? 100 : grid.zMax,
          showscale: true,
          colorbar: {
            tickfont: { color: "#a1a1aa", size: 10 },
            title: { text: grid.zTitle, font: { color: "#a1a1aa", size: 11 } },
          },
          hovertemplate:
            "%{x} · %{y}<br>%{z:.2f}<br>n=%{customdata}<extra></extra>",
          contours: {
            z: { show: true, usecolormap: true, highlightcolor: "#fafafa", project: { z: true } },
          },
        },
      ],
      layout: {
        autosize: true,
        height,
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        margin: { l: 0, r: 0, t: 8, b: 0 },
        scene: {
          bgcolor: "rgba(0,0,0,0)",
          xaxis: {
            title: { text: grid.xTitle, font: { color: "#a1a1aa", size: 11 } },
            tickfont: { color: "#71717a", size: 10 },
            gridcolor: "#3f3f46",
            zerolinecolor: "#52525b",
          },
          yaxis: {
            title: { text: grid.yTitle, font: { color: "#a1a1aa", size: 11 } },
            tickfont: { color: "#71717a", size: 10 },
            gridcolor: "#3f3f46",
            zerolinecolor: "#52525b",
          },
          zaxis: {
            title: { text: grid.zTitle, font: { color: "#a1a1aa", size: 11 } },
            tickfont: { color: "#71717a", size: 10 },
            gridcolor: "#3f3f46",
            zerolinecolor: "#52525b",
          },
          camera: { eye: { x: 1.65, y: 1.45, z: 1.15 } },
        },
      },
      config: {
        displayModeBar: true,
        modeBarButtonsToRemove: ["toImage" as const],
        responsive: true,
      },
    };
  }, [grid, metric, locale, height]);

  return (
    <div className="w-full min-h-[280px]" style={{ height }}>
      <Plot {...plot} style={{ width: "100%", height: "100%" }} useResizeHandler />
    </div>
  );
}
