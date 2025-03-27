interface LoaderProps {
    readonly show: boolean;
}

export default function Loader({ show }: LoaderProps) {
    if (show) {
        return (
            <div className="flex items-center justify-center h-screen">
            <div className="flex items-center justify-center max-w-[500px] w-full">
                <div className="relative w-[60%] h-2 bg-primary/20 overflow-hidden rounded">
                    <div className="absolute inset-0 bg-primary animate-indeterminate"/>
                </div>
            </div>
        </div>
        )
    }
}