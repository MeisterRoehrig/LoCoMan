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
import { Input } from "@/components/ui/input"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"


export default function Page() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">
                    Neues Projekt
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

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <ResizablePanelGroup
            direction="horizontal"
            className="min-h-[200px] rounded-lg md:min-w-[450px]"
          >
            <ResizablePanel defaultSize={25} >
              <div className="flex h-full items-center justify-center">
                <div className="flex flex-1 flex-col gap-4 pt-2">
                  <div className="min-h-[100px] rounded-xl bg-muted/50" />
                  <div className="min-h-[100px] rounded-xl bg-muted/50" />
                  <div className="min-h-[100px] rounded-xl bg-muted/50" />
                  <span className="font-semibold">Sidebar</span>
                  <Input type="email" placeholder="Email" />
                </div>

              </div>
            </ResizablePanel>
            {/* <ResizableHandle withHandle={false} /> */}
            <ResizablePanel defaultSize={75}>
              <div className="flex h-full items-center justify-center p-6">
                <span className="font-semibold">Content</span>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

      </SidebarInset>
    </SidebarProvider>
  )
}
