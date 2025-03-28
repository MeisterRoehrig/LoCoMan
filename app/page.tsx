"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Globe } from "@/components/magicui/globe";
import { Particles } from "@/components/magicui/particles";
import { Button } from "@/components/ui/button";
import {Navbar as NavbarComponent,NavbarLeft,NavbarRight,} from "@/components/ui/navbar";
import Link from "next/link";

export default function Page() {
    const { resolvedTheme } = useTheme();
    const [color, setColor] = useState("#ffffff");


    useEffect(() => {
        setColor(resolvedTheme === "dark" ? "#ffffff" : "#000000");
    }, [resolvedTheme]);

    return (
        <div className="relative flex h-screen w-screen flex-col overflow-hidden px-5">
            <NavbarComponent>
                <NavbarLeft>
                    <Link href="/" className="flex items-center gap-2 text-xl font-bold">LoCoMan</Link>
                    {/* <Navigation /> */}
                </NavbarLeft>
                <NavbarRight>
                    <Button variant="outline" effect="shineHover" asChild>
                        <Link href="/dashboard">Dashboard</Link>
                    </Button>
                </NavbarRight>
            </NavbarComponent>
            <div className="relative z-0 flex flex-col items-center justify-center pb-100">
                <h1 className="text-center text-8xl font-semibold leading-none text-white max-w-5xl py-8">
                    Smarter <span className="bg-gradient-to-r from-blue-600 via-indigo-300 to-indigo-400 inline-block text-transparent bg-clip-text pb-4">insights</span> for transparent <span className="bg-gradient-to-r from-indigo-300 via-indigo-400 to-indigo-500 inline-block text-transparent bg-clip-text pb-4">logistics</span>
                </h1>
            </div>

            <Particles
                className="absolute inset-0 z-0 h-screen w-full"
                quantity={100}
                ease={80}
                color={color}
                refresh
            />
            <Globe className="top-80" />

        </div>
    );
}
