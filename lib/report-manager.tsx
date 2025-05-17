import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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

/** Stored piece of text returned by the AI */
interface StoredText {
  text: string;
}

/** CategoryId -> StoredText */
type CategoryReportMap = Record<string, StoredText>;

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

const inFlight = new Map<string, Promise<string | boolean>>();
const refreshSeq: Record<string, number> = {};

export function forceRefreshReports(projectId: string) {
  refreshSeq[projectId] = (refreshSeq[projectId] ?? 0) + 1;
  [...inFlight.keys()]
    .filter((k) => k.startsWith(`${projectId}::`))
    .forEach((k) => inFlight.delete(k));
  console.debug("[ReportMgr] forceRefresh", projectId);
}

/* -------------------------------------------------------------------------- */
/*  useReport hook                                                            */
/* -------------------------------------------------------------------------- */

export function useReport(
  project: Project | undefined,
  opts: Options,
): HookState {
  const { updateProjectReport } = useProjects();

  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [highlight, setHighlight] = useState<boolean | undefined>(undefined);

  const isHighlight = opts.kind === "highlight";
  const keyBase = opts.kind === "overview"
    ? "overview"
    : isHighlight
    ? `highlight::${opts.categoryId}`
    : `cat::${opts.categoryId}`;

  const cacheKey = `${project?.id ?? "noproj"}::${keyBase}`;

  /* ----- figure out whether the refresh counter ticked ------------------- */
  const seqTick = project ? refreshSeq[project.id] ?? 0 : 0;
  const lastSeq = useRef(seqTick);

  /* ----- get cached result if available ---------------------------------- */
  const cached: StoredText | null = useMemo(() => {
    if (!project?.report || isHighlight) return null;

    if (opts.kind === "overview") {
      return (
        (project.report as unknown as { projectOverview?: StoredText }).projectOverview ??
        null
      );
    }

    const categoryMap = (project.report.categories as unknown as CategoryReportMap) ?? {};
    return categoryMap[opts.categoryId ?? ""] ?? null;
  }, [project, opts.kind, opts.categoryId, isHighlight]);

  useEffect(() => {
    if (!project?.summary) return;

    const seqAdvanced = seqTick !== lastSeq.current;
    lastSeq.current = seqTick;

    const needFetch = opts.force || seqAdvanced || (!isHighlight && !cached?.text);

    // Fast‑path: we already have cached text and no refresh requested
    if (!needFetch) {
      if (text === null && cached?.text) setText(cached.text);
      return;
    }

    // Make sure UI resets while we (re)fetch
    setText(null);
    setHighlight(undefined);

    /* -------------------- reuse inflight promise if any ------------------ */
    if (inFlight.has(cacheKey)) {
      setLoading(true);
      inFlight
        .get(cacheKey)!
        .then((res) => {
          if (typeof res === "boolean") setHighlight(res);
          else setText(res);
        })
        .catch(setError)
        .finally(() => setLoading(false));
      return;
    }

    /* -------------------- actually call the AI manager ------------------- */

    const summaryData: SummaryData = isHighlight || opts.kind === "overview"
      ? project.summary.projectCosts
      : {
          totalProjectCost: project.summary.projectCosts.totalProjectCost,
          categories: project.summary.projectCosts.categories.filter(
            (c) => c.categoryId === opts.categoryId,
          ),
        };

    const aiPromise = getAIAnalysis({
      summaryData,
      responseType: isHighlight ? "highlight" : opts.responseType ?? "text",
      mode: isHighlight ? "category" : (opts.kind as Exclude<ReportKind, "highlight">),
      wordRange: opts.wordRange,
      customPrompt: opts.customPrompt,
      language: opts.language ?? "de",
    }).then((res) => {
      if (typeof res === "boolean") {
        setHighlight(res);
        return res;
      }
      setText(res);
      return res;
    });

    inFlight.set(cacheKey, aiPromise);
    setLoading(true);

    aiPromise
      .then((result) => {
        if (typeof result === "string") {
          // Persist in provider cache
          const fieldPath =
            opts.kind === "overview"
              ? "projectOverview"
              : `categories.${opts.categoryId}`;
          updateProjectReport(project.id, fieldPath, { text: result });
        }
      })
      .catch(setError)
      .finally(() => {
        inFlight.delete(cacheKey);
        setLoading(false);
      });
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [
    project,
    opts,
    cacheKey,
    cached,
    seqTick,
    updateProjectReport,
    isHighlight,
    text,
  ]);

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
  if (error)
    return (
      <span className="text-red-500 text-xs">
        AI error: {(error as Error).message ?? "unknown"}
      </span>
    );

  if (opts.kind === "highlight") {
    return highlight ? (
      <Badge variant="outline" title="Neue AI‑Highlights">
        <BellRing size={64} color="var(--destructive-highlight)" />
      </Badge>
    ) : null;
  }

  if (!text) return null;

  const trimmed = text.trim();

  return (
    <div className={className}>
      {trimmed.startsWith("*") ? (
        <ul className="list-disc pl-5 space-y-1">
          {trimmed
            .split(/\*\s+/)
            .filter(Boolean)
            .map((item, idx) => (
              <li key={idx}>{item.trim()}</li>
            ))}
        </ul>
      ) : (
        <p>{trimmed}</p>
      )}
    </div>
  );
}
