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

const employeeSchema = z.object({
    employeeJobtitel: z.string().min(2, "Job title is too short").max(100, "Job title is too long"),
    employeeMonthlySalary: z.number().min(0, "Salary must be positive").max(1000000, "Salary is too high"),
});

const schema = z.object({
    employees: z.array(employeeSchema).min(1, "At least one employee is required"),
});

type Employee = {
    employeeJobtitel: string;
    employeeMonthlySalary: number;
};

type Props = {
    onComplete: (employees: Employee[] | null) => void;
    initialEmployees?: Employee[];
};

export function FixedCostEmployeeForm({ onComplete, initialEmployees = [] }: Props) {
    const form = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        defaultValues: {
            employees: initialEmployees.length > 0 
                ? initialEmployees 
                : [{ employeeJobtitel: "", employeeMonthlySalary: 0 }]
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "employees",
    });

    const submit = form.handleSubmit(values => {
        onComplete(values.employees);
    });

    const addEmployee = () => {
        append({ employeeJobtitel: "", employeeMonthlySalary: 0 });
    };

    const removeEmployee = (index: number) => {
        if (fields.length > 1) {
            remove(index);
        }
    };

    return (
        <div className="w-full max-w-4xl">
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Mitarbeiter Fixkosten</CardTitle>
                    <CardDescription>
                        Verwalten Sie die monatlichen Gehaltskosten Ihrer Mitarbeiter.
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
                                                name={`employees.${index}.employeeJobtitel`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <Input
                                                                className="focus-visible:ring-0 focus-visible:ring-offset-0"
                                                                placeholder="Berufsbezeichnung (z.B. Softwareentwickler)"
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
                                                name={`employees.${index}.employeeMonthlySalary`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <Input
                                                                className="focus-visible:ring-0 focus-visible:ring-offset-0"
                                                                type="number"
                                                                placeholder="Monatsgehalt (€)"
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
                                            onClick={() => removeEmployee(index)}
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
                                onClick={addEmployee}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Mitarbeiter Hinzufügen
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