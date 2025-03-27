"use client"

import {
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

export default function Page() {
  return (

        <ResizablePanelGroup
          direction="horizontal"
          className="flex-1 flex-col">
          <ResizablePanel defaultSize={25}>

          </ResizablePanel>
        </ResizablePanelGroup>
  )
}
