"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
    Form,
    FormField,
    FormItem,
    FormControl,
    FormMessage,
    FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

const schema = z.object({
    name: z.string().min(2, "Name is too short").max(64, "Name is too long"),
    description: z.string().min(0).max(500, "Description is too long").optional(),
});

type ProjectData = {
    name: string;
    description?: string;
};

type Props = {
    onComplete: (project: ProjectData | null) => void;
    initialName?: string;
    initialDescription?: string;
};

export function ProjectNameForm({ onComplete, initialName, initialDescription }: Props) {
    const form = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        defaultValues: { 
            name: initialName ?? "",
            description: initialDescription ?? "",
        },
    });

    const submit = form.handleSubmit(values => {
        onComplete({
            name: values.name.trim(),
            description: values.description?.trim(),
        });
    });

    return (
        <div className="w-full max-w-md">
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Projekt Details</CardTitle>
                    <CardDescription>Geben Sie den Namen und eine optionale Beschreibung für Ihr Projekt ein.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={submit} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Projekt Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                className="focus-visible:ring-0 focus-visible:ring-offset-0"
                                                autoFocus
                                                placeholder="Einen Namen eingeben"
                                                {...field}
                                                onKeyDown={e => {
                                                    if (e.key === "Escape") onComplete(null);
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Beschreibung (optional)</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                className="focus-visible:ring-0 focus-visible:ring-offset-0 resize-none"
                                                placeholder="Eine kurze Beschreibung des Projekts..."
                                                rows={3}
                                                {...field}
                                                onKeyDown={e => {
                                                    if (e.key === "Escape") onComplete(null);
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex justify-end gap-3">
                                <Button className="cursor-pointer" variant="outline" type="button" onClick={() => onComplete(null)}>
                                    Abbrechen
                                </Button>
                                <Button className="cursor-pointer" type="submit" disabled={!form.formState.isValid}>
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
