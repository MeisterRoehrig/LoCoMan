"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useRef,
} from "react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  addDoc,
  serverTimestamp,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase-config";
import { useAuth } from "@/lib/auth-provider";
import { toast } from "sonner";

/** Basic shape for "Project" documents in Firestore */
export type Project = {
  id: string;
  title: string;
  description?: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

/** Minimal user profile shape — can expand later if needed */
interface UserProfile {
  displayName: string;
  email: string;
  avatarUrl?: string;
}

/**
 * TreeDataItem for your process steps, tasks,
 * or nodes in a hierarchical tree
 */
export type TreeDataItem = {
  id: string;
  parentId?: string | null; // If you want to track a parent node
  name: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;

  // New fields for "details" editing
  responsiblePerson?: string | null;
  executionTime?: number | null; // e.g. hours or days
  costDriverLabel?: string | null;
  costDriverValue?: number | null;
  helperLabel?: string | null;
  helperValue?: number | null;
  sum?: number | null;
};

/** The shape of our DataContext, including new tree-related methods and state */
interface DataContextProps {
  userProfile: UserProfile | null;
  projects: Project[];
  loading: boolean;
  trees: Record<string, TreeDataItem[]>;

  createProject: (title: string, description: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  createTreeItem: (projectId: string, name: string, parentId?: string) => Promise<void>;
  deleteTreeItem: (projectId: string, itemId: string) => Promise<void>;

  /** Update (partial) fields on an existing tree item */
  updateTreeItem: (
    projectId: string,
    itemId: string,
    data: Partial<TreeDataItem>
  ) => Promise<void>;
}

/** Create the Context */
const DataContext = createContext<DataContextProps>({
  userProfile: null,
  projects: [],
  loading: false,
  trees: {},
  createProject: async () => {},
  deleteProject: async () => {},
  createTreeItem: async () => {},
  deleteTreeItem: async () => {},
  updateTreeItem: async () => {},
});

export function DataProvider({ children }: { readonly children: React.ReactNode }) {
  const { user } = useAuth();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * We store all tree items for each project in a dictionary, keyed by projectId.
   * For example: { [projectId]: ArrayOfTreeDataItems }
   */
  const [trees, setTrees] = useState<Record<string, TreeDataItem[]>>({});

  // Track unsubscribers for each project’s tree
  const treeUnsubscribers = useRef<Record<string, () => void>>({});

  // 1) Real-time subscription to the user doc in /users/{uid}
  useEffect(() => {
    if (!user || typeof user !== "object" || !user.uid) {
      setUserProfile(null);
      return;
    }

    const userRef = doc(firestore, "users", user.uid);
    const unsubUser = onSnapshot(
      userRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setUserProfile({
            displayName: data.displayName || "Unknown",
            email: data.email || "",
            avatarUrl: data.avatarUrl || "/avatars/default.jpg",
          });
        } else {
          setUserProfile(null);
        }
      },
      (error) => {
        console.error("Error loading user profile:", error);
        setUserProfile(null);
      }
    );

    return () => unsubUser();
  }, [user]);

  // 2) Real-time subscription to the user’s projects
  useEffect(() => {
    if (!user || typeof user !== "object" || !user.uid) {
      setProjects([]);
      return;
    }

    setLoading(true);
    const q = query(
      collection(firestore, "users", user.uid, "projects"),
      orderBy("createdAt", "desc")
    );

    const unsubscribeProjects = onSnapshot(
      q,
      (snapshot) => {
        const projectData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Project, "id">),
        }));
        setProjects(projectData);
        setLoading(false);
      },
      (error) => {
        console.error(error);
        toast.error("Failed to load projects.");
        setLoading(false);
      }
    );

    return () => unsubscribeProjects();
  }, [user]);

  // 3) Subscribe to the "tree" subcollection of each project
  useEffect(() => {
    // Clean up existing subscriptions
    Object.values(treeUnsubscribers.current).forEach((unsub) => unsub());
    treeUnsubscribers.current = {};

    if (!user || typeof user !== "object" || !user.uid || projects.length === 0) {
      setTrees({});
      return;
    }

    projects.forEach((proj) => {
      const treeCollectionRef = collection(
        firestore,
        "users",
        user.uid,
        "projects",
        proj.id,
        "tree"
      );

      const q = query(treeCollectionRef, orderBy("createdAt", "asc"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const treeItems = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<TreeDataItem, "id">),
        }));
        setTrees((prev) => ({
          ...prev,
          [proj.id]: treeItems,
        }));
      });

      treeUnsubscribers.current[proj.id] = unsubscribe;
    });

    return () => {
      Object.values(treeUnsubscribers.current).forEach((unsub) => unsub());
      treeUnsubscribers.current = {};
    };
  }, [user, projects]);

  // 4) Create a project
  async function createProject(title: string, description: string) {
    if (!user || typeof user !== "object" || !user.uid) return;
    try {
      await addDoc(collection(firestore, "users", user.uid, "projects"), {
        title,
        description,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success("Project created successfully!");
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("Failed to create project.");
    }
  }

  // 5) Delete a project
  async function deleteProject(id: string) {
    if (!user || typeof user !== "object" || !user.uid) return;
    try {
      await deleteDoc(doc(firestore, "users", user.uid, "projects", id));
      toast.success("Project deleted successfully!");
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project.");
    }
  }

  // 6) Create a new item in a project's tree
  async function createTreeItem(projectId: string, name: string, parentId?: string) {
    if (!user || typeof user !== "object" || !user.uid) return;
    try {
      const treeColl = collection(
        firestore,
        "users",
        user.uid,
        "projects",
        projectId,
        "tree"
      );

      await addDoc(treeColl, {
        name,
        parentId: parentId || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success(`Tree item '${name}' created!`);
    } catch (error) {
      console.error("Error creating tree item:", error);
      toast.error("Failed to create tree item.");
    }
  }

  // 7) Delete an item from a project's tree
  async function deleteTreeItem(projectId: string, itemId: string) {
    if (!user || typeof user !== "object" || !user.uid) return;
    try {
      const docRef = doc(
        firestore,
        "users",
        user.uid,
        "projects",
        projectId,
        "tree",
        itemId
      );
      await deleteDoc(docRef);
      toast.success(`Tree item deleted!`);
    } catch (error) {
      console.error("Error deleting tree item:", error);
      toast.error("Failed to delete tree item.");
    }
  }

  /**
   * 8) Update fields of an existing tree item (partial update).
   *    Firestore does not allow `undefined` for fields, so we remove them.
   */
  async function updateTreeItem(projectId: string, itemId: string, data: Partial<TreeDataItem>) {
    if (!user || typeof user !== "object" || !user.uid) return;

    // Remove any undefined fields to avoid "Unsupported field value" error
    const updateData = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined)
    );

    try {
      const docRef = doc(
        firestore,
        "users",
        user.uid,
        "projects",
        projectId,
        "tree",
        itemId
      );
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
      });
      // Optionally toast here
      // toast.success("Tree item updated!");
    } catch (error) {
      console.error("Error updating tree item:", error);
      toast.error("Failed to update tree item.");
    }
  }

  const contextValue = useMemo(
    () => ({
      userProfile,
      projects,
      loading,
      trees,
      createProject,
      deleteProject,
      createTreeItem,
      deleteTreeItem,
      updateTreeItem,
    }),
    [userProfile, projects, loading, trees]
  );

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
