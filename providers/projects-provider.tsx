"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  ReactNode,
} from "react";
import {
  collection,
  doc,
  getDocs,
  addDoc,
  deleteDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase-config";
import { useAuth } from "@/lib/auth-provider";
import { toast } from "sonner";
import { defaultTreeData } from "@/lib/default-tree";
import {
  defaultEmployees,
  defaultFixedCost,
  defaultResourceCost,
} from "@/lib/default-fixed-cost";

/* -------------------------------------------------------------------------- */
/*                 0. Helper: Build ID-only fixedCosts tree                    */
/* -------------------------------------------------------------------------- */
const defaultFixedCostsTree = {
  employees: defaultEmployees.map((e) => e.id),
  fixedCosts: defaultFixedCost.map((fc) => fc.id),
  resources: defaultResourceCost.map((r) => r.id),
} as const;

/* -------------------------------------------------------------------------- */
/*                               Type helpers                                 */
/* -------------------------------------------------------------------------- */
export type FixedCostsTree = typeof defaultFixedCostsTree;

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

export interface ProjectCostSummary {
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

export interface ProjectCostReport {
  projectOverview: string;
  projectRecommendation: string;
  categories: CategoryCostReport[];
}

interface CategoryCostReport {
  categoryId: string;
  categoryLabel: string;
  categoryReport: string;
  categoryHighlight: boolean;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  summary?: ProjectCostSummary;
  summaryUpdatedAt?: Date | null;
  report?: ProjectCostReport;
  reportUpdatedAt?: Date | null;
  dataTree?: any;
  fixedCosts?: FixedCostsTree;
}

interface ProjectsContextValue {
  projects: Project[];
  loadingProjects: boolean;
  loadProjects: () => Promise<void>;
  addProject: (title: string, description: string) => Promise<void>;
  addProjectWithDefaultTree: (
    title: string,
    description: string
  ) => Promise<void>;
  removeProject: (projectId: string) => Promise<void>;
  updateProjectSummary: (projectId: string, summary: any) => Promise<void>;
  updateProjectReport: (
    projectId: string,
    fieldPath: string,
    value: any
  ) => Promise<void>;
}

const ProjectsContext = createContext<ProjectsContextValue>({
  projects: [],
  loadingProjects: false,
  loadProjects: async () => {},
  addProject: async () => {},
  addProjectWithDefaultTree: async () => {},
  removeProject: async () => {},
  updateProjectSummary: async () => {},
  updateProjectReport: async () => {},
});

export function ProjectsProvider({ children }: { readonly children: ReactNode }) {
  const { user } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  /* ------------------------------------------------------------------------ */
  /*                           1. Load projects                               */
  /* ------------------------------------------------------------------------ */
  async function loadProjects() {
    if (!user || !user.uid) return;

    try {
      setLoadingProjects(true);
      const ref = collection(firestore, "users", user.uid, "projects");
      const snap = await getDocs(ref);
      const result: Project[] = snap.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          title: data.title || "",
          description: data.description || "",
          createdAt: data.createdAt?.toDate() || null,
          updatedAt: data.updatedAt?.toDate() || null,
          summary: data.summary || null,
          summaryUpdatedAt: data.summaryUpdatedAt?.toDate() || null,
          report: data.report || null,
          reportUpdatedAt: data.reportUpdatedAt?.toDate() || null,
          dataTree: data.dataTree ?? null,
          fixedCosts: data.fixedCosts ?? null,
        };
      });
      setProjects(result);
    } catch (error) {
      console.error("Error loading projects:", error);
      toast.error("Failed to load projects.");
    } finally {
      setLoadingProjects(false);
    }
  }

  /* ------------------------------------------------------------------------ */
  /*                           2. Add project                                 */
  /* ------------------------------------------------------------------------ */
  async function addProject(title: string, description: string) {
    if (!user || !user.uid) return;

    try {
      const ref = collection(firestore, "users", user.uid, "projects");
      await addDoc(ref, {
        title,
        description,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success("Project created!");
      await loadProjects();
    } catch (error) {
      console.error("Error adding project:", error);
      toast.error("Failed to create project.");
    }
  }

  /* ------------------------------------------------------------------------ */
  /*        3. Add project WITH default dataTree + fixedCosts tree            */
  /* ------------------------------------------------------------------------ */
  async function addProjectWithDefaultTree(title: string, description: string) {
    if (!user || !user.uid) return;

    try {
      const ref = collection(firestore, "users", user.uid, "projects");
      await addDoc(ref, {
        title,
        description,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        dataTree: defaultTreeData,          // operational tree
        fixedCosts: defaultFixedCostsTree,  // ID-only fixed-cost tree 🎉
      });
      toast.success("Project with default tree created!");
      await loadProjects();
    } catch (error) {
      console.error("Error creating project with tree:", error);
      toast.error("Failed to create project with tree.");
    }
  }

  /* ------------------------------------------------------------------------ */
  /*                           4. Remove project                              */
  /* ------------------------------------------------------------------------ */
  async function removeProject(projectId: string) {
    if (!user || !user.uid) return;

    try {
      const ref = doc(firestore, "users", user.uid, "projects", projectId);
      await deleteDoc(ref);
      toast.success("Project removed");
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (error) {
      console.error("Error removing project:", error);
      toast.error("Failed to remove project.");
    }
  }

  /* ------------------------------------------------------------------------ */
  /*                     5. Update project summary/report                     */
  /* ------------------------------------------------------------------------ */
  async function updateProjectSummary(projectId: string, summary: any) {
    if (!user || !user.uid) return;

    try {
      const projectRef = doc(firestore, "users", user.uid, "projects", projectId);
      await updateDoc(projectRef, {
        summary,
        summaryUpdatedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success("Project summary updated!");
      await loadProjects();
    } catch (error) {
      console.error("Error updating project summary:", error);
      toast.error("Failed to update project summary.");
    }
  }

  async function updateProjectReport(
    projectId: string,
    fieldPath: string,
    value: any
  ) {
    if (!user || typeof user !== "object" || !user.uid) return;

    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              report: {
                ...(p.report ?? {}),
                categories: fieldPath.startsWith("categories")
                  ? {
                      ...(p.report?.categories ?? {}),
                      [fieldPath.split(".")[1]]: value,
                    }
                  : p.report?.categories ?? [],
                [fieldPath as keyof ProjectCostReport]: !fieldPath.startsWith(
                  "categories"
                )
                  ? value
                  : p.report?.[fieldPath as keyof ProjectCostReport],
              } as ProjectCostReport,
            }
          : p
      )
    );

    const projectRef = doc(firestore, "users", user.uid, "projects", projectId);
    await updateDoc(projectRef, {
      [`report.${fieldPath}`]: value,
      reportUpdatedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }).catch((err) => {
      console.error("updateProjectReport failed:", err);
      toast.error("Failed to update project report.");
    });
    toast.success("Project report updated!");
  }

  /* ------------------------------------------------------------------------ */
  /*                 6. Auto-load projects when auth state changes            */
  /* ------------------------------------------------------------------------ */
  useEffect(() => {
    if (user && user.uid) {
      loadProjects();
    } else {
      setProjects([]);
    }
  }, [user]);

  /* ------------------------------------------------------------------------ */
  /*                                  Value                                   */
  /* ------------------------------------------------------------------------ */
  const value = useMemo(
    () => ({
      projects,
      loadingProjects,
      loadProjects,
      addProject,
      removeProject,
      addProjectWithDefaultTree,
      updateProjectSummary,
      updateProjectReport,
    }),
    [projects, loadingProjects]
  );

  return (
    <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>
  );
}

export function useProjects() {
  return useContext(ProjectsContext);
}