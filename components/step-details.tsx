"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  FormEvent,
} from "react";
import { AutoComplete, type Option } from "@/lib/autocomplete";
import { useEmployees } from "@/providers/employees-provider";
import { useResources } from "@/providers/resources-provider";
import { useFixedTree } from "@/providers/fixed-tree-provider";
import { StepDoc } from "@/providers/steps-provider";

/**
 * StepDetails – enhanced
 * ------------------------------------------------------------------
 * Both “Responsible Person” and “Additional Resources” are now
 * AutoCompletes that list ONLY the items already attached to the
 * current project. Each control stores the referenced document’s **ID**
 * in the step while showing a human‑readable label. Selecting an item
 * auto‑fills the corresponding monetary field (salary / resource cost).
 * ------------------------------------------------------------------
 */
interface StepDetailsProps {
  step: StepDoc;
  onSave: (updates: Partial<StepDoc>) => void;
}

export default function StepDetails({ step, onSave }: StepDetailsProps) {
  /* ------------------------------------------------------------------
   * Domain data
   * ----------------------------------------------------------------*/
  const { employees, loadingEmployees } = useEmployees();
  const { resources, loadingResources } = useResources();
  const { fixedCosts } = useFixedTree();

  /** Employees & resources attached to THIS project */
  const projectEmployees = useMemo(() => {
    if (!fixedCosts) return [] as typeof employees;
    const set = new Set(fixedCosts.employees);
    return employees.filter((e) => set.has(e.id));
  }, [employees, fixedCosts]);

  const projectResources = useMemo(() => {
    if (!fixedCosts) return [] as typeof resources;
    const set = new Set(fixedCosts.resources);
    return resources.filter((r) => set.has(r.id));
  }, [resources, fixedCosts]);

  /** AutoComplete options */
  const employeeOptions: Option[] = useMemo(
    () => projectEmployees.map((e) => ({ value: e.id, label: e.jobtitel })),
    [projectEmployees],
  );

  const resourceOptions: Option[] = useMemo(
    () => projectResources.map((r) => ({ value: r.id, label: r.costObjectName })),
    [projectResources],
  );

  /* ------------------------------------------------------------------
   * Local state (initialised from props)
   * ----------------------------------------------------------------*/
  // ---------- Person (employee) ----------
  const [person, setPerson] = useState<string>(step.person ?? "");
  const [selectedEmployee, setSelectedEmployee] = useState<Option | undefined>(
    () => employeeOptions.find((o) => o.value === step.person),
  );
  const [personMonthlySalary, setPersonMonthlySalary] = useState<number>(
    step.personMonthlySalary ?? 0,
  );

  // ---------- Cost driver ----------
  const [costDriver, setCostDriver] = useState(step.costDriver ?? "");
  const [costDriverValue, setCostDriverValue] = useState<number>(
    step.costDriverValue ?? 0,
  );

  // ---------- Duration ----------
  const [stepDuration, setStepDuration] = useState<number>(
    step.stepDuration ?? 0,
  );

  // ---------- Additional resources ----------
  const [additionalResources, setAdditionalResources] = useState<string>(
    step.additionalResources ?? "",
  );
  const [selectedResource, setSelectedResource] = useState<Option | undefined>(
    () => resourceOptions.find((o) => o.value === step.additionalResources),
  );
  const [additionalResourcesValue, setAdditionalResourcesValue] = useState<number>(
    step.additionalResourcesValue ?? 0,
  );

  /* ------------------------------------------------------------------
   * Sync when the incoming step or option lists change
   * ----------------------------------------------------------------*/
  useEffect(() => {
    // person
    setPerson(step.person ?? "");
    setSelectedEmployee(employeeOptions.find((o) => o.value === step.person));
    setPersonMonthlySalary(step.personMonthlySalary ?? 0);

    // cost driver etc.
    setCostDriver(step.costDriver ?? "");
    setCostDriverValue(step.costDriverValue ?? 0);
    setStepDuration(step.stepDuration ?? 0);

    // resources
    setAdditionalResources(step.additionalResources ?? "");
    setSelectedResource(resourceOptions.find((o) => o.value === step.additionalResources));
    setAdditionalResourcesValue(step.additionalResourcesValue ?? 0);
  }, [step]);              // ⬅️ no longer dependent on employeeOptions/resourceOptions

  /* ------------------------------------------------------------------
   * Auto-populate monetary fields
   * ----------------------------------------------------------------*/
  useEffect(() => {
    if (!selectedEmployee) return;
    const emp = projectEmployees.find((e) => e.id === selectedEmployee.value);
    if (emp) setPersonMonthlySalary(emp.monthlySalaryEuro);
  }, [selectedEmployee, projectEmployees]);

  useEffect(() => {
    if (!selectedResource) return;
    const res = projectResources.find((r) => r.id === selectedResource.value);
    if (res) setAdditionalResourcesValue(res.costPerMonthEuro);
  }, [selectedResource, projectResources]);

  /* ------------------------------------------------------------------
   * Dirty-check helper
   * ----------------------------------------------------------------*/
  const isDirty = useMemo(() => {
    return (
      (person ?? "") !== (step.person ?? "") ||
      (personMonthlySalary ?? 0) !== (step.personMonthlySalary ?? 0) ||
      (costDriver ?? "") !== (step.costDriver ?? "") ||
      (costDriverValue ?? 0) !== (step.costDriverValue ?? 0) ||
      (stepDuration ?? 0) !== (step.stepDuration ?? 0) ||
      (additionalResources ?? "") !== (step.additionalResources ?? "") ||
      (additionalResourcesValue ?? 0) !== (step.additionalResourcesValue ?? 0)
    );
  }, [
    person,
    personMonthlySalary,
    costDriver,
    costDriverValue,
    stepDuration,
    additionalResources,
    additionalResourcesValue,
    step,
  ]);

  /* ------------------------------------------------------------------
   * Save handler
   * ----------------------------------------------------------------*/
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isDirty) return;

    onSave({
      person,
      personMonthlySalary,
      costDriver,
      costDriverValue,
      stepDuration,
      additionalResources,
      additionalResourcesValue,
    });
  }

  /* ------------------------------------------------------------------
   * Render
   * ----------------------------------------------------------------*/
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Step name (read‑only) */}
      <div>
        <span className="block text-sm font-medium text-muted-foreground pb-2">
          Step Name
        </span>
        <div className="p-2 border rounded bg-muted text-muted-foreground">
          {step.name}
        </div>
      </div>

      {/* Responsible person */}
      <div>
        <label className="block text-sm font-medium pb-2" htmlFor="person-ac">
          Responsible Person
        </label>
        <AutoComplete
          key={`emp-${step.id}`}
          options={employeeOptions}
          placeholder={loadingEmployees ? "Loading employees…" : "Search…"}
          emptyMessage="No matching employee"
          value={selectedEmployee}
          onValueChange={(opt) => {
            setSelectedEmployee(opt);
            setPerson(opt?.value ?? "");
          }}
        />
      </div>

      {/* Monthly salary */}
      <div>
        <label className="block text-sm font-medium pb-2" htmlFor="salary">
          Monthly Salary (€)
        </label>
        <div className="p-2 border rounded bg-muted text-muted-foreground">
          {personMonthlySalary}
        </div>
        {/* <input
          id="salary"
          type="number"
          className="border p-2 rounded w-full"
          value={personMonthlySalary}
          onChange={(e) => setPersonMonthlySalary(Number(e.target.value))}
        /> */}
      </div>

      {/* Cost driver & value */}
      <div>
        <label className="block text-sm font-medium pb-2" htmlFor="driver">
          Cost Driver
        </label>
        <input
          id="driver"
          type="text"
          className="border p-2 rounded w-full"
          value={costDriver}
          onChange={(e) => setCostDriver(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium pb-2" htmlFor="driverValue">
          Cost Driver Value
        </label>
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
        <label className="block text-sm font-medium pb-2" htmlFor="duration">
          Step Duration (min)
        </label>
        <input
          id="duration"
          type="number"
          className="border p-2 rounded w-full"
          value={stepDuration}
          onChange={(e) => setStepDuration(Number(e.target.value))}
        />
      </div>

      {/* Additional resources */}
      <div>
        <label className="block text-sm font-medium pb-2" htmlFor="resources-ac">
          Additional Resources
        </label>
        <AutoComplete
          key={`res-${step.id}`}
          options={resourceOptions}
          placeholder={loadingResources ? "Loading resources…" : "Search…"}
          emptyMessage="No matching resource"
          value={selectedResource}
          onValueChange={(opt) => {
            setSelectedResource(opt);
            setAdditionalResources(opt?.value ?? "");
          }}
        />
      </div>

      {/* Resource monthly cost */}
      <div>
        <label
          className="block text-sm font-medium pb-2"
          htmlFor="resourcesValue"
        >
          Resources Value (€)
        </label>
        <div className="p-2 border rounded bg-muted text-muted-foreground">
          {additionalResourcesValue}
        </div>

        {/* <input
          id="resourcesValue"
          type="number"
          className="border p-2 rounded w-full"
          value={additionalResourcesValue}
          onChange={(e) => setAdditionalResourcesValue(Number(e.target.value))}
        /> */}
      </div>

      {/* Save button */}
      <button
        type="submit"
        className={`px-4 py-2 border rounded ${isDirty
          ? "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
          : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
        disabled={!isDirty}
      >
        Save Changes
      </button>
    </form>
  );
}
