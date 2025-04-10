"use client";

import React from "react";
import { UserProvider } from "@/providers/user-provider";
import { ProjectsProvider } from "@/providers/projects-provider";
import { TreeProvider } from "@/providers/tree-provider";
import { StepsProvider } from "@/providers/steps-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <ProjectsProvider>
        <StepsProvider>
          <TreeProvider>
            {children}
          </TreeProvider>
        </StepsProvider>
      </ProjectsProvider>
    </UserProvider>
  );
}
