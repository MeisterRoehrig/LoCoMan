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


import { Label, Pie, PieChart } from "recharts"

import {
  ChartConfig,
  ChartTooltip,
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  chrome: {
    label: "Chrome",
    color: "hsl(var(--chart-1))",
  },
  safari: {
    label: "Safari",
    color: "hsl(var(--chart-2))",
  },
  firefox: {
    label: "Firefox",
    color: "hsl(var(--chart-3))",
  },
  edge: {
    label: "Edge",
    color: "hsl(var(--chart-4))",
  },
  other: {
    label: "Other",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig


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
      loadTree(projectId)
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
  
    const cssVarNames = [
      "--chart-1",
      "--chart-2",
      "--chart-3",
      "--chart-4",
      "--chart-5",
      "--chart-6",
      "--chart-7",
    ];
  
    const resolveCssVariable = (varName: string) => {
      if (typeof window === "undefined") return "#ccc"; // fallback during SSR
      return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || "#ccc";
    };
  
    return project.summary.categories.map((cat, index) => ({
      name: cat.categoryLabel,
      value: cat.totalCategoryCost,
      fill: resolveCssVariable(cssVarNames[index % cssVarNames.length]),
    }));
  }, [project?.summary?.categories]);
  
  const totalCategoryCost = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.value, 0);
  }, [chartData]);

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

          {/** 
       * TOP GRID: 2 columns with a 20:80 ratio on md+ 
       * 
       * On mobile (below md), it’ll stack into 1 column automatically,
       * because we set grid-cols-1 by default. 
       * 
       * Using `md:grid-cols-[1fr_4fr]` is effectively 20/80.
       * You can adjust the ratio by changing 1fr_4fr to something else if needed.
       */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_4fr] gap-4">
            {/* Left column (20%) => Project Cost Card */}
            <Card>
              <CardHeader>
                <CardDescription>Project Cost</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums">
                  Total
                </CardTitle>
                <CardAction>
                  <Badge variant="outline">
                    <TrendingUp />
                    +12.5%
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardContent className="flex-1 pb-0">
              <ChartContainer
                  config={chartConfig}
                  className="mx-auto aspect-square max-h-[250px]"
                >
                  <PieChart>
                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={85}
                      outerRadius={110}
                      strokeWidth={5}
                    >
                      <Label
                        content={({ viewBox }) => {
                          if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                            return (
                              <text
                                x={viewBox.cx}
                                y={viewBox.cy}
                                textAnchor="middle"
                                dominantBaseline="middle"
                              >
                                <tspan
                                  x={viewBox.cx}
                                  y={viewBox.cy}
                                  className="fill-foreground text-2xl font-bold"
                                >
                                  ${totalCategoryCost.toFixed(2)}
                                </tspan>
                                <tspan
                                  x={viewBox.cx}
                                  y={(viewBox.cy ?? 0) + 20}
                                  className="fill-muted-foreground text-xs"
                                >
                                  Total Cost
                                </tspan>
                              </text>
                            );
                          }
                        }}
                      />
                    </Pie>
                  </PieChart>
                </ChartContainer>
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
                {/* 6) Display the AI response or loading text here */}
                {aiLoading
                  ? "Fetching AI Analysis..."
                  : aiResponse || "No AI analysis available yet."}
              </CardFooter>
            </Card>
          </div>

          {/** 
       * MIDDLE GRID: Categories laid out responsively.
       * 
       * - `grid-cols-1` => always at least 1 column.
       * - `sm:grid-cols-2` => from small screens upwards, 2 columns if space allows.
       * - `md:grid-cols-3` => from medium screens upwards, 3 columns if space allows.
       * 
       * Adjust breakpoints and # of columns as desired.
       */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {project.summary.categories?.map(
              (cat) => (
                <Card key={cat.categoryId}>
                  <CardHeader>
                    <CardDescription>Category</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums">
                      {cat.categoryLabel}
                    </CardTitle>
                  </CardHeader>
                  <CardFooter className="flex flex-col gap-1 text-sm">
                    <div>Total Cost: ${cat.totalCategoryCost.toFixed(2)}</div>
                    <ul className="pl-5 list-disc">
                      {cat.steps.map(
                        (s) => (
                          <li key={s.stepId}>
                            {s.stepName}: ${s.stepCost.toFixed(2)}
                          </li>
                        )
                      )}
                    </ul>
                  </CardFooter>
                </Card>
              )
            )}
          </div>

          {/**
       * BOTTOM: JSON Card 
       * Full width by default, placed after the grids above.
       */}
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



