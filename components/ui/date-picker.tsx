"use client"

import * as React from "react"
import { format, type Locale } from "date-fns"
import { pt } from "date-fns/locale"
import type { DateRange } from "react-day-picker"
import { Calendar as CalendarIcon } from "reicon-react"
import { cn } from "@/lib/utils"

import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

/** Trigger styled like the other fields (Select / Input): same height, radius, background and focus ring. */
const triggerClassName =
  "flex h-11 w-full items-center justify-start gap-2 rounded-2xl bg-muted px-2.5 text-left text-sm font-normal whitespace-nowrap transition-colors outline-none select-none cursor-pointer focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-[empty=true]:text-muted-foreground dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg]:text-muted-foreground"

type DatePickerCommon = {
  /** Shown while nothing is selected. */
  placeholder?: string
  /** date-fns format of the displayed value. */
  displayFormat?: string
  /** date-fns locale, for the label and the calendar. Defaults to Portuguese. */
  locale?: Locale
  disabled?: boolean
  className?: string
  id?: string
  "aria-invalid"?: boolean
  /** Dates that can't be picked (react-day-picker `disabled` matcher). */
  disabledDates?: React.ComponentProps<typeof Calendar>["disabled"]
}

/**
 * DatePicker — pick a single date in a form: a field-style button that opens a Calendar in a popover.
 *
 * Controlled (`value` + `onValueChange`) or uncontrolled (`defaultValue`). Pair with a Label (`id` goes on the button).
 * For a period use DateRangePicker; for a visible month grid use Calendar.
 */
function DatePicker({
  value,
  defaultValue,
  onValueChange,
  placeholder = "Escolher data",
  displayFormat = "PPP",
  locale = pt,
  disabled,
  className,
  disabledDates,
  ...props
}: DatePickerCommon & {
  value?: Date
  defaultValue?: Date
  onValueChange?: (date: Date | undefined) => void
}) {
  const [internal, setInternal] = React.useState<Date | undefined>(defaultValue)
  const [open, setOpen] = React.useState(false)
  const date = value !== undefined ? value : internal

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-slot="date-picker-trigger"
          data-empty={!date}
          disabled={disabled}
          className={cn(triggerClassName, className)}
          {...props}
        >
          <CalendarIcon />
          {date ? format(date, displayFormat, { locale }) : placeholder}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(next) => {
            setInternal(next)
            onValueChange?.(next)
            setOpen(false)
          }}
          defaultMonth={date}
          locale={locale}
          disabled={disabledDates}
        />
      </PopoverContent>
    </Popover>
  )
}

/**
 * DateRangePicker — pick a period (start and end) in a form. Same trigger and popover as DatePicker, two months side by side.
 */
function DateRangePicker({
  value,
  defaultValue,
  onValueChange,
  placeholder = "Escolher período",
  displayFormat = "dd MMM yyyy",
  locale = pt,
  disabled,
  className,
  disabledDates,
  ...props
}: DatePickerCommon & {
  value?: DateRange
  defaultValue?: DateRange
  onValueChange?: (range: DateRange | undefined) => void
}) {
  const [internal, setInternal] = React.useState<DateRange | undefined>(defaultValue)
  const range = value !== undefined ? value : internal

  const label = range?.from
    ? range.to
      ? `${format(range.from, displayFormat, { locale })} – ${format(range.to, displayFormat, { locale })}`
      : format(range.from, displayFormat, { locale })
    : placeholder

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-slot="date-picker-trigger"
          data-empty={!range?.from}
          disabled={disabled}
          className={cn(triggerClassName, className)}
          {...props}
        >
          <CalendarIcon />
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={range}
          onSelect={(next) => {
            setInternal(next)
            onValueChange?.(next)
          }}
          defaultMonth={range?.from}
          numberOfMonths={2}
          locale={locale}
          disabled={disabledDates}
        />
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker, DateRangePicker }
