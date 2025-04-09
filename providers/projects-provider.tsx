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
  // If you want real-time: onSnapshot, query, orderBy
} from "firebase/firestore";
import { firestore } from "@/lib/firebase-config";
import { useAuth } from "@/lib/auth-provider";
import { toast } from "sonner";
import { defaultTreeData } from "@/lib/default-tree";

export interface Project {
  id: string;
  title: string;
  description?: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  // Possibly dataSummary, dataTree if you store them at top-level.
}

interface ProjectsContextValue {
  projects: Project[];
  loadingProjects: boolean;
  loadProjects: () => Promise<void>;
  addProject: (title: string, description: string) => Promise<void>;
  addProjectWithDefaultTree: (title: string, description: string) => Promise<void>;
  removeProject: (projectId: string) => Promise<void>;
}

const ProjectsContext = createContext<ProjectsContextValue>({
  projects: [],
  loadingProjects: false,
  loadProjects: async () => {},
  addProject: async () => {},
  addProjectWithDefaultTree: async () => {},
  removeProject: async () => {},
});

export function ProjectsProvider({ children }: { children: ReactNode }) {
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
