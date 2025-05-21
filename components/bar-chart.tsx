/* -----------------------------------------------------------------------
   CostBarChart.tsx  –  universal version
   -------------------------------------------------------------------- */
"use client";

import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatEuro } from "@/lib/utils";
import type { LabelProps } from "recharts";

/* ── HSL helpers ────────────────────────────────────────────────────── */
function parseHSL(str?: string) {
  const m = str?.match(/hsl\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)/i);
  return m ? { h: +m[1], s: +m[2], l: +m[3] } : null;
}
const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

function lighten(parent: string, step: number, total: number) {
  const hsl = parseHSL(parent);
  if (!hsl) return parent;
  const span = 15;
  const l = clamp(hsl.l + (step * span) / Math.max(1, total - 1), 10, 90);
  return `hsl(${hsl.h}, ${hsl.s}%, ${l}%)`;
}

/* ── types ──────────────────────────────────────────────────────────── */
interface GenericObj {
  [k: string]: unknown;
}
interface Props<T extends GenericObj = GenericObj> {
  objects: T[];
  /** string key OR accessor that returns the numeric value */
  valueAccessor?: keyof T | ((obj: T) => number);
  /** string key OR accessor that returns the label text */
  labelAccessor?: keyof T | ((obj: T) => string);
  baseColor?: string;
  maxBars?: number;
}

/* ── tooltip colour config ──────────────────────────────────────────── */
const chartConfig = {
  value: { label: "Kosten", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

/* ── component ──────────────────────────────────────────────────────── */
export default function CostBarChart<T extends GenericObj>({
  objects,
  valueAccessor = "monthlyCostEuro",
  labelAccessor = "name",
  baseColor = "hsl(221, 83%, 53%)", // #2563EB
  maxBars = 5,
}: Props<T>) {
  /* -------------- helpers resolved at runtime ----------------------- */
  const getValue = React.useCallback(
    (o: T) =>
      typeof valueAccessor === "function"
        ? valueAccessor(o)
        : Number(o[valueAccessor] ?? 0),
    [valueAccessor],
  );

  const getLabel = React.useCallback(
    (o: T) =>
      typeof labelAccessor === "function"
        ? labelAccessor(o)
        : String(o[labelAccessor] ?? ""),
    [labelAccessor],
  );

  /* -------------- build dataset ------------------------------------ */
  const data = React.useMemo(() => {
    if (!objects?.length) return [];

    const sorted = [...objects].sort((a, b) => getValue(b) - getValue(a));
    const top = sorted.slice(0, maxBars);
    const restTotal = sorted.slice(maxBars).reduce((s, o) => s + getValue(o), 0);
    const totalBars = top.length + (restTotal ? 1 : 0);

    const rows = top.map((o, idx) => {
      const full = getLabel(o);
      return {
        name: full.length > 20 ? `${full.slice(0, 17)}…` : full,
        fullName: full,
        value: getValue(o),
        fill: lighten(baseColor, idx, totalBars),
      };
    });

    if (restTotal) {
      rows.push({
        name: "Others",
        fullName: "Others",
        value: restTotal,
        fill: lighten(baseColor, rows.length, totalBars),
      });
    }
    return rows;
  }, [objects, getLabel, getValue, baseColor, maxBars]);

  /* -------------- label renderer ----------------------------------- */


  const renderLabel = (props: LabelProps) => {
    const {
      x,
      y,
      width,
      height,
      value,
    } = props;

    // Ensure all values are numbers and defined
    if (
      typeof x !== "number" ||
      typeof y !== "number" ||
      typeof width !== "number" ||
      typeof height !== "number"
    ) {
      return null;
    }

    const text = String(value ?? "");
    const approx = text.length * 6.5;
    const inside = width > approx + 8;
    return (
      <text
        x={inside ? x + 8 : x + width + 8}
        y={y + height / 2}
        dy="0.35em"
        fontSize={12}
        textAnchor="start"
        fill={inside ? "#fff" : "var(--foreground)"}
        className="pointer-events-none"
      >
        {text}
      </text>
    );
  };

  /* -------------- render chart ------------------------------------- */
  return (
    <ChartContainer config={chartConfig}>
      <BarChart accessibilityLayer data={data} layout="vertical" margin={{ right: 16 }}>
        <CartesianGrid horizontal={false} />
        <YAxis dataKey="name" type="category" hide />
        <XAxis
          type="number"
          tickFormatter={formatEuro}
          tickLine={false}
          axisLine={false}
          strokeOpacity={0.6}
          fontSize={11}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              indicator="line"
              formatter={(v, _k, p) =>
                `${p.payload.fullName}: ${formatEuro(v as number)}`
              }
            />
          }
        />
        <Bar dataKey="value" radius={[4, 4, 4, 4]} isAnimationActive={false}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.fill} />
          ))}
          <LabelList dataKey="name" content={renderLabel} />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
