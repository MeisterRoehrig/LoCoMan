"use client"

import * as React from "react"

import { Progress } from "@/components/ui/progress"

export function ProgressDemo() {
    const [progress, setProgress] = React.useState(13)

    React.useEffect(() => {
        const timer = setTimeout(() => setProgress(66), 500)
        return () => clearTimeout(timer)
    }, [])

    return <Progress value={progress} className="w-[60%]" />
}


export default function Page() {
    return (
        // div that contains the centert ProgressDemo component
        <div className="flex items-center justify-center h-screen">
            <div className="flex items-center justify-center grow max-w-[500px]">
                <ProgressDemo />
            </div>
        </div>
    )
}