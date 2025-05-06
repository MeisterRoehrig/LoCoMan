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
  // If you want real-time: onSnapshot, query, orderBy
} from "firebase/firestore";
import { firestore } from "@/lib/firebase-config";
import { useAuth } from "@/lib/auth-provider";
import { toast } from "sonner";
import { defaultTreeData } from "@/lib/default-tree";



export interface ProjectCostSummary {
  totalProjectCost: number;
  categories: CategoryCostSummary[];
}

interface CategoryCostSummary {
  categoryId: string;
  categoryLabel: string;
  totalCategoryCost: number;
  categoryColor: string;
  steps: StepCostSummary[];
}

interface StepCostSummary {
  stepId: string;
  stepName: string;
  stepCost: number;
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
}

interface ProjectsContextValue {
  projects: Project[];
  loadingProjects: boolean;
  loadProjects: () => Promise<void>;
  addProject: (title: string, description: string) => Promise<void>;
  addProjectWithDefaultTree: (title: string, description: string) => Promise<void>;
  removeProject: (projectId: string) => Promise<void>;
  updateProjectSummary: (projectId: string, summary: any) => Promise<void>;
  updateProjectReport: (projectId: string, fieldPath: string, value: any) => Promise<void>;

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

  /** Load the user's projects "on demand" or "on mount" */
  async function loadProjects() {
    if (!user || !user.uid) return;

    try {
      setLoadingProjects(true);
      const ref = collection(firestore, "users", user.uid, "projects");
      // If you prefer real-time, you’d use onSnapshot + query orderBy.
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

  /** Add a new project */
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
      // Optionally re-fetch or push local state. 
      await loadProjects();
    } catch (error) {
      console.error("Error adding project:", error);
      toast.error("Failed to create project.");
    }
  }

  async function addProjectWithDefaultTree(title: string, description: string) {
    if (!user || !user.uid) return;
  
    try {
      const ref = collection(firestore, "users", user.uid, "projects");
      await addDoc(ref, {
        title,
        description,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        dataTree: defaultTreeData, // ⚡ Here we set the default tree
      });
      toast.success("Project with default tree created!");
      await loadProjects(); // reload local state
    } catch (error) {
      console.error("Error creating project with tree:", error);
      toast.error("Failed to create project with tree.");
    }
  }

  /** Remove a project */
  async function removeProject(projectId: string) {
    if (!user || !user.uid) return;

    try {
      const ref = doc(firestore, "users", user.uid, "projects", projectId);
      await deleteDoc(ref);
      toast.success("Project removed");
      // re-fetch or remove from local state
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (error) {
      console.error("Error removing project:", error);
      toast.error("Failed to remove project.");
    }
  }

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

  // async function updateProjectReport(projectId: string, report: any) {
  //   if (!user || !user.uid) return;

  //   try {
  //     const projectRef = doc(firestore, "users", user.uid, "projects", projectId);
  //     await updateDoc(projectRef, {
  //       report,
  //       reportUpdatedAt: serverTimestamp(),
  //       updatedAt: serverTimestamp(),
  //     });
  //     toast.success("Project report updated!");
  //     await loadProjects(); 
  //   } catch (error) {
  //     console.error("Error updating project report:", error);
  //     toast.error("Failed to update project report.");
  //   }
  // }

  async function updateProjectReport(
    projectId: string,
    fieldPath: string,     // e.g. "projectOverview" or "categories.default-cat-1"
    value: any             // usually { text: "AI output" }
  ) {
    if (!user || typeof user !== "object" || !user.uid) return;
  
    // optimistic local update
    setProjects(prev =>
          prev.map(p =>
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
                    [fieldPath as keyof ProjectCostReport]: !fieldPath.startsWith("categories") ? value : p.report?.[fieldPath as keyof ProjectCostReport],
                  } as ProjectCostReport,
                }
              : p
          )
        );
  
    // write the single field to Firestore
    const projectRef = doc(firestore, "users", user.uid, "projects", projectId);
    await updateDoc(projectRef, {
      [`report.${fieldPath}`]: value,
      reportUpdatedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }).catch(err => {
      console.error("updateProjectReport failed:", err);
      toast.error("Failed to update project report.");
    });
    toast.success("Project report updated!");
  }
  

  // Example: load projects automatically on mount
  useEffect(() => {
    if (user && user.uid) {
      loadProjects();
    } else {
      setProjects([]);
    }
  }, [user]);

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
