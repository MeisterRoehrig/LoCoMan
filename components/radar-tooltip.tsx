/* ------------------------------------------------------------------ */
/*  Tooltip for the employee radar chart                              */
/* ------------------------------------------------------------------ */

import { TooltipProps } from "recharts";       // injected by Recharts
import { formatEuro } from "@/lib/utils";
import { EmployeeSummary } from "./employee-contribution-radar";

/* ---------- local types ---------- */
type Smooth = "none" | "log" | "sqrt" | "percent";

interface ExtraProps {
  employees: EmployeeSummary[];
  stepNameLookup: Record<string, string>;
  metric: "minutes" | "cost";
  smooth: Smooth;
  maxLabel?: number;
}

/* ---------- helpers ---------- */
function fmtRaw(v: number, metric: "minutes" | "cost") {
  return metric === "cost" ? formatEuro(v) : `${v.toFixed(0)} min`;
}

export function RadarTooltip(
  props: TooltipProps<number, string> & ExtraProps
) {
  const {
    active,
    payload,
    label: stepId,          // Recharts passes the X-axis key here
    employees,
    stepNameLookup,
    metric,
    maxLabel = 40,
  } = props;

  if (!active || !payload?.length) return null;

  /* -- colour lookup (dataKey → stroke colour) -- */
  const colorMap = Object.fromEntries(
    payload.map((p) => [p.dataKey as string, p.color as string])
  );

  /* -- derive raw rows from employees (not from payload) -- */
  const rows = employees
    .map((emp) => {
      const step = emp.steps.find((s) => s.stepId === stepId);
      const raw = step ? step[metric] : 0;
      return raw > 0
        ? {
            id: emp.employeeId,
            name: emp.jobtitel || emp.employeeId,
            raw,
            color: colorMap[emp.employeeId],
          }
        : null;
    })
    .filter(Boolean) as { id: string; name: string; raw: number; color: string }[];

  if (!rows.length) return null;

  rows.sort((a, b) => b.raw - a.raw); // largest first

  /* -- label truncation -- */
  const fullStepName = stepNameLookup[stepId] ?? stepId;
  const shortName =
    fullStepName.length > maxLabel
      ? fullStepName.slice(0, maxLabel - 1) + "…"
      : fullStepName;

  /* -- render -- */
  return (
    <div className="rounded-md border bg-background p-2 shadow-sm text-xs">
      <div className="mb-1 font-medium" title={fullStepName}>
        {shortName}
      </div>

      {rows.map((r) => (
        <div key={r.id} className="flex items-center gap-1">
          <span
            className="h-2 w-2 rounded-xs"
            style={{ backgroundColor: r.color }}
          />
          <span className="truncate">{r.name}:</span>
          <span className="ml-auto tabular-nums">{fmtRaw(r.raw, metric)}</span>
        </div>
      ))}
    </div>
  );
}
