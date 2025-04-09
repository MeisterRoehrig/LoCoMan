import { useSteps } from "@/providers/steps-provider";
import { useTree } from "@/providers/tree-provider";
import { StepDoc } from "@/providers/steps-provider";
import { TreeStep } from "@/providers/tree-provider";
import { toast } from "sonner";


export function useCreateAndInsertStep() {
  const { addStep } = useSteps();
  const { addStepToCategory } = useTree();

  return async function createAndInsertStep(
    projectId: string,
    categoryId: string,
    stepData: Omit<StepDoc, "id">
  ) {
    try {
      const newStepId = await addStep(stepData);

      if (!newStepId) {
        toast.error("Failed to create step.");
        return;
      }

      const treeStep: TreeStep = {
        id: newStepId,
        name: stepData.name,
      };

      await addStepToCategory(projectId, categoryId, treeStep);
      toast.success("Step added and inserted into tree.");
    } catch (error) {
      console.error("createAndInsertStep error:", error);
      toast.error("Could not insert step.");
    }
  };
}
