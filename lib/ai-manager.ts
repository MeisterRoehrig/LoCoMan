// lib/ai-manager.ts
// -----------------------------------------------------------------------------
// Central helper for building prompts and fetching AI answers
// -----------------------------------------------------------------------------

import React from "react";
import { model } from "@/lib/firebase-config";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface SummaryData {
  totalProjectCost?: number;
  categories?: {
    categoryId: string;
    categoryLabel: string;
    totalCategoryCost: number;
    categoryColor: string;
    steps: { stepId: string; stepName: string; stepCost: number }[];
  }[];
}

export type ResponseType = "text" | "bullet" | "highlight";      // highlight ⇒ boolean
export type AnalysisMode  = "overview" | "recommendation" | "category" | "custom";

export interface AIRequestOptions {
  summaryData: SummaryData;
  responseType?: ResponseType;                // default "text"
  wordRange?: [number, number];               // default [200,300]
  mode?: AnalysisMode;                        // default "overview"
  customPrompt?: string;
  language?: "de" | "en";                     // default "de"
}

/* -------------------------------------------------------------------------- */
/*  Prompt builder                                                            */
/* -------------------------------------------------------------------------- */

const DEFAULT_OPTS: Required<Pick<
  AIRequestOptions, "responseType" | "wordRange" | "mode" | "language"
>> = {
  responseType: "text",
  wordRange   : [200, 300],
  mode        : "overview",
  language    : "de",
};

export function buildPrompt(opts: AIRequestOptions): string {
  const {
    summaryData,
    responseType = DEFAULT_OPTS.responseType,
    wordRange    = DEFAULT_OPTS.wordRange,
    mode         = DEFAULT_OPTS.mode,
    customPrompt,
    language     = DEFAULT_OPTS.language,
  } = opts;

  const L = (de: string, en: string) => (language === "de" ? de : en);

  /* –– Instruction pieces –– */
  const intro = L(
    "Sie sind ein KI‑Assistent, der in eine Logistikmanagement‑Anwendung integriert ist.",
    "You are an AI assistant embedded in a logistics‑management application."
  );

  const modeLine: Record<AnalysisMode, string> = {
    overview      : L("Erstellen Sie eine verständliche, professionelle Übersicht der Projektkosten.",
                      "Provide a concise, professional overview of the project costs."),
    recommendation: L("Geben Sie konkrete Empfehlungen für Kostensenkungen und nächste Schritte.",
                      "Provide actionable recommendations for cost reduction and next steps."),
    category      : L("Analysieren Sie detailliert die Kostentreiber NUR innerhalb der bereitgestellten Kategorie.",
                      "Analyse in detail the cost drivers ONLY within the provided category."),
    custom        : "",
  };

  const formatInstr = responseType === "highlight"
    ? ""
    : L(
        `Ausgabeformat: ${responseType === "bullet" ? "Bullet Points" : "Fließtext"}.`,
        `Output format: ${responseType === "bullet" ? "bullet points" : "continuous text"}.`
      );

  const lengthInstr = responseType === "highlight"
    ? ""
    : L(`Länge: ${wordRange[0]}‑${wordRange[1]} Wörter.`,
        `Length: ${wordRange[0]}‑${wordRange[1]} words.`);

  const numberFmt   = L(
    "Verwenden Sie immer deutsches Zahlenformat (Punkt als Tausendertrennzeichen, Komma für Dezimalstellen) mit vorangestelltem €‑Symbol, z. B. €12.000,01.",
    "Always use German number formatting ('.' thousands separator, ',' decimal) with € prefix, e.g. €12.000,01."
  );

  const highlightInstr = responseType === "highlight"
    ? L(
        "Gibt es extreme Kostenausreißer? Antworten Sie NUR mit TRUE oder FALSE.",
        "Are there extreme cost outliers? Respond ONLY with TRUE or FALSE."
      )
    : "";

  const closing = responseType === "highlight"
    ? ""
    : L("Antworten Sie ausschließlich mit dem Bericht, ohne zusätzliche Formatierung.",
        "Respond only with the report, no extra formatting.");

  /* –– Assemble prompt –– */
  return [
    intro,
    mode === "custom" ? "" : modeLine[mode],
    formatInstr,
    lengthInstr,
    numberFmt,
    highlightInstr,
    customPrompt ?? "",
    L("Hier ist die Projektzusammenfassung (JSON):",
      "Here is the project summary (JSON):"),
    JSON.stringify(summaryData, null, 2),
    closing,
  ].filter(Boolean).join("\n\n");
}

/* -------------------------------------------------------------------------- */
/*  Low‑level fetch                                                           */
/* -------------------------------------------------------------------------- */

export async function getAIAnalysis(
  opts: AIRequestOptions
): Promise<string | boolean> {
  const prompt = buildPrompt(opts);
  const res    = await model.generateContent(prompt);
  const text   = res.response.text().trim();

  if (opts.responseType === "highlight") return /^true$/i.test(text);
  return text;
}

/* -------------------------------------------------------------------------- */
/*  React hook convenience                                                    */
/* -------------------------------------------------------------------------- */

export function useAIAnalysis(initialOpts: AIRequestOptions) {
  const [loading, setLoading] = React.useState(false);
  const [result,  setResult ] = React.useState<string | boolean | null>(null);
  const [error,   setError  ] = React.useState<unknown>(null);

  const run = React.useCallback(
    async (override?: Partial<AIRequestOptions>) => {
      setLoading(true);
      setError(null);
      try {
        const answer = await getAIAnalysis({ ...initialOpts, ...override });
        setResult(answer);
      } catch (err) {
        console.error("AI analysis error:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    [initialOpts]
  );

  return { loading, result, error, run } as const;
}
