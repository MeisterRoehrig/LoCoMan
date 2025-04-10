import type { TreeCategory } from "@/providers/tree-provider";

export const defaultTreeData: TreeCategory[] = [
    {
        id: "default-cat-1",
        label: "Beauftragung",
        children: [
            { id: "step-1", name: "Transportbedarf überprüfen" },
            { id: "step-2", name: "Angebot vorbereiten und übermitteln" },
            { id: "step-3", name: "Transportbedarf erfassen" },
        ],
    },
    {
        id: "default-cat-2",
        label: "Disposition",
        children: [
            { id: "step-4", name: "Verfügbarkeit von Personal und Fuhrpark überprüfen" },
            { id: "step-5", name: "Touren planen" },
            //...
        ],
    },
    {
        id: "default-cat-3",
        label: "Beladung",
        children: [

        ],
    },
    {
        id: "default-cat-4",
        label: "Transport",
        children: [

        ],
    },
    {
        id: "default-cat-5",
        label: "Entladung",
        children: [

        ],
    },
    {
        id: "default-cat-6",
        label: "Abrechnung",
        children: [

        ],
    }
];