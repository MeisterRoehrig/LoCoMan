/* eslint-disable @typescript-eslint/consistent-type-definitions */

import type { TreeCategory } from "@/providers/tree-provider";
import type { StepDoc } from "@/providers/steps-provider";
import type { EmployeeDoc } from "@/providers/employees-provider";
import type { ResourceDoc } from "@/providers/resources-provider";
import type { FixedCostsBucket } from "@/providers/fixed-tree-provider";
import type { FixedCostObjectDoc } from "@/providers/fixed-cost-provider";

/* ─────────────────────────────────────────────────────────── */
/* 1 ─ Public result types                                    */
/* ─────────────────────────────────────────────────────────── */

export interface StepCostBreakdown {
  stepId: string;
  stepName: string;
  minutes: number;
  employeeIds: string[];
  employeeCost: number; // aggregated over all employees
  resourceIds: string[];
  resourceCost: number;
  fixedCost: number;
  stepCost: number; // grand total for the step
}

export interface ProjectCategorySummary {
  categoryId: string;
  categoryLabel: string;
  categoryColor: string;
  totalCategoryCost: number;
  steps: StepCostBreakdown[];
}

export interface ProjectSummary {
  projectCosts: {
    totalProjectCost: number;
    categories: ProjectCategorySummary[];
  };
  fixedCosts: {
    totalFixedCost: number;
    objects: Array<{ id: string; name: string; monthlyCostEuro: number }>;
  };
  employees: {
    totalEmployeeCost: number;
    list: Array<{
      employeeId: string;
      jobtitel: string;
      totalMinutes: number;
      perMinuteCost: number;
      totalCost: number;
      steps: Array<{ stepId: string; minutes: number; cost: number }>;
    }>;
  };
  resources: {
    totalResourceCost: number;
    objects: Array<{ id: string; name: string; monthlyCostEuro: number }>;
  };
}

/* ─────────────────────────────────────────────────────────── */
/* 2 ─ Helpers                                                */
/* ─────────────────────────────────────────────────────────── */

function isTreeStep(child: unknown): child is { id: string; name: string } {
  return !!child && typeof child === "object" && "name" in child;
}

function collectStepIds(categories: TreeCategory[]): Set<string> {
  const set = new Set<string>();
  const walk = (cat: TreeCategory) => {
    cat.children.forEach((ch) => {
      if (isTreeStep(ch)) set.add(ch.id);
      else walk(ch as unknown as TreeCategory);
    });
  };
  categories.forEach(walk);
  return set;
}

function collectStepIdsForCategory(cat: TreeCategory): string[] {
  const ids: string[] = [];
  const walk = (c: TreeCategory) => {
    c.children.forEach((ch) => {
      if (isTreeStep(ch)) ids.push(ch.id);
      else walk(ch as unknown as TreeCategory);
    });
  };
  walk(cat);
  return ids;
}

/** Guarantee an array */
const arr = <T>(x: T | T[] | null | undefined): T[] =>
  x === undefined || x === null ? [] : Array.isArray(x) ? x : [x];

/* ─────────────────────────────────────────────────────────── */
/* 3 ─ Main generator                                         */
/* ─────────────────────────────────────────────────────────── */

export function generateProjectSummary(
  dataTree: TreeCategory[],
  steps: StepDoc[],
  employees: EmployeeDoc[],
  resources: ResourceDoc[],
  fixedBucket: FixedCostsBucket,
  fixedCostObjects: FixedCostObjectDoc[],
): ProjectSummary {
  /* ---------- 3.1 Filter to project scope ---------- */
  const projectStepIds = collectStepIds(dataTree);
  const projectSteps = steps.filter((s) => projectStepIds.has(s.id));

  /* ---------- 3.2 Lookup maps ---------- */
  const employeeMap = Object.fromEntries(employees.map((e) => [e.id, e]));
  const resourceMap = Object.fromEntries(resources.map((r) => [r.id, r]));

  /* ---------- 3.3 Minute buckets & resource ids ---------- */
  const employeeMinutes: Record<string, number> = {};
  const resourceMinutes: Record<string, number> = {};
  const projectResourceIds = new Set<string>();

  projectSteps.forEach((step) => {
    const minutes = (step.stepDuration ?? 0) * (step.costDriverValue ?? 0);

    arr(step.person).forEach((empId) => {
      employeeMinutes[empId] = (employeeMinutes[empId] ?? 0) + minutes;
    });

    arr(step.additionalResources).forEach((resId) => {
      projectResourceIds.add(resId);
      resourceMinutes[resId] = (resourceMinutes[resId] ?? 0) + minutes;
    });
  });

  /* ---------- 3.4 Per‑minute rates ---------- */
  const employeeRate: Record<string, number> = {};
  for (const [empId, mins] of Object.entries(employeeMinutes)) {
    const salary = employeeMap[empId]?.monthlySalaryEuro ?? 0;
    employeeRate[empId] = mins === 0 ? 0 : salary / mins;
  }

  const resourceRate: Record<string, number> = {};
  for (const [resId, mins] of Object.entries(resourceMinutes)) {
    const rent = resourceMap[resId]?.costPerMonthEuro ?? 0;
    resourceRate[resId] = mins === 0 ? 0 : rent / mins;
  }

  /* ---------- 3.5 Fixed‑cost pot ---------- */
  const fixedCostObjs = fixedBucket.fixedCosts
    .map((id) => fixedCostObjects.find((o) => o.id === id))
    .filter(Boolean) as FixedCostObjectDoc[];

  const totalFixedCost = fixedCostObjs.reduce(
    (acc, o) => acc + (o.costPerMonthEuro ?? 0),
    0,
  );

  /* ---------- 3.6 Step breakdown ---------- */
  const stepBreakdown: Record<string, StepCostBreakdown> = {};
  let variablePool = 0; // employee + resource costs (denominator for fixed allocation)

  projectSteps.forEach((step) => {
    const minutes = (step.stepDuration ?? 0) * (step.costDriverValue ?? 0);

    const empIds = arr(step.person);
    const empCost = empIds.reduce(
      (sum, id) => sum + minutes * (employeeRate[id] ?? 0),
      0,
    );

    const resIds = arr(step.additionalResources);
    const resCost = resIds.reduce(
      (sum, id) => sum + minutes * (resourceRate[id] ?? 0),
      0,
    );

    variablePool += empCost + resCost;

    stepBreakdown[step.id] = {
      stepId: step.id,
      stepName: step.name,
      minutes,
      employeeIds: empIds,
      employeeCost: empCost,
      resourceIds: resIds,
      resourceCost: resCost,
      fixedCost: 0, // filled later
      stepCost: 0,
    };
  });

  const denominator = variablePool || 1;

  Object.values(stepBreakdown).forEach((sb) => {
    const share = sb.employeeCost + sb.resourceCost;
    const fixedShare = (share / denominator) * totalFixedCost;
    sb.fixedCost = fixedShare;
    sb.stepCost = share + fixedShare;
  });

  /* ---------- 3.7 Category summaries ---------- */
  const buildCat = (cat: TreeCategory): ProjectCategorySummary => {
    const ids = collectStepIdsForCategory(cat);
    const stepsArr = ids.map((id) => stepBreakdown[id]).filter(Boolean) as StepCostBreakdown[];
    const total = stepsArr.reduce((acc, s) => acc + s.stepCost, 0);
    return {
      categoryId: cat.id,
      categoryLabel: cat.label,
      categoryColor: cat.color,
      totalCategoryCost: total,
      steps: stepsArr,
    };
  };
  const categories = dataTree.map(buildCat);
  const totalProjectCost = categories.reduce((acc, c) => acc + c.totalCategoryCost, 0);

  /* ---------- 3.8 Employee section ---------- */
  const employeeSection = Object.entries(employeeMinutes).map(([empId, mins]) => {
    const rate = employeeRate[empId] ?? 0;
    const totalCost = rate * mins;
    const jobtitel = employeeMap[empId]?.jobtitel ?? "";

    const stepsArr = Object.values(stepBreakdown)
      .filter((sb) => sb.employeeIds.includes(empId))
      .map((sb) => ({
        stepId: sb.stepId,
        minutes: sb.minutes,
        cost: sb.minutes * rate,
      }));

    return {
      employeeId: empId,
      jobtitel,
      totalMinutes: mins,
      perMinuteCost: rate,
      totalCost,
      steps: stepsArr,
    };
  });

  const totalEmployeeCost = employeeSection.reduce((acc, e) => acc + e.totalCost, 0);

  /* ---------- 3.9 Resource section ---------- */
  const resourceSectionObjects = Array.from(projectResourceIds).map((resId) => ({
    id: resId,
    name: resourceMap[resId]?.costObjectName ?? "",
    monthlyCostEuro: resourceMap[resId]?.costPerMonthEuro ?? 0,
  }));

  const totalResourceCost = resourceSectionObjects.reduce(
    (acc, obj) => acc + obj.monthlyCostEuro,
    0,
  );

  /* ---------- 3.10 Result ---------- */
  return {
    projectCosts: {
      totalProjectCost,
      categories,
    },
    fixedCosts: {
      totalFixedCost,
      objects: fixedCostObjs.map((o) => ({
        id: o.id,
        name: o.costObjectName,
        monthlyCostEuro: o.costPerMonthEuro,
      })),
    },
    employees: {
      totalEmployeeCost,
      list: employeeSection,
    },
    resources: {
      totalResourceCost,
      objects: resourceSectionObjects,
    },
  };
}
