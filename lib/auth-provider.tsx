"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
} from "firebase/auth";
import {
  doc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { auth, firestore } from "@/lib/firebase-config";
import { FirebaseError } from "firebase/app"
import { toast } from "sonner"



// Helper function to generate username
function generateUsernameFromEmail(email: string) {
  if (!email || typeof email !== 'string') return "user";
  const base = email.split('@')[0];
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // remove special chars
    .slice(0, 20); // limit to 20 chars
}

// Type to handle loading, logged out, or logged-in user
type AuthState = false | null | FirebaseUser;

interface AuthContextProps {
  user: AuthState;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({
  user: false,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { readonly children: ReactNode }) {
  const [user, setUser] = useState<AuthState>(false);

  useEffect(() => {
    // Subscribe to user changes once
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // ----- LOGIN -----
  async function login(email: string, password: string) {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Logged in successfully!s")
    } catch (error: unknown) {
      const firebaseError = error as FirebaseError
      switch (firebaseError.code) {
        case "auth/user-not-found":
          toast.error("No user found with this email.")
          break
        case "auth/wrong-password":
          toast.error("Incorrect password.")
          break
        case "auth/invalid-email":
          toast.error("Please enter a valid email address.")
          break
        default:
          toast.error("Login failed. Please try again.")
      }
    }
  }

  // ----- SIGNUP -----
  async function signup(email: string, password: string) {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast.success("Account created successfully!")
    } catch (error: unknown) {
      const firebaseError = error as FirebaseError
      switch (firebaseError.code) {
        case "auth/email-already-in-use":
          toast.error("This email is already registered.")
          break
        case "auth/invalid-email":
          toast.error("Please enter a valid email address.")
          break
        case "auth/weak-password":
          toast.error("Password should be at least 6 characters.")
          break
        default:
          toast.error("Sign up failed. Please try again.")
      }
    }
    

    // 2) Firestore logic (example: create "users" doc + some sample projects)
    const userID = auth.currentUser?.uid;
    if (!userID) {
      throw new Error("UserID is undefined after sign-up.");
    }

    const userMail = auth.currentUser?.email ?? 'e@mail.com';
    const userName = generateUsernameFromEmail(userMail);

    const batch = writeBatch(firestore);

    // Create doc in /users/{userID} with basic fields
    const userRef = doc(firestore, 'users', userID);
    batch.set(userRef, {
      displayName: userName,
      email: userMail,
      createdAt: serverTimestamp(),
    });

    // Example of creating some “projects” subcollection
    const exampleProjects = [
      {
        title: 'Project Alpha',
        description: 'First project description',
        texts: [
          { content: 'Hello world from Alpha 1' },
          { content: 'Another piece of Alpha text' }
        ]
      },
      {
        title: 'Project Beta',
        description: 'Second project details',
        texts: [
          { content: 'Beta text A' },
          { content: 'Beta text B with more depth' }
        ]
      }
    ];

    exampleProjects.forEach((project, pIndex) => {
      const projectId = `project-${pIndex + 1}`;
      const projectRef = doc(firestore, 'users', userID, 'projects', projectId);
      batch.set(projectRef, {
        title: project.title,
        description: project.description,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Add “texts” subcollection
      project.texts.forEach((text, tIndex) => {
        const textId = `text-${tIndex + 1}`;
        const textRef = doc(firestore, 'users', userID, 'projects', projectId, 'texts', textId);

        batch.set(textRef, {
          content: text.content,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });
    });

    // Commit the batch
    await batch.commit();
  }

  // ----- LOGOUT -----
  async function logout() {
    await signOut(auth);
    toast.success("Logged out successfully!s")

  }

  const contextValue = useMemo(() => ({
    user,
    login,
    signup,
    logout,
  }), [user, login, signup, logout]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
