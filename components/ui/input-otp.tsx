"use client"

import * as React from "react"
import { OTPInput, OTPInputContext } from "input-otp"
import { Minus } from "reicon-react"
import { cn } from "@/lib/utils"

/**
 * InputOTP — one-time code entry (verification code, 2FA) as separate slots with paste support.
 *
 * Compose: InputOTP (maxLength) > InputOTPGroup > InputOTPSlot (index), optionally split by InputOTPSeparator.
 * Pass `placeholder` (e.g. "000000") to show a faint hint in empty slots. Set `aria-invalid` on InputOTP to show the error state. Don't use it for free-form codes of unknown length (use Input).
 */
function InputOTP({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<typeof OTPInput> & {
  containerClassName?: string
}) {
  return (
    <OTPInput
      data-slot="input-otp"
      containerClassName={cn(
        "flex items-center gap-2 has-disabled:opacity-50",
        containerClassName
      )}
      spellCheck={false}
      className={cn("disabled:cursor-not-allowed", className)}
      {...props}
    />
  )
}

function InputOTPGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-otp-group"
      className={cn(
        "flex items-center rounded-2xl has-aria-invalid:ring-3 has-aria-invalid:ring-destructive/20 dark:has-aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

function InputOTPSlot({
  index,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  index: number
}) {
  const inputOTPContext = React.useContext(OTPInputContext)
  const { char, placeholderChar, hasFakeCaret, isActive } =
    inputOTPContext?.slots[index] ?? {}

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      className={cn(
        "relative flex h-11 w-10 items-center justify-center bg-muted text-base transition-all outline-none first:rounded-l-xl last:rounded-r-xl not-last:border-r not-last:border-background aria-invalid:text-destructive data-[active=true]:z-10 data-[active=true]:rounded-2xl data-[active=true]:ring-3 data-[active=true]:ring-ring/50 data-[active=true]:aria-invalid:ring-destructive/20 dark:bg-input/30 dark:not-last:border-background dark:data-[active=true]:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    >
      {char ??
        (placeholderChar && (
          <span className="text-muted-foreground/40">{placeholderChar}</span>
        ))}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px animate-caret-blink bg-foreground duration-1000" />
        </div>
      )}
    </div>
  )
}

function InputOTPSeparator({ ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-otp-separator"
      className="flex items-center text-muted-foreground [&_svg:not([class*='size-'])]:size-3"
      role="separator"
      {...props}
    >
      <Minus />
    </div>
  )
}

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
