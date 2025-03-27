"use client";

import { ReactNode, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-provider";
import Loader from "@/components/loader";


export default function ProtectedRoute({ children }: Readonly<{ children: ReactNode }>) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (user === false) {
      // still loading, do nothing yet
      return;
    }
    if (user === null) {
      // not logged in, redirect to /login?redirect=the-current-page
      router.replace(`/login?redirect=${pathname}`);
    }
    // if user is an actual Firebase user, do nothing (render children)
  }, [user, router, pathname]);

  // While checking user is false (loading), render some fallback or spinner
  if (user === false) {
    return (
      <Loader show></Loader>
    )
  }

  // If user is null, we might be in the midst of a redirect, so show nothing or a spinner
  if (user === null) {
    return null;
  }

  return <>{children}</>;
}
