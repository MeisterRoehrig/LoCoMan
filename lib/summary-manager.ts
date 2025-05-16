// file: /lib/summary-utils.ts
/* eslint-disable @typescript-eslint/consistent-type-definitions */

import type { TreeCategory }  from "@/providers/tree-provider";
import type { StepDoc }       from "@/providers/steps-provider";
import type { EmployeeDoc }   from "@/providers/employees-provider";
import type { ResourceDoc }   from "@/providers/resources-provider";
import type {
  FixedCostsBucket,
} from "@/providers/fixed-tree-provider";
import type { FixedCostObjectDoc } from "@/providers/fixed-cost-provider";

/* ─────────────────────────────────────────────────────────── */
/* 1 ─ Public result types                                     */
/* ─────────────────────────────────────────────────────────── */

export interface StepCostBreakdown {
  stepId: string;
  stepName: string;
  minutes: number;
  employeeId: string | null;
  employeeCost: number;
  resourceIds: string[];
  resourceCost: number;
  fixedCost: number;
  stepCost: number;
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
}

/* ─────────────────────────────────────────────────────────── */
/* 2 ─ Internal helpers                                        */
/* ─────────────────────────────────────────────────────────── */

function isTreeStep(child: unknown): child is { id: string; name: string } {
  return !!child && typeof child === "object" && "name" in child;
}

function collectStepIds(categories: TreeCategory[]): Set<string> {
  const ids = new Set<string>();
  const walk = (cat: TreeCategory) => {
    cat.children.forEach(child => {
      if (isTreeStep(child)) ids.add(child.id);
      else walk(child as unknown as TreeCategory); // nested category
    });
  };
  categories.forEach(walk);
  return ids;
}

function collectStepIdsForCategory(cat: TreeCategory): string[] {
  const ids: string[] = [];
  const walk = (c: TreeCategory) => {
    c.children.forEach(child => {
      if (isTreeStep(child)) ids.push(child.id);
      else walk(child as unknown as TreeCategory);
    });
  };
  walk(cat);
  return ids;
}

const minutesPerMonth = 160 * 60;

const safeArray = <T>(x: T | T[] | null | undefined): T[] =>
  x === undefined || x === null
    ? []
    : Array.isArray(x)
    ? x
    : [x];

/* ─────────────────────────────────────────────────────────── */
/* 3 ─ Main generator                                          */
/* ─────────────────────────────────────────────────────────── */

/**
 * Build a complete project summary starting *strictly* from the dataTree.
 */
export function generateProjectSummary(
  dataTree: TreeCategory[],
  steps: StepDoc[],
  employees: EmployeeDoc[],
  resources: ResourceDoc[],
  fixedBucket: FixedCostsBucket,
  fixedCostObjects: FixedCostObjectDoc[]
): ProjectSummary {
  /* ───── 3.1  maps & filters — only project steps ─────────── */
  const projectStepIds     = collectStepIds(dataTree);
  const projectSteps       = steps.filter(s => projectStepIds.has(s.id));

  const employeeMap  = Object.fromEntries(employees.map(e => [e.id, e]));
  const resourceMap  = Object.fromEntries(resources.map(r => [r.id, r]));
  const stepMap      = Object.fromEntries(projectSteps.map(s => [s.id, s]));

  /* ───── 3.2  minutes per employee / resource  ────────────── */
  const employeeMinutes: Record<string, number> = {};
  const resourceMinutes: Record<string, number> = {};

  projectSteps.forEach(step => {
    const minutes = (step.stepDuration ?? 0) * (step.costDriverValue ?? 0);

    if (step.person) {
      employeeMinutes[step.person] =
        (employeeMinutes[step.person] ?? 0) + minutes;
    }

    safeArray(step.additionalResources).forEach(resId => {
      resourceMinutes[resId] = (resourceMinutes[resId] ?? 0) + minutes;
    });
  });

  /* ───── 3.3  pro-rata per-minute rates  ──────────────────── */
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

  /* ───── 3.4  fixed-cost pot  ─────────────────────────────── */
  const fixedCostObjs = fixedBucket.fixedCosts
    .map(id => fixedCostObjects.find(f => f.id === id))
    .filter(Boolean) as FixedCostObjectDoc[];

  const totalFixedCost = fixedCostObjs.reduce(
    (acc, obj) => acc + (obj.costPerMonthEuro ?? 0),
    0
  );

  /* ───── 3.5  per-step breakdown  ─────────────────────────── */
  const stepBreakdown: Record<string, StepCostBreakdown> = {};
  let baseProjectCost = 0;

  projectSteps.forEach(step => {
    const minutes = (step.stepDuration ?? 0) * (step.costDriverValue ?? 0);

    const empId   = step.person ?? null;
    const empCost = empId ? minutes * (employeeRate[empId] ?? 0) : 0;

    const resIds  = safeArray(step.additionalResources);
    const resCost = resIds.reduce(
      (sum, resId) => sum + minutes * (resourceRate[resId] ?? 0),
      0
    );

    baseProjectCost += empCost + resCost;

    stepBreakdown[step.id] = {
      stepId: step.id,
      stepName: step.name,
      minutes,
      employeeId: empId,
      employeeCost: empCost,
      resourceIds: resIds,
      resourceCost: resCost,
      fixedCost: 0, // filled below
      stepCost: 0
    };
  });

  const denominator = baseProjectCost || 1;

  /* allocate fixed-costs proportionally */
  Object.values(stepBreakdown).forEach(sb => {
    const share    = sb.employeeCost + sb.resourceCost;
    const fixed    = (share / denominator) * totalFixedCost;
    sb.fixedCost   = fixed;
    sb.stepCost    = share + fixed;
  });

  /* ───── 3.6  category aggregation (recursive) ────────────── */
  const buildCategorySummary = (cat: TreeCategory): ProjectCategorySummary => {
    const stepIds = collectStepIdsForCategory(cat);
    const stepsInCat = stepIds
      .map(id => stepBreakdown[id])
      .filter(Boolean) as StepCostBreakdown[];

    const total = stepsInCat.reduce((acc, s) => acc + s.stepCost, 0);

    return {
      categoryId:  cat.id,
      categoryLabel: cat.label,
      categoryColor: cat.color,
      totalCategoryCost: total,
      steps: stepsInCat
    };
  };

  const categories = dataTree.map(buildCategorySummary);
  const totalProjectCost = categories.reduce(
    (acc, c) => acc + c.totalCategoryCost,
    0
  );

  /* ───── 3.7  employee section  ───────────────────────────── */
  const employeeSection = Object.entries(employeeMinutes).map(
    ([empId, mins]) => {
      const rate      = employeeRate[empId] ?? 0;
      const totalCost = rate * mins;
      const jobtitel  = employeeMap[empId]?.jobtitel ?? "";

      const stepsArr = Object.values(stepBreakdown)
        .filter(sb => sb.employeeId === empId)
        .map(sb => ({ stepId: sb.stepId, minutes: sb.minutes, cost: sb.employeeCost }));

      return {
        employeeId: empId,
        jobtitel,
        totalMinutes: mins,
        perMinuteCost: rate,
        totalCost,
        steps: stepsArr
      };
    }
  );

  const totalEmployeeCost = employeeSection.reduce(
    (acc, e) => acc + e.totalCost,
    0
  );

  /* ───── 3.8  result  ─────────────────────────────────────── */
  return {
    projectCosts: {
      totalProjectCost,
      categories
    },
    fixedCosts: {
      totalFixedCost,
      objects: fixedCostObjs.map(o => ({
        id: o.id,
        name: o.costObjectName,
        monthlyCostEuro: o.costPerMonthEuro
      }))
    },
    employees: {
      totalEmployeeCost,
      list: employeeSection
    }
  };
}
