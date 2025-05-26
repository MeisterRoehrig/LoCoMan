"use client";

import React from "react";
import {
    PolarAngleAxis,
    PolarGrid,
    Radar,
    RadarChart,
    TooltipProps
} from "recharts";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    ChartContainer,
    ChartTooltip,
    ChartConfig,
} from "@/components/ui/chart";
import { RadarTooltip } from "./radar-tooltip";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface EmployeeSummary {
    employeeId: string;
    jobtitel: string;
    steps: {
        stepId: string;
        minutes: number;
        cost: number;
    }[];
}

type Metric = "minutes" | "cost";
type Smooth = "none" | "log" | "sqrt" | "percent";

interface Props {
    employees: EmployeeSummary[];
    metric?: Metric;                     // default: "minutes"
    smooth?: Smooth;                     // default: "none"
    stepNameLookup?: Record<string, string>;
    className?: string;                  // optional passthrough
}

/* ------------------------------------------------------------------ */
/*  Color helpers                                                     */
/* ------------------------------------------------------------------ */

function buildPalette(count: number): string[] {
    // equally spaced hues on the color wheel
    return Array.from({ length: count }, (_, i) => {
        const h = (i * 360) / count;
        return `hsl(${h}, 65%, 55%)`;
    });
}

/* ------------------------------------------------------------------ */
/*  Value transforms                                                  */
/* ------------------------------------------------------------------ */

function transformValue(
    raw: number,
    stepTotal: number,
    smooth: Smooth
): number {
    switch (smooth) {
        case "log":
            return Math.log10(raw + 1);
        case "sqrt":
            return Math.sqrt(raw);
        case "percent":
            return stepTotal === 0 ? 0 : (raw / stepTotal) * 100;
        default:
            return raw;
    }
}

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */

export default function EmployeeStepRadarChart({
    employees,
    metric = "minutes",
    smooth = "none",
    stepNameLookup = {},
    className,
}: Readonly<Props>) {
    /* ---------- constant values ---------- */
    const palette = React.useMemo(() => buildPalette(employees.length), [employees]);

    /* ---------- collect step ids ---------- */
    const stepIds = React.useMemo(() => {
        const set = new Set<string>();
        employees.forEach((e) => {
            e.steps.forEach((s) => set.add(s.stepId));
        });
        return Array.from(set);
    }, [employees]);

    const stepLabel = React.useCallback(
        (id: string) => stepNameLookup[id] ?? id,
        [stepNameLookup]
    );

    /* ---------- build data rows ---------- */
    const data = React.useMemo(() => {
        return stepIds.map((sid) => {
            const stepTotal =
                smooth === "percent"
                    ? employees.reduce((acc, e) => {
                        const found = e.steps.find((s) => s.stepId === sid);
                        return acc + (found ? found[metric] : 0);
                    }, 0)
                    : 0;

            const row: Record<string, unknown> = { step: sid };
            employees.forEach((e) => {
                const found = e.steps.find((s) => s.stepId === sid);
                const raw = found ? found[metric] : 0;
                row[e.employeeId] = transformValue(raw, stepTotal, smooth);
            });
            return row;
        });
    }, [employees, metric, smooth, stepIds]);

    /* ---------- chart config ---------- */
    const chartConfig: ChartConfig = React.useMemo(() => {
        const cfg: ChartConfig = {};
        employees.forEach((e, i) => {
            cfg[e.employeeId] = {
                label: e.jobtitel,
                color: palette[i],
            };
        });
        return cfg;
    }, [employees, palette]);

    /* ---------- early return ---------- */
    if (!employees.length) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle>Personenbeitrag pro Schritt</CardTitle>
                    <CardDescription>Keine Daten vorhanden</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    /* ---------- render ---------- */
    let yUnit: string;
    if (smooth === "percent") {
        yUnit = "%";
    } else if (metric === "cost") {
        yUnit = "€";
    } else {
        yUnit = "min";
    }

    return (
        <Card className={className}>
            <CardHeader className="items-center pb-4">
                <CardTitle>Personenbeitrag pro Schritt</CardTitle>
                <CardDescription>
                    {metric === "minutes" ? "Arbeitszeit" : "Kosten"} ({yUnit}),
                    Glättung: {smooth}
                </CardDescription>
            </CardHeader>

            <CardContent className="pb-0">
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto width-full "
                >
                    <RadarChart data={data}>

                        <ChartTooltip
                            cursor={false}
                            content={(p: TooltipProps<number, string>) => (
                                <RadarTooltip
                                    {...p}
                                    employees={employees}
                                    stepNameLookup={stepNameLookup}
                                    metric={metric}      // "cost" | "minutes"
                                    smooth={smooth}      // "none" | "log" | "sqrt" | "percent"
                                />
                            )}
                        />
                        <PolarAngleAxis
                            dataKey="step"
                            tickFormatter={(id: string) => {
                                const label = stepLabel(id);
                                // Limit label to 10 chars and add ellipsis if too long
                                return label.length > 16 ? label.slice(0, 16) + "…" : label;
                            }}
                            tick={{ fontSize: 12 }}
                        />
                        <PolarGrid gridType="circle" />
                        {employees.map((e) => (
                            <Radar
                                key={e.employeeId}
                                dataKey={e.employeeId}
                                fill={`var(--color-${e.employeeId})`}
                                fillOpacity={0.45}
                                stroke={`var(--color-${e.employeeId})`}
                                strokeWidth={2}
                            />
                        ))}
                    </RadarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
