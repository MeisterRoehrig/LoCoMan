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
import { DropdownMenu } from "@radix-ui/react-dropdown-menu";
import { useAuth } from "@/lib/auth-provider";
import { useSteps } from "@/providers/steps-provider";
import { NewStepDialog } from "@/components/new-step-dialog";
import StepDetails from "@/components/step-details";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";



export default function Page() {
    const params = useParams();
    const projectId = String(params.projectId);
    const { user } = useAuth();
    const { getStepById, updateStep } = useSteps();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [selectedStepId, setSelectedStepId] = useState<string | null>(null);


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
        }
    }, [user, projectId, loadTree]);

    const selectedStep = selectedStepId ? getStepById(selectedStepId) : null;

    return (
        <ResizablePanelGroup direction="horizontal" className="flex-1 flex-col">
            <ResizablePanel defaultSize={25}>
                <SidebarContent className="h-full">
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
                                                                // When a step is clicked, store its ID
                                                                setSelectedStepId(child.id);
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
                                <div className="flex justify-center">
                                    <Button
                                        className="cursor-pointer"
                                        variant="link"
                                    >
                                        Add Category <Plus />
                                    </Button>
                                </div>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Edit profile</DialogTitle>
                                    <DialogDescription>
                                        Make changes to your profile here. Click save when you&apos;re done.
                                    </DialogDescription>
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
                                            Save changes
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
                    <div>
                        {selectedStep ? (
                            <>
                                <div className="pb-4">
                                    <h2>Details for “{selectedStep.name}”</h2>
                                    <Separator className="my-3" />
                                </div>
                                <StepDetails
                                    step={selectedStep}
                                    onSave={(updatedFields) => {
                                        // Minimal calls to DB:
                                        // we already have the step in local context, so just call update
                                        updateStep(selectedStep.id, updatedFields);
                                    }}
                                />
                            </>
                        ) : (
                            <p>Select a step in the sidebar to view details.</p>
                        )}
                    </div>
                </ScrollArea>
            </ResizablePanel>
        </ResizablePanelGroup>
    );
}
