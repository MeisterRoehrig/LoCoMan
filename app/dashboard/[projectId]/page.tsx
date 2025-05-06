"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Loader from "@/components/loader";
import { Download, Edit, Sparkles, TrendingUp } from "lucide-react";
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
import { model } from "@/lib/firebase-config"; // or wherever your model is exported
import { generateProjectSummary } from "@/lib/summary-report";

import { Pie, PieChart } from "recharts";
import CostTreemap from "@/components/cost-treemap";

import {
  ChartConfig,
  ChartTooltip,
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";

function parseHSL(str?: string) {
  const m = str?.match(/hsl\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)/i);
  return m ? { h: +m[1], s: +m[2], l: +m[3] } : null;
}
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
function childColor(parent?: string, idx = 0, total = 1) {
  const hsl = parseHSL(parent);
  if (!hsl) return undefined;
  // Spread the children across a lightness span to get clearly distinct colours
  const span = 20; // percentage points
  const l = clamp(hsl.l - ((idx / Math.max(1, total - 1)) - 0.5) * span, 10, 90);
  return `hsl(${hsl.h}, ${hsl.s}%, ${l}%)`;
}

const chartConfig = {
} satisfies ChartConfig;

export default function Page() {
  const params = useParams();
  const projectId = String(params.projectId);
  const router = useRouter();

  const { steps } = useSteps();
  const { dataTree, loadTree } = useTree();
  const { projects, updateProjectSummary } = useProjects();

  const [aiResponse, setAiResponse] = React.useState("");
  const [aiLoading, setAiLoading] = React.useState(false);
  const [analysisTriggered, setAnalysisTriggered] = React.useState(false);

  type SummaryData = {
    totalProjectCost?: number;
    categories?: {
      categoryId: string;
      categoryLabel: string;
      totalCategoryCost: number;
      categoryColor: string;
      steps: {
        stepId: string;
        stepName: string;
        stepCost: number;
      }[];
    }[];
  };

  function buildPrompt(summaryData: SummaryData) {
    return `
      Sie sind ein KI-Assistent, der in eine Logistikmanagement-Anwendung integriert ist.
      Erstellen Sie einen prägnanten, professionellen Kostenanalysebericht auf der Grundlage der folgenden Daten. 
      Konzentrieren Sie sich auf die wichtigsten Kostentreiber, potenzielle Einsparungen und die empfohlenen nächsten Schritte.

      Hier ist die Projektzusammenfassung (JSON):
      ${JSON.stringify(summaryData, null, 2)}

       Bitte antworten Sie mit einer kurzen Zusammenfassung und allen verwertbaren Erkenntnissen der text sollte in einem Block geschrieben sein und keine formatierungen enthalten.:
    `.trim();
  }

  

  async function handleAiAnalysis(summaryData: SummaryData) {
    if (!summaryData) return;

    try {
      setAiLoading(true);
      setAiResponse("");

      const prompt = buildPrompt(summaryData);
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      setAiResponse(text);
    } catch (error) {
      console.error("Error generating AI analysis:", error);
      setAiResponse("An error occurred while fetching the AI response.");
    } finally {
      setAiLoading(false);
    }
  }

  // Find the relevant project from our ProjectsContext
  const project = React.useMemo(() => {
    const found = projects.find((p) => p.id === projectId);
    return found;
  }, [projects, projectId]);

  // Load the tree for this project if needed
  React.useEffect(() => {
    if (projectId) {
      loadTree(projectId);
    }
  }, [projectId, loadTree]);

  // Only run the AI analysis once when summary is first loaded.
  React.useEffect(() => {
    if (project?.summary && !analysisTriggered) {
      setAnalysisTriggered(true);
      handleAiAnalysis(project.summary);
    }
  }, [project?.summary, analysisTriggered]);

  const chartData = React.useMemo(() => {
    if (!project?.summary?.categories) return [];
    return project.summary.categories.map((cat) => ({
      name: cat.categoryLabel,
      value: cat.totalCategoryCost,
      fill: cat.categoryColor ?? "#cccccc",
    }));
  }, [project?.summary?.categories]);

  const totalCategoryCost = React.useMemo(
    () => chartData.reduce((acc, curr) => acc + curr.value, 0),
    [chartData]
  );

  // If we don't have the project ID or a valid project, show a loader or a fallback
  if (!projectId) {
    return <Loader show={true} />;
  }
  if (!project) {
    return <Loader show={true} />;
  }

  // This is the function that runs the cost calculations and saves them to Firestore
  async function handleGenerateReport() {
    if (!dataTree) {
      return;
    }
    // 1) Compute the summary
    const summary = generateProjectSummary(dataTree, steps);

    // 2) Store it in Firestore for the project
    try {
      await updateProjectSummary(projectId, summary);
    } catch (err) {
      console.error("Error updating project summary:", err);
    }
  }

  // Helper to download the summary JSON
  function handleDownloadSummary() {
    if (!project?.summary) {
      alert("No summary available to download!");
      return;
    }
    const json = JSON.stringify(project.summary, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `project_${projectId}_summary.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <ScrollArea
      type="scroll"
      className="flex-1 p-4 pt-0 rounded-md h-full overflow-hidden"
    >
      <Separator className="mb-3" />
      <div className="flex justify-between items-center px-1">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Report</h1>
          <h2>Details for “{project.title}”</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="cursor-pointer" onClick={handleDownloadSummary}>
            <Download />
          </Button>
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={() => router.push(`/dashboard/${projectId}/data`)}
          >
            <Edit /> Edit Data
          </Button>
          <Button className="cursor-pointer" onClick={handleGenerateReport}>
            <Sparkles /> Generate Report
          </Button>
        </div>
      </div>

      <div className="py-5"></div>

      {project.summary && (
        <div className="flex flex-col gap-4">
          {/* TOP GRID */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_4fr] gap-4">
            {/* Left column (20%) => Project Cost Card */}
            <Card className="min-w-0">
              <CardHeader>
                <CardDescription>Project Cost</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums">
                  €{totalCategoryCost.toFixed(2)}
                </CardTitle>
                <CardAction>
                  <Badge variant="outline">
                    <TrendingUp />
                    +12.5%
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardContent className="flex justify-center items-center pb-0">
                <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg aspect-square p-0">
                  <ChartContainer config={chartConfig} className="w-full h-full p-0">
                    <PieChart width={100} height={100} className="p-0">
                      <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                      <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius="60%"
                        paddingAngle={1}
                        stroke="#fff"
                      />
                    </PieChart>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>

            {/* Right column => AI Report Card */}
            <Card>
              <CardHeader>
                <CardTitle>AI Report</CardTitle>
                <CardDescription>
                  Next steps or summary from an AI perspective
                </CardDescription>
              </CardHeader>
              <CardFooter className="text-sm">
                {aiLoading ? "Fetching AI Analysis..." : aiResponse || "No AI analysis available yet."}
              </CardFooter>
            </Card>
          </div>

          {/* MIDDLE GRID: Categories */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {project.summary.categories?.map((cat) => {
              const stepData = cat.steps.map((s, i) => ({
                name: s.stepName,
                value: s.stepCost,
                fill: childColor(cat.categoryColor, i, cat.steps.length) ?? cat.categoryColor ?? "#ccc",
              }));

              return (
                <Card key={cat.categoryId} className="flex flex-col">
                  <CardHeader>
                    <CardDescription>Category</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums">
                      {cat.categoryLabel}
                    </CardTitle>
                  </CardHeader>
                  <CardContent  /* Category card body */
                    className="flex flex-col sm:flex-row items-center gap-4 pb-0">
                    {/* Pie chart ― fixed square that never stretches the row */}
                    <div className="shrink-0 w-40 aspect-square">
                      <ChartContainer config={chartConfig} className="w-full h-full p-0">
                        <PieChart width={160} height={160}>
                          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                          <Pie
                            data={stepData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius="60%"
                            paddingAngle={1}
                            stroke="#fff"
                          />
                        </PieChart>
                      </ChartContainer>
                    </div>

                    {/* Cost breakdown */}
                    <div className="flex flex-col justify-center gap-1 text-sm text-center sm:text-left">
                      <div className="font-medium">
                        Total Cost: €{cat.totalCategoryCost.toFixed(2)}
                      </div>
                      <ul className="list-disc list-inside">
                        {cat.steps.map((s) => (
                          <li key={s.stepId}>
                            {s.stepName}: €{s.stepCost.toFixed(2)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* TREEMAP CARD */}
          <Card>
            <CardHeader>
              <CardTitle>Kostenstruktur</CardTitle>
              <CardDescription className="text-sm">Treemap</CardDescription>
            </CardHeader>
            <CardContent className="-my-4">
              <CostTreemap categories={project.summary.categories} />
            </CardContent>
          </Card>

          {/* RAW JSON CARD */}
          <Card>
            <CardHeader>
              <CardTitle>Raw Summary JSON</CardTitle>
              <CardDescription className="text-sm">
                Helpful for development or debugging
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <pre className="p-2 bg-muted rounded-md w-full text-sm overflow-auto">
                {JSON.stringify(project.summary, null, 2)}
              </pre>
            </CardFooter>
          </Card>
        </div>
      )}

      {!project.summary && (
        <div className="text-sm text-muted-foreground mt-4">
          No summary generated yet. Click &quot;Generate Report&quot; to create one.
        </div>
      )}
    </ScrollArea>
  );
}
