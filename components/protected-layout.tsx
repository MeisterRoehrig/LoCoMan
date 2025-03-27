"use client"

import React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger
} from "@/components/ui/sidebar"

import ProtectedRoute from "@/components/protected-route"

interface ProtectedLayoutProps {
  readonly children: React.ReactNode
  readonly breadcrumbTitle?: string
}

/**
 * Shows a sidebar, a top bar with breadcrumb, and protected routing.
 * If breadcrumbTitle is specified, it replaces the default "Neues Projekt".
 */
export default function ProtectedLayout({
  children,
  breadcrumbTitle = "Neues Projekt",
}: ProtectedLayoutProps) {
  return (
    <ProtectedRoute>
      <SidebarProvider className="h-screen p-0 m-0">
        <AppSidebar />
        <SidebarInset>
          {/* ---- Top Bar ---- */}
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

          {/* ---- Main Content ---- */}
          {children}
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  )
}
