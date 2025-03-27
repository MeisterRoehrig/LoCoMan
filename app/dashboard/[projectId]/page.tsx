"use client"

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

import { useParams } from "next/navigation"
import { useData } from "@/lib/data-provider"

import { ScrollArea } from "@/components/ui/scroll-area"
import { buttonVariants } from "@/components/ui/button"

import Link from "next/link"

import { TreeView, TreeDataItem } from '@/components/ui/tree-view';
import { CirclePlus } from "lucide-react";
import { ScrollDiv } from "@/components/ui/scroll-div"
import Loader from "@/components/loader"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

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
    ],
  },
];

export default function Page() {
  const { projectId } = useParams()
  const { projects } = useData()
  const project = projects.find((p) => p.id === projectId)
  if (!project) return <Loader show></Loader>

  return (

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
          <Separator className="mb-2" />
          <span className="font-semibold">Zuständiger</span>
          <div className="flex space-x-4 pt-2">
            <Input type="text" placeholder="Vertriebsmitarbeiter" />
            <Input type="number" placeholder="29,76" />
          </div>
          <Separator className="mt-4" />
          <span className="font-semibold">Durchführungszeit</span>
          <div className="flex space-x-4 pt-2">
            <Input type="number" placeholder="5" />
          </div>
          <Separator className="mt-4" />
          <span className="font-semibold">Kostentreiber</span>
          <div className="flex space-x-4 pt-2">
            <Input type="text" placeholder="Anzahl Angebote" />
            <Input type="number" placeholder="504" />
          </div>
          <Separator className="mt-4" />
          <span className="font-semibold">Hilfsmittel</span>
          <div className="flex space-x-4 pt-2">
            <Input type="text" placeholder="Tachograph" />
            <Input type="number" placeholder="700" />
          </div>
          <Separator className="mt-4" />
          <span className="font-semibold">Summe</span>
          <div className="flex space-x-4 pt-2">
            <Input type="number" placeholder="360" />
          </div>
        </ScrollArea>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
