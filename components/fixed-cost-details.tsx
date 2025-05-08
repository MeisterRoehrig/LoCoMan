"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  Plus as PlusIcon,
  Trash2,
} from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Separator } from "@/components/ui/separator";
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

/* --------------------------------------------------------
 * 1. Generic Data-Table component (shadcn + tanstack v8)
 * ------------------------------------------------------ */

type DataTableProps<T extends { id: string }> = {
  title: string;
  columns: ColumnDef<T>[];
  data: T[];
  isLoading?: boolean;
  onDelete?: (id: string) => void;
  onAddClick: () => void;
};

function DataTable<T extends { id: string }>({
  title,
  columns,
  data,
  isLoading,
  onDelete,
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

  /* ---------- debug (once) ---------- */
  useEffect(() => {
    console.debug(`[DataTable] mounted – ${title}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        <Button size="sm" onClick={onAddClick}>
          <PlusIcon className="mr-1.5 h-4 w-4" />
          Add&nbsp;{title.split(" ")[0]}
        </Button>
      </div>

      {/* Optional global filter (uses first text column) */}
      <div className="flex items-center">
        {table.getAllColumns().length > 0 && (
          <Input
            placeholder={`Filter ${title.toLowerCase()}…`}
            value={
              (table
                .getAllColumns()
                .find((c) => c.getCanFilter())
                ?.getFilterValue() as string) ?? ""
            }
            onChange={(e) =>
              table
                .getAllColumns()
                .find((c) => c.getCanFilter())
                ?.setFilterValue(e.target.value)
            }
            className="max-w-sm"
          />
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto">
              Columns <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((c) => c.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  className="capitalize"
                  onCheckedChange={(v) => column.toggleVisibility(!!v)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* The actual table */}
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

      {/* Footer / selection summary */}
      <div className="flex items-center justify-end text-sm text-muted-foreground">
        {table.getFilteredSelectedRowModel().rows.length} of{" "}
        {table.getFilteredRowModel().rows.length} row(s) selected.
      </div>
    </div>
  );
}

/* --------------------------------------------------------
 * 2. Re-usable “Add…Dialog” (autocomplete OR manual input)
 * ------------------------------------------------------ */

type HashRecord<T> = T & { id: string };

interface AddDialogProps<T extends HashRecord<any>> {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  /* existing already-known entities (for autocomplete) */
  options: Option[];
  /* callback if the user selects an existing option */
  onAttachExisting: (id: string) => Promise<void>;
  /* callback for creating a brand-new record */
  onCreateNew: (payload: Omit<T, "id">) => Promise<void>;
  /* form-fields renderer for brand-new record */
  renderFields: (
    values: { [K in keyof Omit<T, "id">]: any },
    set: (k: keyof Omit<T, "id">, v: any) => void,
  ) => React.ReactNode;
  initialValues: { [K in keyof Omit<T, "id">]: any };
}

function AddDialog<T extends HashRecord<any>>({
  open,
  onOpenChange,
  title,
  options,
  onAttachExisting,
  onCreateNew,
  renderFields,
  initialValues,
}: AddDialogProps<T>) {
  const [selectedOption, setSelectedOption] = useState<Option | undefined>();
  /** state bag for new-record fields (keyed by obj prop) */
  const [formValues, setFormValues] = useState<
    { [K in keyof Omit<T, "id">]: any }
  >(initialValues);

  const set = (k: Exclude<keyof T, "id">, v: any) =>
    setFormValues((prev) => ({ ...prev, [k]: v }));

  const reset = () => {
    setSelectedOption(undefined);
    setFormValues(initialValues);
  };

  const handleSave = async () => {
    try {
      if (selectedOption) {
        await onAttachExisting(selectedOption.value);
        toast.success("Added existing entry!");
      } else {
        // very naive validation
        const empty = Object.values(formValues).some(
          (v) => v === "" || v === undefined || v === null,
        );
        if (empty) {
          toast.error("Please fill all fields.");
          return;
        }
        await onCreateNew(formValues as Omit<T, "id">);
        toast.success("Created new entry!");
      }
      reset();
      onOpenChange(false);
    } catch (err) {
      console.error(`[AddDialog] Save failed – ${title}:`, err);
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
            Pick an existing one or enter a new record.
          </DialogDescription>
        </DialogHeader>

        <AutoComplete
          options={options}
          emptyMessage="No results"
          placeholder="Search existing…"
          onValueChange={setSelectedOption}
          value={selectedOption}
        />

        {/* If no option picked, show manual form */}
        {!selectedOption && renderFields(formValues, set)}

        {selectedOption && (
          <div className="mt-2 text-sm">
            Selected: <strong>{selectedOption.label}</strong>{" "}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedOption(undefined)}
            >
              Clear
            </Button>
          </div>
        )}

        <DialogFooter>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* --------------------------------------------------------
 * 3. Domain-specific columns, dialogs & section container
 * ------------------------------------------------------ */

export default function FixedCostSection() {
  /* ===== 3.1 Providers ===== */
  const {
    employees,
    loadingEmployees,
    addEmployee,
    deleteEmployee,
    loadEmployees,
  } = useEmployees();
  const {
    fixedCostObjects,
    loadingFixedCostObjects,
    addFixedCostObject,
    deleteFixedCostObject,
    loadFixedCostObjects,
  } = useFixedCostObjects();
  const {
    resources,
    loadingResources,
    addResource,
    deleteResource,
    loadResources,
  } = useResources();

  /* auto-refresh when providers mount */
  useEffect(() => {
    loadEmployees();
    loadFixedCostObjects();
    loadResources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ===== 3.2 “Add dialog” open flags ===== */
  const [openEmployeeDlg, setOpenEmployeeDlg] = useState(false);
  const [openFixedCostDlg, setOpenFixedCostDlg] = useState(false);
  const [openResourceDlg, setOpenResourceDlg] = useState(false);

  /* ===== 3.3 ColumnDefs ===== */
  const employeeColumns: ColumnDef<EmployeeDoc>[] = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(v) => row.toggleSelected(!!v)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "jobtitel",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          >
            Jobtitel <ArrowUpDown className="ml-1 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <span>{row.getValue("jobtitel")}</span>,
      },
      {
        accessorKey: "monthlySalaryEuro",
        header: () => <div className="text-right">Salary/Mon.</div>,
        cell: ({ row }) => {
          const value: number = row.getValue("monthlySalaryEuro");
          return (
            <div className="text-right font-medium">
              {value.toLocaleString("de-DE", {
                style: "currency",
                currency: "EUR",
              })}
            </div>
          );
        },
      },
      {
        id: "actions",
        enableHiding: false,
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const { id } = row.original;
          return (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                deleteEmployee(id);
              }}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">delete</span>
            </Button>
          );
        },
      },
    ],
    [deleteEmployee],
  );

  const fixedCostColumns: ColumnDef<FixedCostObjectDoc>[] = useMemo(
    () => [
      {
        accessorKey: "costObjectName",
        header: "Cost Object",
        cell: ({ row }) => <span>{row.getValue("costObjectName")}</span>,
      },
      {
        accessorKey: "costPerMonthEuro",
        header: () => <div className="text-right">€/Mon.</div>,
        cell: ({ row }) => {
          const value: number = row.getValue("costPerMonthEuro");
          return (
            <div className="text-right font-medium">
              {value.toLocaleString("de-DE", {
                style: "currency",
                currency: "EUR",
              })}
            </div>
          );
        },
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => deleteFixedCostObject(row.original.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    [deleteFixedCostObject],
  );

  const resourceColumns: ColumnDef<ResourceDoc>[] = useMemo(
    () => [
      {
        accessorKey: "costObjectName",
        header: "Resource",
        cell: ({ row }) => <span>{row.getValue("costObjectName")}</span>,
      },
      {
        accessorKey: "costPerMonthEuro",
        header: () => <div className="text-right">€/Mon.</div>,
        cell: ({ row }) => {
          const value: number = row.getValue("costPerMonthEuro");
          return (
            <div className="text-right font-medium">
              {value.toLocaleString("de-DE", {
                style: "currency",
                currency: "EUR",
              })}
            </div>
          );
        },
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => deleteResource(row.original.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    [deleteResource],
  );

  /* ===== 3.4 Dialog option lists ===== */
  const employeeOptions: Option[] = employees.map((e) => ({
    value: e.id,
    label: e.jobtitel,
  }));
  const fixedCostOptions: Option[] = fixedCostObjects.map((f) => ({
    value: f.id,
    label: f.costObjectName,
  }));
  const resourceOptions: Option[] = resources.map((r) => ({
    value: r.id,
    label: r.costObjectName,
  }));

  /* ---------------------------------------------------- */
  /* 4. Render                                              */
  /* ---------------------------------------------------- */

  return (
    <>
      {/* ---- Add dialogs ---- */}
      <AddDialog<EmployeeDoc>
        open={openEmployeeDlg}
        onOpenChange={setOpenEmployeeDlg}
        title="Add Employee"
        options={employeeOptions}
        onAttachExisting={async () => {
          /* Nothing special to do – employee already part of list */
        }}
        onCreateNew={async (payload) => {
          await addEmployee(payload as Omit<EmployeeDoc, "id">);
        }}
        renderFields={(vals, setVal) => (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right">Jobtitel</label>
              <Input
                className="col-span-3"
                value={vals.jobtitel as string}
                onChange={(e) => setVal("jobtitel", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right">Monatsgehalt (€)</label>
              <Input
                type="number"
                className="col-span-3"
                value={vals.monthlySalaryEuro as number | ""}
                onChange={(e) =>
                  setVal(
                    "monthlySalaryEuro",
                    e.target.valueAsNumber || "",
                  )
                }
              />
            </div>
          </div>
        )}
        initialValues={{ jobtitel: "", monthlySalaryEuro: "" }}
      />

      <AddDialog<FixedCostObjectDoc>
        open={openFixedCostDlg}
        onOpenChange={setOpenFixedCostDlg}
        title="Add Fixed Cost"
        options={fixedCostOptions}
        onAttachExisting={async () => {}}
        onCreateNew={async (payload) =>
          await addFixedCostObject(payload).then(() => {})
        }
        renderFields={(vals, setVal) => (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right">Name</label>
              <Input
                className="col-span-3"
                value={vals.costObjectName as string}
                onChange={(e) => setVal("costObjectName", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right">Kosten (€)</label>
              <Input
                type="number"
                className="col-span-3"
                value={vals.costPerMonthEuro as number | ""}
                onChange={(e) =>
                  setVal("costPerMonthEuro", e.target.valueAsNumber || "")
                }
              />
            </div>
          </div>
        )}
        initialValues={{ costObjectName: "", costPerMonthEuro: "" }}
      />

      <AddDialog<ResourceDoc>
        open={openResourceDlg}
        onOpenChange={setOpenResourceDlg}
        title="Add Resource"
        options={resourceOptions}
        onAttachExisting={async () => {}}
        onCreateNew={async (payload) =>
          await addResource(payload).then(() => {})
        }
        renderFields={(vals, setVal) => (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right">Name</label>
              <Input
                className="col-span-3"
                value={vals.costObjectName as string}
                onChange={(e) => setVal("costObjectName", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right">Kosten (€)</label>
              <Input
                type="number"
                className="col-span-3"
                value={vals.costPerMonthEuro as number | ""}
                onChange={(e) =>
                  setVal("costPerMonthEuro", e.target.valueAsNumber || "")
                }
              />
            </div>
          </div>
        )}
        initialValues={{ costObjectName: "", costPerMonthEuro: "" }}
      />

      {/* ---- Section layout ---- */}
      <ScrollArea className="h-full w-full pr-4">
        <div className="space-y-10 pb-8">
          {/* Employees */}
          <DataTable
            title="Employees"
            data={employees}
            columns={employeeColumns}
            isLoading={loadingEmployees}
            onAddClick={() => setOpenEmployeeDlg(true)}
            onDelete={(id) => deleteEmployee(id)}
          />
          <Separator />
          {/* Fixed cost objects */}
          <DataTable
            title="Fixed Cost Objects"
            data={fixedCostObjects}
            columns={fixedCostColumns}
            isLoading={loadingFixedCostObjects}
            onAddClick={() => setOpenFixedCostDlg(true)}
            onDelete={(id) => deleteFixedCostObject(id)}
          />
          <Separator />
          {/* Resources */}
          <DataTable
            title="Resources"
            data={resources}
            columns={resourceColumns}
            isLoading={loadingResources}
            onAddClick={() => setOpenResourceDlg(true)}
            onDelete={(id) => deleteResource(id)}
          />
        </div>
      </ScrollArea>
    </>
  );
}
