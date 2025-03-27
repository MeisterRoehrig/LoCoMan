"use client";

import { createContext, useContext, useEffect, useState, useMemo } from "react"
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  addDoc,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore"
import { firestore } from "@/lib/firebase-config"
import { useAuth } from "@/lib/auth-provider"
import { toast } from "sonner"

type Project = {
  id: string
  title: string
  description?: string
  createdAt?: Date | null
  updatedAt?: Date | null
}

interface UserProfile {
  displayName: string
  email: string
  avatarUrl?: string
}

interface DataContextProps {
  userProfile: UserProfile | null
  projects: Project[]
  loading: boolean
  createProject: (title: string, description: string) => Promise<void>
  deleteProject: (id: string) => Promise<void>
}

// Create the Context
const DataContext = createContext<DataContextProps>({
  userProfile: null,
  projects: [],
  loading: false,
  createProject: async () => {},
  deleteProject: async () => {},
})

export function DataProvider({ children }: { readonly children: React.ReactNode }) {
  const { user } = useAuth()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)

  // 1) Real-time subscription to the user doc in /users/{uid}
  useEffect(() => {
    if (!user || typeof user !== "object" || !user.uid) {
      setUserProfile(null)
      return
    }

    const userRef = doc(firestore, "users", user.uid)
    const unsub = onSnapshot(
      userRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data()
          setUserProfile({
            displayName: data.displayName || "Unknown",
            email: data.email || "",
            avatarUrl: data.avatarUrl || "/avatars/default.jpg",
          })
        } else {
          // If user doc doesn't exist
          setUserProfile(null)
        }
      },
      (error) => {
        console.error("Error loading user profile:", error)
        setUserProfile(null)
      }
    )

    return () => unsub()
  }, [user])

  // 2) Real-time subscription to the user’s projects
  useEffect(() => {
    if (!user || typeof user !== "object" || !user.uid) {
      setProjects([])
      return
    }

    setLoading(true)
    const q = query(
      collection(firestore, "users", user.uid, "projects"),
      orderBy("createdAt", "desc")
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const projectData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Project, "id">),
        }))
        setProjects(projectData)
        setLoading(false)
      },
      (error) => {
        console.error(error)
        toast.error("Failed to load projects.")
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user])

  // 3) Create a project
  async function createProject(title: string, description: string) {
    if (!user || typeof user !== "object" || !user.uid) return
    try {
      await addDoc(collection(firestore, "users", user.uid, "projects"), {
        title,
        description,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      toast.success("Project created successfully!")
    } catch (error) {
      console.error("Error creating project:", error)
      toast.error("Failed to create project.")
    }
  }

  // 4) Delete a project
  async function deleteProject(id: string) {
    if (!user || typeof user !== "object" || !user.uid) return
    try {
      await deleteDoc(doc(firestore, "users", user.uid, "projects", id))
      toast.success("Project deleted successfully!")
    } catch (error) {
      console.error("Error deleting project:", error)
      toast.error("Failed to delete project.")
    }
  }

  const contextValue = useMemo(
    () => ({
      userProfile,
      projects,
      loading,
      createProject,
      deleteProject,
    }),
    [userProfile, projects, loading]
  )

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  return useContext(DataContext)
}
