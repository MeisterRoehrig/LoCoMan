"use client"

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
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger
} from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import Link from "next/link"

import { TreeView, TreeDataItem } from '@/components/ui/tree-view';
import { FolderOpen, FolderClosed, File, FilePen } from "lucide-react"
import { CirclePlus } from "lucide-react";
import { ScrollDiv } from "@/components/ui/scroll-div"

const data: TreeDataItem[] = [
  {
    id: '0',
    name: 'Beauftragung',
    actions: <Button className="p-0 m-0" size="icon" variant="ghost" onClick={() => console.log("confirmed")}><CirclePlus /></Button>,
    children: [
      {
        id: '1',
        name: 'Transportbedarf überprüfen',
      },
      {
        id: '2',
        name: 'Angebot vorbereiten und übermitteln',
      },
      {
        id: '3',
        name: 'Transportbedarf erfassen',
      },
    ],
  },
  {
    id: '4',
    name: 'Disposition',
    children: [
      {
        id: '5',
        name: 'Verfügbarkeit von Personal und Fuhrpark prüfen',
      },
      {
        id: '6',
        name: 'Tour planen',
      },
      {
        id: '7',
        name: 'Touren, Fahrzeuge und Fahrer disponieren',
      },
      {
        id: '8',
        name: 'Frachtpapiere vorbereiten',
      },
      {
        id: '9',
        name: 'Dokumente an Fahrer übermitteln',
      },
    ],
  },
  {
    id: '10',
    name: 'Beladung',
    children: [
      {
        id: '11',
        name: 'Zum Abholort fahren',
      },
      {
        id: '12',
        name: 'Verladepapiere an Erfassungsstelle übergeben',
      },
      {
        id: '13',
        name: 'Beladeplatz zuweisen',
      },
      {
        id: '14',
        name: 'Sendung überprüfen',
      },
      {
        id: '15',
        name: 'Sendung beladen',
      },
    ],
  },
  {
    id: '16',
    name: 'Transport',
    children: [
      {
        id: '17',
        name: 'Fahrerkarte einlesen',
      },
      {
        id: '18',
        name: 'Fahrzeugzustand prüfen und vorbereiten',
      },
      {
        id: '19',
        name: 'sendung transportieren',
      },
    ],
  },
  {
    id: '20',
    name: 'Entladung',
    children: [
      {
        id: '21',
        name: 'Sendung entladen',
      },
      {
        id: '22',
        name: 'Sendung überprüfen',
      },
      {
        id: '23',
        name: 'Sendung annehmen',
      },
    ],
  },
];

export default function Page() {
  return (
    <SidebarProvider className="h-screen p-0 m-0" >
      <AppSidebar />
      <SidebarInset >
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

        <ResizablePanelGroup
          direction="horizontal"
          className="flex-1 flex-col">
          <ResizablePanel defaultSize={25}>
            <ScrollDiv className="h-full">
              <TreeView className=" p-4 pt-0" data={data} initialSelectedItemId="0" expandAll={true} />
              <span className="font-semibold">Sidebar</span>
              <Input type="email" placeholder="Email" />
            </ScrollDiv>
          </ResizablePanel>
          {<ResizableHandle withHandle={false} />}
          <ResizablePanel defaultSize={75}>
            <ScrollArea type="scroll" className="flex-1 p-4 pt-0 rounded-md h-full">
              <span className="font-semibold">Sidebar</span>
              <div className="h-[600] w-[600] bg-accent"></div>
              <div className="h-[600] w-[600] bg-accent"></div>
              <div className="h-[600] w-[600] bg-accent"></div>
            </ScrollArea>
          </ResizablePanel>
        </ResizablePanelGroup>

      </SidebarInset>
    </SidebarProvider>
  )
}
