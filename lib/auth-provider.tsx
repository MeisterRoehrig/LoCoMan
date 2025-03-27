"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  ReactNode,
  useCallback,
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
  const login = useCallback(async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Logged in successfully!");
    } catch (error: unknown) {
      const firebaseError = error as FirebaseError;
      switch (firebaseError.code) {
        case "auth/user-not-found":
          toast.error("No user found with this email.");
          break;
        case "auth/wrong-password":
          toast.error("Incorrect password.");
          break;
        case "auth/invalid-email":
          toast.error("Please enter a valid email address.");
          break;
        default:
          toast.error("Login failed. Please try again.");
      }
    }
  }, []);

  // ----- SIGNUP -----
  const signup = useCallback(async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast.success("Account created successfully!");
    } catch (error: unknown) {
      const firebaseError = error as FirebaseError;
      switch (firebaseError.code) {
        case "auth/email-already-in-use":
          toast.error("This email is already registered.");
          break;
        case "auth/invalid-email":
          toast.error("Please enter a valid email address.");
          break;
        case "auth/weak-password":
          toast.error("Password should be at least 6 characters.");
          break;
        default:
          toast.error("Sign up failed. Please try again.");
      }
    }

    const userID = auth.currentUser?.uid;
    if (!userID) {
      throw new Error("UserID is undefined after sign-up.");
    }

    const userMail = auth.currentUser?.email ?? "e@mail.com";
    const userName = generateUsernameFromEmail(userMail);

    const batch = writeBatch(firestore);

    const userRef = doc(firestore, "users", userID);
    batch.set(userRef, {
      displayName: userName,
      email: userMail,
      createdAt: serverTimestamp(),
    });

    await batch.commit();
  }, []);

  // ----- LOGOUT -----
  const logout = useCallback(async () => {
    await signOut(auth);
    toast.success("Logged out successfully!");
  }, []);

  const contextValue = useMemo(
    () => ({
      user,
      login,
      signup,
      logout,
    }),
    [user, login, signup, logout]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
