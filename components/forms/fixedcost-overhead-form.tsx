"use client";

import * as React from "react";
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2, Plus } from "lucide-react";

import {
    Form,
    FormField,
    FormItem,
    FormControl,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

const overheadSchema = z.object({
    overheadDescription: z.string().min(2, "Description is too short").max(100, "Description is too long"),
    overheadMonthlyCost: z.number().min(0, "Cost must be positive").max(1000000, "Cost is too high"),
});

const schema = z.object({
    overheadCosts: z.array(overheadSchema).min(1, "At least one overhead cost is required"),
});

type OverheadCost = {
    overheadDescription: string;
    overheadMonthlyCost: number;
};

type Props = {
    onComplete: (overheadCosts: OverheadCost[] | null) => void;
    initialOverheadCosts?: OverheadCost[];
};

export function FixedCostOverheadForm({ onComplete, initialOverheadCosts = [] }: Props) {
    const form = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        defaultValues: {
            overheadCosts: initialOverheadCosts.length > 0 
                ? initialOverheadCosts 
                : [{ overheadDescription: "", overheadMonthlyCost: 0 }]
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "overheadCosts",
    });

    const submit = form.handleSubmit(values => {
        onComplete(values.overheadCosts);
    });

    const addOverheadCost = () => {
        append({ overheadDescription: "", overheadMonthlyCost: 0 });
    };

    const removeOverheadCost = (index: number) => {
        if (fields.length > 1) {
            remove(index);
        }
    };

    return (
        <div className="w-full max-w-4xl">
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Allgemeine Fixkosten</CardTitle>
                    <CardDescription>
                        Verwalten Sie die monatlichen Gemeinkosten Ihres Unternehmens wie Miete, Versicherungen, etc.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="flex items-start gap-3 p-3 border rounded-lg">
                                        <div className="flex-1">
                                            <FormField
                                                control={form.control}
                                                name={`overheadCosts.${index}.overheadDescription`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <Input
                                                                className="focus-visible:ring-0 focus-visible:ring-offset-0"
                                                                placeholder="Kostenbeschreibung (z.B. Büromiete, Versicherung)"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <FormField
                                                control={form.control}
                                                name={`overheadCosts.${index}.overheadMonthlyCost`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <Input
                                                                className="focus-visible:ring-0 focus-visible:ring-offset-0"
                                                                type="number"
                                                                placeholder="Monatliche Kosten (€)"
                                                                {...field}
                                                                onChange={(e) => field.onChange(Number(e.target.value))}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            className="shrink-0 text-destructive hover:text-destructive"
                                            onClick={() => removeOverheadCost(index)}
                                            disabled={fields.length === 1}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                className="w-full cursor-pointer"
                                onClick={addOverheadCost}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Fixkosten Hinzufügen
                            </Button>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button 
                                    className="cursor-pointer" 
                                    variant="outline" 
                                    type="button" 
                                    onClick={() => onComplete(null)}
                                >
                                    Abbrechen
                                </Button>
                                <Button 
                                    className="cursor-pointer" 
                                    type="submit" 
                                    disabled={!form.formState.isValid}
                                >
                                    Speichern
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}