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
} from "@/components/ui/breadcrumb"

import ProtectedRoute from "@/components/protected-route"

export default function DashboardLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <ProtectedRoute>
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
                      Assistant
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          {/* Render the rest of the nested layouts/pages */}
          {children}
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  )
}
