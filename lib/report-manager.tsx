// lib/report-manager.tsx
// ---------------------------------------------------------------------------
// AI report fetcher – production version (no paint‑time logs, no flash)   
// ---------------------------------------------------------------------------

import React from "react";
import { getAIAnalysis } from "@/lib/ai-manager";
import type { SummaryData, ResponseType } from "@/lib/ai-manager";
import type { Project } from "@/providers/projects-provider";
import { useProjects } from "@/providers/projects-provider";
import { Skeleton } from "@/components/ui/skeleton";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */
export type ReportKind = "overview" | "category";

interface Options {
  kind: ReportKind;
  categoryId?: string;
  customPrompt?: string;
  wordRange?: [number, number];
  responseType?: ResponseType;
  language?: "de" | "en";
  force?: boolean; // bypass cache for this instance
}

interface HookState {
  text: string | null;
  loading: boolean;
  error: unknown;
}

/* -------------------------------------------------------------------------- */
/*  In‑memory caches + refresh control                                        */
/* -------------------------------------------------------------------------- */
const inFlight: Record<string, Promise<string> | undefined> = {};
const refreshSeq: Record<string, number> = {};

export function forceRefreshReports(projectId: string) {
  refreshSeq[projectId] = (refreshSeq[projectId] ?? 0) + 1;
  Object.keys(inFlight).forEach(k => k.startsWith(`${projectId}::`) && delete inFlight[k]);
  // single console for manual trigger – does not run every paint
  console.debug("[ReportMgr] forceRefresh", projectId);
}

/* -------------------------------------------------------------------------- */
/*  useReport hook                                                            */
/* -------------------------------------------------------------------------- */
export function useReport(project: Project | undefined, opts: Options): HookState {
  const { updateProjectReport } = useProjects();
  const [text, setText] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<unknown>(null);

  const keyBase = opts.kind === "overview" ? "overview" : `cat::${opts.categoryId}`;
  const key = `${project?.id ?? "noproj"}::${keyBase}`;
  const seqTick = project ? refreshSeq[project.id] ?? 0 : 0;
  const lastSeq = React.useRef(seqTick);

  const cached = React.useMemo(() => {
    if (!project?.report) return null;
    return opts.kind === "overview"
      ? (project.report as any).projectOverview ?? null
      : (project.report.categories as any)?.[opts.categoryId!] ?? null;
  }, [project, opts]);

  React.useEffect(() => {
    if (!project?.summary) return;

    const seqAdvanced = seqTick !== lastSeq.current;
    lastSeq.current = seqTick;

    const needFetch = opts.force || seqAdvanced || !cached;
    if (!needFetch) {
      if (text === null) setText(cached.text); // initial paint
      return;
    }

    // Clear old text immediately to avoid flash
    setText(null);

    // Reuse ongoing promise if another component already started it
    if (inFlight[key]) {
      setLoading(true);
      inFlight[key]!.then(setText).catch(setError).finally(() => setLoading(false));
      return;
    }

    const summaryData: SummaryData = opts.kind === "overview"
      ? project.summary
      : {
        totalProjectCost: project.summary.totalProjectCost,
        categories: project.summary.categories.filter(c => c.categoryId === opts.categoryId),
      };

    const promise = inFlight[key] = getAIAnalysis({
      summaryData,
      responseType: opts.responseType ?? "text",
      mode: opts.kind === "overview" ? "overview" : "category",
      wordRange: opts.wordRange,
      customPrompt: opts.customPrompt,
      language: opts.language ?? "de",
    }).then(res => typeof res === "string" ? res : String(res));

    setLoading(true);
    promise
    .then(txt => {
      setText(txt);
    
      const fieldPath =
        opts.kind === "overview"
          ? "projectOverview"
          : `categories.${opts.categoryId}`;
    
      updateProjectReport(project.id, fieldPath, { text: txt });
    })
      .catch(setError)
      .finally(() => {
        delete inFlight[key];
        setLoading(false);
      });
  }, [project, opts, key, cached, seqTick, updateProjectReport]);

  return { text, loading, error };
}

/* -------------------------------------------------------------------------- */
/*  <Report> component                                                        */
/* -------------------------------------------------------------------------- */
interface ReportProps extends Options {
  project: Project | undefined;
  className?: string;
}

export function Report({ project, className, ...opts }: ReportProps) {
  const { text, loading, error } = useReport(project, opts);

  if (loading) return <Skeleton className="h-4 w-32" />;
  if (error) return <span className="text-red-500 text-xs">AI error</span>;
  return text ? <div className={className}>{text}</div> : null;
}
