"use client";

import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  ReactNode,
} from "react";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,        // <-- Import setDoc
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase-config";
import { useAuth } from "@/lib/auth-provider";
import { toast } from "sonner";

export interface StepDoc {
  id: string;
  name: string;
  person?: string;
  personMonthlySalary?: number;
  costDriver?: string;
  costDriverValue?: number;
  stepDuration?: number;
  additionalResources?: string;
  additionalResourcesValue?: number;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  // ... more fields as needed
}

interface StepsContextValue {
  steps: StepDoc[];
  loadingSteps: boolean;

  loadSteps: () => Promise<void>;
  getStepById: (stepId: string) => StepDoc | null;
  addStep: (stepData: Omit<StepDoc, "id">) => Promise<string | undefined>;
  /** NEW: Add a step but let us specify the Firestore doc ID. */
  addStepWithId: (
    stepData: Omit<StepDoc, "id">,
    customId: string
  ) => Promise<string | undefined>;
  createStepCopy: (originalStepId: string) => Promise<void>;
  updateStep: (stepId: string, data: Partial<StepDoc>) => Promise<void>;
  deleteStep: (stepId: string) => Promise<void>;
}

/** StepsContext + StepsProvider */
const StepsContext = createContext<StepsContextValue>({
  steps: [],
  loadingSteps: false,
  loadSteps: async () => {},
  getStepById: () => null,
  addStep: async () => undefined,
  addStepWithId: async () => undefined, // new
  createStepCopy: async () => {},
  updateStep: async () => {},
  deleteStep: async () => {},
});

export function StepsProvider({ children }: { readonly children: ReactNode }) {
  const { user } = useAuth();
  const [steps, setSteps] = useState<StepDoc[]>([]);
  const [loadingSteps, setLoadingSteps] = useState(false);

  /** 1. Load all steps for the user */
  async function loadSteps() {
    if (!user || !user.uid) return;
    setLoadingSteps(true);
    try {
      const stepsRef = collection(firestore, "users", user.uid, "steps");
      const snap = await getDocs(stepsRef);
      const result: StepDoc[] = snap.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name || "",
          person: data.person || "",
          personMonthlySalary: data.personMonthlySalary || 0,
          costDriver: data.costDriver || "",
          costDriverValue: data.costDriverValue || 0,
          stepDuration: data.stepDuration || 0,
          additionalResources: data.additionalResources || "",
          additionalResourcesValue: data.additionalResourcesValue || 0,
          createdAt: data.createdAt?.toDate() || null,
          updatedAt: data.updatedAt?.toDate() || null,
        };
      });
      setSteps(result);
    } catch (error) {
      console.error("Error loading steps:", error);
      toast.error("Failed to load steps library.");
    } finally {
      setLoadingSteps(false);
    }
  }

  /** 2. Retrieve a step from local state by ID */
  function getStepById(stepId: string): StepDoc | null {
    return steps.find((s) => s.id === stepId) || null;
  }

  /** 3. Add a new step with an AUTO-GENERATED doc ID. */
  async function addStep(stepData: Omit<StepDoc, "id">) {
    if (!user || !user.uid) return;
    try {
      const stepsRef = collection(firestore, "users", user.uid, "steps");
      const newStepRef = await addDoc(stepsRef, {
        ...stepData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success("Step added!");
      await loadSteps();
      return newStepRef.id;
    } catch (error) {
      console.error("Error adding step:", error);
      toast.error("Failed to add step.");
    }
  }

  async function addStepWithId(stepData: Omit<StepDoc, "id">, customId: string) {
    if (!user || !user.uid) {
      console.warn("addStepWithId called with missing user");
      return;
    }
  
    try {
      const docRef = doc(firestore, "users", user.uid, "steps", customId);
      console.log("[addStepWithId] Creating step with ID:", customId);
  
      await setDoc(docRef, {
        ...stepData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
  
      console.log("[addStepWithId] Successfully created:", docRef.path);
      await loadSteps();
      return docRef.id;
    } catch (error) {
      console.error("Error adding step with custom ID:", error);
      toast.error("Failed to add step with custom ID.");
    }
  }
  
  /** 4. Create a copy of an existing step with a new doc ID. */
  async function createStepCopy(originalStepId: string) {
    if (!user || !user.uid) return;

    let originalStep = getStepById(originalStepId);
    // fallback: read from Firestore if needed
    if (!originalStep) {
      const docRef = doc(firestore, "users", user.uid, "steps", originalStepId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        toast.error("Original step not found");
        return;
      }
      const data = snap.data();
      originalStep = {
        id: snap.id,
        name: data.name || "",
      } as StepDoc;
    }

    const { id, createdAt, updatedAt, ...rest } = originalStep;
    await addStep({
      ...rest,
      name: `${rest.name} (Copy)`,
    });
  }

  /** 5. Update an existing step doc in Firestore. */
  async function updateStep(stepId: string, data: Partial<StepDoc>) {
    if (!user || !user.uid) return;

    try {
      const docRef = doc(firestore, "users", user.uid, "steps", stepId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
      toast.success("Step updated!");
      await loadSteps();
    } catch (error) {
      console.error("Error updating step:", error);
      toast.error("Failed to update step.");
    }
  }

  /** 6. Delete a step by ID. */
  async function deleteStep(stepId: string) {
    if (!user || !user.uid) return;

    try {
      const docRef = doc(firestore, "users", user.uid, "steps", stepId);
      await deleteDoc(docRef);
      toast.success("Step deleted.");
      setSteps((prev) => prev.filter((s) => s.id !== stepId));
    } catch (error) {
      console.error("Error deleting step:", error);
      toast.error("Failed to delete step.");
    }
  }

  /** Automatically load steps once on mount. */
  useEffect(() => {
    if (user && user.uid) {
      loadSteps();
    } else {
      setSteps([]);
    }
  }, [user]);

  const value = useMemo(
    () => ({
      steps,
      loadingSteps,
      loadSteps,
      getStepById,
      addStep,
      addStepWithId, // new function
      createStepCopy,
      updateStep,
      deleteStep,
    }),
    [steps, loadingSteps]
  );

  return <StepsContext.Provider value={value}>{children}</StepsContext.Provider>;
}

export function useSteps() {
  return useContext(StepsContext);
}
