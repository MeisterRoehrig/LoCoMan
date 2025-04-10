// file: /lib/summary-utils.ts

import type { TreeCategory } from "@/providers/tree-provider";
import type { StepDoc } from "@/providers/steps-provider";

/**
 * The overall shape of the returned summary.
 * Each category has an array of "steps", and each step has an ID, name, and cost.
 */
export type ProjectCostSummary = {
  totalProjectCost: number;
  categories: Array<{
    categoryId: string;
    categoryLabel: string;
    totalCategoryCost: number;
    steps: Array<{
      stepId: string;
      stepName: string;
      stepCost: number;
    }>;
  }>;
};

/**
 * 1) Compute the cost of a single step based on your new formula:
 *    (personMonthlySalary / 160) * costDriverValue * stepDuration + additionalResourcesValue
 */
function computeStepCost(step: StepDoc): number {
  // Fallbacks so undefined fields don't break anything
  const personMonthlySalary = step.personMonthlySalary ?? 0;
  const costDriverValue = step.costDriverValue ?? 0;
  const stepDuration = step.stepDuration ?? 0;
  const additionalResourcesValue = step.additionalResourcesValue ?? 0;

  return (
    (personMonthlySalary / 160) * costDriverValue * stepDuration +
    additionalResourcesValue
  );
}

/**
 * 2) Given the project's dataTree (categories) + an array of StepDocs,
 *    build a summary with the total cost per category and an overall total.
 *
 *    We assume the tree's children have `id` that matches a `StepDoc.id`,
 *    and we skip any steps we can't find in the `steps` array.
 */
export function generateProjectSummary(
  dataTree: TreeCategory[],
  steps: StepDoc[]
): ProjectCostSummary {
  // Build a quick map from stepId -> StepDoc for faster lookups
  const stepMap: Record<string, StepDoc> = {};
  steps.forEach((step) => {
    stepMap[step.id] = step;
  });

  // Build array of categories with sums
  const categories = dataTree.map((category) => {
    let totalCategoryCost = 0;
    const categorySteps = category.children.map((child) => {
      const stepId = child.id;
      const stepDoc = stepMap[stepId];
      if (!stepDoc) {
        // If there's no matching step data, skip or treat as 0 cost
        return null;
      }
      const cost = computeStepCost(stepDoc);
      totalCategoryCost += cost;

      return {
        stepId: stepDoc.id,
        stepName: stepDoc.name,
        stepCost: cost,
      };
    });

    // Filter out any `null` items (if no matching StepDoc was found)
    const validSteps = categorySteps.filter(Boolean) as Array<{
      stepId: string;
      stepName: string;
      stepCost: number;
    }>;

    return {
      categoryId: category.id,
      categoryLabel: category.label,
      totalCategoryCost,
      steps: validSteps,
    };
  });

  // Summation of all categories
  const totalProjectCost = categories.reduce(
    (acc, cat) => acc + cat.totalCategoryCost,
    0
  );

  return {
    totalProjectCost,
    categories,
  };
}
