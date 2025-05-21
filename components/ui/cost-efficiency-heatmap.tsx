"use client";

import React from "react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

// ────────────────────────────────────────────────────────────────────────────
// Types copied from the dashboard page so the component is self‑contained
// ────────────────────────────────────────────────────────────────────────────
interface StepCostBreakdown {
  stepId: string;
  stepName: string;
  minutes: number;
  employeeIds: string[];
  employeeCost: number;
  resourceIds: string[];
  resourceCost: number;
  fixedCost: number;
  stepCost: number;
}

interface ProjectCategorySummary {
  categoryId: string;
  categoryLabel: string;
  categoryColor: string;
  totalCategoryCost: number;
  steps: StepCostBreakdown[];
}

// ────────────────────────────────────────────────────────────────────────────
// Helper utilities
// ────────────────────────────────────────────────────────────────────────────

/** Clamp a number between a minimum and maximum value */
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/**
 * Transform a raw value → 0‥1 where 0 = min, 1 = max using a *log* scale
 * so we get a better spread when the data are highly skewed
 */
function scaled(value: number, min: number, max: number) {
  // log1p handles 0 gracefully
  const lv = Math.log1p(value);
  const lmin = Math.log1p(min);
  const lmax = Math.log1p(max);
  return (lv - lmin) / (lmax - lmin);
}

/**
 * Map a scaled value (0‥1) to a color on a Blue → Purple → Red gradient.
 * We skip green/yellow entirely.
 */
function rampColor(t: number) {
  t = clamp(t, 0, 1);
  let hue: number;
  if (t < 0.5) {
    // Blue (220°) → Purple (280°)
    hue = 220 + (280 - 220) * (t / 0.5);
  } else {
    // Purple (280°) → Red (360°/0°)
    hue = 280 + (360 - 280) * ((t - 0.5) / 0.5);
    if (hue >= 360) hue -= 360; // wrap so 360° == 0° red
  }
  return `hsl(${hue}, 80%, 45%)`;
}

/**
 * Calculate the (row, col) coordinates for the custom "double‑spiral" grid.
 * Pattern: 1×1, 2×2, 3×3, 4×4, 5×5, then 5×6, 5×7, …
 */
function buildGridPositions(count: number) {
  type Coord = { row: number; col: number };
  const coords: Coord[] = [];

  let col = -1;
  let placed = 0;
  while (placed < count) {
    col += 1;
    const rowsHere = col < 5 ? col + 1 : 5; // 1‑5, then stick at 5
    for (let row = 0; row < rowsHere && placed < count; row++) {
      coords.push({ row, col });
      placed += 1;
    }
  }

  return {
    coords,
    width: col + 1,
    height: 4, // fixed so labels align
  };
}

// ────────────────────────────────────────────────────────────────────────────
// React component
// ────────────────────────────────────────────────────────────────────────────

export type StepEfficiencyGridProps = {
  categories: ProjectCategorySummary[];
  squareSize?: number; // px
  gap?: number; // px
};

export default function StepEfficiencyGrid({
  categories,
  squareSize = 28,
  gap = 4,
}: StepEfficiencyGridProps) {
  // Flatten for global stats
  const allSteps = React.useMemo(() => categories.flatMap((c) => c.steps), [categories]);

  const [min, max] = React.useMemo(() => {
    const vals = allSteps.filter((s) => s.minutes > 0).map((s) => s.stepCost / s.minutes);
    return [Math.min(...vals), Math.max(...vals)];
  }, [allSteps]);

  // Precompute layouts for all categories to avoid calling hooks inside a callback
  const layouts = React.useMemo(
    () =>
      categories.reduce<Record<string, ReturnType<typeof buildGridPositions>>>((acc, cat) => {
        acc[cat.categoryId] = buildGridPositions(cat.steps.length);
        return acc;
      }, {}),
    [categories]
  );

  return (
    <div className="flex flex-row gap-6 overflow-x-auto py-2 items-end">
      {categories.map((cat) => {
        const layout = layouts[cat.categoryId];

        return (
          <div key={cat.categoryId} className="flex flex-col items-center shrink-0">
            {/* Grid */}
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${layout.width}, ${squareSize}px)`,
                gridTemplateRows: `repeat(${layout.height}, ${squareSize}px)`,
                gap: `${gap}px` as React.CSSProperties["gap"],
              }}
            >
              {cat.steps.map((step, idx) => {
                const { row, col } = layout.coords[idx];
                const value = step.minutes > 0 ? step.stepCost / step.minutes : 0;
                const t = scaled(value, min, max);
                const color = rampColor(t);

                return (
                  <Tooltip key={step.stepId} delayDuration={100}>
                    <TooltipTrigger asChild>
                      <div
                        style={{
                          width: squareSize,
                          height: squareSize,
                          backgroundColor: color,
                          gridColumnStart: col + 1,
                          gridRowStart: row + 1,
                        }}
                        className="rounded-md cursor-default"
                      />
                    </TooltipTrigger>
                    <TooltipContent className="bg-background text-foreground">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block w-3 h-3 rounded-xs"
                          style={{ backgroundColor: color }}
                        />
                        <span className="whitespace-nowrap text-xs">
                          {step.stepName}: €{value.toFixed(2)}/min
                        </span>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>

            {/* Category label */}
            <span className="text-xs mt-1 text-center whitespace-nowrap" title={cat.categoryLabel}>
              {cat.categoryLabel}
            </span>
          </div>
        );
      })}
    </div>
  );
}
