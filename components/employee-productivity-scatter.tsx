"use client";

import React from "react";
import {
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    ZAxis,
    CartesianGrid,
    ResponsiveContainer,
    TooltipProps
} from "recharts";
import {
    ChartContainer,
    ChartTooltip,
    ChartConfig,
} from "@/components/ui/chart";
import { formatEuro } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

type EmployeeSummary = {
    employeeId: string;
    jobtitel: string;                       // used as “real” name in the UI
    totalMinutes: number;
    totalCost: number;
    steps: { stepId: string; minutes: number; cost: number }[];
};

interface Props {
    readonly employees: readonly EmployeeSummary[];
    readonly className?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function buildPalette(count: number): string[] {
    return Array.from({ length: count }, (_, i) => {
        const h = (i * 360) / count;
        return `hsl(${h}, 65%, 55%)`;
    });
}

/* ---------- custom tooltip ---------- */
type ScatterPoint = {
    x: number;
    y: number;
    z: number;
    name: string;
    color: string;
    fill: string;
};

function ScatterTooltip(props: TooltipProps<number, string>) {
    const { active, payload } = props;

    if (!active || !payload?.length) return null;

    const p = payload[0];                       // only one point in payload
    const { x, y, z, name } = p.payload as ScatterPoint; // props added below

    return (
        <div className="rounded-md border bg-background p-2 shadow-sm text-xs">
            <div className="flex items-center gap-1 mb-1 font-medium">
                <span
                    className="h-2 w-2 rounded-xs"
                    style={{ backgroundColor: p.payload.color }}
                />
                <span>{name}</span>
            </div>

            <div className="flex gap-2">
                <span className="tabular-nums">{x} min</span>
                <span className="tabular-nums">{formatEuro(y)}</span>
                <span className="tabular-nums">{z} steps</span>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */

export default function EmployeeProductivityScatter({
    employees,
    className,
}: Props) {
    /* ---------- palette + config ---------- */
    const palette = React.useMemo(() => buildPalette(employees.length), [employees]);

    const chartConfig: ChartConfig = React.useMemo(() => {
        const cfg: ChartConfig = {};
        employees.forEach((e, i) => {
            cfg[e.employeeId] = { label: e.jobtitel, color: palette[i] };
        });
        return cfg;
    }, [employees, palette]);

    /* ---------- data ---------- */
    const series = React.useMemo(
        () =>
            employees.map((e, i) => ({
                x: e.totalMinutes,
                y: e.totalCost,
                z: e.steps.length || 1,       // bubble size
                name: e.jobtitel || e.employeeId,
                fill: palette[i],
                color: palette[i],
            })),
        [employees, palette]
    );

    /* NEW → compute the minimum cost once */
    const minCost = React.useMemo(
        () => Math.min(...employees.map((e) => e.totalCost)),
        [employees]
    );

    if (!employees.length) return null;

    /* ---------- render ---------- */
    return (
        <ChartContainer config={chartConfig} className={className ?? "h-80 w-full"}>
            <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 16, right: 16, left: 16, bottom: 16 }}>
                    <CartesianGrid strokeDasharray="3 3"/>
                    <XAxis
                        type="number"
                        dataKey="x"
                        name="Minuten"
                        tick={{ fontSize: 12 }}
                        label={{ value: "Total Minutes Worked", position: "Bottom", dy: 16 }}
                    />
                    <YAxis
                        type="number"
                        dataKey="y"
                        name="Kosten"
                        tick={{ fontSize: 12 }}
                        tickFormatter={formatEuro}
                        domain={[minCost, "auto"]}
                        label={{ value: "Total Employee Cost (€)", angle: -90, position: "Left", dx: -40 }}
                    />
                    <ZAxis type="number" dataKey="z" range={[60, 400]}/>

                    <ChartTooltip
                        cursor={false}
                        content={(p: TooltipProps<number, string>) => <ScatterTooltip {...p} />}
                    />

                    {/* one <Scatter> per employee keeps colour and legend consistent */}
                    {series.map((pt) => (
                        <Scatter
                            key={pt.name}
                            data={[pt]}
                            name={pt.name}
                            fill={pt.fill}
                            dataKey="x" // any non-undefined key, required by Recharts
                        />
                    ))}
                </ScatterChart>
            </ResponsiveContainer>
        </ChartContainer>
    );
}
