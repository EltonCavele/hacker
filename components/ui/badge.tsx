import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"
import {
  AlertCircle,
  Archive,
  Calendar,
  CheckCircle,
  Clock,
  Edit2,
  Eye,
  Loader,
  PauseCircle,
  Refresh2,
  XCircle,
} from "reicon-react"
import { Spinner } from "@/components/ui/spinner"

/**
 * Badge — small, non-interactive label for a status or category (e.g. payment status, plan name).
 *
 * Use `success` / `warning` / `info` / `destructive` to communicate state; `secondary` / `outline` for neutral tags.
 * Don't use it as a button or for long text. Always pair colour with a word — never rely on colour alone.
 */
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-lg border px-2 py-0.5 text-sm font-medium max-md:px-2.5 max-md:text-[0.8125rem] whitespace-nowrap transition-[color,box-shadow] [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "text-foreground",
        muted: "border-transparent bg-muted text-muted-foreground",
        success:
          "border-transparent bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        warning:
          "border-transparent bg-amber-500/10 text-amber-600 dark:text-amber-400",
        info: "border-transparent bg-sky-500/10 text-sky-600 dark:text-sky-400",
        danger: "border-transparent bg-destructive/10 text-destructive",
        destructive: "border-transparent bg-destructive/10 text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

type StatusValue =
  | "running"
  | "saving"
  | "syncing"
  | "unsaved"
  | "draft"
  | "progress"
  | "pending"
  | "payment_pending"
  | "queued"
  | "pendingApproval"
  | "pending_permission"
  | "scheduled"
  | "published"
  | "applying"
  | "sending"
  | "applied"
  | "active"
  | "invited"
  | "inactive"
  | "approved"
  | "completed"
  | "refunded"
  | "ringing"
  | "accepted"
  | "declined"
  | "timed_out"
  | "fallback_original"
  | "fallback_queue"
  | "connected"
  | "disconnected"
  | "missed"
  | "no_answer"
  | "busy"
  | "archived"
  | "rejected"
  | "failed"
  | "error"
  | "stale"
  | "paused"
  | "cancelled"
  | "deleted"
  | "disabled"
  | "enabled"
  | "pending_configuration"
  | "disconnecting"
  | "needs_reauth"
  | "unknown"

type StatusVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>

/** Maps a raw status string to its label, Badge variant and icon. Unknown values fall back to `unknown`. */
const statusMapping: Record<
  StatusValue,
  { label: string; variant: StatusVariant; icon: React.ReactNode }
> = {
  running: { label: "Em execução", variant: "info", icon: <Spinner /> },
  saving: { label: "A guardar", variant: "info", icon: <Spinner /> },
  syncing: { label: "A sincronizar", variant: "info", icon: <Refresh2 /> },
  unsaved: { label: "Por guardar", variant: "warning", icon: <Edit2 /> },
  draft: { label: "Rascunho", variant: "muted", icon: <Edit2 /> },
  progress: { label: "Em curso", variant: "info", icon: <Loader /> },
  pending: { label: "Pendente", variant: "info", icon: <Clock /> },
  payment_pending: { label: "Pendente", variant: "warning", icon: <Clock /> },
  queued: { label: "Em fila", variant: "info", icon: <Clock /> },
  pendingApproval: {
    label: "A aguardar aprovação",
    variant: "warning",
    icon: <Clock />,
  },
  pending_permission: {
    label: "A aguardar permissão",
    variant: "warning",
    icon: <Clock />,
  },
  scheduled: { label: "Agendado", variant: "info", icon: <Calendar /> },
  published: { label: "Publicado", variant: "success", icon: <Eye /> },
  applying: { label: "A aplicar", variant: "info", icon: <Spinner /> },
  sending: { label: "A enviar", variant: "warning", icon: <Spinner /> },
  applied: { label: "Aplicado", variant: "success", icon: <CheckCircle /> },
  active: { label: "Ativo", variant: "success", icon: <CheckCircle /> },
  invited: { label: "Convidado", variant: "warning", icon: <Clock /> },
  inactive: { label: "Inativo", variant: "muted", icon: <PauseCircle /> },
  approved: { label: "Aprovado", variant: "success", icon: <CheckCircle /> },
  completed: { label: "Concluído", variant: "success", icon: <CheckCircle /> },
  refunded: { label: "Reembolsado", variant: "success", icon: <CheckCircle /> },
  ringing: { label: "A tocar", variant: "warning", icon: <Clock /> },
  accepted: { label: "Aceite", variant: "success", icon: <CheckCircle /> },
  declined: { label: "Recusado", variant: "danger", icon: <XCircle /> },
  timed_out: { label: "Expirado", variant: "warning", icon: <Clock /> },
  fallback_original: { label: "Devolvido", variant: "info", icon: <Refresh2 /> },
  fallback_queue: { label: "Em fila", variant: "info", icon: <Clock /> },
  connected: { label: "Ligado", variant: "info", icon: <CheckCircle /> },
  disconnected: { label: "Desligado", variant: "muted", icon: <PauseCircle /> },
  missed: { label: "Perdido", variant: "warning", icon: <AlertCircle /> },
  no_answer: { label: "Sem resposta", variant: "warning", icon: <AlertCircle /> },
  busy: { label: "Ocupado", variant: "warning", icon: <PauseCircle /> },
  archived: { label: "Arquivado", variant: "muted", icon: <Archive /> },
  rejected: { label: "Rejeitado", variant: "danger", icon: <XCircle /> },
  failed: { label: "Falhou", variant: "danger", icon: <XCircle /> },
  error: { label: "Erro", variant: "danger", icon: <AlertCircle /> },
  stale: { label: "Desatualizado", variant: "warning", icon: <AlertCircle /> },
  paused: { label: "Em pausa", variant: "warning", icon: <PauseCircle /> },
  cancelled: { label: "Cancelado", variant: "muted", icon: <XCircle /> },
  deleted: { label: "Eliminado", variant: "muted", icon: <XCircle /> },
  disabled: { label: "Desativado", variant: "muted", icon: <PauseCircle /> },
  enabled: { label: "Ativo", variant: "success", icon: <CheckCircle /> },
  pending_configuration: {
    label: "Configuração pendente",
    variant: "warning",
    icon: <Clock />,
  },
  disconnecting: { label: "A desligar", variant: "info", icon: <Spinner /> },
  needs_reauth: {
    label: "Requer nova autenticação",
    variant: "warning",
    icon: <Refresh2 />,
  },
  unknown: { label: "Desconhecido", variant: "muted", icon: <AlertCircle /> },
}

/**
 * Status — a Badge driven by a raw status string (e.g. "active", "payment_pending").
 * The mapping picks the label, colour and icon; unrecognised values render as "Desconhecido".
 */
function Status({ status, className }: { status: string; className?: string }) {
  const { label, variant, icon } =
    statusMapping[status as StatusValue] ?? statusMapping.unknown

  return (
    <Badge variant={variant} className={cn("gap-1.5", className)} aria-label={label}>
      {icon}
      {label}
    </Badge>
  )
}

export { Badge, badgeVariants, Status, statusMapping }
export type { StatusValue }
