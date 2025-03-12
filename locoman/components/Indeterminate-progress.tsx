
  import { cn } from "@/lib/utils"
  
  function IndeterminateProgressBar({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div className="relative w-[60%] h-2 bg-primary/20 overflow-hidden rounded">
        <div className={cn("absolute inset-0 bg-primary animate-indeterminate", className)} {...props} />
      </div>
    )
  }
  
  export { IndeterminateProgressBar }
  