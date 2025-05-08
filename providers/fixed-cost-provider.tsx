"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase-config";
import { useAuth } from "@/lib/auth-provider";
import { toast } from "sonner";

/* ========= 1. Firestore doc shape ========= */
export interface FixedCostObjectDoc {
  id: string;
  costObjectName: string;
  costPerMonthEuro: number;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

/* ========= 2. Context interface ========= */
interface FixedCostObjectsContextValue {
  fixedCostObjects: FixedCostObjectDoc[];
  loadingFixedCostObjects: boolean;

  loadFixedCostObjects: () => Promise<void>;
  getFixedCostObjectById: (id: string) => FixedCostObjectDoc | null;
  addFixedCostObject: (data: Omit<FixedCostObjectDoc, "id">) => Promise<string | undefined>;
  
  addFixedCostObjectWithId: (
    data: Omit<FixedCostObjectDoc, "id">,
    customId: string
  ) => Promise<string | undefined>;
  updateFixedCostObject: (
    id: string,
    data: Partial<FixedCostObjectDoc>
  ) => Promise<void>;
  deleteFixedCostObject: (id: string) => Promise<void>;
}

/* ========= 3. Context + Provider ========= */
const FixedCostObjectsContext = createContext<FixedCostObjectsContextValue>({
  fixedCostObjects: [],
  loadingFixedCostObjects: false,
  loadFixedCostObjects: async () => {},
  getFixedCostObjectById: () => null,
  addFixedCostObject: async () => undefined,
  addFixedCostObjectWithId: async () => undefined,
  updateFixedCostObject: async () => {},
  deleteFixedCostObject: async () => {},
});

export function FixedCostObjectsProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  const { user } = useAuth();
  const [fixedCostObjects, setFixedCostObjects] = useState<
    FixedCostObjectDoc[]
  >([]);
  const [loadingFixedCostObjects, setLoadingFixedCostObjects] = useState(false);

  /* ---------- 3.1 Load ---------- */
  async function loadFixedCostObjects() {
    if (!user || typeof user !== "object" || !("uid" in user)) return;
    setLoadingFixedCostObjects(true);
    try {
      const ref = collection(
        firestore,
        "users",
        user.uid,
        "fixedCostObjects"
      );
      const snap = await getDocs(ref);
      const docs: FixedCostObjectDoc[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          costObjectName: data.costObjectName || "",
          costPerMonthEuro: data.costPerMonthEuro ?? 0,
          createdAt: data.createdAt?.toDate() ?? null,
          updatedAt: data.updatedAt?.toDate() ?? null,
        };
      });
      setFixedCostObjects(docs);
    } catch (err) {
      console.error("Error loading fixed cost objects:", err);
      toast.error("Failed to load fixed cost objects.");
    } finally {
      setLoadingFixedCostObjects(false);
    }
  }

  /* ---------- 3.2 Helpers ---------- */
  function getFixedCostObjectById(id: string) {
    return fixedCostObjects.find((f) => f.id === id) ?? null;
  }

  /* ---------- 3.3 Create ---------- */
  async function addFixedCostObject(
    data: Omit<FixedCostObjectDoc, "id">
  ): Promise<string | undefined> {
    if (!user || typeof user !== "object" || !("uid" in user)) return;
    try {
      const ref = collection(firestore, "users", user.uid, "fixedCostObjects");
      const docRef = await addDoc(ref, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success("Fixed cost object added!");
      await loadFixedCostObjects();
      return docRef.id;
    } catch (err) {
      console.error("Error adding fixed cost object:", err);
      toast.error("Failed to add fixed cost object.");
    }
  }

  async function addFixedCostObjectWithId(
    data: Omit<FixedCostObjectDoc, "id">,
    customId: string
  ): Promise<string | undefined> {
    if (!user || typeof user !== "object" || !("uid" in user)) return;
    try {
      const ref = doc(
        firestore,
        "users",
        user.uid,
        "fixedCostObjects",
        customId
      );
      await setDoc(ref, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success("Fixed cost object added!");
      await loadFixedCostObjects();
      return ref.id;
    } catch (err) {
      console.error("Error adding fixed cost object with ID:", err);
      toast.error("Failed to add fixed cost object.");
    }
  }

  /* ---------- 3.4 Update ---------- */
  async function updateFixedCostObject(
    id: string,
    data: Partial<FixedCostObjectDoc>
  ) {
    if (!user || typeof user !== "object" || !("uid" in user)) return;
    try {
      const ref = doc(firestore, "users", user.uid, "fixedCostObjects", id);
      await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
      toast.success("Fixed cost object updated!");
      await loadFixedCostObjects();
    } catch (err) {
      console.error("Error updating fixed cost object:", err);
      toast.error("Failed to update fixed cost object.");
    }
  }

  /* ---------- 3.5 Delete ---------- */
  async function deleteFixedCostObject(id: string) {
    if (!user || typeof user !== "object" || !("uid" in user)) return;
    try {
      const ref = doc(firestore, "users", user.uid, "fixedCostObjects", id);
      await deleteDoc(ref);
      toast.success("Fixed cost object deleted.");
      setFixedCostObjects((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      console.error("Error deleting fixed cost object:", err);
      toast.error("Failed to delete fixed cost object.");
    }
  }

  /* ---------- 3.6 Auto-load on mount ---------- */
  useEffect(() => {
    if (user && typeof user === "object" && "uid" in user) {
      loadFixedCostObjects();
    } else {
      setFixedCostObjects([]);
    }
  }, [user]);

  const value = useMemo<FixedCostObjectsContextValue>(
    () => ({
      fixedCostObjects,
      loadingFixedCostObjects,
      loadFixedCostObjects,
      getFixedCostObjectById,
      addFixedCostObject,
      addFixedCostObjectWithId,
      updateFixedCostObject,
      deleteFixedCostObject,
    }),
    [fixedCostObjects, loadingFixedCostObjects]
  );

  return (
    <FixedCostObjectsContext.Provider value={value}>
      {children}
    </FixedCostObjectsContext.Provider>
  );
}

/* ========= 4. Convenience hook ========= */
export function useFixedCostObjects() {
  return useContext(FixedCostObjectsContext);
}
