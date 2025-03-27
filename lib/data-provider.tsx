"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useState,
  useMemo,
} from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase-config"; // adjust import as needed
import { useAuth } from "@/lib/auth-provider";
import { toast } from "sonner";

// -- Project model
type Project = {
  id: string;
  title: string;
  description: string;
  createdAt?: any; // Firestore Timestamp
  updatedAt?: any; // Firestore Timestamp
};

interface DataContextProps {
  projects: Project[];
  loading: boolean;
  createProject: (title: string, description: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  // e.g. updateProject if you need it
}

// -- Create the DataContext with default values
const DataContext = createContext<DataContextProps>({
  projects: [],
  loading: false,
  createProject: async () => {},
  deleteProject: async () => {},
});

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Real-time subscription to the user's projects
  useEffect(() => {
    if (!user || !user.uid) {
      // if user is null or false, reset projects
      setProjects([]);
      return;
    }

    setLoading(true);
    const q = query(
      collection(firestore, "users", user.uid, "projects"),
      orderBy("createdAt", "desc")
    );

    // Subscribe to the "projects" subcollection in real time
    const unsubscribe = onSnapshot(
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

    return () => unsubscribe();
  }, [user]);

  // -- CREATE a project --
  async function createProject(title: string, description: string) {
    if (!user || !user.uid) return;
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

  // -- DELETE a project --
  async function deleteProject(id: string) {
    if (!user || !user.uid) return;
    try {
      await deleteDoc(doc(firestore, "users", user.uid, "projects", id));
      toast.success("Project deleted successfully!");
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project.");
    }
  }

  const contextValue = useMemo(
    () => ({
      projects,
      loading,
      createProject,
      deleteProject,
    }),
    [projects, loading]
  );

  return (
    <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
