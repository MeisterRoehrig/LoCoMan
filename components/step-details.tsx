"use client";

import React, { useState, useEffect, FormEvent, useMemo } from "react";
import { StepDoc } from "@/providers/steps-provider";

interface StepDetailsProps {
  step: StepDoc;
  onSave: (updates: Partial<StepDoc>) => void;
}

export default function StepDetails({ step, onSave }: StepDetailsProps) {
  const [person, setPerson] = useState(step.person || "");
  const [personMonthlySalary, setPersonMonthlySalary] = useState(step.personMonthlySalary || 0);
  const [costDriver, setCostDriver] = useState(step.costDriver || "");
  const [costDriverValue, setCostDriverValue] = useState(step.costDriverValue || 0);
  const [stepDuration, setStepDuration] = useState(step.stepDuration || 0);
  const [additionalResources, setAdditionalResources] = useState(step.additionalResources || "");
  const [additionalResourcesValue, setAdditionalResourcesValue] = useState(step.additionalResourcesValue || 0);

  // Sync when step changes
  useEffect(() => {
    setPerson(step.person || "");
    setPersonMonthlySalary(step.personMonthlySalary || 0);
    setCostDriver(step.costDriver || "");
    setCostDriverValue(step.costDriverValue || 0);
    setStepDuration(step.stepDuration || 0);
    setAdditionalResources(step.additionalResources || "");
    setAdditionalResourcesValue(step.additionalResourcesValue || 0);
  }, [step]);

  // Dirty check – is anything different from the original?
  const isDirty = useMemo(() => {
    return (
      (person || "") !== (step.person || "") ||
      (personMonthlySalary || 0) !== (step.personMonthlySalary || 0) ||
      (costDriver || "") !== (step.costDriver || "") ||
      (costDriverValue || 0) !== (step.costDriverValue || 0) ||
      (stepDuration || 0) !== (step.stepDuration || 0) ||
      (additionalResources || "") !== (step.additionalResources || "") ||
      (additionalResourcesValue || 0) !== (step.additionalResourcesValue || 0)
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <span className="block text-sm font-medium text-muted-foreground pb-2">Step Name</span>
        <div className="p-2 border rounded bg-muted text-muted-foreground">{step.name}</div>
      </div>

      <div>
        <label className="block text-sm font-medium" htmlFor="person">Responsible Person</label>
        <input
          id="person"
          type="text"
          className="border p-2 rounded w-full"
          value={person}
          onChange={(e) => setPerson(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium pb-2" htmlFor="salary">Monthly Salary (€)</label>
        <input
          id="salary"
          type="number"
          className="border p-2 rounded w-full"
          value={personMonthlySalary}
          onChange={(e) => setPersonMonthlySalary(Number(e.target.value))}
        />
      </div>

      <div>
        <label className="block text-sm font-medium pb-2" htmlFor="driver">Cost Driver</label>
        <input
          id="driver"
          type="text"
          className="border p-2 rounded w-full"
          value={costDriver}
          onChange={(e) => setCostDriver(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium pb-2" htmlFor="driverValue">Cost Driver Value</label>
        <input
          id="driverValue"
          type="number"
          className="border p-2 rounded w-full"
          value={costDriverValue}
          onChange={(e) => setCostDriverValue(Number(e.target.value))}
        />
      </div>

      <div>
        <label className="block text-sm font-medium pb-2" htmlFor="duration">Step Duration (hours)</label>
        <input
          id="duration"
          type="number"
          className="border p-2 rounded w-full"
          value={stepDuration}
          onChange={(e) => setStepDuration(Number(e.target.value))}
        />
      </div>

      <div>
        <label className="block text-sm font-medium pb-2" htmlFor="resources">Additional Resources</label>
        <input
          id="resources"
          type="text"
          className="border p-2 rounded w-full"
          value={additionalResources}
          onChange={(e) => setAdditionalResources(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium pb-2" htmlFor="resourcesValue">Resources Value (€)</label>
        <input
          id="resourcesValue"
          type="number"
          className="border p-2 rounded w-full"
          value={additionalResourcesValue}
          onChange={(e) => setAdditionalResourcesValue(Number(e.target.value))}
        />
      </div>

      <button
        type="submit"
        className={`px-4 py-2 border rounded ${
          isDirty
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
