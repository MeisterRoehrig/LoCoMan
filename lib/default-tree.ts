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
            { id: "step-6", name: "Touren, Fahrzeuge und Fahrer disponieren" },
            { id: "step-7", name: "Frachtpapiere vorbereiten (und ausdrucken)" },
            { id: "step-8", name: "Dokumentenübergabe und Instruktionen an Fahrer" },
        ],
    },
    {
        id: "default-cat-3",
        label: "Beladung",
        children: [
            { id: "step-9", name: "Zum Abhol-WA fahren" },
            { id: "step-10", name: "Verladepapiere an Erfassung übergeben" },
            { id: "step-11", name: "Beladeplatz zuweisen" },
            { id: "step-12", name: "Sendung überprüfen (visuell)" },
            { id: "step-13", name: "LKW am Versandort beladen und Ladung sichern" },
        ],
    },
    {
        id: "default-cat-4",
        label: "Transport",
        children: [
            { id: "step-14", name: "Sendung überprüfen (visuell)" },
            { id: "step-15", name: "Fahrzeugzustand prüfen und vorbereiten" },
            { id: "step-16", name: "Sendung transportieren" },
        ],
    },
    {
        id: "default-cat-5",
        label: "Entladung",
        children: [
            { id: "step-17", name: "Zum Entlade-WE fahren" },
            { id: "step-18", name: "Entladepapiere an Erfassung übergeben" },
            { id: "step-19", name: "Entladeplatz zuweisen" },
            { id: "step-20", name: "Sendung beim Empfänger abladen" },
            { id: "step-21", name: "Sendungen scannen" },
            { id: "step-22", name: "Lieferscheine und Bordeos vom Kunden quittieren lassen" },
        ],
    },
    {
        id: "default-cat-6",
        label: "Abrechnung",
        children: [
            { id: "step-23", name: "Zurück zum Fuhrpark fahren und die Fahrerkarte auslesen lassen" },
            { id: "step-24", name: "Dokumente an Disponenten übergeben (Schadensbericht, Beschwerden)" },
            { id: "step-25", name: "Transport dokumentieren und analysieren" },
            { id: "step-26", name: "Rechnung erstellen und verbuchen" },
            { id: "step-27", name: "Debitorenabrechnung durchführen" },
            { id: "step-28", name: "Zahlungseingang prüfen" },
        ],
    }
];