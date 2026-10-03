import { cn } from "@/lib/utils"

/**
 * Skeleton — grey placeholder shaped like the content while it loads. Prefer it over spinners for page/section loading;
 * use Button `isLoading` for button-triggered work.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
