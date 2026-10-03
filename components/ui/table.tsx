"use client"

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Table — structured, comparable data in rows and columns (payment history, users). Wrap lists of prose or cards in something else.
 * Use TableCaption or an aria-label for context. Use `mobileHidden` on TableHead/TableCell to hide a column below md.
 */
function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-hidden md:overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn(
          "w-full table-fixed caption-bottom text-sm md:table-auto",
          className,
        )}
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn(
        "[&_th]:bg-sidebar [&_th:first-child]:rounded-l-xl [&_th:last-child]:rounded-r-xl",
        className,
      )}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
        className,
      )}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn("group border-b-0 transition-colors", className)}
      {...props}
    />
  );
}

function TableHead({
  className,
  mobileHidden = false,
  ...props
}: React.ComponentProps<"th"> & { mobileHidden?: boolean }) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "text-muted-foreground h-10 px-3 text-left align-middle text-xs font-medium whitespace-nowrap md:px-4 [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        mobileHidden && "hidden md:table-cell",
        className,
      )}
      {...props}
    />
  );
}

function TableCell({
  className,
  mobileHidden = false,
  ...props
}: React.ComponentProps<"td"> & { mobileHidden?: boolean }) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "px-3 py-3 align-middle whitespace-normal break-words transition-colors md:px-4 md:whitespace-nowrap group-hover:bg-sidebar group-data-[state=selected]:bg-muted first:rounded-l-xl last:rounded-r-xl [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        mobileHidden && "hidden md:table-cell",
        className,
      )}
      {...props}
    />
  );
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props}
    />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
