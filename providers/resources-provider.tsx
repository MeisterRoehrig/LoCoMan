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
export interface ResourceDoc {
  id: string;
  costObjectName: string;      // “cost objects name” per your spec
  costPerMonthEuro: number;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

/* ========= 2. Context interface ========= */
interface ResourcesContextValue {
  resources: ResourceDoc[];
  loadingResources: boolean;

  loadResources: () => Promise<void>;
  getResourceById: (id: string) => ResourceDoc | null;
  addResource: (data: Omit<ResourceDoc, "id">) => Promise<string | undefined>;
  addResourceWithId: (
    data: Omit<ResourceDoc, "id">,
    customId: string
  ) => Promise<string | undefined>;
  updateResource: (
    id: string,
    data: Partial<ResourceDoc>
  ) => Promise<void>;
  deleteResource: (id: string) => Promise<void>;
}

/* ========= 3. Context + Provider ========= */
const ResourcesContext = createContext<ResourcesContextValue>({
  resources: [],
  loadingResources: false,
  loadResources: async () => {},
  getResourceById: () => null,
  addResource: async () => undefined,
  addResourceWithId: async () => undefined,
  updateResource: async () => {},
  deleteResource: async () => {},
});

export function ResourcesProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  const { user } = useAuth();
  const [resources, setResources] = useState<ResourceDoc[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);

  /* ---------- 3.1 Load ---------- */
  async function loadResources() {
    if (!user || typeof user !== "object" || !("uid" in user)) return;
    setLoadingResources(true);
    try {
      const ref = collection(firestore, "users", user.uid, "resources");
      const snap = await getDocs(ref);
      const docs: ResourceDoc[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          costObjectName: data.costObjectName || "",
          costPerMonthEuro: data.costPerMonthEuro ?? 0,
          createdAt: data.createdAt?.toDate() ?? null,
          updatedAt: data.updatedAt?.toDate() ?? null,
        };
      });
      setResources(docs);
    } catch (err) {
      console.error("Error loading resources:", err);
      toast.error("Failed to load resources.");
    } finally {
      setLoadingResources(false);
    }
  }

  /* ---------- 3.2 Helpers ---------- */
  function getResourceById(id: string) {
    return resources.find((r) => r.id === id) ?? null;
  }

  /* ---------- 3.3 Create ---------- */
  async function addResource(
    data: Omit<ResourceDoc, "id">
  ): Promise<string | undefined> {
    if (!user || typeof user !== "object" || !("uid" in user)) return;
    try {
      const ref = collection(firestore, "users", user.uid, "resources");
      const docRef = await addDoc(ref, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success("Resource added!");
      await loadResources();
      return docRef.id;
    } catch (err) {
      console.error("Error adding resource:", err);
      toast.error("Failed to add resource.");
    }
  }

  async function addResourceWithId(
    data: Omit<ResourceDoc, "id">,
    customId: string
  ): Promise<string | undefined> {
    if (!user || typeof user !== "object" || !("uid" in user)) return;
    try {
      const ref = doc(firestore, "users", user.uid, "resources", customId);
      await setDoc(ref, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success("Resource added!");
      await loadResources();
      return ref.id;
    } catch (err) {
      console.error("Error adding resource with ID:", err);
      toast.error("Failed to add resource.");
    }
  }

  /* ---------- 3.4 Update ---------- */
  async function updateResource(
    id: string,
    data: Partial<ResourceDoc>
  ) {
    if (!user || typeof user !== "object" || !("uid" in user)) return;
    try {
      const ref = doc(firestore, "users", user.uid, "resources", id);
      await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
      toast.success("Resource updated!");
      await loadResources();
    } catch (err) {
      console.error("Error updating resource:", err);
      toast.error("Failed to update resource.");
    }
  }

  /* ---------- 3.5 Delete ---------- */
  async function deleteResource(id: string) {
    if (!user || typeof user !== "object" || !("uid" in user)) return;
    try {
      const ref = doc(firestore, "users", user.uid, "resources", id);
      await deleteDoc(ref);
      toast.success("Resource deleted.");
      setResources((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Error deleting resource:", err);
      toast.error("Failed to delete resource.");
    }
  }

  /* ---------- 3.6 Auto-load on mount ---------- */
  useEffect(() => {
    if (!user || typeof user !== "object" || !("uid" in user)) {
      loadResources();
    } else {
      setResources([]);
    }
  }, [user]);

  const value = useMemo<ResourcesContextValue>(
    () => ({
      resources,
      loadingResources,
      loadResources,
      getResourceById,
      addResource,
      addResourceWithId,
      updateResource,
      deleteResource,
    }),
    [resources, loadingResources]
  );

  return (
    <ResourcesContext.Provider value={value}>
      {children}
    </ResourcesContext.Provider>
  );
}

/* ========= 4. Convenience hook ========= */
export function useResources() {
  return useContext(ResourcesContext);
}
