"use client";

import React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronRight } from "lucide-react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

/** Your node data interface */
export interface TreeDataItem {
  id: string;
  name: string;
  icon?: React.ComponentType<{ className?: string }>;
  selectedIcon?: React.ComponentType<{ className?: string }>;
  openIcon?: React.ComponentType<{ className?: string }>;
  // Could store parentId or other fields if you like
  parentId?: string; 
  children?: TreeDataItem[];
  actions?: React.ReactNode;
  onClick?: () => void;
}

type TreeProps = React.HTMLAttributes<HTMLDivElement> & {
  data: TreeDataItem[] | TreeDataItem;
  initialSelectedItemId?: string;
  onSelectChange?: (item: TreeDataItem | undefined) => void;
  expandAll?: boolean;
  defaultNodeIcon?: React.ComponentType<{ className?: string }>;
  defaultLeafIcon?: React.ComponentType<{ className?: string }>;
  /** OPTIONAL: A function that transforms every node before rendering */
  transformItem?: (item: TreeDataItem) => TreeDataItem;
};

function applyTransform(
  data: TreeDataItem | TreeDataItem[],
  transformItem?: (item: TreeDataItem) => TreeDataItem
): TreeDataItem[] {
  const arr = Array.isArray(data) ? data : [data];

  function mapItem(item: TreeDataItem): TreeDataItem {
    const newItem = transformItem ? transformItem(item) : item;
    if (newItem.children && newItem.children.length > 0) {
      return {
        ...newItem,
        children: newItem.children.map(mapItem),
      };
    }
    return newItem;
  }

  return arr.map(mapItem);
}

const TreeView = React.forwardRef<HTMLDivElement, TreeProps>(
  (
    {
      data,
      initialSelectedItemId,
      onSelectChange,
      expandAll,
      defaultLeafIcon,
      defaultNodeIcon,
      transformItem,
      className,
      ...props
    },
    ref
  ) => {
    const [selectedItemId, setSelectedItemId] = React.useState<string | undefined>(
      initialSelectedItemId
    );

    // 1) We only store the ID in state. We also call onSelectChange for external updates.
    const handleSelectChange = React.useCallback(
      (item: TreeDataItem | undefined) => {
        setSelectedItemId(item?.id);
        onSelectChange?.(item);
      },
      [onSelectChange]
    );

    // 2) Figure out which items are expanded (if expandAll is true, we handle differently)
    const expandedItemIds = React.useMemo(() => {
      if (!initialSelectedItemId) {
        return [] as string[];
      }
      const ids: string[] = [];
      function walkTreeItems(
        items: TreeDataItem[] | TreeDataItem,
        targetId: string
      ) {
        if (Array.isArray(items)) {
          for (const item of items) {
            ids.push(item.id);
            if (walkTreeItems(item, targetId) && !expandAll) {
              return true;
            }
            if (!expandAll) ids.pop();
          }
        } else if (!expandAll && items.id === targetId) {
          return true;
        } else if (items.children) {
          return walkTreeItems(items.children, targetId);
        }
      }
      walkTreeItems(data, initialSelectedItemId);
      return ids;
    }, [data, expandAll, initialSelectedItemId]);

    // 3) Apply transformation to the entire data set
    const processedData = React.useMemo(() => {
      return applyTransform(data, transformItem);
    }, [data, transformItem]);

    return (
      <div
        className={cn("overflow-hidden relative", className)}
        ref={ref}
        {...props}
      >
        <TreeItem
          data={processedData}
          selectedItemId={selectedItemId}
          handleSelectChange={handleSelectChange}
          expandedItemIds={expandedItemIds}
          defaultLeafIcon={defaultLeafIcon}
          defaultNodeIcon={defaultNodeIcon}
        />
      </div>
    );
  }
);
TreeView.displayName = "TreeView";

type TreeItemProps = {
  data: TreeDataItem[];
  selectedItemId?: string;
  handleSelectChange: (item: TreeDataItem | undefined) => void;
  expandedItemIds: string[];
  defaultNodeIcon?: React.ComponentType<{ className?: string }>;
  defaultLeafIcon?: React.ComponentType<{ className?: string }>;
};

const TreeItem = ({
  data,
  selectedItemId,
  handleSelectChange,
  expandedItemIds,
  defaultNodeIcon,
  defaultLeafIcon,
}: TreeItemProps) => {
  return (
    <div role="tree">
      <ul>
        {data.map((item) => (
          <li key={item.id}>
            {item.children && item.children.length > 0 ? (
              <TreeNode
                item={item}
                selectedItemId={selectedItemId}
                expandedItemIds={expandedItemIds}
                handleSelectChange={handleSelectChange}
                defaultNodeIcon={defaultNodeIcon}
                defaultLeafIcon={defaultLeafIcon}
              />
            ) : (
              <TreeLeaf
                item={item}
                selectedItemId={selectedItemId}
                handleSelectChange={handleSelectChange}
                defaultLeafIcon={defaultLeafIcon}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

const TreeNode = ({
  item,
  handleSelectChange,
  expandedItemIds,
  selectedItemId,
  defaultNodeIcon,
  defaultLeafIcon,
}: {
  item: TreeDataItem;
  handleSelectChange: (item: TreeDataItem | undefined) => void;
  expandedItemIds: string[];
  selectedItemId?: string;
  defaultNodeIcon?: React.ComponentType<{ className?: string }>;
  defaultLeafIcon?: React.ComponentType<{ className?: string }>;
}) => {
  const [value, setValue] = React.useState(
    expandedItemIds.includes(item.id) ? [item.id] : []
  );

  return (
    <AccordionPrimitive.Root
      type="multiple"
      value={value}
      onValueChange={(s) => setValue(s)}
    >
      <AccordionPrimitive.Item value={item.id}>
        <AccordionTrigger
          className={cn(
            treeVariants(),
            selectedItemId === item.id && selectedTreeVariants()
          )}
          onClick={() => {
            handleSelectChange(item);
            item.onClick?.();
          }}
        >
          <TreeIcon
            item={item}
            isSelected={selectedItemId === item.id}
            isOpen={value.includes(item.id)}
            default={defaultNodeIcon}
          />
          <span className="text-sm truncate">{item.name}</span>

          {/* Put item.actions in a separate container so we don’t nest inside a <button> */}
          <div className="ml-auto flex items-center">
            <TreeActions isSelected={selectedItemId === item.id}>
              {item.actions}
            </TreeActions>
          </div>
        </AccordionTrigger>
        <AccordionContent className="ml-4 pl-1 border-l">
          <TreeItem
            data={item.children || []}
            selectedItemId={selectedItemId}
            handleSelectChange={handleSelectChange}
            expandedItemIds={expandedItemIds}
            defaultLeafIcon={defaultLeafIcon}
            defaultNodeIcon={defaultNodeIcon}
          />
        </AccordionContent>
      </AccordionPrimitive.Item>
    </AccordionPrimitive.Root>
  );
};

const TreeLeaf = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    item: TreeDataItem;
    selectedItemId?: string;
    handleSelectChange: (item: TreeDataItem | undefined) => void;
    defaultLeafIcon?: React.ComponentType<{ className?: string }>;
  }
>(function TreeLeaf(
  { className, item, selectedItemId, handleSelectChange, defaultLeafIcon, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      role="treeitem"
      aria-selected={selectedItemId === item.id}
      tabIndex={0}
      className={cn(
        "ml-5 flex text-left items-center py-2 cursor-pointer relative",
        treeVariants(),
        className,
        selectedItemId === item.id && selectedTreeVariants()
      )}
      onClick={() => {
        handleSelectChange(item);
        item.onClick?.();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleSelectChange(item);
          item.onClick?.();
        }
      }}
      {...props}
    >
      <TreeIcon
        item={item}
        isSelected={selectedItemId === item.id}
        default={defaultLeafIcon}
      />
      <span className="flex-grow text-sm truncate">{item.name}</span>
      {/* Leaf may or may not have actions, but typically you'd skip them. */}
      {item.actions && (
        <div className="ml-auto pr-2">
          <TreeActions isSelected={selectedItemId === item.id}>
            {item.actions}
          </TreeActions>
        </div>
      )}
    </div>
  );
});

const treeVariants = cva(
  "group mb-1 hover:bg-accent/70 rounded-lg px-2"
);

const selectedTreeVariants = cva(
  "bg-accent/70 text-accent-foreground"
);

/** Accordion trigger */
const AccordionTrigger = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(function AccordionTrigger({ className, children, ...props }, ref) {
  return (
    <AccordionPrimitive.Header>
      <AccordionPrimitive.Trigger
        ref={ref}
        className={cn(
          "flex flex-1 w-full items-center py-2 transition-all " +
            "first:[&[data-state=open]>svg]:rotate-90 " +
            "relative",
          className
        )}
        {...props}
      >
        <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200 text-accent-foreground/50 mr-1" />
        {children}
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
});

const AccordionContent = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(function AccordionContent({ className, children, ...props }, ref) {
  return (
    <AccordionPrimitive.Content
      ref={ref}
      className={cn(
        "overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
        className
      )}
      {...props}
    >
      <div className="pb-1 pt-0">{children}</div>
    </AccordionPrimitive.Content>
  );
});

/** The icon logic for Node vs. Leaf, open vs. selected, etc. */
const TreeIcon = ({
  item,
  isOpen,
  isSelected,
  default: defaultIcon,
}: {
  item: TreeDataItem;
  isOpen?: boolean;
  isSelected?: boolean;
  default?: React.ComponentType<{ className?: string }>;
}) => {
  let Icon = defaultIcon;
  if (isSelected && item.selectedIcon) {
    Icon = item.selectedIcon;
  } else if (isOpen && item.openIcon) {
    Icon = item.openIcon;
  } else if (item.icon) {
    Icon = item.icon;
  }
  return Icon ? <Icon className="h-4 w-4 shrink-0 mr-2" /> : null;
};

/** We render actions only if the node is selected (or hovered), per your preference. */
const TreeActions = ({
  children,
  isSelected,
}: {
  children: React.ReactNode;
  isSelected: boolean;
}) => {
  // By default, we show the actions only if the node is selected or hovered:
  return (
    <div
      className={cn(
        "opacity-0 group-hover:opacity-100 transition-opacity",
        isSelected && "opacity-100"
      )}
    >
      {children}
    </div>
  );
};

export { TreeView };
