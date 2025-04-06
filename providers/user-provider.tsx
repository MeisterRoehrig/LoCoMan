"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  ReactNode,
} from "react";
import { doc, getDoc } from "firebase/firestore";
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

const UserContext = createContext<UserContextValue>({
  userProfile: null,
  loadingUser: true,
});

export function UserProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth(); // tri-state: false | null | FirebaseUser
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    // Wait for auth to resolve
    if (user === false) {
      setLoadingUser(true);
      return;
    }

    // Not logged in
    if (!user) {
      setUserProfile(null);
      setLoadingUser(false);
      return;
    }

    // Logged in – fetch user doc
    const fetchUserProfile = async () => {
      try {
        const userRef = doc(firestore, "users", user.uid);
        const snapshot = await getDoc(userRef);

        if (!snapshot.exists()) {
          console.warn("User profile not found in Firestore.");
          setUserProfile(null);
        } else {
          const data = snapshot.data();
          setUserProfile({
            displayName: data.displayName ?? "Unknown",
            email: data.email ?? "",
            avatarUrl: data.avatarUrl ?? "/avatars/default.jpg",
          });
        }
      } catch (err) {
        console.error("Failed to load user profile:", err);
        setUserProfile(null);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  const value = useMemo(
    () => ({
      userProfile,
      loadingUser,
    }),
    [userProfile, loadingUser]
  );

  return (
    <UserContext.Provider value={value}>{children}</UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
