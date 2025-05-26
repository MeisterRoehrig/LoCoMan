"use client"

import React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

import ProtectedRoute from "@/components/protected-route"
import {
  DashboardContext,
} from "@/lib/dashboard-context"  
import BreadcrumbProvider from "@/providers/breadcrumb-provider"

export default function DashboardLayout({
  children,
}: {
  readonly children: React.ReactNode
}) {
  const [breadcrumbTitle, setBreadcrumbTitle] = React.useState("Neues Projekt")

  const contextValue = React.useMemo(
    () => ({ breadcrumbTitle, setBreadcrumbTitle }),
    [breadcrumbTitle]
  )

  return (
    <ProtectedRoute>
      <DashboardContext.Provider value={contextValue}>
        <SidebarProvider className="h-screen p-0 m-0">
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2">
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1 cursor-pointer" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <BreadcrumbProvider/>
              </div>
            </header>
            {children}
          </SidebarInset>
        </SidebarProvider>
      </DashboardContext.Provider>
    </ProtectedRoute>
  )
}
