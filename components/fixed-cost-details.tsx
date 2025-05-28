/* ---------------------------------------------------------------------- */
/*  FixedCostSection.tsx                                                  */
/*  – project-specific view on employees / fixed-costs / resources        */
/* ---------------------------------------------------------------------- */

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Plus as PlusIcon,
  Trash2,
} from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

import { AutoComplete, type Option } from "@/lib/autocomplete";

import {
  useEmployees,
  type EmployeeDoc,
} from "@/providers/employees-provider";
import {
  useFixedCostObjects,
  type FixedCostObjectDoc,
} from "@/providers/fixed-cost-provider";
import { useResources, type ResourceDoc } from "@/providers/resources-provider";
import {
  useFixedTree,
  type FixedCostKind,
} from "@/providers/fixed-tree-provider";

/* ======================================================================
 * 1. Generic Data-Table component
 * ==================================================================== */

type DataTableProps<T extends { id: string }> = {
  title: string;
  columns: ColumnDef<T>[];
  data: T[];
  isLoading?: boolean;
  onAddClick: () => void;
  /** remove only the reference, NOT the document itself */
  onRemove: (id: string) => void;
};

function DataTable<T extends { id: string }>({
  title,
  columns,
  data,
  isLoading,
  onAddClick,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        <Button size="sm" onClick={onAddClick}>
          <PlusIcon className="mr-1.5 h-4 w-4" />&nbsp;
          {title.split(" ")[0]}
        </Button>
      </div>

      

      {/* ---------- the table ---------- */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length}>Loading…</TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/* ======================================================================
 * 2. Generic “Add…Dialog” (autocomplete OR manual input)
 * ==================================================================== */

type AddDialogProps<T extends { id: string }> = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  options: Option[];
  onAttachExisting: (id: string) => Promise<void>;
  onCreateNew: (payload: Omit<T, "id">) => Promise<void>;
  renderFields: (
    vals: Record<string, unknown>,
    setVal: (k: string, v: unknown) => void,
  ) => React.ReactNode;
  initialValues: Record<string, unknown>;
};

function AddDialog<T extends { id: string }>({
  open,
  onOpenChange,
  title,
  options,
  onAttachExisting,
  onCreateNew,
  renderFields,
  initialValues,
}: AddDialogProps<T>) {
  const [selected, setSelected] = useState<Option | undefined>();
  const [vals, setVals] =
    useState<Record<string, unknown>>(initialValues);

  const setVal = (k: string, v: unknown) =>
    setVals((prev) => ({ ...prev, [k]: v }));

  const reset = () => {
    setSelected(undefined);
    setVals(initialValues);
  };

  const handleSave = async () => {
    try {
      if (selected) {
        await onAttachExisting(selected.value);
        toast.success("Reference added!");
      } else {
        await onCreateNew(vals as Omit<T, "id">);
        toast.success("Created & referenced!");
      }
      reset();
      onOpenChange(false);
    } catch (err) {
      console.error(`[AddDialog] save failed (${title}):`, err);
      toast.error("Operation failed.");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Wählen Sie vorhandene oder erstellen Sie neue.
          </DialogDescription>
        </DialogHeader>

        <AutoComplete
          options={options}
          emptyMessage="Keine Ergebnisse"
          placeholder="Nach vorhandenen suchen…"
          onValueChange={setSelected}
          value={selected}
        />

        {!selected && renderFields(vals, setVal)}

        {selected && (
          <div className="mt-2 text-sm">
            Selected: <strong>{selected.label}</strong>{" "}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelected(undefined)}
            >
              Clear
            </Button>
          </div>
        )}

        <DialogFooter>
          <Button onClick={handleSave}>Speichern</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ======================================================================
 * 3. Section container – wires everything together
 * ==================================================================== */

export default function FixedCostSection() {
  /* 3.1 Get projectId from route */
  const params = useParams();
  const projectId = String(params.projectId);

  /* 3.2 Domain providers */
  const {
    employees,
    loadingEmployees,
    addEmployee,
    loadEmployees,
  } = useEmployees();
  const {
    fixedCostObjects,
    loadingFixedCostObjects,
    addFixedCostObject,
    loadFixedCostObjects,
  } = useFixedCostObjects();
  const {
    resources,
    loadingResources,
    addResource,
    loadResources,
  } = useResources();
  const {
    fixedCosts,
    loadingFixedTree,
    loadFixedTree,
    addToFixedCosts,
    removeFromFixedCosts,
  } = useFixedTree();

  /* 3.3 First load */
  useEffect(() => {
    loadEmployees();
    loadFixedCostObjects();
    loadResources();
    loadFixedTree(projectId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  /* 3.4 Filter global docs down to project-specific refs */
  const projectEmployees = useMemo(() => {
    if (!fixedCosts) return [];
    const set = new Set(fixedCosts.employees);
    return employees.filter((e) => set.has(e.id));
  }, [employees, fixedCosts]);

  const projectFixedCosts = useMemo(() => {
    if (!fixedCosts) return [];
    const set = new Set(fixedCosts.fixedCosts);
    return fixedCostObjects.filter((f) => set.has(f.id));
  }, [fixedCostObjects, fixedCosts]);

  const projectResources = useMemo(() => {
    if (!fixedCosts) return [];
    const set = new Set(fixedCosts.resources);
    return resources.filter((r) => set.has(r.id));
  }, [resources, fixedCosts]);

  /* 3.5 Column definitions */
  const employeeColumns: ColumnDef<EmployeeDoc>[] = [
    {
      accessorKey: "jobtitel",
      header: "Mitarbeiter",
      cell: ({ row }) => <span>{row.getValue("jobtitel")}</span>,
    },
    {
      accessorKey: "monthlySalaryEuro",
      header: () => <div className="text-right">€/Mon.</div>,
      cell: ({ row }) => {
        const value: number = row.getValue("monthlySalaryEuro");
        return (
          <div className="text-right font-medium">
            {value.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
          </div>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      header: () => <div className="text-right sr-only">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button
            size="icon"
            variant="ghost"
            onClick={() =>
              removeFromFixedCosts(projectId, "employees", row.original.id)
            }
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">remove</span>
          </Button>
        </div>
      ),
    },
  ];

  const fixedCostColumns: ColumnDef<FixedCostObjectDoc>[] = [
    {
      accessorKey: "costObjectName",
      header: "Gemeinkosten",
      cell: ({ row }) => <span>{row.getValue("costObjectName")}</span>,
    },
    {
      accessorKey: "costPerMonthEuro",
      header: () => <div className="text-right">€/Mon.</div>,
      cell: ({ row }) => {
        const v: number = row.getValue("costPerMonthEuro");
        return (
          <div className="text-right font-medium">
            {v.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
          </div>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      header: () => <div className="text-right sr-only">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button
            size="icon"
            variant="ghost"
            onClick={() =>
              removeFromFixedCosts(projectId, "fixedCosts", row.original.id)
            }
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">remove</span>
          </Button>
        </div>
      ),
    },
  ];

  const resourceColumns: ColumnDef<ResourceDoc>[] = [
    {
      accessorKey: "costObjectName",
      header: "Hilfsmittel",
      cell: ({ row }) => <span>{row.getValue("costObjectName")}</span>,
    },
    {
      accessorKey: "costPerMonthEuro",
      header: () => <div className="text-right">€/Mon.</div>,
      cell: ({ row }) => {
        const v: number = row.getValue("costPerMonthEuro");
        return (
          <div className="text-right font-medium">
            {v.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
          </div>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      header: () => <div className="text-right sr-only">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button
            size="icon"
            variant="ghost"
            onClick={() =>
              removeFromFixedCosts(projectId, "resources", row.original.id)
            }
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">remove</span>
          </Button>
        </div>
      ),
    },
  ];

  /* 3.6 Add-dialog open flags */
  const [dlgEmp, setDlgEmp] = useState(false);
  const [dlgFix, setDlgFix] = useState(false);
  const [dlgRes, setDlgRes] = useState(false);

  /* 3.7 Helpers */
  const attachExisting = (kind: FixedCostKind) => async (id: string) =>
    addToFixedCosts(projectId, kind, id);

  const createAndAttach =
    <T extends { id: string }>(
      create: (p: Omit<T, "id">) => Promise<string | undefined>,
      kind: FixedCostKind,
    ) =>
      async (payload: Omit<T, "id">) => {
        console.log("createAndAttach", payload);
        const id = await create(payload);
        if (id) await addToFixedCosts(projectId, kind, id);
      };

  /* ====================================================================
   * 4. Render
   * ================================================================== */
  if (loadingFixedTree && !fixedCosts) {   // ← replace with this
    return <p className="p-4">Loading project data…</p>;
  }

  return (
    <>
      {/* ---------------- Add dialogs ---------------- */}
      <AddDialog<EmployeeDoc>
        open={dlgEmp}
        onOpenChange={setDlgEmp}
        title="Mitarbeiter hinzufügen"
        options={employees.map((e) => ({ value: e.id, label: e.jobtitel }))}
        onAttachExisting={attachExisting("employees")}
        onCreateNew={createAndAttach(addEmployee, "employees")}
        renderFields={(v, set) => (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right">Jobtitel</label>
              <Input
                className="col-span-3"
                value={v.jobtitel as string}
                onChange={(e) => set("jobtitel", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right">Monatsgehalt (€)</label>
              <Input
                type="number"
                className="col-span-3"
                value={v.monthlySalaryEuro as number | ""}
                onChange={(e) =>
                  set("monthlySalaryEuro", e.target.valueAsNumber || "")
                }
              />
            </div>
          </div>
        )}
        initialValues={{ jobtitel: "", monthlySalaryEuro: "" }}
      />

      <AddDialog<FixedCostObjectDoc>
        open={dlgFix}
        onOpenChange={setDlgFix}
        title="Gemeinkosten hinzufügen"
        options={fixedCostObjects.map((f) => ({
          value: f.id,
          label: f.costObjectName,
        }))}
        onAttachExisting={attachExisting("fixedCosts")}
        onCreateNew={createAndAttach(addFixedCostObject, "fixedCosts")}
        renderFields={(v, set) => (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right">Name</label>
              <Input
                className="col-span-3"
                value={v.costObjectName as string}
                onChange={(e) => set("costObjectName", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right">Kosten (€)</label>
              <Input
                type="number"
                className="col-span-3"
                value={v.costPerMonthEuro as number | ""}
                onChange={(e) =>
                  set("costPerMonthEuro", e.target.valueAsNumber || "")
                }
              />
            </div>
          </div>
        )}
        initialValues={{ costObjectName: "", costPerMonthEuro: "" }}
      />

      <AddDialog<ResourceDoc>
        open={dlgRes}
        onOpenChange={setDlgRes}
        title="Hilfsmittel hinzufügen"
        options={resources.map((r) => ({
          value: r.id,
          label: r.costObjectName,
        }))}
        onAttachExisting={attachExisting("resources")}
        onCreateNew={createAndAttach(addResource, "resources")}
        renderFields={(v, set) => (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right">Name</label>
              <Input
                className="col-span-3"
                value={v.costObjectName as string}
                onChange={(e) => set("costObjectName", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right">Kosten (€)</label>
              <Input
                type="number"
                className="col-span-3"
                value={v.costPerMonthEuro as number | ""}
                onChange={(e) =>
                  set("costPerMonthEuro", e.target.valueAsNumber || "")
                }
              />
            </div>
          </div>
        )}
        initialValues={{ costObjectName: "", costPerMonthEuro: "" }}
      />

      {/* ---------------- Section ---------------- */}
      <ScrollArea className="h-full w-full pr-4">
        <div className="space-y-10 pb-8">
          <DataTable
            title="Mitarbeiter"
            data={projectEmployees}
            columns={employeeColumns}
            isLoading={loadingEmployees}
            onAddClick={() => setDlgEmp(true)}
            onRemove={(id) =>
              removeFromFixedCosts(projectId, "employees", id)
            }
          />

          <DataTable
            title="Gemeinkosten"
            data={projectFixedCosts}
            columns={fixedCostColumns}
            isLoading={loadingFixedCostObjects}
            onAddClick={() => setDlgFix(true)}
            onRemove={(id) =>
              removeFromFixedCosts(projectId, "fixedCosts", id)
            }
          />

          <DataTable
            title="Hilfsmittel"
            data={projectResources}
            columns={resourceColumns}
            isLoading={loadingResources}
            onAddClick={() => setDlgRes(true)}
            onRemove={(id) =>
              removeFromFixedCosts(projectId, "resources", id)
            }
          />
        </div>
      </ScrollArea>
    </>
  );
}
