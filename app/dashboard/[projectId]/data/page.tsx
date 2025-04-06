"use client";

import React from "react";
import { useParams } from "next/navigation";

import { ScrollDiv } from "@/components/ui/scroll-div";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Loader from "@/components/loader";

import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";

import { TreeView, TreeDataItem as ViewTreeDataItem } from "@/components/ui/tree-view";
import { useData, TreeDataItem as ProviderTreeDataItem } from "@/lib/data-provider";

import { CirclePlus, Minus, MoreHorizontal, Plus } from "lucide-react";
import ItemDetails from "@/components/item-details";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuAction, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from "@/components/ui/sidebar";
import { TreeStep, useTree } from "@/providers/tree-provider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { CollapsibleTrigger } from "@radix-ui/react-collapsible";
import { useAuth } from "@/lib/auth-provider";



export default function Page() {
    const params = useParams();
    const projectId = String(params.projectId);
    const { user } = useAuth();

    const {
        dataTree,
        loadingTree,
        loadTree,
        addCategory,
        removeCategory,
        addStepToCategory,
        loadDefaultTree,
    } = useTree();

    React.useEffect(() => {
        if (user && user.uid && projectId) {
            loadTree(projectId);
        }
    }, [user, projectId, loadTree]);

    function handleAddCategory() {
        addCategory(projectId, "New Category");
    }

    function handleLoadDefaultTree() {
        loadDefaultTree();
    }

    function handleAddStep(catId: string) {
        const step: TreeStep = {
            id: crypto.randomUUID(),
            name: "My New Step",
        };
        addStepToCategory(projectId, catId, step);
    }


    return (
        <ResizablePanelGroup direction="horizontal" className="flex-1 flex-col">
            {/* Left Panel: TreeView */}
            <ResizablePanel defaultSize={25}>
                <SidebarContent>
                    {dataTree?.map((cat) => {
                        return (
                            <SidebarGroup key={cat.id}>
                                <SidebarGroupLabel>{cat.label}</SidebarGroupLabel>
                                <SidebarGroupAction onClick={() => handleAddStep(cat.id)}>
                                    <Plus /> <span className="sr-only">Add Step</span>
                                </SidebarGroupAction>
                                <SidebarGroupContent>
                                    <SidebarMenuSub>
                                        {cat.children.map((child) => {
                                            return (
                                                <SidebarMenuSubItem key={child.id}>
                                                    <SidebarMenuButton asChild>
                                                        <a href={"#"}>
                                                            <span>{child.name}</span>
                                                        </a>
                                                    </SidebarMenuButton >
                                                    <DropdownMenu>
                                                        <SidebarMenuAction onClick={() => removeCategory(projectId, child.id)}>
                                                            <Minus /> <span className="sr-only">Remove Step</span>
                                                        </SidebarMenuAction>
                                                    </DropdownMenu>
                                                </SidebarMenuSubItem>
                                            );
                                        })}
                                    </SidebarMenuSub>
                                </SidebarGroupContent>
                            </SidebarGroup>
                        );
                    })}
                </SidebarContent>

            </ResizablePanel>

            <ResizableHandle withHandle={false} />

            {/* Right Panel: Item Details */}
            <ResizablePanel defaultSize={75}>
                <ScrollArea type="scroll" className="flex-1 p-4 pt-0 rounded-md h-full">
                    <Separator className="mb-2" />
                    <div>
                        <h2>Data Tree</h2>
                        <pre>{JSON.stringify(dataTree, null, 2)}</pre>
                    </div>
                    <span>{projectId}</span>
                </ScrollArea>
            </ResizablePanel>
        </ResizablePanelGroup>
    );
}
