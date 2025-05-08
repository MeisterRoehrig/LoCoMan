import React from "react";
import { getAIAnalysis } from "@/lib/ai-manager";
import type { SummaryData, ResponseType } from "@/lib/ai-manager";
import type { Project } from "@/providers/projects-provider";
import { useProjects } from "@/providers/projects-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { BellRing } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */
export type ReportKind = "overview" | "category" | "highlight";

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
  highlight?: boolean;
}

/* -------------------------------------------------------------------------- */
/*  In‑memory caches + refresh control                                        */
/* -------------------------------------------------------------------------- */
const inFlight: Record<string, Promise<string | boolean> | undefined> = {};
const refreshSeq: Record<string, number> = {};

export function forceRefreshReports(projectId: string) {
  refreshSeq[projectId] = (refreshSeq[projectId] ?? 0) + 1;
  Object.keys(inFlight).forEach(k => k.startsWith(`${projectId}::`) && delete inFlight[k]);
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
  const [highlight, setHighlight] = React.useState<boolean | undefined>(undefined);

  const isHighlight = opts.kind === "highlight";
  const keyBase = isHighlight
    ? `highlight::${opts.categoryId}`
    : opts.kind === "overview"
      ? "overview"
      : `cat::${opts.categoryId}`;

  const key = `${project?.id ?? "noproj"}::${keyBase}`;
  const seqTick = project ? refreshSeq[project.id] ?? 0 : 0;
  const lastSeq = React.useRef(seqTick);

  const cached = React.useMemo(() => {
    if (!project?.report || isHighlight) return null;
    return opts.kind === "overview"
      ? (project.report as { projectOverview?: string }).projectOverview ?? null
      : (project.report.categories as any)?.[opts.categoryId!] ?? null;
  }, [project, opts, isHighlight]);

  React.useEffect(() => {
    if (!project?.summary) return;

    const seqAdvanced = seqTick !== lastSeq.current;
    lastSeq.current = seqTick;

    const needFetch = opts.force || seqAdvanced || (!isHighlight && !cached);
    if (!needFetch) {
      if (text === null && cached?.text) setText(cached.text);
      return;
    }

    setText(null);
    setHighlight(undefined);

    if (inFlight[key]) {
      setLoading(true);
      inFlight[key]!
        .then(res => {
          if (typeof res === "boolean") {
            setHighlight(res);
          } else {
            setText(res);
          }
        })
        .catch(setError)
        .finally(() => setLoading(false));
      return;
    }

    const summaryData: SummaryData = isHighlight || opts.kind === "overview"
      ? project.summary
      : {
          totalProjectCost: project.summary.totalProjectCost,
          categories: project.summary.categories.filter(c => c.categoryId === opts.categoryId),
        };

    const promise = inFlight[key] = getAIAnalysis({
      summaryData,
      responseType: isHighlight ? "highlight" : (opts.responseType ?? "text"),
      mode: isHighlight ? "category" : (opts.kind as Exclude<ReportKind, "highlight">),
      wordRange: opts.wordRange,
      customPrompt: opts.customPrompt,
      language: opts.language ?? "de",
    }).then(res => {
      if (typeof res === "boolean") {
        setHighlight(res);
        return res;
      } else {
        setText(res);
        return res;
      }
    });
    
    setLoading(true);
    promise
      .then(result => {
        if (typeof result === "string") {
          const fieldPath = opts.kind === "overview"
            ? "projectOverview"
            : `categories.${opts.categoryId}`;
          updateProjectReport(project.id, fieldPath, { text: result });
        }
      })
      .catch(setError)
      .finally(() => {
        delete inFlight[key];
        setLoading(false);
      });
  }, [project, opts, key, cached, seqTick, updateProjectReport]);

  return { text, loading, error, highlight };
}

/* -------------------------------------------------------------------------- */
/*  <Report> component                                                        */
/* -------------------------------------------------------------------------- */
interface ReportProps extends Options {
  project: Project | undefined;
  className?: string;
}

export function Report({ project, className, ...opts }: ReportProps) {
  const { text, loading, error, highlight } = useReport(project, opts);

  if (loading) return <Skeleton className="h-4 w-32" />;
  if (error) return <span className="text-red-500 text-xs">AI error</span>;

  if (opts.kind === "highlight") {
    return highlight ? (
      <Badge variant="outline">
        <BellRing size={64} color="var(--destructive-highlight)" />
      </Badge>
    ) : null;
  }

  if (!text) return null;

  return (
    <div className={className}>
      {text.trim().startsWith("*") ? (
        <ul className="list-disc pl-5 space-y-1">
          {text
            .split(/\*\s+/)
            .filter(Boolean)
            .map((item, idx) => (
              <li key={idx}>{item.trim()}</li>
            ))}
        </ul>
      ) : (
        <p>{text}</p>
      )}
    </div>
  );
}
