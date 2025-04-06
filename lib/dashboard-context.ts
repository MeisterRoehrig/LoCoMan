"use client"

import React from "react"

export type DashboardContextProps = {
  breadcrumbTitle: string
  setBreadcrumbTitle: (title: string) => void
}

export const DashboardContext = React.createContext<DashboardContextProps>({
  breadcrumbTitle: "Neues Projekt",
  setBreadcrumbTitle: () => {},
})
