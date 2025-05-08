"use client";

import React from "react";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import { formatEuro } from "@/lib/utils";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

/* ------------------------------------------------------------------
 *  Types
 * ---------------------------------------------------------------- */
export type StepItem = {
  stepId: string;
  stepName: string;
  stepCost: number;
};
export type CategoryItem = {
  categoryId: string;
  categoryLabel: string;
  categoryColor?: string;
  totalCategoryCost: number;
  steps: StepItem[];
};
export interface CostTreemapProps {
  categories?: CategoryItem[];
}

/* ------------------------------------------------------------------
 *  HSL utilities
 * ---------------------------------------------------------------- */
function parseHSL(str?: string) {
  const m = str?.match(
    /hsl\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)/i,
  );
  return m ? { h: +m[1], s: +m[2], l: +m[3] } : null;
}
const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));
function childColor(parent?: string, idx = 0, total = 1) {
  const hsl = parseHSL(parent);
  if (!hsl) return undefined;
  const span = 12;
  const l = clamp(
    hsl.l + ((idx / Math.max(1, total - 1)) - 0.5) * span,
    10,
    90,
  );
  return `hsl(${hsl.h}, ${hsl.s}%, ${l}%)`;
}

/* ------------------------------------------------------------------
 *  Component
 * ---------------------------------------------------------------- */
export default function CostTreemap({ categories = [] }: CostTreemapProps) {
  /* ---- Build series ---- */
  const series = React.useMemo(
    () =>
      categories.map((cat) => ({
        name: cat.categoryLabel,
        data: cat.steps.map((step, i) => ({
          x: step.stepName,
          y: step.stepCost,
          fillColor: childColor(cat.categoryColor, i, cat.steps.length),
        })),
      })),
    [categories],
  );

  /* ---- Tooltip – memoised renderer ---- */
  type TooltipCtx = {
    seriesIndex: number;
    dataPointIndex: number;
    w: {
      globals: { series: number[][] };
      config: {
        series: { data: { x: string; fillColor?: string }[] }[];
      };
    };
  };

  const tooltipHtml = React.useMemo(
    () =>
      ({ seriesIndex, dataPointIndex, w }: TooltipCtx): string => {
        const rawVal = w.globals.series[seriesIndex][dataPointIndex];
        const point =
          w.config.series[seriesIndex].data[dataPointIndex];

        return `
      <div class="border-border/50 bg-background grid min-w-[8rem] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl">
        <div class="grid gap-1.5">
          <div class="[&>svg]:text-muted-foreground flex w-full items-center gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5">
            <div style="width:10px;height:10px;border-radius:2px;background:${point.fillColor ?? "#666"};flex-shrink:0;"></div>
            <div class="flex flex-1 justify-between items-center leading-none">
              <span class="text-muted-foreground" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:14rem;">${point.x}</span>
              <span class="text-foreground font-mono font-medium tabular-nums pl-1">${formatEuro(rawVal)}</span>
            </div>
          </div>
        </div>
      </div>`;
      },
    [],
  );

  /* ---- Chart options ---- */
  const options: ApexOptions = React.useMemo(
    () => ({
      chart: {
        type: "treemap",
        toolbar: { show: false },
        animations: { speed: 300 },
        fontFamily: "var(--font-sans, Inter, sans-serif)",
        selection: { enabled: false },
      },
      stroke: { show: false, colors: ["var(--border)"], width: 1 },
      legend: { show: false },
      dataLabels: {
        enabled: true,
        style: {
          fontSize: "20px",
          fontWeight: "bold",
          colors: ["var(--foreground)"],
        },
        formatter: (_txt, o) =>
          formatEuro(
            o.w.globals.series[o.seriesIndex][o.dataPointIndex] as number,
          ),
      },
      tooltip: {
        followCursor: true,
        fixed: { enabled: false },
        intersect: false,
        fillSeriesColor: false,
        background: "transparent",
        border: "none",
        custom: tooltipHtml,
      },
      states: {
        active: { filter: { type: "none", value: 0 } },
        hover: { filter: { type: "none", value: 0 } },
      },
    }),
    [tooltipHtml],
  );

  /* ---- Render ---- */
  return (
    <>
      {categories.length ? (
        <>
          <ReactApexChart
            type="treemap"
            height={550}
            options={options}
            series={series}
          />
          <style jsx global>{`
            .apexcharts-tooltip {
              background: transparent !important;
              border: none !important;
              box-shadow: none !important;
              padding: 0 !important;
            }
          `}</style>
        </>
      ) : (
        <p className="text-muted-foreground text-sm">
          Noch keine Kostendaten vorhanden.
        </p>
      )}
    </>
  );
}
