"use client";

import React from "react";
import { useParams } from "next/navigation";

import { ScrollDiv } from "@/components/ui/scroll-div";
import { ScrollArea } from "@/components/ui/scroll-area";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Loader from "@/components/loader";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

import { TreeView, TreeDataItem as ViewTreeDataItem } from "@/components/ui/tree-view";
import { useData, TreeDataItem as ProviderTreeDataItem } from "@/lib/data-provider";

import { CirclePlus } from "lucide-react";
import ItemDetails from "@/components/item-details";

export default function Page() {
  const params = useParams();
  const projectId = params.projectId;

  // Hooks must be called on every render cycle — always declare before returns
  const { projects, trees, createTreeItem } = useData();
  const [selectedItem, setSelectedItem] = React.useState<ViewTreeDataItem | null>(null);

  const handleSelectChange = React.useCallback(
    (item: ViewTreeDataItem | undefined) => {
      if (!item || !item.parentId) {
        setSelectedItem(null);
      } else {
        setSelectedItem(item);
      }
    },
    []
  );

  const getNodeActions = React.useCallback(
    (node: ViewTreeDataItem) => {
      if (!node.parentId) {
        // Must avoid nesting <button> inside <button> → use <div> with full accessibility
        return (
          <div
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              const childName =
                prompt("Name for the new child node?") || "New child";
              if (typeof projectId === "string") {
                createTreeItem(projectId, childName, node.id);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                const childName =
                  prompt("Name for the new child node?") || "New child";
                if (typeof projectId === "string") {
                  createTreeItem(projectId, childName, node.id);
                }
              }
            }}
            className="px-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-sm"
          >
            <CirclePlus size={16} />
          </div>
        );
      }
      return null;
    },
    [projectId, createTreeItem]
  );

  // Guard: ensure projectId is a string
  if (!projectId || Array.isArray(projectId)) {
    return <Loader show={true} />;
  }

  // Lookup project
  const project = projects.find((p) => p.id === projectId);
  if (!project) {
    return <Loader show={true} />;
  }

  // Prepare tree data
  const treeData = trees[project.id] || [];
  const sanitizedData: ViewTreeDataItem[] = treeData.map(
    (item: ProviderTreeDataItem) => ({
      ...item,
      parentId: item.parentId ?? undefined,
    })
  );
  const nestedTree = buildNestedTree(sanitizedData);

  return (
    <ResizablePanelGroup direction="horizontal" className="flex-1 flex-col">
      {/* Left Panel: TreeView */}
      <ResizablePanel defaultSize={25}>
        <ScrollDiv className="h-full">
          <TreeView
            className="p-4 pt-0"
            data={nestedTree}
            expandAll
            onSelectChange={handleSelectChange}
            transformItem={(node) => ({
              ...node,
              actions: getNodeActions(node),
            })}
          />

            <div className="px-4 flex justify-center items-center ">
            <button
              className={`${buttonVariants({ variant: "link" })} cursor-pointer`}
              onClick={() => {
              const categoryName =
                prompt("Name for the new top-level category?") ?? "New Category";
              createTreeItem(project.id, categoryName);
              }}
            >
              <CirclePlus className="mr-1 inline-block" size={16} />
              Add Category
            </button>
          </div>
        </ScrollDiv>
      </ResizablePanel>

      <ResizableHandle withHandle={false} />

      {/* Right Panel: Item Details */}
      <ResizablePanel defaultSize={75}>
        <ScrollArea type="scroll" className="flex-1 p-4 pt-0 rounded-md h-full">
          <Separator className="mb-2" />
          {selectedItem ? (
            <ItemDetails projectId={project.id} item={selectedItem} />
          ) : (
            <p>Wähle einen (untergeordneten) Knoten aus dem Baum aus ...</p>
          )}
        </ScrollArea>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

/** Helper to build nested tree from flat list */
function buildNestedTree(flatList: ViewTreeDataItem[]): ViewTreeDataItem[] {
  const map: Record<string, ViewTreeDataItem & { children?: ViewTreeDataItem[] }> = {};
  flatList.forEach((item) => {
    map[item.id] = { ...item, children: [] };
  });

  const roots: ViewTreeDataItem[] = [];

  flatList.forEach((item) => {
    if (!item.parentId) {
      roots.push(map[item.id]);
    } else {
      if (map[item.parentId]) {
        map[item.parentId].children?.push(map[item.id]);
      } else {
        console.warn("Parent ID not found for item", item);
      }
    }
  });

  return roots;
}
