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
  SidebarProvider,
  SidebarTrigger
} from "@/components/ui/sidebar"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

import { ScrollArea } from "@/components/ui/scroll-area"
import { buttonVariants } from "@/components/ui/button"

import Link from "next/link"

import { TreeView, TreeDataItem } from '@/components/ui/tree-view';
import { CirclePlus } from "lucide-react";
import { ScrollDiv } from "@/components/ui/scroll-div"

const data: TreeDataItem[] = [
  {
    id: '0',
    name: 'Beauftragung',
    actions: (
      <div className="flex">
        <Link className={buttonVariants({ variant: "link" })} href={"javascript:void(0)"} onClick={() => console.log("confirmed")}><CirclePlus /></Link>
      </div>
    ),

    children: [
      {
        id: '1',
        name: 'Transportbedarf überprüfen',
        actions: (
          <div className="flex">
            <Link className={buttonVariants({ variant: "link" })} href={"javascript:void(0)"} onClick={() => console.log("confirmed")}><CirclePlus /></Link>
          </div>
        ),
      },
      {
        id: '2',
        name: 'Angebot vorbereiten und übermitteln',
        actions: (
          <div className="flex">
            <Link className={buttonVariants({ variant: "link" })} href={"javascript:void(0)"} onClick={() => console.log("confirmed")}><CirclePlus /></Link>
          </div>
        ),
      },
      {
        id: '3',
        name: 'Transportbedarf erfassen',
        actions: (
          <div className="flex">
            <Link className={buttonVariants({ variant: "link" })} href={"javascript:void(0)"} onClick={() => console.log("confirmed")}><CirclePlus /></Link>
          </div>
        ),
      },
    ],
  },
  {
    id: '4',
    name: 'Disposition',
    actions: (
      <div className="flex">
        <Link className={buttonVariants({ variant: "link" })} href={"javascript:void(0)"} onClick={() => console.log("confirmed")}><CirclePlus /></Link>
      </div>
    ),
    children: [
      {
        id: '5',
        name: 'Verfügbarkeit von Personal und Fuhrpark prüfen',
        actions: (
          <div className="flex">
            <Link className={buttonVariants({ variant: "link" })} href={"javascript:void(0)"} onClick={() => console.log("confirmed")}><CirclePlus /></Link>
          </div>
        ),
      },
      {
        id: '6',
        name: 'Tour planen',
        actions: (
          <div className="flex">
            <Link className={buttonVariants({ variant: "link" })} href={"javascript:void(0)"} onClick={() => console.log("confirmed")}><CirclePlus /></Link>
          </div>
        ),
      },
      {
        id: '7',
        name: 'Touren, Fahrzeuge und Fahrer disponieren',
        actions: (
          <div className="flex">
            <Link className={buttonVariants({ variant: "link" })} href={"javascript:void(0)"} onClick={() => console.log("confirmed")}><CirclePlus /></Link>
          </div>
        ),
      },
      {
        id: '8',
        name: 'Frachtpapiere vorbereiten',
        actions: (
          <div className="flex">
            <Link className={buttonVariants({ variant: "link" })} href={"javascript:void(0)"} onClick={() => console.log("confirmed")}><CirclePlus /></Link>
          </div>
        ),
      },
      {
        id: '9',
        name: 'Dokumente an Fahrer übermitteln',
        actions: (
          <div className="flex">
            <Link className={buttonVariants({ variant: "link" })} href={"javascript:void(0)"} onClick={() => console.log("confirmed")}><CirclePlus /></Link>
          </div>
        ),
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
        actions: (
          <div className="flex">
            <Link className={buttonVariants({ variant: "link" })} href={"javascript:void(0)"} onClick={() => console.log("confirmed")}><CirclePlus /></Link>
          </div>
        ),
      },
      {
        id: '12',
        name: 'Verladepapiere an Erfassungsstelle übergeben',
        actions: (
          <div className="flex">
            <Link className={buttonVariants({ variant: "link" })} href={"javascript:void(0)"} onClick={() => console.log("confirmed")}><CirclePlus /></Link>
          </div>
        ),
      },
      {
        id: '13',
        name: 'Beladeplatz zuweisen',
        actions: (
          <div className="flex">
            <Link className={buttonVariants({ variant: "link" })} href={"javascript:void(0)"} onClick={() => console.log("confirmed")}><CirclePlus /></Link>
          </div>
        ),
      },
      {
        id: '14',
        name: 'Sendung überprüfen',
        actions: (
          <div className="flex">
            <Link className={buttonVariants({ variant: "link" })} href={"javascript:void(0)"} onClick={() => console.log("confirmed")}><CirclePlus /></Link>
          </div>
        ),
      },
      {
        id: '15',
        name: 'Sendung beladen',
        actions: (
          <div className="flex">
            <Link className={buttonVariants({ variant: "link" })} href={"javascript:void(0)"} onClick={() => console.log("confirmed")}><CirclePlus /></Link>
          </div>
        ),
      },
    ],
  },
  {
    id: '16',
    name: 'Transport',
    actions: (
      <div className="flex">
        <Link className={buttonVariants({ variant: "link" })} href={"javascript:void(0)"} onClick={() => console.log("confirmed")}><CirclePlus /></Link>
      </div>
    ),
    children: [
      {
        id: '17',
        name: 'Fahrerkarte einlesen',
        actions: (
          <div className="flex">
            <Link className={buttonVariants({ variant: "link" })} href={"javascript:void(0)"} onClick={() => console.log("confirmed")}><CirclePlus /></Link>
          </div>
        ),
      },
      {
        id: '18',
        name: 'Fahrzeugzustand prüfen und vorbereiten',
        actions: (
          <div className="flex">
            <Link className={buttonVariants({ variant: "link" })} href={"javascript:void(0)"} onClick={() => console.log("confirmed")}><CirclePlus /></Link>
          </div>
        ),
      },
      {
        id: '19',
        name: 'sendung transportieren',
        actions: (
          <div className="flex">
            <Link className={buttonVariants({ variant: "link" })} href={"javascript:void(0)"} onClick={() => console.log("confirmed")}><CirclePlus /></Link>
          </div>
        ),
      },
    ],
  },
  {
    id: '20',
    name: 'Entladung',
    actions: (
      <div className="flex">
        <Link className={buttonVariants({ variant: "link" })} href={"javascript:void(0)"} onClick={() => console.log("confirmed")}><CirclePlus /></Link>
      </div>
    ),
    children: [
      {
        id: '21',
        name: 'Sendung entladen',
        actions: (
          <div className="flex">
            <Link className={buttonVariants({ variant: "link" })} href={"javascript:void(0)"} onClick={() => console.log("confirmed")}><CirclePlus /></Link>
          </div>
        ),
      },
      {
        id: '22',
        name: 'Sendung überprüfen',
        actions: (
          <div className="flex">
            <Link className={buttonVariants({ variant: "link" })} href={"javascript:void(0)"} onClick={() => console.log("confirmed")}><CirclePlus /></Link>
          </div>
        ),
      },
      {
        id: '23',
        name: 'Sendung annehmen',
        actions: (
          <div className="flex">
            <Link className={buttonVariants({ variant: "link" })} href={"javascript:void(0)"} onClick={() => console.log("confirmed")}><CirclePlus /></Link>
          </div>
        ),
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
            </ScrollDiv>
          </ResizablePanel>
          {<ResizableHandle withHandle={false} />}
          <ResizablePanel defaultSize={75}>
            <ScrollArea type="scroll" className="flex-1 p-4 pt-0 rounded-md h-full">
              <span className="font-semibold">Sidebar</span>

            </ScrollArea>
          </ResizablePanel>
        </ResizablePanelGroup>

      </SidebarInset>
    </SidebarProvider>
  )
}
