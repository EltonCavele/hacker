"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Slot } from "radix-ui"
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
  useFormState,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
  type SubmitHandler,
  type UseFormProps,
  type UseFormReturn,
} from "react-hook-form"
import type { z } from "zod"

import { cn } from "@/lib/utils"
import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

/**
 * Form — validated form built on react-hook-form + zod. Use it for every form that has fields to validate;
 * a single input with no rules doesn't need it.
 *
 * 1. Describe the data with a zod schema and create the form with `useZodForm(schema, { defaultValues })`.
 * 2. Render `<Form form={form} onSubmit={…}>`; `onSubmit` receives the parsed (valid) values and may be async.
 * 3. For each field use `FormField` → `FormItem` → `FormLabel` + `FormControl` (wraps the input) + `FormMessage`.
 *
 * `FormControl` wires `id`, `aria-invalid` and `aria-describedby` into whatever it wraps (Input, Textarea,
 * SelectTrigger, NativeSelect, Checkbox, Switch, DatePicker trigger…), so Label focus and error styling work.
 * Components that don't expose a native `onChange` (Select, Checkbox, Switch, RadioGroup) are fed from the
 * `field` render prop: `onValueChange={field.onChange}` / `onCheckedChange={field.onChange}`.
 *
 * Server errors: `form.setError("root", { message })` and render `<FormError />`, or set per-field with `form.setError("email", …)`.
 */

/** `useForm` with a zod resolver. Validates on submit first, then on every change once a field has been touched. */
function useZodForm<TSchema extends z.ZodType<FieldValues, FieldValues>>(
  schema: TSchema,
  props?: Omit<UseFormProps<z.input<TSchema>, unknown, z.output<TSchema>>, "resolver">
) {
  return useForm<z.input<TSchema>, unknown, z.output<TSchema>>({
    mode: "onTouched",
    ...props,
    // The resolver's generics are looser than ours; the schema is the source of truth for both.
    resolver: zodResolver(schema as never) as never,
  })
}

type FormProps<TInput extends FieldValues, TOutput extends FieldValues> = Omit<
  React.ComponentProps<"form">,
  "onSubmit"
> & {
  form: UseFormReturn<TInput, unknown, TOutput>
  onSubmit: SubmitHandler<TOutput>
}

function Form<TInput extends FieldValues, TOutput extends FieldValues = TInput>({
  form,
  onSubmit,
  className,
  children,
  ...props
}: FormProps<TInput, TOutput>) {
  return (
    <FormProvider {...(form as unknown as UseFormReturn<FieldValues>)}>
      <form
        data-slot="form"
        noValidate
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("grid gap-5", className)}
        {...props}
      >
        {children}
      </form>
    </FormProvider>
  )
}

type FormFieldContextValue = { name: string }
const FormFieldContext = React.createContext<FormFieldContextValue | null>(null)

type FormItemContextValue = { id: string }
const FormItemContext = React.createContext<FormItemContextValue | null>(null)

function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(props: ControllerProps<TFieldValues, TName>) {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

function useFormField() {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState, control } = useFormContext()
  const formState = useFormState({ control, name: fieldContext?.name })

  if (!fieldContext || !itemContext) {
    throw new Error("Form field components must be used inside <FormField> and <FormItem>")
  }

  const fieldState = getFieldState(fieldContext.name, formState)
  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

/** Groups a label, its control, the hint and the error message. Generates the ids that link them. */
function FormItem({ className, ...props }: React.ComponentProps<"div">) {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div data-slot="form-item" className={cn("grid gap-2", className)} {...props} />
    </FormItemContext.Provider>
  )
}

function FormLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
  const { error, formItemId } = useFormField()

  return (
    <Label
      data-slot="form-label"
      data-error={!!error}
      className={cn("data-[error=true]:text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  )
}

/** Wrap exactly one control (Input, SelectTrigger, Checkbox…); it receives `id` and the aria attributes. */
function FormControl({ ...props }: React.ComponentProps<typeof Slot.Root>) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  return (
    <Slot.Root
      data-slot="form-control"
      id={formItemId}
      aria-describedby={error ? `${formDescriptionId} ${formMessageId}` : formDescriptionId}
      aria-invalid={!!error}
      {...props}
    />
  )
}

function FormDescription({ className, ...props }: React.ComponentProps<"p">) {
  const { formDescriptionId } = useFormField()

  return (
    <p
      data-slot="form-description"
      id={formDescriptionId}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

/** Shows the field's validation error, or its children when there is none. Renders nothing if both are empty. */
function FormMessage({ className, children, ...props }: React.ComponentProps<"p">) {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error.message ?? "") : children

  if (!body) return null

  return (
    <p
      data-slot="form-message"
      id={formMessageId}
      role={error ? "alert" : undefined}
      className={cn("text-sm text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  )
}

/** Form-level error (`form.setError("root", { message })`), e.g. a failed request or "wrong credentials". */
function FormError({ className, ...props }: React.ComponentProps<typeof Alert>) {
  const { formState } = useFormContext()
  const message = formState.errors.root?.message

  if (!message) return null

  return (
    <Alert data-slot="form-error" variant="destructive" className={className} {...props}>
      {String(message)}
    </Alert>
  )
}

/** Submit button already wired to the form: shows the spinner while `onSubmit` is running. */
function FormSubmit({ children, ...props }: Omit<React.ComponentProps<typeof Button>, "type" | "isLoading">) {
  const { formState } = useFormContext()

  return (
    <Button type="submit" isLoading={formState.isSubmitting} {...props}>
      {children}
    </Button>
  )
}

export {
  Form,
  FormControl,
  FormDescription,
  FormError,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormSubmit,
  useFormField,
  useZodForm,
}
