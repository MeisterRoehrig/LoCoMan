"use client"

import React, { useEffect } from "react"
import { useParams } from "next/navigation"
import { useData } from "@/lib/data-provider"
import { DashboardContext } from "../layout"

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

  // Set the parent's breadcrumb when this layout mounts or changes project
  useEffect(() => {
    setBreadcrumbTitle(projectName)
    // reset or leave as-is when unmounting? up to you.
  }, [projectName, setBreadcrumbTitle])

  // We don't render a new header – it's handled by the parent
  return <>{children}</>
}
