"use client";

import * as React from "react";
import type { DateRange } from "react-day-picker";
import { MoreH } from "reicon-react";
import { z } from "zod";
import { toast } from "sonner";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormError,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormSubmit,
  useZodForm,
} from "@/components/ui/form";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import { Badge } from "@/components/ui/badge";
import { BlurImage } from "@/components/ui/blur-image";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import {
  DataTable,
  DataTableColumnHeader,
  createDataTableColumnHelper,
  createSelectColumn,
} from "@/components/ui/data-table";
import { DatePicker, DateRangePicker } from "@/components/ui/date-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp";
import { useCurrentThemeColor, useThemeColor } from "@/components/theme-color";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollLandmark } from "@/components/ui/scroll-landmark";
import { Shortcut, ShortcutHint } from "@/components/ui/kbd";
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoiceDescription,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireError,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSkip,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from "@/components/ui/questionnaire";

const frameworks = ["Next.js", "SvelteKit", "Nuxt.js", "Remix", "Astro", "Vite", "Angular"];

export function ComboboxDemo() {
  const anchor = useComboboxAnchor();

  return (
    <div className="grid w-full max-w-sm gap-6">
      <div className="grid gap-2">
        <Label>Framework</Label>
        <Combobox items={frameworks}>
          <ComboboxInput placeholder="Escolher framework…" showClear />
          <ComboboxContent>
            <ComboboxEmpty>Sem resultados.</ComboboxEmpty>
            <ComboboxList>
              {(item: string) => (
                <ComboboxItem key={item} value={item}>
                  {item}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>
      <div className="grid gap-2">
        <Label>Várias opções</Label>
        <Combobox multiple autoHighlight items={frameworks} defaultValue={[frameworks[0], frameworks[3]]}>
          <ComboboxChips ref={anchor}>
            <ComboboxValue>
              {(values: string[]) => (
                <React.Fragment>
                  {values.map((value) => (
                    <ComboboxChip key={value}>{value}</ComboboxChip>
                  ))}
                  <ComboboxChipsInput placeholder={values.length ? "" : "Escolher…"} />
                </React.Fragment>
              )}
            </ComboboxValue>
          </ComboboxChips>
          <ComboboxContent anchor={anchor}>
            <ComboboxEmpty>Sem resultados.</ComboboxEmpty>
            <ComboboxList>
              {(item: string) => (
                <ComboboxItem key={item} value={item}>
                  {item}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>
    </div>
  );
}

export function DatePickerDemo() {
  const [date, setDate] = React.useState<Date | undefined>();
  const [range, setRange] = React.useState<DateRange | undefined>();

  return (
    <div className="grid w-full max-w-sm gap-6">
      <div className="grid gap-2">
        <Label htmlFor="ds-date">Data de nascimento</Label>
        <DatePicker id="ds-date" value={date} onValueChange={setDate} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="ds-range">Período</Label>
        <DateRangePicker id="ds-range" value={range} onValueChange={setRange} />
      </div>
    </div>
  );
}

export function OtpDemo() {
  const [value, setValue] = React.useState("");
  const [wrong, setWrong] = React.useState("12");

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <Label htmlFor="ds-otp">Código de verificação</Label>
        <InputOTP id="ds-otp" maxLength={6} value={value} onChange={setValue}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="ds-otp-error">Com erro</Label>
        <InputOTP id="ds-otp-error" maxLength={4} value={wrong} onChange={setWrong} aria-invalid>
          <InputOTPGroup>
            <InputOTPSlot index={0} aria-invalid />
            <InputOTPSlot index={1} aria-invalid />
            <InputOTPSlot index={2} aria-invalid />
            <InputOTPSlot index={3} aria-invalid />
          </InputOTPGroup>
        </InputOTP>
      </div>
    </div>
  );
}

const questions = [
  {
    name: "direction",
    required: true,
    prompt: "O que devemos construir a seguir?",
    description: "Escolhe uma direcção ou escreve a tua.",
    choices: [
      { value: "delegation", label: "Delegação", description: "Mostra como o trabalho passa para um especialista." },
      { value: "questions", label: "Perguntas", description: "Mostra opções enquanto a interface espera." },
      { value: "both", label: "As duas em conjunto" },
    ],
    input: { label: "Outra resposta", placeholder: "Escreve outra resposta…" },
  },
  {
    name: "detail",
    required: false,
    prompt: "Quanto detalhe deve incluir?",
    description: "Salta esta pergunta se ainda não tiveres a certeza.",
    choices: [
      { value: "focused", label: "Focado" },
      { value: "complete", label: "Fluxo completo" },
    ],
  },
] as const;

export function QuestionnaireDemo() {
  const [answers, setAnswers] = React.useState<Record<string, string> | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setAnswers(Object.fromEntries(questions.map((q) => [q.name, String(data.get(q.name) ?? "—")])));
  }

  return (
    <div className="grid w-full max-w-md gap-4">
      <Questionnaire items={questions} onSubmit={handleSubmit}>
        <QuestionnaireProgress />
        {questions.map((question) => (
          <QuestionnaireItem key={question.name} name={question.name} required={question.required}>
            <QuestionnaireTitle>{question.prompt}</QuestionnaireTitle>
            <QuestionnaireDescription>{question.description}</QuestionnaireDescription>
            <QuestionnaireChoices>
              {question.choices.map((choice) => (
                <QuestionnaireChoice key={choice.value} value={choice.value}>
                  <span className="font-medium">{choice.label}</span>
                  {"description" in choice ? (
                    <QuestionnaireChoiceDescription>{choice.description}</QuestionnaireChoiceDescription>
                  ) : null}
                </QuestionnaireChoice>
              ))}
              {"input" in question ? (
                <QuestionnaireInput aria-label={question.input.label} placeholder={question.input.placeholder} />
              ) : null}
            </QuestionnaireChoices>
            <QuestionnaireError />
          </QuestionnaireItem>
        ))}
        <QuestionnaireActions>
          <QuestionnairePrevious />
          <QuestionnaireSkip />
          <QuestionnaireNext />
          <QuestionnaireSubmit />
        </QuestionnaireActions>
      </Questionnaire>
      {answers && (
        <pre className="rounded-2xl bg-muted p-3 text-xs" aria-live="polite">
          {JSON.stringify(answers, null, 2)}
        </pre>
      )}
    </div>
  );
}

type Payment = {
  id: string;
  amount: number;
  status: "pending" | "processing" | "success" | "failed";
  email: string;
};

const payments: Payment[] = [
  { id: "728ed52f", amount: 100, status: "pending", email: "m@example.com" },
  { id: "489e1d42", amount: 125, status: "processing", email: "example@gmail.com" },
  { id: "abc123de", amount: 316, status: "success", email: "ken99@example.com" },
  { id: "def456gh", amount: 242, status: "success", email: "abe45@example.com" },
  { id: "ghi789jk", amount: 837, status: "processing", email: "monserrat44@example.com" },
  { id: "jkl012mn", amount: 451, status: "failed", email: "silas22@example.com" },
  { id: "mno345pq", amount: 98, status: "success", email: "carmella@example.com" },
  { id: "pqr678st", amount: 560, status: "pending", email: "joana@example.com" },
];

const statusBadge = {
  pending: { variant: "warning", label: "Pendente" },
  processing: { variant: "info", label: "A processar" },
  success: { variant: "success", label: "Pago" },
  failed: { variant: "destructive", label: "Falhou" },
} as const;

const helper = createDataTableColumnHelper<Payment>();

const paymentColumns = helper.columns([
  createSelectColumn<Payment>(),
  helper.accessor("status", {
    header: "Estado",
    cell: ({ row }) => {
      const status = statusBadge[row.original.status];
      return <Badge variant={status.variant}>{status.label}</Badge>;
    },
  }),
  helper.accessor("email", {
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
  }),
  helper.accessor("amount", {
    header: ({ column }) => <DataTableColumnHeader column={column} title="Valor" className="ml-auto" />,
    cell: ({ row }) => (
      <div className="text-right font-medium">
        {new Intl.NumberFormat("pt-PT", { style: "currency", currency: "MZN" }).format(row.original.amount)}
      </div>
    ),
  }),
  helper.display({
    id: "actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Acções">
            <MoreH />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Acções</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(row.original.id)}>Copiar ID</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Ver cliente</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    enableHiding: false,
  }),
]);

export function DataTableDemo() {
  return (
    <DataTable
      columns={paymentColumns}
      data={payments}
      filterColumn="email"
      filterPlaceholder="Filtrar emails…"
      pageSize={5}
    />
  );
}

export function ShortcutDemo() {
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "s" || !(event.metaKey || event.ctrlKey)) return;
      event.preventDefault();
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1200);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-6">
      <Button className="relative" onClick={() => setSaved(true)}>
        {saved ? "Guardado!" : "Guardar"}
        <ShortcutHint keys={["mod", "S"]} />
      </Button>
      <Button variant="outline" className="relative">
        Pesquisar
        <ShortcutHint keys={["mod", "K"]} />
      </Button>
      <p className="text-sm text-muted-foreground">
        Segura <Shortcut keys={["mod"]} /> para ver os atalhos; <Shortcut keys={["mod", "S"]} /> guarda.
      </p>
    </div>
  );
}

/** "Américo Júnior" → "americo.junior" — used to hint the format of the field that follows the name. */
function handleFrom(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.replace(/[^a-z0-9]/g, ""))
    .filter(Boolean)
    .slice(0, 2)
    .join(".");
}

export function NamePlaceholderDemo() {
  const [name, setName] = React.useState("");
  const handle = handleFrom(name);

  return (
    <div className="grid w-full max-w-sm gap-5">
      <div className="grid gap-2">
        <Label htmlFor="ds-np-name">Nome</Label>
        <Input
          id="ds-np-name"
          placeholder="Américo Júnior"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="ds-np-email">Email</Label>
        <Input id="ds-np-email" type="email" placeholder={`${handle || "tu"}@exemplo.com`} />
        <p className="text-xs text-muted-foreground">
          O exemplo do email usa o nome que acabaste de escrever. Clica no rótulo para focar o campo.
        </p>
      </div>
    </div>
  );
}

const chromeColors = [
  { label: "Tema", value: null },
  { label: "Índigo", value: "#4f46e5" },
  { label: "Esmeralda", value: "#059669" },
  { label: "Carmim", value: "#be123c" },
] as const;

export function ThemeColorDemo() {
  const [color, setColor] = React.useState<string | null>(null);
  useThemeColor(color);
  const current = useCurrentThemeColor();

  return (
    <div className="grid w-full max-w-md gap-4">
      <div className="flex flex-wrap gap-2">
        {chromeColors.map((option) => (
          <Button
            key={option.label}
            variant={color === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => setColor(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <span
          className="size-4 rounded-full ring-1 ring-foreground/10"
          style={{ background: current ?? "transparent" }}
        />
        <code className="font-mono">{`<meta name="theme-color" content="${current ?? "…"}">`}</code>
      </p>
      <p className="text-xs text-muted-foreground">
        A cor aplica-se à barra do browser em telemóvel (e à barra de título de uma PWA); desaparece quando este ecrã é
        desmontado.
      </p>
    </div>
  );
}

export function ScrollLandmarkDemo() {
  const scroller = React.useRef<HTMLDivElement>(null);

  return (
    <div className="relative w-full max-w-sm">
      <div
        ref={scroller}
        className="h-64 space-y-3 overflow-y-auto rounded-2xl bg-muted/50 p-4 ring-1 ring-foreground/10"
      >
        {Array.from({ length: 24 }, (_, i) => (
          <p key={i} className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Linha {i + 1}. </span>
            Desce até ao fim e usa o botão: sobe ao topo e, depois, volta ao ponto onde estavas.
          </p>
        ))}
      </div>
      <ScrollLandmark target={scroller} threshold={160} />
    </div>
  );
}

/** A 1px-ish tinted gradient as a data URL: stands in for the tiny preview a real app would store with the image. */
function tinyPreview(hue: number) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 5"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${hue} 80% 62%)"/><stop offset="1" stop-color="hsl(${hue} 50% 30%)"/></linearGradient></defs><rect width="8" height="5" fill="url(#g)"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function BlurImageDemo() {
  // A new `t` per run defeats the cache, so each press replays the load.
  const [run, setRun] = React.useState(0);
  const src = (hue: number) => `/design-system/slow-image?delay=1600&hue=${hue}&t=${run}`;

  return (
    <div className="grid w-full gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <figure className="grid gap-2">
          <BlurImage
            key={`a-${run}`}
            src={src(220)}
            alt="Paisagem azul ao fim do dia"
            wrapperClassName="aspect-[8/5] rounded-2xl"
          />
          <figcaption className="text-xs text-muted-foreground">Sem placeholder</figcaption>
        </figure>
        <figure className="grid gap-2">
          <BlurImage
            key={`b-${run}`}
            src={src(340)}
            alt="Paisagem rosa ao fim do dia"
            placeholder={tinyPreview(340)}
            wrapperClassName="aspect-[8/5] rounded-2xl"
          />
          <figcaption className="text-xs text-muted-foreground">Com placeholder desfocado</figcaption>
        </figure>
      </div>
      <div>
        <Button variant="outline" size="sm" onClick={() => setRun((n) => n + 1)}>
          Repetir
        </Button>
      </div>
    </div>
  );
}

const formDemoSchema = z.object({
  name: z.string().min(2, "Enter at least 2 characters"),
  email: z.email("Enter a valid email"),
  plan: z.enum(["free", "pro"], { message: "Choose a plan" }),
  country: z.string().min(1, "Pick a country"),
  bio: z.string().max(120, "Keep it under 120 characters").optional(),
  terms: z.boolean().refine((v) => v, "You must accept the terms"),
  notify: z.boolean(),
});

export function FormDemo() {
  const form = useZodForm(formDemoSchema, {
    defaultValues: { name: "", email: "", plan: "free", country: "", bio: "", terms: false, notify: true },
  });

  async function onSubmit(values: z.output<typeof formDemoSchema>) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    if (values.email.endsWith("@taken.com")) {
      form.setError("email", { message: "This email is already registered" });
      form.setError("root", { message: "Could not create the account" });
      return;
    }
    toast.success(`Saved ${values.name}`);
  }

  return (
    <Form form={form} onSubmit={onSubmit} className="w-full max-w-sm">
      <FormError />
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input placeholder="Américo" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input type="email" placeholder="you@example.com" {...field} />
            </FormControl>
            <FormDescription>Try an address ending in @taken.com to see a server error.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="country"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Country</FormLabel>
            <FormControl>
              <NativeSelect className="w-full" {...field}>
                <NativeSelectOption value="">Select…</NativeSelectOption>
                <NativeSelectOption value="br">Brazil</NativeSelectOption>
                <NativeSelectOption value="pt">Portugal</NativeSelectOption>
              </NativeSelect>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="plan"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Plan</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a plan" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="bio"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Bio</FormLabel>
            <FormControl>
              <Textarea placeholder="Tell us a bit…" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="notify"
        render={({ field }) => (
          <FormItem className="flex items-center gap-2">
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <FormLabel>Email notifications</FormLabel>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="terms"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center gap-2">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel>I accept the terms</FormLabel>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormSubmit>Create account</FormSubmit>
    </Form>
  );
}
