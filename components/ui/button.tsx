"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { ArrowRight, CheckCircle, XCircle } from "reicon-react"
import { Slot } from "radix-ui"
import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"

/**
 * Button — the only way to trigger an action.
 *
 * Use it for: submitting forms, opening dialogs, starting checkout, any "do something" click.
 * Don't use it for: navigation (render `<Button asChild><Link/></Button>` instead so the
 * element stays an anchor), or inline text links (use a plain `<Link>`).
 *
 * Rules of thumb:
 * - One `default` button per screen section. It is the primary action.
 * - `outline`/`secondary` for supporting actions, `ghost` for toolbars and tertiary actions.
 * - `destructive` only for actions that delete or cancel something.
 * - Filled variants (`default`, `secondary`, `destructive`) carry the glow surface; `outline`, `ghost`
 *   and `link` are transparent and intentionally don't.
 * - Pass `isLoading` while an async action runs; it disables the button and shows a spinner.
 * - Add `isAnimated` for submit-style actions that should confirm their outcome: drive it with
 *   `status` ("idle" | "success" | "error"). The button turns green/red with a check/cross icon,
 *   pulses/shakes, stays disabled for `animationDuration` ms, then calls `onSuccess`/`onError`
 *   (e.g. close the dialog, reset the form). The icon slot swaps spinner → check/cross with a blurred
 *   cross-fade and collapses when empty. Without `isAnimated`, `status` is ignored.
 * - `disabled` uses `aria-disabled` (it stays focusable and announced): clicking it does nothing except shake the button,
 *   so the user sees the click was received and blocked. `isLoading` and the status states use the native `disabled`.
 * - Pass `input` to make the button morph into a text field in place ("New project" → a name field). It is opt-in: only a button
 *   given an `input` config can turn into a field. Enter submits, Escape or blurring while empty collapses it.
 * - Icon-only buttons (`size="icon*"`) must have an `aria-label`.
 */
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 not-aria-disabled:active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 cursor-pointer",
  {
    variants: {
      variant: {
        default: "glow-surface-inverted border-none bg-primary text-primary-foreground not-aria-disabled:hover:bg-primary/85",
        secondary: "glow-surface-inverted bg-secondary text-secondary-foreground not-aria-disabled:hover:bg-secondary/70",
        outline: "border border-border bg-background not-aria-disabled:hover:bg-muted dark:border-input dark:bg-input/30 dark:not-aria-disabled:hover:bg-input/50",
        ghost: "not-aria-disabled:hover:bg-muted dark:not-aria-disabled:hover:bg-muted/50",
        destructive: "glow-surface bg-destructive text-white not-aria-disabled:hover:bg-destructive/85 focus-visible:ring-destructive/30",
        link: "text-primary underline-offset-4 not-aria-disabled:hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-[0.8rem]",
        default: "h-9 px-4",
        lg: "h-11 px-6 text-base",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ButtonStatus = "idle" | "success" | "error"

// `onError` is redefined below (animation callback), so drop the DOM one that takes an event.
type ButtonProps = Omit<React.ComponentProps<"button">, "onError"> &
  VariantProps<typeof buttonVariants> & {
    /** Render the child element (e.g. `<Link>`) with button styles instead of a `<button>`. `isLoading`/`isAnimated` are not supported with it. */
    asChild?: boolean
    /** Disables the button and shows a spinner while an async action runs. */
    isLoading?: boolean
    /** Enables outcome feedback driven by `status`: colour, icon, pulse/shake, then `onSuccess`/`onError`. */
    isAnimated?: boolean
    /** Outcome of the action. Only used with `isAnimated`. */
    status?: ButtonStatus
    /** How long (ms) the success/error state stays visible before `onSuccess`/`onError` fire. */
    animationDuration?: number
    /** Called once the success animation has finished. Only used with `isAnimated`. */
    onSuccess?: () => void
    /** Called once the error animation has finished. Only used with `isAnimated`. */
    onError?: () => void
    /** Turns the button into a text field when clicked. Not supported with `asChild`. */
    input?: ButtonInput
  }

/** Configuration for a button that morphs into a text field (`<Button input={{ onSubmit }}>`). */
type ButtonInput = {
  /**
   * Called with the trimmed text on Enter / submit. May be async: the field shows a spinner while it runs; if it rejects, the
   * field stays open and is marked invalid. When it resolves the field collapses back into the button and clears.
   */
  onSubmit: (value: string) => void | Promise<void>
  /** Called when the field is dismissed with Escape. */
  onCancel?: () => void
  placeholder?: string
  defaultValue?: string
  /** Width of the open field (px number or any CSS length). The button animates from its own width to this one. Default `16rem`. */
  width?: number | string
  type?: React.HTMLInputTypeAttribute
  name?: string
  maxLength?: number
  /** Accessible name of the field. Defaults to the placeholder. */
  label?: string
  /** Accessible name of the submit icon button. Default "Enviar". */
  submitLabel?: string
  /** Extra classes for the morphing container (the element whose width animates). */
  containerClassName?: string
}

function BaseButton({
  className,
  variant,
  size,
  asChild = false,
  isLoading = false,
  isAnimated = false,
  status = "idle",
  animationDuration = 700,
  onSuccess,
  onError,
  disabled,
  onClick,
  onAnimationEnd,
  children,
  ...props
}: Omit<ButtonProps, "input">) {
  const activeStatus = isAnimated && !asChild ? status : "idle"
  const isSuccess = activeStatus === "success"
  const isError = activeStatus === "error"
  // Explicitly disabled buttons stay clickable (aria-disabled) so we can shake them; loading/status keep the native `disabled`.
  const busy = isLoading || activeStatus !== "idle"
  const blocked = Boolean(disabled) && !busy
  const glyph = isSuccess ? "success" : isError ? "error" : isLoading ? "loading" : null

  // Refs so inline callbacks don't restart the timer on every parent render.
  const onSuccessRef = React.useRef(onSuccess)
  const onErrorRef = React.useRef(onError)
  React.useEffect(() => {
    onSuccessRef.current = onSuccess
    onErrorRef.current = onError
  })

  React.useEffect(() => {
    if (activeStatus === "idle") return
    const timeout = window.setTimeout(() => {
      if (activeStatus === "success") onSuccessRef.current?.()
      else onErrorRef.current?.()
    }, animationDuration)
    return () => window.clearTimeout(timeout)
  }, [activeStatus, animationDuration])

  if (asChild) {
    return (
      <Slot.Root
        data-slot="button"
        className={cn(buttonVariants({ variant, size }), className)}
        onClick={onClick}
        onAnimationEnd={onAnimationEnd}
        {...props}
      >
        {children}
      </Slot.Root>
    )
  }

  return (
    <button
      data-slot="button"
      data-status={activeStatus === "idle" ? undefined : activeStatus}
      className={cn(
        buttonVariants({ variant, size }),
        isAnimated && "transition-[background-color,border-color,color,transform] duration-200",
        "data-[shake=true]:animate-[button-error_260ms_ease-in-out] motion-reduce:data-[shake=true]:animate-none",
        // Status disables the button (blocks a second submit mid-animation) but must stay vivid,
        // so override the variant's `disabled:opacity-50`.
        isSuccess &&
          "animate-[button-success_420ms_ease-out] bg-success text-success-foreground opacity-100 hover:bg-success disabled:opacity-100 motion-reduce:animate-none",
        isError &&
          "animate-[button-error_260ms_ease-in-out] bg-destructive text-white opacity-100 hover:bg-destructive disabled:opacity-100 motion-reduce:animate-none",
        className
      )}
      disabled={busy}
      aria-disabled={blocked || undefined}
      aria-busy={isLoading || undefined}
      onClick={(event) => {
        if (!blocked) {
          onClick?.(event)
          return
        }
        // Swallow the action (also stops form submit/navigation) and shake. Re-arm the animation on repeated clicks.
        event.preventDefault()
        event.stopPropagation()
        const el = event.currentTarget
        el.removeAttribute("data-shake")
        void el.offsetWidth
        el.setAttribute("data-shake", "true")
      }}
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.removeAttribute("data-shake")
        onAnimationEnd?.(event)
      }}
      {...props}
    >
      {isAnimated ? (
        <span
          data-slot="button-glyph"
          data-empty={glyph === null}
          aria-hidden
          className="relative inline-flex size-4 shrink-0 items-center justify-center transition-[width,margin] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] data-[empty=true]:-me-2 data-[empty=true]:w-0 motion-reduce:transition-none"
        >
          <GlyphLayer active={glyph === "loading"}>
            <Spinner />
          </GlyphLayer>
          <GlyphLayer active={glyph === "success"}>
            <CheckCircle />
          </GlyphLayer>
          <GlyphLayer active={glyph === "error"}>
            <XCircle />
          </GlyphLayer>
        </span>
      ) : (
        isLoading && <Spinner aria-hidden />
      )}
      {children}
    </button>
  )
}

function Button({ input, ...props }: ButtonProps) {
  return input && !props.asChild ? <ButtonWithInput input={input} {...props} /> : <BaseButton {...props} />
}

/**
 * A button that morphs into a text field (detail.design). A `<button>` can't contain an input, so the real button and a form sit
 * stacked in one container: its width animates from the button's width to the field's while the two cross-fade, and the
 * field takes focus. Enter submits; Escape, or leaving the field while empty, collapses it back and returns focus to the button.
 */
function ButtonWithInput({ input, ...buttonProps }: ButtonProps & { input: ButtonInput }) {
  const {
    onSubmit,
    onCancel,
    placeholder,
    defaultValue = "",
    width = "16rem",
    type = "text",
    name,
    maxLength,
    label,
    submitLabel = "Enviar",
    containerClassName,
  } = input
  const id = React.useId()
  const root = React.useRef<HTMLDivElement>(null)
  const field = React.useRef<HTMLInputElement>(null)
  const closedWidth = React.useRef(0)
  const settle = React.useRef<number | undefined>(undefined)

  const [open, setOpen] = React.useState(false)
  const [boxWidth, setBoxWidth] = React.useState<number | string | undefined>(undefined)
  const [value, setValue] = React.useState(defaultValue)
  const [pending, setPending] = React.useState(false)
  const [invalid, setInvalid] = React.useState(false)

  React.useEffect(() => () => window.clearTimeout(settle.current), [])

  function expand() {
    const el = root.current
    if (!el) return
    window.clearTimeout(settle.current)
    closedWidth.current = el.offsetWidth
    // Pin the current width first so the browser has a number to animate from, then grow to the field's width.
    setBoxWidth(closedWidth.current)
    setOpen(true)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setBoxWidth(width))
      field.current?.focus({ preventScroll: true })
    })
  }

  function collapse(restoreFocus: boolean) {
    setOpen(false)
    setInvalid(false)
    setBoxWidth(closedWidth.current)
    // Hand the width back to the content once the shrink has finished (the label may change meanwhile).
    window.clearTimeout(settle.current)
    settle.current = window.setTimeout(() => setBoxWidth(undefined), 340)
    if (restoreFocus) {
      requestAnimationFrame(() => root.current?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true }))
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = value.trim()
    if (!text || pending) return
    setInvalid(false)
    try {
      const result = onSubmit(text)
      if (result instanceof Promise) {
        setPending(true)
        await result
      }
      setValue(defaultValue)
      collapse(true)
    } catch {
      setInvalid(true)
      field.current?.focus({ preventScroll: true })
    } finally {
      setPending(false)
    }
  }

  return (
    <div
      ref={root}
      data-slot="button-input"
      data-open={open}
      style={{ width: boxWidth }}
      className={cn(
        "relative inline-flex max-w-full transition-[width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none",
        containerClassName
      )}
    >
      <Button
        {...buttonProps}
        aria-expanded={open}
        aria-controls={id}
        inert={open}
        className={cn("w-full transition-opacity duration-200", open && "pointer-events-none opacity-0", buttonProps.className)}
        onClick={(event) => {
          buttonProps.onClick?.(event)
          if (!event.defaultPrevented) expand()
        }}
      />
      <form
        id={id}
        inert={!open}
        aria-hidden={!open}
        onSubmit={submit}
        onKeyDown={(event) => {
          if (event.key !== "Escape") return
          event.preventDefault()
          event.stopPropagation()
          setValue(defaultValue)
          onCancel?.()
          collapse(true)
        }}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget) && !value.trim() && !pending) collapse(false)
        }}
        className={cn(
          "absolute inset-0 flex items-center gap-1 rounded-2xl bg-muted pr-1 pl-3 text-sm transition-[opacity,box-shadow] duration-200 focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30",
          invalid && "ring-3 ring-destructive/20 focus-within:ring-destructive/30",
          open ? "opacity-100 delay-100" : "pointer-events-none opacity-0"
        )}
      >
        <input
          ref={field}
          type={type}
          name={name}
          value={value}
          maxLength={maxLength}
          placeholder={placeholder}
          aria-label={label ?? placeholder ?? submitLabel}
          aria-invalid={invalid || undefined}
          readOnly={pending}
          autoComplete="off"
          onChange={(event) => {
            setValue(event.target.value)
            if (invalid) setInvalid(false)
          }}
          className="h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
        />
        <BaseButton
          type="submit"
          variant="ghost"
          size="icon-sm"
          aria-label={submitLabel}
          disabled={!value.trim() && !pending}
          isLoading={pending}
          className="size-7 shrink-0 rounded-lg"
        >
          {!pending && <ArrowRight />}
        </BaseButton>
      </form>
    </div>
  )
}

/**
 * One icon in the Button's icon slot. All icons sit stacked in the same spot and only their `data-active` flips, so the
 * outgoing icon blurs/shrinks/fades out while the incoming one comes in from a blur, the same way (detail.design).
 * Reduced motion keeps just the fade.
 */
function GlyphLayer({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <span
      data-active={active}
      className="absolute inset-0 flex scale-[0.25] items-center justify-center opacity-0 blur-[4px] transition-[opacity,scale,filter] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] data-[active=true]:scale-100 data-[active=true]:opacity-100 data-[active=true]:blur-none motion-reduce:scale-100 motion-reduce:blur-none"
    >
      {children}
    </span>
  )
}

export { Button, buttonVariants }
export type { ButtonInput, ButtonProps, ButtonStatus }
