"use client"

import React from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  TooltipProps,
  XAxis,
  YAxis,
} from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartConfig,
} from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { formatEuro } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"

//
// ─── TYPES ──────────────────────────────────────────────────────────────
//
interface StepCostBreakdown {
  stepId: string
  stepName: string
  employeeCost: number
  resourceCost: number
  fixedCost: number
}
interface ProjectCategorySummary {
  categoryId: string
  categoryLabel: string
  steps: StepCostBreakdown[]
}
interface Props {
  /** summary.projectCosts.categories */
  categories: ProjectCategorySummary[]
}

// palette
const COL_FIX = "hsl(227, 65%, 55%)"
const COL_EMP = "hsl(262, 65%, 55%)"
const COL_RES = "hsl(276, 65%, 55%)"

//
// ─── TOOLTIP ────────────────────────────────────────────────────────────
//
function Tooltip({
  active,
  payload,
  label,
  max = 40,          // ⇦ tweak here if you need a different cut-off
}: TooltipProps<number, string> & { max?: number }) {
  if (!active || !payload?.length) return null

  // ellipsis helper
  const shortLabel =
    label.length > max ? label.slice(0, max - 1) + "…" : label

  const row = payload[0].payload as any
  const lines = [
    { key: "fixedEuro",    label: "Fixed",    col: COL_FIX },
    { key: "employeeEuro", label: "Employee", col: COL_EMP },
    { key: "resourceEuro", label: "Resource", col: COL_RES },
  ]

  return (
    <div className="rounded-md border bg-background p-2 shadow-sm text-xs">
      {/* title attr keeps full text, innerText is truncated */}
      <div
        className="mb-1 font-medium whitespace-pre-line"
        title={label}
      >
        {shortLabel}
      </div>

      {lines.map((l) => (
        <div key={l.key} className="flex items-center gap-1">
          <span
            className="h-2 w-2 rounded-xs"
            style={{ backgroundColor: l.col }}
          />
          <span>{l.label}:</span>
          <span className="ml-auto tabular-nums">
            {formatEuro(row[l.key] ?? 0)}
          </span>
        </div>
      ))}
    </div>
  )
}


//
// ─── MAIN COMPONENT ─────────────────────────────────────────────────────
//
export default function CostContributionChart({ categories }: Props) {
  const [view, setView] = React.useState<"categories" | "steps">("categories")

  const chartData = React.useMemo(() => {
    if (!categories?.length) return []

    type Row = {
      label: string
      fixedEuro: number
      employeeEuro: number
      resourceEuro: number
      totalEuro: number
      // shares only for the category view
      fixedShare?: number
      employeeShare?: number
      resourceShare?: number
    }

    let rows: Row[] = []

    if (view === "categories") {
      // aggregate per category
      rows = categories.map((c) => {
        const fixedEuro = c.steps.reduce((s, x) => s + (x.fixedCost ?? 0), 0)
        const employeeEuro = c.steps.reduce((s, x) => s + (x.employeeCost ?? 0), 0)
        const resourceEuro = c.steps.reduce((s, x) => s + (x.resourceCost ?? 0), 0)
        const totalEuro = fixedEuro + employeeEuro + resourceEuro
        return { label: c.categoryLabel, fixedEuro, employeeEuro, resourceEuro, totalEuro }
      })

      // compute shares
      const totFix = rows.reduce((s, r) => s + r.fixedEuro, 0) || 1
      const totEmp = rows.reduce((s, r) => s + r.employeeEuro, 0) || 1
      const totRes = rows.reduce((s, r) => s + r.resourceEuro, 0) || 1
      rows.forEach((r) => {
        r.fixedShare = r.fixedEuro / totFix
        r.employeeShare = r.employeeEuro / totEmp
        r.resourceShare = r.resourceEuro / totRes
      })

      // top 5
      rows.sort((a, b) => b.totalEuro - a.totalEuro)
      const top = rows.slice(0, 5)
      if (rows.length > 5) {
        const rest = rows.slice(5).reduce(
          (acc, r) => {
            acc.fixedEuro += r.fixedEuro
            acc.employeeEuro += r.employeeEuro
            acc.resourceEuro += r.resourceEuro
            return acc
          },
          { fixedEuro: 0, employeeEuro: 0, resourceEuro: 0 },
        )
        top.push({
          label: "Other",
          ...rest,
          totalEuro: rest.fixedEuro + rest.employeeEuro + rest.resourceEuro,
          fixedShare: rest.fixedEuro / totFix,
          employeeShare: rest.employeeEuro / totEmp,
          resourceShare: rest.resourceEuro / totRes,
        })
      }
      return top
    }

    // ── STEP VIEW ────────────────────────────────────────────────
    rows = categories.flatMap((c) =>
      c.steps.map((s) => {
        const fixedEuro = s.fixedCost ?? 0
        const employeeEuro = s.employeeCost ?? 0
        const resourceEuro = s.resourceCost ?? 0
        const totalEuro = fixedEuro + employeeEuro + resourceEuro
        return { label: s.stepName, fixedEuro, employeeEuro, resourceEuro, totalEuro }
      }),
    )

    // top 12
    rows.sort((a, b) => b.totalEuro - a.totalEuro)
    const top12 = rows.slice(0, 12)
    if (rows.length > 12) {
      const rest = rows.slice(12).reduce(
        (acc, r) => {
          acc.fixedEuro += r.fixedEuro
          acc.employeeEuro += r.employeeEuro
          acc.resourceEuro += r.resourceEuro
          return acc
        },
        { fixedEuro: 0, employeeEuro: 0, resourceEuro: 0 },
      )
      top12.push({
        label: "Other",
        ...rest,
        totalEuro: rest.fixedEuro + rest.employeeEuro + rest.resourceEuro,
      })
    }
    return top12
  }, [categories, view])

  if (!chartData.length) return null

  // config for legend (colours only)
  const chartConfig: ChartConfig = {
    fixedEuro: { label: "Fixed", color: COL_FIX },
    employeeEuro: { label: "Employee", color: COL_EMP },
    resourceEuro: { label: "Resource", color: COL_RES },
  }

  /** whether current bars are stacked (step view) */
  const stacked = view === "steps"



  return (
    <Card>

      <CardHeader className="flex justify-between items-start">
        <div>
          <CardTitle>Beitrag zu den Fixkosten</CardTitle>
          <CardDescription className="text-sm">
            Größte Fixkosten-Verursacher absteigend
          </CardDescription>
        </div>
        {/* VIEW TOGGLE  */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={view === "categories" ? "default" : "outline"}
            onClick={() => setView("categories")}
          >
            Categories
          </Button>
          <Button
            size="sm"
            variant={view === "steps" ? "default" : "outline"}
            onClick={() => setView("steps")}
          >
            Steps
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">


          <ChartContainer config={chartConfig} className="w-full overflow-x-auto">
            <BarChart
              accessibilityLayer
              data={chartData}
              margin={{ top: 8, right: 24, left: 4, bottom: 24 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                interval={0}
                angle={-25}
                textAnchor="end"
              />
              <YAxis
                tickFormatter={(v) =>
                  stacked ? formatEuro(v as number) : `${((v as number) * 100).toFixed(1)} %`
                }
              />

              <ChartTooltip cursor={false} content={<Tooltip />} />

              {/* BAR DEFINITIONS — stackId only for step view  */}
              <Bar
                dataKey={stacked ? "fixedEuro" : "fixedShare"}
                name="Fixed"
                fill={COL_FIX}
                stackId={stacked ? "a" : undefined}
                radius={stacked ? [4, 4, 0, 0] : [2, 2, 0, 0]}
              >
                {chartData.map((_, i) => (
                  <Cell key={`fix-${i}`} fill={COL_FIX} />
                ))}
              </Bar>

              <Bar
                dataKey={stacked ? "employeeEuro" : "employeeShare"}
                name="Employee"
                fill={COL_EMP}
                stackId={stacked ? "a" : undefined}
                radius={stacked ? [4, 4, 0, 0] : [2, 2, 0, 0]}
              >
                {chartData.map((_, i) => (
                  <Cell key={`emp-${i}`} fill={COL_EMP} />
                ))}
              </Bar>

              <Bar
                dataKey={stacked ? "resourceEuro" : "resourceShare"}
                name="Resource"
                fill={COL_RES}
                stackId={stacked ? "a" : undefined}
                radius={stacked ? [4, 4, 0, 0] : [2, 2, 0, 0]}
              >
                {chartData.map((_, i) => (
                  <Cell key={`res-${i}`} fill={COL_RES} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}

