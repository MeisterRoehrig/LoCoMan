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

/**
 * We'll treat top-level nodes as “categories” (they can have children,
 * but we do NOT display details in the right panel).
 * Only children (leaves) can be selected to display details on the right side.
 */

export default function Page() {
  const { projectId } = useParams();
  const { projects, trees, createTreeItem } = useData();

  // 1) Find the active project
  const project = projects.find((p) => p.id === projectId);
  if (!project) {
    return <Loader show={true} />;
  }

  // 2) Get the raw, flat array of tree items
  const treeData = trees[project.id] || [];

  // 3) Convert Firestore 'null' => 'undefined' for the tree-view if needed
  const sanitizedData: ViewTreeDataItem[] = treeData.map(
    (item: ProviderTreeDataItem) => ({
      ...item,
      parentId: item.parentId ?? undefined,
    })
  );

  // 4) Build a nested structure
  const nestedTree = buildNestedTree(sanitizedData);

  // 5) State for selected child item
  const [selectedItem, setSelectedItem] = React.useState<ViewTreeDataItem | null>(null);

  // 6) Node actions (only top-level gets a plus)
  const getNodeActions = React.useCallback(
    (node: ViewTreeDataItem) => {
      if (!node.parentId) {
        return (
          <div
            role="button"
            tabIndex={0}
            className="px-1"
            onClick={(e) => {
              e.stopPropagation();
              const childName =
                prompt("Name for the new child node?") || "New child";
              createTreeItem(project.id, childName, node.id);
            }}
          >
            <CirclePlus size={16} />
          </div>
        );
      }
      return null;
    },
    [project.id, createTreeItem]
  );

  // 7) Only child leaves are selectable
  const handleSelectChange = React.useCallback((item: ViewTreeDataItem | undefined) => {
    if (!item) {
      setSelectedItem(null);
      return;
    }
    if (!item.parentId) {
      // It's a top-level node => do not select
      setSelectedItem(null);
    } else {
      setSelectedItem(item);
    }
  }, []);

  return (
    <ResizablePanelGroup direction="horizontal" className="flex-1 flex-col">
      {/* Left side: Tree View */}
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
          <div className="p-4">
            {/* Button to add a top-level category */}
            <button
              className={buttonVariants()}
              onClick={() => {
                const categoryName =
                  prompt("Name for the new top-level category?") || "New Category";
                createTreeItem(project.id, categoryName);
              }}
            >
              <CirclePlus className="mr-1 inline-block" size={16} />
              Add Top-Level Category
            </button>
          </div>
        </ScrollDiv>
      </ResizablePanel>

      <ResizableHandle withHandle={false} />

      {/* Right side: item details */}
      <ResizablePanel defaultSize={75}>
        <ScrollArea type="scroll" className="flex-1 p-4 pt-0 rounded-md h-full">
          <Separator className="mb-2" />

          {selectedItem ? (
            // Render our new, separate ItemDetails component
            <ItemDetails projectId={project.id} item={selectedItem} />
          ) : (
            <p>Wähle einen (untergeordneten) Knoten aus dem Baum aus ...</p>
          )}
        </ScrollArea>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

/** Helper to nest the flat array into a tree structure. */
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
        console.warn("Parent ID not found for item, item");
      }
    }
  });

  return roots;
}