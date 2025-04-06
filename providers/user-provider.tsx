"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  ReactNode,
} from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { firestore } from "@/lib/firebase-config";
import { useAuth } from "@/lib/auth-provider";

interface UserProfile {
  displayName: string;
  email: string;
  avatarUrl?: string;
}

interface UserContextValue {
  userProfile: UserProfile | null;
  loadingUser: boolean;
}

/**
 * Context + Provider
 */
const UserContext = createContext<UserContextValue>({
  userProfile: null,
  loadingUser: true,
});

export function UserProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    if (!user || !user.uid) {
      setUserProfile(null);
      setLoadingUser(false);
      return;
    }

    setLoadingUser(true);
    const userRef = doc(firestore, "users", user.uid);
    const unsubscribe = onSnapshot(
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
        setLoadingUser(false);
      },
      (error) => {
        console.error("Error loading user profile:", error);
        setUserProfile(null);
        setLoadingUser(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const value = useMemo(
    () => ({
      userProfile,
      loadingUser,
    }),
    [userProfile, loadingUser]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

/** Convenience hook */
export function useUser() {
  return useContext(UserContext);
}
