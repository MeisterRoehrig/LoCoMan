"use client";

import React, { FormEvent, useEffect, useMemo, useState } from "react";
import { InputTags, type TagOption } from "@/components/ui/tag-input";
import { StepDoc } from "@/providers/steps-provider";
import { useEmployees } from "@/providers/employees-provider";
import { useResources } from "@/providers/resources-provider";
import { useFixedTree } from "@/providers/fixed-tree-provider";

/* -------------------------------------------------------
 * Types & helpers
 * -----------------------------------------------------*/
interface StepDetailsProps {
  step: StepDoc;
  onSave: (updates: Partial<StepDoc>) => void;
}

/** Normalise whatever comes from Firestore → always string[] */
function toIdArray(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === "string" && val.trim() !== "") return [val.trim()];
  return [];
}

/* -------------------------------------------------------
 * Component
 * -----------------------------------------------------*/
export default function StepDetails({ step, onSave }: StepDetailsProps) {
  /* Domain – already loaded upstream */
  const { fixedCosts } = useFixedTree();
  const { employees, loadEmployees, loadingEmployees } = useEmployees();
  const { resources, loadResources, loadingResources } = useResources();

  /* One‑shot lazy load (in case parent hasn't) */
  useEffect(() => {
    if (employees.length === 0) void loadEmployees();
    if (resources.length === 0) void loadResources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -----------------------------------------------------
   * Project‑scoped lists -> options for <InputTags>
   * ---------------------------------------------------*/
  const projectEmployees = useMemo(() => {
    if (!fixedCosts) return [] as typeof employees;
    const ids = new Set(fixedCosts.employees);
    return employees.filter((e) => ids.has(e.id));
  }, [employees, fixedCosts]);

  const employeeOptions = useMemo<TagOption[]>(
    () =>
      projectEmployees.map((emp) => ({
        id: emp.id,
        label: emp.jobtitel,
        employee: emp,
      })),
    [projectEmployees],
  );

  const projectResources = useMemo(() => {
    if (!fixedCosts) return [] as typeof resources;
    const ids = new Set(fixedCosts.resources);
    return resources.filter((r) => ids.has(r.id));
  }, [resources, fixedCosts]);

  const resourceOptions = useMemo<TagOption[]>(
    () =>
      projectResources.map((res) => ({
        id: res.id,
        label: res.costObjectName,
        resource: res,
      })),
    [projectResources],
  );

  /* -----------------------------------------------------
   * Local state – syncs whenever the `step` prop changes
   * ---------------------------------------------------*/
  const [person, setPerson] = useState<string[]>(toIdArray(step.person));
  const [additionalResources, setAdditionalResources] = useState<string[]>(
    toIdArray(step.additionalResources),
  );
  const [costDriver, setCostDriver] = useState(step.costDriver ?? "");
  const [costDriverValue, setCostDriverValue] = useState(
    step.costDriverValue ?? 0,
  );
  const [stepDuration, setStepDuration] = useState(step.stepDuration ?? 0);

  /**
   * Reset the editing state when a DIFFERENT step doc arrives.
   * Using step.id is safe because it is immutable within Firestore.
   */
  useEffect(() => {
    setPerson(toIdArray(step.person));
    setAdditionalResources(toIdArray(step.additionalResources));
    setCostDriver(step.costDriver ?? "");
    setCostDriverValue(step.costDriverValue ?? 0);
    setStepDuration(step.stepDuration ?? 0);
  }, [step.id]);

  /* -----------------------------------------------------
   * Dirty check – JSON stringify for simple deep compare
   * ---------------------------------------------------*/
  const isDirty = useMemo(() => {
    const eqArr = (a: string[], b?: unknown) =>
      JSON.stringify(a) === JSON.stringify(toIdArray(b));

    return (
      !eqArr(person, step.person) ||
      costDriver !== (step.costDriver ?? "") ||
      costDriverValue !== (step.costDriverValue ?? 0) ||
      stepDuration !== (step.stepDuration ?? 0) ||
      !eqArr(additionalResources, step.additionalResources)
    );
  }, [person, additionalResources, costDriver, costDriverValue, stepDuration, step]);

  /* -----------------------------------------------------
   * Save handler
   * ---------------------------------------------------*/
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!isDirty) return;

    onSave({
      person,
      costDriver,
      costDriverValue,
      stepDuration,
      additionalResources,
    });
  };

  /* -----------------------------------------------------
   * Render
   * ---------------------------------------------------*/
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      

      {/* Cost driver */}
      <div>
        <h3 className="text-lg font-semibold tracking-tight pb-2">Kostentreiber</h3>
        <input
          id="driver"
          type="text"
          className="border p-2 rounded w-full"
          value={costDriver}
          onChange={(e) => setCostDriver(e.target.value)}
        />
      </div>

      {/* Cost driver value */}
      <div>
        <h3 className="text-lg font-semibold tracking-tight pb-2">Kostentreiber Multiplikator</h3>
        <input
          id="driverValue"
          type="number"
          className="border p-2 rounded w-full"
          value={costDriverValue}
          onChange={(e) => setCostDriverValue(Number(e.target.value))}
        />
      </div>

      {/* Step duration */}
      <div>
        <h3 className="text-lg font-semibold tracking-tight pb-2">Schritt Dauer (min)</h3>
        <input
          id="duration"
          type="number"
          className="border p-2 rounded w-full"
          value={stepDuration}
          onChange={(e) => setStepDuration(Number(e.target.value))}
        />
      </div>

      {/* Responsible person */}
      <div>
        <h3 className="text-lg font-semibold tracking-tight">Zuständige Person</h3>

        <InputTags
          key={`person-${step.id}`}
          value={person}
          onChange={setPerson}
          options={employeeOptions}
          allowCustom={false}
          placeholder="Mitarbeiter auswählen…"
          isLoading={loadingEmployees}
        />
      </div>

      {/* Additional resources */}
      <div>
        <h3 className="text-lg font-semibold tracking-tight">Zusätzliche Hilfsmittel</h3>
        <InputTags
          key={`resources-${step.id}`}
          value={additionalResources}
          onChange={setAdditionalResources}
          options={resourceOptions}
          allowCustom={false}
          placeholder="Hilfsmittel auswählen…"
          isLoading={loadingResources}
        />
      </div>

      {/* Save button */}
      <button
        type="submit"
        disabled={!isDirty}
        className={`px-4 py-2 border rounded ${isDirty
          ? "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
          : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
      >
        Änderungen speichern
      </button>
    </form>
  );
}
