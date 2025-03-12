"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSigninCheck } from "reactfire";
import { IndeterminateProgressBar } from "@/components/Indeterminate-progress";

export default function ProtectedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const { status, data: signInCheckResult } = useSigninCheck();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Wait until we have user sign-in state before redirecting
        if (status === "success") {
            const isSignedIn = signInCheckResult?.signedIn;

            // If not signed in and not on a public route, push to /auth/login
            if (!isSignedIn && !pathname.startsWith("/auth")) {
                router.replace("/auth");
            }
        }
    }, [status, signInCheckResult, pathname, router]);


    // While checking auth state
    if (status === "loading") {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="flex items-center justify-center max-w-[500px] w-full">
                    <IndeterminateProgressBar />
                </div>
            </div>
        )
    }

    // If signInCheckResult has loaded and user is NOT signed in, do not render children
    // (We already triggered a redirect in the effect above, but this ensures no content is shown at all.)
    if (!signInCheckResult.signedIn) {
        return <div>Unauthorized</div>;
    }

    // Otherwise, render the protected content
    return <>{children}</>;
}
