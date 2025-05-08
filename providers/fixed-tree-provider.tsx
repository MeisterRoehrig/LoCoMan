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

/* ———————————————————————————————————————————————— */
/* Types                                                                    */
/* ———————————————————————————————————————————————— */

export type FixedCostKind = "employees" | "fixedCosts" | "resources";

export interface FixedCostsBucket {
  employees: string[];
  fixedCosts: string[];
  resources: string[];
}

interface FixedTreeContextValue {
  fixedCosts: FixedCostsBucket | null;
  loadingFixedTree: boolean;
  loadFixedTree: (projectId: string) => Promise<void>;
  addToFixedCosts: (
    projectId: string,
    kind: FixedCostKind,
    id: string
  ) => Promise<void>;
  removeFromFixedCosts: (
    projectId: string,
    kind: FixedCostKind,
    id: string
  ) => Promise<void>;
}

/* ———————————————————————————————————————————————— */
/* Context                                                                    */
/* ———————————————————————————————————————————————— */

const FixedTreeContext = createContext<FixedTreeContextValue>({
  fixedCosts: null,
  loadingFixedTree: false,
  loadFixedTree: async () => {},
  addToFixedCosts: async () => {},
  removeFromFixedCosts: async () => {},
});

export function FixedTreeProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  const { user } = useAuth();
  const [fixedCosts, setFixedCosts] = useState<FixedCostsBucket | null>(null);
  const [loadingFixedTree, setLoadingFixedTree] = useState(false);

  /* ——— read from Firestore ——— */
  async function loadFixedTree(projectId: string) {
    if (!user || typeof user === "boolean" || !user.uid) return;

    try {
      setLoadingFixedTree(true);
      const projectRef = doc(
        firestore,
        "users",
        user.uid,
        "projects",
        projectId
      );
      const snap = await getDoc(projectRef);
      if (!snap.exists()) {
        setFixedCosts({
          employees: [],
          fixedCosts: [],
          resources: [],
        });
        return;
      }
      const data = snap.data();
      setFixedCosts(
        data.fixedCosts ?? {
          employees: [],
          fixedCosts: [],
          resources: [],
        }
      );
    } catch (err) {
      console.error("Error loading fixed costs bucket:", err);
      toast.error("Failed to load fixed-costs data.");
    } finally {
      setLoadingFixedTree(false);
    }
  }

  /* ——— write helper ——— */
  async function saveFixedCosts(
    projectId: string,
    newFixed: FixedCostsBucket
  ) {
    if (!user || typeof user === "boolean" || !user.uid) return;

    try {
      const projectRef = doc(
        firestore,
        "users",
        user.uid,
        "projects",
        projectId
      );
      await updateDoc(projectRef, {
        fixedCosts: newFixed,
        updatedAt: serverTimestamp(),
      });
      setFixedCosts(newFixed);
    } catch (err) {
      console.error("Error saving fixed costs bucket:", err);
      toast.error("Failed to update fixed-costs data.");
    }
  }

  /* ——— public CRUD ——— */
  async function addToFixedCosts(
    projectId: string,
    kind: FixedCostKind,
    id: string
  ) {
    if (!fixedCosts) return;
    if (fixedCosts[kind].includes(id)) return; // guard against duplicates

    const newFixed: FixedCostsBucket = {
      ...fixedCosts,
      [kind]: [...fixedCosts[kind], id],
    };

    console.log("newFixed", newFixed);

    await saveFixedCosts(projectId, newFixed);
  }

  async function removeFromFixedCosts(
    projectId: string,
    kind: FixedCostKind,
    id: string
  ) {
    if (!fixedCosts) return;

    const newFixed: FixedCostsBucket = {
      ...fixedCosts,
      [kind]: fixedCosts[kind].filter((x) => x !== id),
    };

    await saveFixedCosts(projectId, newFixed);
  }

  /* ——— context value ——— */
  const value = useMemo(
    () => ({
      fixedCosts,
      loadingFixedTree,
      loadFixedTree,
      addToFixedCosts,
      removeFromFixedCosts,
    }),
    [fixedCosts, loadingFixedTree, user]
  );

  return (
    <FixedTreeContext.Provider value={value}>
      {children}
    </FixedTreeContext.Provider>
  );
}

/* ———————————————————————————————————————————————— */
/* Convenience hook                                                          */
/* ———————————————————————————————————————————————— */

export function useFixedTree() {
  return useContext(FixedTreeContext);
}
