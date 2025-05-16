"use client";

import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  ReactNode,
} from "react";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase-config";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-provider";

/** A category or step node within the dataTree. */
export interface TreeCategory {
  id: string;
  label: string;
  color: string; // optional, for color-coding categories
  children: Array<TreeStep>; // can nest categories or steps
}

export interface TreeStep {
  id: string;
  name: string;
  // Possibly more fields if you want to store a subset of step info here
}

interface TreeContextValue {
  dataTree: TreeCategory[] | null;
  loadingTree: boolean;
  loadTree: (projectId: string) => Promise<void>;
  addCategory: (projectId: string, categoryLabel: string) => Promise<void>;
  removeCategory: (projectId: string, categoryId: string) => Promise<void>;
  addStepToCategory: (projectId: string, categoryId: string, step: TreeStep) => Promise<void>;
  removeStepFromCategory: (projectId: string, categoryId: string, stepId: string) => Promise<void>;
}

const TreeContext = createContext<TreeContextValue>({
  dataTree: null,
  loadingTree: false,
  loadTree: async () => { },

  addCategory: async () => { },
  removeCategory: async () => { },
  addStepToCategory: async () => { },
  removeStepFromCategory: async () => { },
});

export function TreeProvider({ children }: { readonly children: ReactNode }) {
  const { user } = useAuth();
  const [dataTree, setDataTree] = useState<TreeCategory[] | null>(null);
  const [loadingTree, setLoadingTree] = useState(false);

  /** Load the dataTree from a project doc */
  async function loadTree(projectId: string) {

    if (!user || !user.uid) {
      console.log("No user is logged in or user ID is missing.");
      return;
    }
    try {
      setLoadingTree(true);
      const projectRef = doc(firestore, "users", user.uid, "projects", projectId);
      const snap = await getDoc(projectRef);

      if (!snap.exists()) {
        console.log("No project document found for the given project ID.");
        setDataTree(null);
        setLoadingTree(false);
        return;
      }
      const data = snap.data();
      // dataTree might be stored as a JSON object or array
      const tree = data.dataTree || [];
      setDataTree(tree);
    } catch (error) {
      console.error("Error loading tree:", error);
      toast.error("Failed to load tree data.");
    } finally {
      setLoadingTree(false);
    }
  }



  /** Internal helper to upload the updated dataTree to Firestore */
  async function saveDataTree(projectId: string, newTree: TreeCategory[]) {
    if (!user || !user.uid) return;
    try {
      const projectRef = doc(firestore, "users", user.uid, "projects", projectId);
      await updateDoc(projectRef, {
        dataTree: newTree,
        updatedAt: serverTimestamp(),
      });
      setDataTree(newTree);
    } catch (error) {
      console.error("Error saving dataTree:", error);
      toast.error("Failed to update tree data.");
    }
  }

  /** Add a new top-level category */
  async function addCategory(projectId: string, categoryLabel: string) {
    if (!dataTree) return;
    const newCat: TreeCategory = {
      id: crypto.randomUUID(),
      label: categoryLabel,
      color: getCategoryColor(dataTree.length),
      children: [],
    };
    const newTree = [...dataTree, newCat];
    await saveDataTree(projectId, newTree);
  }

  /** Remove a category by ID (top-level or nested) – example for top-level only */
  async function removeCategory(projectId: string, categoryId: string) {
    if (!dataTree) return;
    const newTree = dataTree.filter((cat) => cat.id !== categoryId);
    await saveDataTree(projectId, newTree);
  }

  /** Add a step inside a given category’s children */
  async function addStepToCategory(projectId: string, categoryId: string, step: TreeStep) {
    if (!dataTree) return;

    const newTree = dataTree.map((cat) => {
      if (cat.id === categoryId) {
        const updatedCat = {
          ...cat,
          children: [...cat.children, step],
        };
        return updatedCat;
      }
      return cat;
    });

    await saveDataTree(projectId, newTree);
  }

  /** Remove a step from the category’s children */
  async function removeStepFromCategory(projectId: string, categoryId: string, stepId: string) {
    if (!dataTree) return;

    const newTree = dataTree.map((cat) => {
      if (cat.id === categoryId) {
        const filteredChildren = cat.children.filter((child) => {
          if ("name" in child) {
            // child is a TreeStep
            return child.id !== stepId;
          }
          return true; // child is a sub-category
        });
        return { ...cat, children: filteredChildren };
      }
      return cat;
    });

    await saveDataTree(projectId, newTree);
  }

  const value = useMemo(
    () => ({
      dataTree,
      loadingTree,
      loadTree,
      addCategory,
      removeCategory,
      addStepToCategory,
      removeStepFromCategory,
    }),
    // add `user` so that `loadTree` sees the current user
    [dataTree, loadingTree, user]
  );

  return <TreeContext.Provider value={value}>{children}</TreeContext.Provider>;
}

export function useTree() {
  return useContext(TreeContext);
}



export const getCategoryColor = (
  index: number,
  sat = 65,
  light = 55
): string => {
  const GOLDEN_ANGLE = 137.508;
  const hue = (index * GOLDEN_ANGLE) % 360;
  return `hsl(${hue.toFixed(1)}, ${sat}%, ${light}%)`;
};