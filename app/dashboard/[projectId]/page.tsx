"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Loader from "@/components/loader";
import { BellRing, Download, Edit, Sparkles } from "lucide-react";
import { Report, forceRefreshReports } from "@/lib/report-manager";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { useSteps } from "@/providers/steps-provider";
import { useTree } from "@/providers/tree-provider";
import { useProjects } from "@/providers/projects-provider";
import { generateProjectSummary } from "@/lib/summary-manager";

import { Pie, PieChart } from "recharts";
import CostTreemap from "@/components/cost-treemap";

import {
  ChartConfig,
  ChartTooltip,
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatEuro } from "@/lib/utils";

import { useEmployees } from "@/providers/employees-provider";
import { useResources } from "@/providers/resources-provider";
import { useFixedCostObjects } from "@/providers/fixed-cost-provider";
import { useFixedTree } from "@/providers/fixed-tree-provider";

/**
 * Utility helpers
 */
function parseHSL(str?: string) {
  const m = str?.match(/hsl\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)/i);
  return m ? { h: +m[1], s: +m[2], l: +m[3] } : null;
}
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
function childColor(parent?: string, idx = 0, total = 1) {
  const hsl = parseHSL(parent);
  if (!hsl) return undefined;
  const span = 20;
  const l = clamp(hsl.l - ((idx / Math.max(1, total - 1)) - 0.5) * span, 10, 90);
  return `hsl(${hsl.h}, ${hsl.s}%, ${l}%)`;
}

const chartConfig = {} satisfies ChartConfig;

export default function Page() {
  const params = useParams();
  const projectId = String(params.projectId);
  const router = useRouter();

  const { steps } = useSteps();
  const { dataTree, loadTree } = useTree();
  const { employees: allEmployees, loadEmployees } = useEmployees();
  const { resources, loadResources } = useResources();
  const { fixedCosts: fixedTree, loadFixedTree } = useFixedTree();
  const { fixedCostObjects, loadFixedCostObjects } = useFixedCostObjects();
  const { projects, updateProjectSummary } = useProjects();

  const project = React.useMemo(() => projects.find((p) => p.id === projectId), [projects, projectId]);

  React.useEffect(() => {
    if (!projectId) return;
    loadTree(projectId);
    loadEmployees();
    loadResources();
    loadFixedTree(projectId);
    loadFixedCostObjects();
  }, [projectId, loadTree, loadEmployees, loadResources, loadFixedTree, loadFixedCostObjects]);

  // Short‑cuts to summary sections (new schema only)
  const summary = project?.summary as ProjectCostSummary | undefined;
  const categories = summary?.projectCosts.categories ?? [];
  const totalProjectCost = summary?.projectCosts.totalProjectCost ?? 0;
  const fixedCostsSection = summary?.fixedCosts;
  const employeeSection = summary?.employees;

  const projectChartData = React.useMemo(
    () =>
      categories.map((cat) => ({
        name: cat.categoryLabel,
        value: cat.totalCategoryCost,
        fill: cat.categoryColor ?? "#ccc",
      })),
    [categories]
  );

  const fixedCostChartData = React.useMemo(
    () =>
      (fixedCostsSection?.objects ?? []).map((obj, idx, arr) => ({
        name: obj.name,
        value: obj.monthlyCostEuro,
        fill: childColor("hsl(200, 65%, 55%)", idx, arr.length) ?? "#bbb",
      })),
    [fixedCostsSection]
  );

  const employeeChartData = React.useMemo(
    () =>
      (employeeSection?.list ?? []).map((emp, idx, arr) => ({
        name: emp.jobtitel || emp.employeeId,
        value: emp.totalCost,
        fill: childColor("hsl(340, 65%, 55%)", idx, arr.length) ?? "#ddd",
      })),
    [employeeSection]
  );

  if (!projectId || !project) return <Loader show={true} />;

  async function handleGenerateReport() {
    if (!dataTree || !fixedTree) return;
    const summary = generateProjectSummary(dataTree, steps, allEmployees, resources, fixedTree, fixedCostObjects);
    try {
      await updateProjectSummary(projectId, summary);
      forceRefreshReports(projectId);
    } catch (err) {
      console.error("Error updating project summary:", err);
    }
  }

  const handleDownloadSummary = () => {
    if (!summary) return alert("No summary available to download!");
    const url = URL.createObjectURL(new Blob([JSON.stringify(summary, null, 2)], { type: "application/json" }));
    const link = Object.assign(document.createElement("a"), { href: url, download: `project_${projectId}_summary.json` });
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ScrollArea type="scroll" className="flex-1 p-4 pt-0 rounded-md h-full overflow-hidden">
      <Separator className="mb-3" />

      {/* HEADER */}
      <div className="flex justify-between items-center px-1">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
          <h2>{project.description}</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadSummary}>
            <Download />
          </Button>
          <Button variant="outline" onClick={() => router.push(`/dashboard/${projectId}/data`)}>
            <Edit /> Edit Data
          </Button>
          <Button onClick={handleGenerateReport}>
            <Sparkles /> {summary ? "Update Report" : "Generate Report"}
          </Button>
        </div>
      </div>

      <div className="py-5" />

      {summary ? (
        <div className="flex flex-col gap-4">
          {/* ── OVERVIEW GRID ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
           <Card className="min-w-0">
              <CardHeader>
                <CardDescription>Gesamtkosten</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums">
                  {formatEuro(totalProjectCost)}
                </CardTitle>
                <CardAction>
                  <Badge variant="outline">
                    <BellRing size={64} color="var(--destructive-highlight)" />
                  </Badge>
                </CardAction>
              </CardHeader>
              <ChartContainer config={chartConfig} className="w-full h-full p-0">
                <PieChart width={100} height={100} className="p-0">
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={projectChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="60%"
                    paddingAngle={1}
                    stroke="#fff"
                    labelLine={false}
                    label={({ cx, cy, midAngle, outerRadius, payload }) => {
                      const RAD = Math.PI / 180;
                      const offset = 10;
                      const normalized = (midAngle + 360) % 360;
                      const radius = outerRadius + offset;
                      const x = cx + radius * Math.cos(-midAngle * RAD);
                      const y = cy + radius * Math.sin(-midAngle * RAD);
                      const anchors = ["start", "end"] as const;
                      const baselines = ["hanging", "baseline"] as const;
                      const [ta, db] = normalized >= 135 && normalized < 315 ? [1, normalized < 225 ? 1 : 0] : [0, normalized < 45 || normalized >= 315 ? 0 : 1];
                      return (
                        <text x={x} y={y} textAnchor={anchors[ta]} dominantBaseline={baselines[db]} fill={payload.fill} fontSize={10}>
                          {payload.name}
                        </text>
                      );
                    }}
                  />
                </PieChart>
              </ChartContainer>
            </Card>

            {/* AI REPORT */}
            <Card>
              <CardHeader>
                <CardTitle>AI Report</CardTitle>
                <CardDescription>Eine kurze Zusammenfassung der Kostenstruktur aus Sicht der KI.</CardDescription>
              </CardHeader>
              <CardFooter className="text-sm">
                <Report project={project} kind="overview" responseType="text" wordRange={[300, 400]} />
              </CardFooter>
            </Card>

            {/* Fixed costs */}
            <Card className="flex flex-col col-span-1">
              <CardHeader>
                <CardDescription>Fixkosten (Monat)</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums">
                  {formatEuro(fixedCostsSection?.totalFixedCost ?? 0)}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1 text-sm overflow-y-auto max-h-36">
                {(fixedCostsSection?.objects ?? []).map((obj) => (
                  <div key={obj.id} className="flex justify-between">
                    <span>{obj.name}</span>
                    <span className="tabular-nums">{formatEuro(obj.monthlyCostEuro)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Employee cost */}
            <Card className="flex flex-col col-span-1">
              <CardHeader>
                <CardDescription>Personalkosten (Projekt)</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums">
                  {formatEuro(employeeSection?.totalEmployeeCost ?? 0)}
                </CardTitle>
              </CardHeader>
              <ChartContainer config={chartConfig} className="h-40">
                <PieChart width={160} height={160}>
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <Pie data={employeeChartData} dataKey="value" nameKey="name" innerRadius="60%" paddingAngle={1} stroke="#fff" />
                </PieChart>
              </ChartContainer>
            </Card>
          </div>

          {/* ── CATEGORY GRID ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categories.map((cat) => {
              const stepData = cat.steps.map((s, i) => ({
                name: s.stepName,
                value: s.stepCost,
                fill: childColor(cat.categoryColor, i, cat.steps.length) ?? cat.categoryColor ?? "#ccc",
              }));

              return (
                <Card key={cat.categoryId} className="flex flex-col">
                  <CardHeader>
                    <CardDescription>{cat.categoryLabel}</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums">
                      {formatEuro(cat.totalCategoryCost)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col sm:flex-row items-center gap-4 pb-0">
                    <div className="shrink-0 w-40 aspect-square">
                      <ChartContainer config={chartConfig} className="w-full h-full p-0">
                        <PieChart width={160} height={160}>
                          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                          <Pie data={stepData} dataKey="value" nameKey="name" innerRadius="60%" paddingAngle={1} stroke="#fff" />
                        </PieChart>
                      </ChartContainer>
                    </div>
                    <div className="flex flex-col justify-center gap-1 text-sm text-center sm:text-left">
                      <Report project={project} kind="category" categoryId={cat.categoryId} responseType="bullet" wordRange={[10, 50]} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* ── TREEMAP ──────────────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle>Kostenstruktur (Treemap)</CardTitle>
              <CardDescription className="text-sm">Alle Kosten im Verhältnis</CardDescription>
            </CardHeader>
            <CardContent className="-my-4">
              <CostTreemap categories={categories} />
            </CardContent>
          </Card>

          {/* ── RAW JSON ─────────────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle>Raw Summary JSON</CardTitle>
              <CardDescription className="text-sm">Nur für Entwicklung & Debugging 🔧</CardDescription>
            </CardHeader>
            <CardFooter>
              <pre className="p-2 bg-muted rounded-md w-full text-sm overflow-auto">
                {JSON.stringify(summary, null, 2)}
              </pre>
            </CardFooter>
          </Card>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground mt-4">Noch kein Bericht generiert. Klicke auf "Generate Report", um zu starten.</div>
      )}
    </ScrollArea>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────
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

interface ProjectCostSummary {
  projectCosts: {
    totalProjectCost: number;
    categories: ProjectCategorySummary[];
  };
  fixedCosts: {
    totalFixedCost: number;
    objects: { id: string; name: string; monthlyCostEuro: number }[];
  };
  employees: {
    totalEmployeeCost: number;
    list: {
      employeeId: string;
      jobtitel: string;
      totalMinutes: number;
      perMinuteCost: number;
      totalCost: number;
      steps: { stepId: string; minutes: number; cost: number }[];
    }[];
  };
}
