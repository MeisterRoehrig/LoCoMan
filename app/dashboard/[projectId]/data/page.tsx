"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";

import { ScrollArea } from "@/components/ui/scroll-area";
import { ScrollDiv } from "@/components/ui/scroll-div";

import { Separator } from "@/components/ui/separator";

import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";


import { Minus, Plus } from "lucide-react";
import { SidebarContent, SidebarGroup, SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel, SidebarMenuAction, SidebarMenuButton, SidebarMenuSub, SidebarMenuSubItem } from "@/components/ui/sidebar";

import { useTree } from "@/providers/tree-provider";
import { useFixedTree } from "@/providers/fixed-tree-provider";   // ← add this line
import { DropdownMenu } from "@radix-ui/react-dropdown-menu";
import { useAuth } from "@/lib/auth-provider";
import { useSteps } from "@/providers/steps-provider";
import { NewStepDialog } from "@/components/new-step-dialog";
import StepDetails from "@/components/step-details";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import FixedCostSection from "@/components/fixed-cost-details";



export default function Page() {
    const params = useParams();
    const projectId = String(params.projectId);
    const { user } = useAuth();
    const { getStepById, updateStep } = useSteps();
    const { loadFixedTree } = useFixedTree();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

    const [viewMode, setViewMode] = useState<"step" | "fixed-costs" | null>(null);

    const {
        dataTree,
        loadTree,
        removeStepFromCategory,
        removeCategory,
        addCategory,
    } = useTree();

    React.useEffect(() => {
        if (user && user.uid && projectId) {
            loadTree(projectId);
            loadFixedTree(projectId);
        }
    }, [user, projectId, loadTree]);

    const selectedStep = selectedStepId ? getStepById(selectedStepId) : null;

    return (
        <ResizablePanelGroup direction="horizontal" className="flex-1 flex-col">
            <ResizablePanel className="flex flex-col h-full" defaultSize={25}>
                <div className="flex flex-col justify-center px-4 ">
                    <Button
                        className="cursor-pointer w-full"
                        variant="secondary"
                        onClick={() => {
                            setSelectedStepId(null); // clear step if needed
                            setViewMode("fixed-costs");
                        }}
                    >
                        Fixkosten verwalten
                    </Button>
                    <Separator className="mt-3" />
                </div>
                <SidebarContent className="h-full flex-1 overflow-hidden">
                    <ScrollDiv className="h-full">
                        {dataTree?.map((cat) => {
                            return (
                                <SidebarGroup key={cat.id}>
                                    <SidebarGroupLabel>{cat.label}</SidebarGroupLabel>
                                    <SidebarGroupAction
                                        className="cursor-pointer"
                                        onClick={() => {
                                            setSelectedCategoryId(cat.id);
                                            setDialogOpen(true);
                                        }}
                                    >
                                        <Plus /> <span className="sr-only">Add Step</span>
                                    </SidebarGroupAction>
                                    <SidebarGroupAction className="mr-6 cursor-pointer"
                                        onClick={() => {
                                            removeCategory(projectId, cat.id);
                                        }}
                                    >
                                        <Minus /> <span className="sr-only">Add Step</span>
                                    </SidebarGroupAction>
                                    <SidebarGroupContent>
                                        <SidebarMenuSub>
                                            {cat.children.map((child) => (

                                                <SidebarMenuSubItem key={child.id}>
                                                    <SidebarMenuButton asChild>
                                                        <button
                                                            className="cursor-pointer"

                                                            onClick={() => {
                                                                setSelectedStepId(child.id);
                                                                setViewMode("step");
                                                            }}

                                                        >
                                                            <span>{child.name}</span>
                                                        </button>
                                                    </SidebarMenuButton>
                                                    <DropdownMenu>
                                                        <SidebarMenuAction
                                                            className="cursor-pointer"
                                                            onClick={() =>
                                                                removeStepFromCategory(projectId, cat.id, child.id)
                                                            }
                                                        >
                                                            <Minus /> <span className="sr-only">Remove Step</span>
                                                        </SidebarMenuAction>
                                                    </DropdownMenu>
                                                </SidebarMenuSubItem>

                                            ))}
                                        </SidebarMenuSub>
                                    </SidebarGroupContent>
                                </SidebarGroup>
                            );
                        })}

                        <Dialog>
                            <DialogTrigger asChild>
                                <div className="flex justify-center mb-3">
                                    <Button
                                        className="cursor-pointer"
                                        variant="link"
                                    >
                                        Kategorie hinzufügen <Plus />
                                    </Button>
                                </div>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Kategorie hinzufügen</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="name" className="text-right">
                                            Name
                                        </Label>
                                        <Input id="name" defaultValue="New Category" className="col-span-3" />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button
                                            type="submit"
                                            className="cursor-pointer"
                                            onClick={() => {
                                                const inputElement = document.getElementById("name") as HTMLInputElement;
                                                const newCategoryName = inputElement?.value.trim();
                                                if (newCategoryName) {
                                                    addCategory(projectId, newCategoryName);
                                                }
                                                setDialogOpen(false); // Close the dialog after saving
                                            }}
                                        >
                                            Speichern
                                        </Button>
                                    </DialogClose>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                    </ScrollDiv>
                    {/* ✅ Add the dialog here, just once, outside the .map() */}
                    {selectedCategoryId && (
                        <NewStepDialog
                            open={dialogOpen}
                            onOpenChange={setDialogOpen}
                            projectId={projectId}
                            categoryId={selectedCategoryId}
                        />
                    )}
                </SidebarContent>
                {/* </SidebarInset> */}
            </ResizablePanel>

            <ResizableHandle withHandle={false} />

            {/* RIGHT DETAILS PANEL */}
            <ResizablePanel defaultSize={75}>
                <ScrollArea type="scroll" className="flex-1 p-4 pt-0 rounded-md h-full">
                    {(() => {
                        if (viewMode === "step" && selectedStep) {
                            return (
                                <div className="pb-4">
                                    <h1 className="text-3xl font-bold tracking-tight">{selectedStep.name}</h1>
                                    <Separator className="my-4" />
                                    <StepDetails
                                        step={selectedStep}

                                        onSave={(updatedFields) => {
                                            updateStep(selectedStep.id, updatedFields);
                                        }}
                                    />
                                </div>
                            );
                        } else if (viewMode === "fixed-costs") {
                            return (
                                <div className="pb-4">
                                    <h1 className="text-3xl font-bold tracking-tight">Fixkosten</h1>
                                    <Separator className="mt-4 mb-6" />
                                    <FixedCostSection />
                                </div>
                            );
                        } else {
                            return (
                                <div className="flex justify-center items-center h-40">
                                    <div className="text-sm text-muted-foreground">Wählen Sie einen Schritt oder öffnen Sie die Fixkosten, um Details anzuzeigen.</div>
                                </div>
                            )
                        }
                    })()}
                </ScrollArea>
            </ResizablePanel>
        </ResizablePanelGroup >
    );
}
