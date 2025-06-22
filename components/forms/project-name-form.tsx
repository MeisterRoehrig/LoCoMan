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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

const schema = z.object({
    name: z.string().min(2, "Name is too short").max(64, "Name is too long"),
});

type Props = {
  onComplete: (name: string | null) => void;
  initialName?: string;
};

export function ProjectNameForm({ onComplete, initialName}: Props) {
    const form = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        defaultValues: { name: initialName ?? "" },
    });

    const submit = form.handleSubmit(values => {
        onComplete(values.name.trim());
    });

    return (
        <div className="w-full max-w-md">
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Projekt Name</CardTitle>
                    <CardDescription>Ein Begriff, der die Identität und den Zweck eines Projekts widerspiegelt.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={submit} className="space-y-4 ">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        {/* <FormLabel>Name</FormLabel> */}
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
