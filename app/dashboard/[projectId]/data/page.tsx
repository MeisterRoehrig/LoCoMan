"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";


import { Minus, Plus } from "lucide-react";
import { SidebarContent, SidebarGroup, SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuAction, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from "@/components/ui/sidebar";
import { useTree } from "@/providers/tree-provider";
import { DropdownMenu } from "@radix-ui/react-dropdown-menu";
import { useAuth } from "@/lib/auth-provider";
import { useSteps } from "@/providers/steps-provider";
import { useCreateAndInsertStep } from "@/hooks/create-insert-step";
import { NewStepDialog } from "@/components/new-step-dialog";
import StepDetails from "@/components/step-details";


export default function Page() {
    const params = useParams();
    const projectId = String(params.projectId);
    const { user } = useAuth();
    const { steps, loadingSteps, deleteStep, createStepCopy, addStep, getStepById, updateStep } = useSteps();
    const createAndInsertStep = useCreateAndInsertStep();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

    const {
        dataTree,
        loadingTree,
        loadTree,
        addCategory,
        removeCategory,
        removeStepFromCategory,
        addStepToCategory,
        loadDefaultTree,
    } = useTree();

    React.useEffect(() => {
        if (user && user.uid && projectId) {
            loadTree(projectId);
        }
    }, [user, projectId, loadTree]);

    const selectedStep = selectedStepId ? getStepById(selectedStepId) : null;

    return (
        <ResizablePanelGroup direction="horizontal" className="flex-1 flex-col">
            {/* Left Panel: TreeView */}
            <ResizablePanel defaultSize={25}>
                <SidebarContent>
                    {dataTree?.map((cat) => {
                        return (
                            <SidebarGroup key={cat.id}>
                                <SidebarGroupLabel>{cat.label}</SidebarGroupLabel>
                                <SidebarGroupAction
                                    onClick={() => {
                                        setSelectedCategoryId(cat.id);
                                        setDialogOpen(true);
                                    }}
                                >
                                    <Plus /> <span className="sr-only">Add Step</span>
                                </SidebarGroupAction>

                                <SidebarGroupContent>
                                    <SidebarMenuSub>
                                        {cat.children.map((child) => (
                                            <SidebarMenuSubItem key={child.id}>
                                                <SidebarMenuButton asChild>
                                                    <button
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
