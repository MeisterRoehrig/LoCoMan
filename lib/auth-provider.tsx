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
import { FirebaseError } from "firebase/app";
import { toast } from "sonner";
import { defaultStepsData } from "@/lib/default-steps";
import {
  defaultEmployees,
  defaultFixedCost,
  defaultResourceCost,
} from "@/lib/default-fixed-cost";

// Helper function to generate username
function generateUsernameFromEmail(email: string) {
  if (!email || typeof email !== "string") return "user";
  const base = email.split("@")[0];
  return base.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20);
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

  // ----- SIGN UP -----
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
      return;
    }

    const userID = auth.currentUser?.uid;
    const userMail = auth.currentUser?.email ?? "unknown@mail.com";

    if (!userID) {
      throw new Error("UserID is undefined after sign-up.");
    }

    const userName = generateUsernameFromEmail(userMail);

    // 🔁 Create batch to set user doc + all default data
    const batch = writeBatch(firestore);

    // 1️⃣ Set the user document
    const userRef = doc(firestore, "users", userID);
    batch.set(userRef, {
      displayName: userName,
      email: userMail,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 2️⃣ Add default steps to /users/{uid}/steps/{stepId}
    for (const step of defaultStepsData) {
      const stepRef = doc(firestore, "users", userID, "steps", step.id);
      batch.set(stepRef, {
        name: step.name,
        person: step.person ?? "",
        personMonthlySalary: step.personMonthlySalary ?? 0,
        costDriver: step.costDriver ?? "",
        costDriverValue: step.costDriverValue ?? 0,
        stepDuration: step.stepDuration ?? 0,
        additionalResources: step.additionalResources ?? "",
        additionalResourcesValue: step.additionalResourcesValue ?? 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // 3️⃣ Add default employees to /users/{uid}/employees/{employeeId}
    for (const emp of defaultEmployees) {
      const empRef = doc(firestore, "users", userID, "employees", emp.id);
      batch.set(empRef, {
        jobtitel: emp.jobtitel,
        monthlySalaryEuro: emp.monthlySalaryEuro,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // 4️⃣ Add default fixed cost objects to /users/{uid}/fixedCostObjects/{fixedCostId}
    for (const cost of defaultFixedCost) {
      const costRef = doc(
        firestore,
        "users",
        userID,
        "fixedCostObjects",
        cost.id
      );
      batch.set(costRef, {
        costObjectName: cost.costObjectName,
        costPerMonthEuro: cost.costPerMonthEuro,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // 5️⃣ Add default resource cost objects to /users/{uid}/resources/{resourceId}
    for (const res of defaultResourceCost) {
      const resRef = doc(
        firestore,
        "users",
        userID,
        "resources",
        res.id
      );
      batch.set(resRef, {
        costObjectName: res.costObjectName,
        costPerMonthEuro: res.costPerMonthEuro,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // 6️⃣ Commit all writes
    await batch.commit();
    toast.success("User, default steps, employees, fixed costs, and resources created!");
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
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
