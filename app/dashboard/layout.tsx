"use client"

import React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

import ProtectedRoute from "@/components/protected-route"

// 1) Create a context for storing the current project's name (breadcrumbTitle)
type DashboardContextProps = {
  breadcrumbTitle: string
  setBreadcrumbTitle: (title: string) => void
}

export const DashboardContext = React.createContext<DashboardContextProps>({
  breadcrumbTitle: "Neues Projekt",
  setBreadcrumbTitle: () => {},
})

export default function DashboardLayout({ children }: { readonly children: React.ReactNode }) {
  // 2) Use React state to store the current breadcrumb title
  const [breadcrumbTitle, setBreadcrumbTitle] = React.useState("Neues Projekt")

  const contextValue = React.useMemo(() => ({ breadcrumbTitle, setBreadcrumbTitle }), [breadcrumbTitle, setBreadcrumbTitle]);

  return (
    <ProtectedRoute>
      {/* Provide the breadcrumb state to all children */}
      <DashboardContext.Provider value={contextValue}>
        <SidebarProvider className="h-screen p-0 m-0">
          <AppSidebar />
          <SidebarInset>
            {/* --- Header in PARENT layout --- */}
            <header className="flex h-16 shrink-0 items-center gap-2">
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />

                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="#">
                        {breadcrumbTitle}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Dateneingabe</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>

            {/* Render the rest of the nested layouts/pages */}
            {children}
          </SidebarInset>
        </SidebarProvider>
      </DashboardContext.Provider>
    </ProtectedRoute>
  )
}
