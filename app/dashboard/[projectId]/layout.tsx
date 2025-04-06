"use client"

import React, { useEffect } from "react"
import { useParams } from "next/navigation"
import { useData } from "@/lib/data-provider"
import { DashboardContext } from "@/lib/dashboard-context" // <-- new import

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { projectId } = useParams() as { projectId: string }
  const { projects } = useData()

  // Find your project
  const project = projects.find((p) => p.id === projectId)
  const projectName = project?.title ?? "Unbekanntes Projekt"

  // Access the parent's context so we can set the breadcrumb
  const { setBreadcrumbTitle } = React.useContext(DashboardContext)

  useEffect(() => {
    setBreadcrumbTitle(projectName)
  }, [projectName, setBreadcrumbTitle])

  return <>{children}</>
}
