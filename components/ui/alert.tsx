import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { AlertCircle, CheckCircle, InfoCircle } from "reicon-react"
import { cn } from "@/lib/utils"

const alertVariants = cva(
  "group/alert relative grid w-full gap-0.5 rounded-2xl p-3 text-left text-sm has-data-[slot=alert-action]:pr-18 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-muted/50 text-muted-foreground *:data-[slot=alert-title]:text-foreground",
        destructive:
          "bg-destructive/10 text-destructive *:data-[slot=alert-description]:text-destructive/90",
        success:
          "bg-success/10 text-success *:data-[slot=alert-description]:text-success/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

/** Icon shown when none is passed, by variant. */
const alertIcons = {
  default: InfoCircle,
  destructive: AlertCircle,
  success: CheckCircle,
} as const

/**
 * Alert — inline, persistent message about the current page or form (errors, notices, confirmations).
 *
 * Tinted, borderless surface with a built-in icon per variant: `default` (info), `success`, `destructive` (errors).
 * Pass `icon` to swap the icon or `icon={false}` to hide it. `destructive` is announced as an alert, the others as status.
 * Don't use it for transient feedback (toasts) or for static page copy.
 */
function Alert({
  className,
  variant = "default",
  icon,
  children,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof alertVariants> & {
    /** Custom icon element, or `false` for none. Defaults to the variant's icon. */
    icon?: React.ReactNode | false
  }) {
  const Icon = alertIcons[variant ?? "default"]

  return (
    <div
      data-slot="alert"
      role={variant === "destructive" ? "alert" : "status"}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      {icon === false ? null : (icon ?? <Icon aria-hidden />)}
      {children}
    </div>
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "font-medium group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-sm text-balance text-muted-foreground md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4",
        className
      )}
      {...props}
    />
  )
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn("absolute top-2 right-2", className)}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription, AlertAction }
