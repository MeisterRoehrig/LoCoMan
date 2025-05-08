"use client";

import React from "react";
import { UserProvider } from "@/providers/user-provider";
import { ProjectsProvider } from "@/providers/projects-provider";
import { TreeProvider } from "@/providers/tree-provider";
import { StepsProvider } from "@/providers/steps-provider";
import { EmployeesProvider } from "@/providers/employees-provider";
import { FixedCostObjectsProvider } from "@/providers/fixed-cost-provider";
import { ResourcesProvider  } from "@/providers/resources-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <ProjectsProvider>
        <StepsProvider>
          <EmployeesProvider>
            <FixedCostObjectsProvider>
              <ResourcesProvider>
                <TreeProvider>
                  {children}
                </TreeProvider>
              </ResourcesProvider>
            </FixedCostObjectsProvider>
          </EmployeesProvider>
        </StepsProvider>
      </ProjectsProvider>
    </UserProvider>
  );
}
