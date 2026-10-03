import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AddressBook, Lock, MoreH, Wallet } from "reicon-react";
import type * as React from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollLandmark } from "@/components/ui/scroll-landmark";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";
import {
  List,
  ListIcon,
  ListItem,
  ListItemDescription,
  ListItemEnd,
  ListItemStart,
  ListItemTitle,
} from "@/components/ui/list";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Sidebar,
  SidebarBrand,
  SidebarHeader,
  SidebarIcon,
  SidebarItem,
  SidebarLabel,
  SidebarLink,
  SidebarMenu,
  SidebarNav,
  SidebarSubitem,
  SidebarSubLink,
  SidebarSubmenu,
} from "@/components/ui/sidebar";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { ButtonDemo } from "./button-demo";
import { ChartDemo } from "./chart-demo";
import {
  BlurImageDemo,
  ComboboxDemo,
  DataTableDemo,
  DatePickerDemo,
  FormDemo,
  NamePlaceholderDemo,
  OtpDemo,
  QuestionnaireDemo,
  ScrollLandmarkDemo,
  ShortcutDemo,
  ThemeColorDemo,
} from "./field-demos";
import { ToastDemo } from "./toast-demo";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge, Status, statusMapping } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = { title: "Design system" };

/** Colour tokens come from app/globals.css. Add a row here when you add a token. */
const tokens = [
  { name: "background", use: "Page background", cls: "bg-background border" },
  { name: "foreground", use: "Main text", cls: "bg-foreground" },
  { name: "primary", use: "Primary action", cls: "bg-primary" },
  { name: "secondary", use: "Supporting actions", cls: "bg-secondary" },
  { name: "muted", use: "Subtle surfaces", cls: "bg-muted" },
  { name: "accent", use: "Hover / highlight", cls: "bg-accent" },
  { name: "border", use: "Borders and dividers", cls: "bg-border" },
  { name: "destructive", use: "Errors and destructive actions", cls: "bg-destructive" },
  { name: "success", use: "Success / confirmed", cls: "bg-success" },
  { name: "warning", use: "Attention / pending", cls: "bg-warning" },
  { name: "info", use: "Neutral information", cls: "bg-info" },
];

/** Index entries, in page order. Add a row here when you add a Section. */
const index = [
  { id: "tokens", label: "Colours" },
  { id: "button", label: "Button" },
  { id: "badge", label: "Badge" },
  { id: "input", label: "Input + Label" },
  { id: "alert", label: "Alert" },
  { id: "card", label: "Card" },
  { id: "chart", label: "Chart" },
  { id: "dialog", label: "Dialog" },
  { id: "alert-dialog", label: "AlertDialog" },
  { id: "sheet", label: "Sheet" },
  { id: "menus", label: "Menus & Tooltip" },
  { id: "page-header", label: "PageHeader" },
  { id: "sidebar", label: "Sidebar" },
  { id: "form-controls", label: "Form controls" },
  { id: "form", label: "Form (validation)" },
  { id: "native-select", label: "NativeSelect" },
  { id: "combobox", label: "Combobox" },
  { id: "date-picker", label: "DatePicker" },
  { id: "input-otp", label: "InputOTP" },
  { id: "questionnaire", label: "Questionnaire" },
  { id: "data-table", label: "DataTable" },
  { id: "list", label: "List" },
  { id: "data", label: "Table, Tabs, Accordion" },
  { id: "feedback", label: "Feedback" },
  { id: "empty-state", label: "EmptyState" },
  { id: "details", label: "Interface details" },
];

function Section({
  id,
  title,
  when,
  children,
}: {
  id: string;
  title: string;
  when: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="space-y-4 scroll-mt-8">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="max-w-2xl text-sm text-muted-foreground">{when}</p>
      </div>
      {children}
    </section>
  );
}

function Demo({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-secondary/30 p-6">{children}</div>;
}

export default function DesignSystemPage() {
  // Reference page for development: keep it out of production builds.
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="mx-auto w-full max-w-4xl space-y-12 px-6 py-12">
      <aside className="fixed top-12 bottom-12 left-[max(1.5rem,calc(50%-448px-13rem))] hidden w-44 overflow-y-auto xl:block">
        <nav aria-label="Design system index" className="space-y-1">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Index</p>
          {index.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="block rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </aside>

      <header className="space-y-2">
        <div className="flex items-center justify-between">
          <Badge variant="info">Development only</Badge>
          <ThemeToggle />
        </div>
        <h1 className="text-4xl font-semibold">Design system</h1>
        <p className="max-w-2xl text-muted-foreground">
          Components in <code className="font-mono text-sm">components/ui</code>, tokens in{" "}
          <code className="font-mono text-sm">app/globals.css</code>. Each section says when to use the component. Full
          guide in <code className="font-mono text-sm">docs/design-system.md</code>.
        </p>
      </header>

      <Section
        id="tokens"
        title="Colours (tokens)"
        when="Always use semantic classes (bg-primary, text-muted-foreground…). Never hard-coded colours like zinc-900 or #fff — that way the theme changes in a single place."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {tokens.map((t) => (
            <div key={t.name} className="space-y-2 rounded-2xl border p-3">
              <div className={`h-12 rounded-lg ${t.cls}`} />
              <p className="font-mono text-xs">{t.name}</p>
              <p className="text-xs text-muted-foreground">{t.use}</p>
            </div>
          ))}
        </div>
      </Section>

      <Separator />

      <Section
        id="button"
        title="Button"
        when="Any action (submit, open, pay). One default button per section. To navigate, use asChild with Link. For async actions, pass isLoading; with isAnimated + status it confirms the result (onSuccess/onError)."
      >
        <Demo>
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
        </Demo>
        <Demo>
          <Button size="sm">Small</Button>
          <Button>Default</Button>
          <Button size="lg">Large</Button>
          <Button isLoading>Saving…</Button>
          <Button disabled>Disabled</Button>
        </Demo>
        <Demo>
          <ButtonDemo />
        </Demo>
      </Section>

      <Section
        id="badge"
        title="Badge"
        when="Short label for a status or category (payment status, plan). Not clickable. Always pair colour with text."
      >
        <Demo>
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="success">Paid</Badge>
          <Badge variant="warning">Pending</Badge>
          <Badge variant="info">New</Badge>
          <Badge variant="destructive">Failed</Badge>
          <Badge variant="muted">Muted</Badge>
          <Badge variant="danger">Danger</Badge>
        </Demo>
        <Demo>
          {Object.keys(statusMapping).map((status) => (
            <Status key={status} status={status} />
          ))}
        </Demo>
      </Section>

      <Section
        id="input"
        title="Input + Label"
        when="Single-line text field. Every Input has a Label. On error, use aria-invalid and show the message next to the field."
      >
        <Demo>
          <div className="grid w-full max-w-sm gap-4">
            <div className="grid gap-2">
              <Label htmlFor="ds-email">Email</Label>
              <Input id="ds-email" type="email" placeholder="you@example.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ds-invalid">With error</Label>
              <Input id="ds-invalid" aria-invalid defaultValue="invalid value" />
              <p role="alert" className="text-sm text-destructive">
                This value is not valid.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ds-disabled">Disabled</Label>
              <Input id="ds-disabled" disabled placeholder="Not editable" />
            </div>
          </div>
        </Demo>
      </Section>

      <Section
        id="alert"
        title="Alert"
        when="Persistent message about the page or form (errors, warnings). For transient feedback use a toast (not yet included); don't use it for static text."
      >
        <div className="grid gap-3">
          <Alert>
            <AlertTitle>Information</AlertTitle>
            <AlertDescription>The payment is being confirmed by the provider.</AlertDescription>
          </Alert>
          <Alert variant="success">
            <AlertTitle>Payment confirmed</AlertTitle>
            <AlertDescription>Your subscription is now active.</AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertTitle>Unable to continue</AlertTitle>
            <AlertDescription>Please try again in a few moments.</AlertDescription>
          </Alert>
        </div>
      </Section>

      <Section
        id="card"
        title="Card"
        when="Groups related content (product, setting, summary). Compose with Header, Content and Footer. Don't nest cards."
      >
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle>Pro plan</CardTitle>
            <CardDescription>For small teams.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">990 MZN</p>
          </CardContent>
          <CardFooter>
            <Button className="w-full">Continue to payment</Button>
          </CardFooter>
        </Card>
      </Section>
      <Separator />

      <Section
        id="chart"
        title="Chart"
        when="Comparing a few series (counts, rates, amounts). Don't use it for one number, a dense table, or a single task's progress. Pair it with a legend or a table so colour is not the only cue. Colours come from chart and status tokens."
      >
        <ChartDemo />
      </Section>
      <Separator />

      <Section
        id="dialog"
        title="Dialog"
        when="Modal window for a focused task (edit, short form, detail). To confirm destructive actions use AlertDialog; for side panels use Sheet."
      >
        <Demo>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Edit profile</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit profile</DialogTitle>
                <DialogDescription>Change your public name.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-2">
                <Label htmlFor="ds-name">Name</Label>
                <Input id="ds-name" defaultValue="Américo" />
              </div>
              <DialogFooter>
                <Button>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary">Expandable dialog</Button>
            </DialogTrigger>
            <DialogContent isExpansible size="md">
              <DialogHeader>
                <DialogTitle>Terms and conditions</DialogTitle>
                <DialogDescription>
                  On mobile, drag the handle up to expand and down to collapse or close.
                </DialogDescription>
              </DialogHeader>
              <DialogBody className="grid content-start gap-3 text-sm text-muted-foreground">
                {Array.from({ length: 8 }, (_, i) => (
                  <p key={i}>
                    <span className="font-medium text-foreground">{i + 1}. </span>The footer stays pinned at the bottom,
                    even with the sheet expanded or content scrolling. Use isExpansible on dialogs with long content,
                    such as terms, lists or lengthy forms.
                  </p>
                ))}
              </DialogBody>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost">Decline</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button>Accept</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Demo>
        <Demo>
          {(["sm", "md", "lg", "xl"] as const).map((size) => (
            <Dialog key={size}>
              <DialogTrigger asChild>
                <Button variant="outline">Size {size}</Button>
              </DialogTrigger>
              <DialogContent size={size}>
                <DialogHeader>
                  <DialogTitle>Dialog {size}</DialogTitle>
                  <DialogDescription>
                    The size prop only changes the width on desktop; on mobile it is always a bottom sheet.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button>Close</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ))}
        </Demo>
      </Section>

      <Section
        id="alert-dialog"
        title="AlertDialog"
        when="Mandatory confirmation before something destructive or irreversible. Doesn't close when clicking outside. State clearly what will be lost."
      >
        <Demo>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Cancel subscription</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel subscription?</AlertDialogTitle>
                <AlertDialogDescription>
                  You will lose access at the end of the current period. You can subscribe again later.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep</AlertDialogCancel>
                <AlertDialogAction>Cancel subscription</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Demo>
      </Section>

      <Section
        id="sheet"
        title="Sheet"
        when="Panel that slides in from a side, keeping the page context: filters, details, edit forms, mobile navigation."
      >
        <Demo>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">Open filters</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>Refine the payments list.</SheetDescription>
              </SheetHeader>
              <div className="grid gap-2 px-4">
                <Label htmlFor="ds-q">Search</Label>
                <Input id="ds-q" placeholder="Product…" />
              </div>
              <SheetFooter>
                <Button>Apply</Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </Demo>
      </Section>

      <Section
        id="menus"
        title="DropdownMenu, Popover, Tooltip"
        when="DropdownMenu: list of actions. Popover: small interactive content. Tooltip: short label for icon-only buttons (never essential information)."
      >
        <Demo>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Actions</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Sign out</DropdownMenuItem>
              <DropdownMenuItem size="lg">Large item</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">More info</Button>
            </PopoverTrigger>
            <PopoverContent>
              <PopoverHeader>
                <PopoverTitle>Billing</PopoverTitle>
                <PopoverDescription>We charge at the start of each period.</PopoverDescription>
              </PopoverHeader>
            </PopoverContent>
          </Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" aria-label="More options">
                <MoreH />
              </Button>
            </TooltipTrigger>
            <TooltipContent>More options</TooltipContent>
          </Tooltip>
        </Demo>
      </Section>

      <Separator />

      <Section
        id="page-header"
        title="PageHeader"
        when="Title and description at the top of a full page in the authenticated area. Always pinned to the top: back button at the start, centred title, actions at the end (full width, ignoring the content max-w). Below md several actions collapse into a … menu. Not for titles inside cards, dialogs or sheets. See app/(dashboard) pages for live use."
      >
        <Demo>
          <code className="text-sm">
            {
              '<PageHeader back={{ href: "/dashboard" }} title="Pagamentos" actions={[{ label: "Novo", icon: <Plus />, href: "/new" }]} />'
            }
          </code>
        </Demo>
      </Section>

      <Separator />

      <Section
        id="sidebar"
        title="Sidebar"
        when="Main navigation for an area of the app (account, settings). Column on desktop, tab bar on mobile. Not for tabs within a page (use Tabs)."
      >
        <Demo>
          <div className="h-96 w-full max-w-65 overflow-hidden rounded-2xl border md:[&_aside]:h-full">
            <Sidebar className="max-md:static max-md:border-0">
              <SidebarHeader>
                <SidebarBrand href="#sidebar">Account</SidebarBrand>
                <Avatar className="size-6">
                  <AvatarFallback />
                </Avatar>
              </SidebarHeader>
              <SidebarNav>
                <SidebarMenu>
                  <SidebarItem isActive>
                    <SidebarLink href="#sidebar">
                      <SidebarIcon icon={Wallet} />
                      <SidebarLabel>Your Wallets</SidebarLabel>
                    </SidebarLink>
                  </SidebarItem>
                  <SidebarItem>
                    <SidebarLink href="#sidebar">
                      <AddressBook />
                      <SidebarLabel>Address Book</SidebarLabel>
                    </SidebarLink>
                  </SidebarItem>
                  <SidebarItem>
                    <SidebarLink href="#sidebar">
                      <SidebarIcon icon={Lock} />
                      <SidebarLabel>Security</SidebarLabel>
                    </SidebarLink>
                  </SidebarItem>
                </SidebarMenu>
                <SidebarSubmenu>
                  <SidebarSubitem>
                    <SidebarSubLink href="#sidebar">Developers</SidebarSubLink>
                  </SidebarSubitem>
                  <SidebarSubitem>
                    <SidebarSubLink href="#sidebar">Privacy</SidebarSubLink>
                  </SidebarSubitem>
                  <SidebarSubitem>
                    <SidebarSubLink href="#sidebar">Terms</SidebarSubLink>
                  </SidebarSubitem>
                </SidebarSubmenu>
              </SidebarNav>
            </Sidebar>
          </div>
        </Demo>
      </Section>

      <Separator />

      <Section
        id="form-controls"
        title="Textarea, Select, Checkbox, Radio, Switch"
        when="Textarea: long text. Select: one option from a list (4–15). RadioGroup: 2–5 visible options. Checkbox: yes/no or multiple. Switch: setting with immediate effect."
      >
        <Demo>
          <div className="grid w-full max-w-sm gap-5">
            <div className="grid gap-2">
              <Label htmlFor="ds-msg">Message</Label>
              <Textarea id="ds-msg" placeholder="Write here…" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ds-provider">Provider</Label>
              <Select defaultValue="epay">
                <SelectTrigger id="ds-provider" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="epay">EPay</SelectItem>
                  <SelectItem value="dodo">Dodo Payments</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <RadioGroup defaultValue="monthly">
              <div className="flex items-center gap-2">
                <RadioGroupItem id="ds-r1" value="monthly" />
                <Label htmlFor="ds-r1">Monthly</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem id="ds-r2" value="yearly" />
                <Label htmlFor="ds-r2">Yearly</Label>
              </div>
            </RadioGroup>
            <div className="flex items-center gap-2">
              <Checkbox id="ds-terms" />
              <Label htmlFor="ds-terms">I accept the terms</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="ds-notify" />
              <Label htmlFor="ds-notify">Email notifications</Label>
            </div>
          </div>
        </Demo>
      </Section>

      <Separator />

      <Section
        id="form"
        title="Form"
        when="Validated form: react-hook-form + zod. Describe the data with a zod schema, create it with useZodForm, then compose FormField → FormItem → FormLabel + FormControl + FormMessage. FormControl wires id and aria-invalid into the wrapped input; Select, Checkbox and Switch are fed from the field render prop. Server errors go through form.setError (FormError for the root). FormSubmit shows the spinner while submitting."
      >
        <Demo>
          <FormDemo />
        </Demo>
      </Section>

      <Separator />

      <Section
        id="native-select"
        title="NativeSelect"
        when="The browser's own select with the field styling. Preferable on mobile and in simple forms. For options with icons/descriptions use Select; for long searchable lists use Combobox."
      >
        <Demo>
          <div className="grid w-full max-w-sm gap-5">
            <div className="grid gap-2">
              <Label htmlFor="ds-native">Country</Label>
              <NativeSelect id="ds-native" defaultValue="mz" className="w-full">
                <NativeSelectOption value="mz">Mozambique</NativeSelectOption>
                <NativeSelectOption value="pt">Portugal</NativeSelectOption>
                <NativeSelectOption value="br">Brazil</NativeSelectOption>
                <NativeSelectOption value="ao">Angola</NativeSelectOption>
              </NativeSelect>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ds-native-error">With error</Label>
              <NativeSelect id="ds-native-error" aria-invalid className="w-full" defaultValue="">
                <NativeSelectOption value="" disabled>
                  Choose…
                </NativeSelectOption>
                <NativeSelectOption value="a">Option A</NativeSelectOption>
              </NativeSelect>
            </div>
          </div>
        </Demo>
      </Section>

      <Section
        id="combobox"
        title="Combobox"
        when="Pick from a long list by filtering as you type (countries, customers, tags). With multiple, pick several values as chips. For 4–15 simple options use Select or NativeSelect."
      >
        <Demo>
          <ComboboxDemo />
        </Demo>
      </Section>

      <Section
        id="date-picker"
        title="DatePicker, DateRangePicker, Calendar"
        when="DatePicker: a single date in a form. DateRangePicker: a period. Calendar (react-day-picker) can also be used inline."
      >
        <Demo>
          <DatePickerDemo />
        </Demo>
      </Section>

      <Section
        id="input-otp"
        title="InputOTP"
        when="One-time code (verification, 2FA) in separate slots, with paste support. For free-length codes use Input."
      >
        <Demo>
          <OtpDemo />
        </Demo>
      </Section>

      <Section
        id="questionnaire"
        title="Questionnaire"
        when="Guided form, one question at a time (onboarding, surveys). Supports single/multiple choice, free-text answers and optional questions. For a regular form with all fields visible use Field + Input."
      >
        <Demo>
          <QuestionnaireDemo />
        </Demo>
      </Section>

      <Section
        id="data-table"
        title="DataTable"
        when="Table with sorting, filtering, pagination, row selection and column visibility (TanStack Table). For a few static rows use Table."
      >
        <DataTableDemo />
      </Section>

      <Separator />

      <Section
        id="list"
        title="List"
        when="Simple rows with a left side (title + description) and a right side (value, status, action). Payment history, members, summaries. No dividers by default. For comparable columns use Table."
      >
        <Demo>
          <List className="max-w-md divide-y">
            <ListItem>
              <ListIcon>
                <Wallet />
              </ListIcon>
              <ListItemStart>
                <ListItemTitle>Pro plan</ListItemTitle>
                <ListItemDescription>Renews on October 12</ListItemDescription>
              </ListItemStart>
              <ListItemEnd>
                <ListItemTitle>990.00 MZN</ListItemTitle>
                <Badge variant="success">Paid</Badge>
              </ListItemEnd>
            </ListItem>
            <ListItem>
              <ListItemStart>
                <ListItemTitle>Extra: 5 users</ListItemTitle>
                <ListItemDescription>Added on September 2</ListItemDescription>
              </ListItemStart>
              <ListItemEnd>
                <ListItemTitle>250.00 MZN</ListItemTitle>
                <Badge variant="warning">Pending</Badge>
              </ListItemEnd>
            </ListItem>
            <ListItem>
              <ListItemStart>
                <ListItemTitle>Previous subscription</ListItemTitle>
                <ListItemDescription>Cancelled on August 20</ListItemDescription>
              </ListItemStart>
              <ListItemEnd>
                <ListItemTitle>—</ListItemTitle>
                <Badge variant="secondary">Cancelled</Badge>
              </ListItemEnd>
            </ListItem>
          </List>
        </Demo>
      </Section>

      <Separator />

      <Section
        id="data"
        title="Table, Tabs, Accordion, Breadcrumb"
        when="Table: comparable data. Tabs: views of the same page. Accordion: collapsible secondary content. Breadcrumb: position in a hierarchy (2+ levels)."
      >
        <div className="space-y-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Payments</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Tabs defaultValue="history">
            <TabsList>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="subs">Subscriptions</TabsTrigger>
            </TabsList>
            <TabsContent value="history">
              <div className="rounded-2xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Pro plan</TableCell>
                      <TableCell>
                        <Badge variant="success">Paid</Badge>
                      </TableCell>
                      <TableCell className="text-right">990 MZN</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Basic plan</TableCell>
                      <TableCell>
                        <Badge variant="warning">Pending</Badge>
                      </TableCell>
                      <TableCell className="text-right">490 MZN</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="subs">
              <p className="py-4 text-sm text-muted-foreground">No active subscriptions.</p>
            </TabsContent>
          </Tabs>
          <Accordion type="single" collapsible className="max-w-xl">
            <AccordionItem value="a">
              <AccordionTrigger>Can I cancel whenever I want?</AccordionTrigger>
              <AccordionContent>Yes, at the end of the current period.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="b">
              <AccordionTrigger>Which payment methods do you accept?</AccordionTrigger>
              <AccordionContent>EPay and Dodo Payments.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </Section>

      <Section
        id="feedback"
        title="Toast, Skeleton, Progress, Avatar"
        when="Toast: brief feedback after an action (use Alert if it must persist). Skeleton: loading of sections. Progress: task with known progress. Avatar: a person or entity."
      >
        <Demo>
          <ToastDemo />
        </Demo>
        <Demo>
          <div className="flex w-full max-w-sm items-center gap-3">
            <Skeleton className="size-10 rounded-full" />
            <div className="grid flex-1 gap-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </Demo>
        <Demo>
          <Progress value={60} className="max-w-sm" />
          <Avatar>
            <AvatarFallback>AJ</AvatarFallback>
          </Avatar>
        </Demo>
      </Section>

      <Separator />

      <Section
        id="empty-state"
        title="EmptyState"
        when="Shown instead of a list or table with no data (nothing created yet, or no search results). Say what is missing and offer the next step. For loading use Skeleton; for failures use Alert or ErrorState."
      >
        <Demo>
          <EmptyState
            className="w-full"
            icon={<Wallet />}
            title="No payments yet"
            description="Purchases will show up here once you complete your first checkout."
            action={<Button size="sm">Browse plans</Button>}
          />
        </Demo>
      </Section>

      <Section
        id="details"
        title="Interface details"
        when="Small interaction, design and accessibility details (detail.design) that are already part of the system: shortcut hint when holding ⌘/Ctrl, text that adapts to its background, placeholder derived from the name, progressive blur on the edges, browser bar colour (theme-color), scroll shortcut, images that emerge from blur, and labels that focus the field."
      >
        <div className="space-y-6">
          <Demo>
            <ShortcutDemo />
          </Demo>
          <Demo>
            {["#fde047", "#86efac", "#38bdf8", "#6366f1", "#be123c", "#1e293b"].map((color) => (
              <div
                key={color}
                style={{ "--surface": color } as React.CSSProperties}
                className="flex h-14 w-28 items-center justify-center rounded-2xl bg-(--surface) text-sm font-medium text-adaptive"
              >
                {color}
              </div>
            ))}
          </Demo>
          <Demo>
            <div className="relative h-72 w-full max-w-sm overflow-hidden rounded-2xl ring-1 ring-foreground/10">
              <div className="h-full space-y-3 overflow-y-auto p-4 pt-20 pb-16">
                {[
                  "from-rose-500 to-orange-400",
                  "from-indigo-500 to-sky-400",
                  "from-emerald-500 to-lime-300",
                  "from-fuchsia-500 to-violet-500",
                ].map((gradient, i) => (
                  <div key={gradient} className="space-y-2">
                    <div className={`h-24 rounded-2xl bg-linear-to-br ${gradient}`} />
                    <p className="text-sm text-muted-foreground">
                      Card {i + 1}: the content progressively blurs as it approaches the edge, without fading the
                      colours.
                    </p>
                  </div>
                ))}
              </div>
              <ProgressiveBlur side="top" size={72} />
              <ProgressiveBlur side="bottom" size={56} />
              <div className="absolute inset-x-0 top-0 z-20 flex h-12 items-center px-4 text-sm font-medium">
                Header
              </div>
            </div>
          </Demo>
          <Demo>
            <NamePlaceholderDemo />
          </Demo>
          <Demo>
            <ThemeColorDemo />
          </Demo>
          <Demo>
            <ScrollLandmarkDemo />
          </Demo>
          <Demo>
            <BlurImageDemo />
          </Demo>
        </div>
      </Section>
      <ScrollLandmark />
    </main>
  );
}
