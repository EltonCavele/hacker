"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatMzn, UNASSIGNED_MUNICIPALITY, type PanelStats } from "@/features/folha/panel";
import { cn } from "@/lib/utils";

const axisColor = {
  light: "var(--chart-5)",
  dark: "var(--chart-1)",
} as const;

const MUNICIPALITY_COLORS = ["var(--foreground)", "var(--info)", "var(--success)", "var(--warning)", "var(--chart-2)"];

const staffConfig = {
  staff: { label: "Funcionários", theme: axisColor },
} satisfies ChartConfig;

const payrollConfig = {
  payrollMzn: { label: "Massa salarial", theme: axisColor },
} satisfies ChartConfig;

const coverageConfig = {
  owned: { label: "Com chefe", theme: axisColor },
  verified: { label: "Verificada", color: "var(--info)" },
  attestedOnTime: { label: "Com atestação", color: "var(--success)" },
} satisfies ChartConfig;

const paymentConfig = {
  pay: { label: "Pagar", color: "var(--success)" },
  hold: { label: "Reter", color: "var(--warning)" },
  suspend: { label: "Suspender", color: "var(--destructive)" },
} satisfies ChartConfig;

const riskConfig = {
  discrepancies: { label: "Discrepâncias", theme: axisColor },
  highRisk: { label: "Risco alto", color: "var(--destructive)" },
  mediumRisk: { label: "Risco médio", color: "var(--warning)" },
} satisfies ChartConfig;

const sectorConfig = {
  staff: { label: "Funcionários", theme: axisColor },
  units: { label: "Unidades", color: "var(--info)" },
} satisfies ChartConfig;

const unitStaffConfig = {
  staff: { label: "Funcionários", theme: axisColor },
} satisfies ChartConfig;

const unitVerifiedConfig = {
  verified: { label: "Verificada", color: "var(--info)" },
} satisfies ChartConfig;

function truncate(value: string, max = 22) {
  return value.length > max ? `${value.slice(0, max - 2)}…` : value;
}

function NameTick({ x = 0, y = 0, payload }: { x?: number; y?: number; payload?: { value?: string } }) {
  const full = String(payload?.value ?? "");
  return (
    <text className="fill-muted-foreground text-xs" dy={4} textAnchor="end" x={x} y={y}>
      <title>{full}</title>
      {truncate(full, 32)}
    </text>
  );
}

function municipalityColor(name: string, names: string[]) {
  if (name === UNASSIGNED_MUNICIPALITY) return "var(--muted-foreground)";
  const index = names.filter((item) => item !== UNASSIGNED_MUNICIPALITY).indexOf(name);
  return MUNICIPALITY_COLORS[(index < 0 ? 0 : index) % MUNICIPALITY_COLORS.length];
}

function ChartCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("min-w-0 border", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function PanelCharts({ stats }: { stats: PanelStats }) {
  const municipalityNames = stats.municipalities.map((row) => row.municipality);
  const unitHeight = Math.max(260, stats.units.length * 36 + 28);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ChartCard
        title="Funcionários por município"
        description="Salários activos em cada município, incluindo quem está sem unidade."
      >
        <ChartContainer config={staffConfig}>
          <BarChart data={stats.municipalities} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="municipality" tickLine={false} axisLine={false} interval={0} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="staff" fill="var(--color-staff)" isAnimationActive={false} radius={4} />
          </BarChart>
        </ChartContainer>
      </ChartCard>

      <ChartCard title="Massa salarial" description="Soma dos salários mensais, em meticais, por município.">
        <ChartContainer config={payrollConfig}>
          <BarChart data={stats.municipalities} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="municipality" tickLine={false} axisLine={false} interval={0} />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={72}
              tickFormatter={(value: number) => (value >= 1000 ? `${Math.round(value / 1000)} mil` : String(value))}
            />
            <ChartTooltip content={<ChartTooltipContent valueFormatter={(value) => formatMzn(Number(value))} />} />
            <Bar dataKey="payrollMzn" fill="var(--color-payrollMzn)" isAnimationActive={false} radius={4} />
          </BarChart>
        </ChartContainer>
      </ChartCard>

      <ChartCard
        title="Cobertura da folha"
        description="Percentagem de salários em unidade com chefe nomeado, salários confirmados por duas fontes, e unidades com pelo menos uma atestação."
      >
        <ChartContainer config={coverageConfig}>
          <BarChart data={stats.municipalities} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="municipality" tickLine={false} axisLine={false} interval={0} />
            <YAxis domain={[0, 100]} tickLine={false} axisLine={false} width={32} />
            <ChartTooltip content={<ChartTooltipContent valueFormatter={(value) => `${value}%`} />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="owned" fill="var(--color-owned)" isAnimationActive={false} radius={4} />
            <Bar dataKey="verified" fill="var(--color-verified)" isAnimationActive={false} radius={4} />
            <Bar dataKey="attestedOnTime" fill="var(--color-attestedOnTime)" isAnimationActive={false} radius={4} />
          </BarChart>
        </ChartContainer>
      </ChartCard>

      <ChartCard
        title="Decisão de pagamento"
        description="Quantos salários seguem para pagar, ficam retidos ou são suspensos."
      >
        <ChartContainer config={paymentConfig}>
          <BarChart data={stats.municipalities} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="municipality" tickLine={false} axisLine={false} interval={0} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="pay" stackId="payment" fill="var(--color-pay)" isAnimationActive={false} />
            <Bar dataKey="hold" stackId="payment" fill="var(--color-hold)" isAnimationActive={false} />
            <Bar
              dataKey="suspend"
              stackId="payment"
              fill="var(--color-suspend)"
              isAnimationActive={false}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </ChartCard>

      <ChartCard
        title="Risco e discrepâncias"
        description="Alertas de risco e visitas em que o chefe atestou presente e a auditoria não encontrou a pessoa."
      >
        <ChartContainer config={riskConfig}>
          <BarChart data={stats.municipalities} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="municipality" tickLine={false} axisLine={false} interval={0} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="discrepancies" fill="var(--color-discrepancies)" isAnimationActive={false} radius={4} />
            <Bar dataKey="highRisk" fill="var(--color-highRisk)" isAnimationActive={false} radius={4} />
            <Bar dataKey="mediumRisk" fill="var(--color-mediumRisk)" isAnimationActive={false} radius={4} />
          </BarChart>
        </ChartContainer>
      </ChartCard>

      <ChartCard title="Por sector" description="Funcionários e unidades de todo o Estado, por área.">
        <ChartContainer
          className="aspect-auto w-full"
          config={sectorConfig}
          style={{ height: Math.max(220, stats.sectors.length * 48 + 16) }}
        >
          <BarChart data={stats.sectors} layout="vertical" margin={{ top: 0, right: 12, left: 4, bottom: 0 }}>
            <CartesianGrid horizontal={false} />
            <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="label" width={200} tickLine={false} axisLine={false} tick={<NameTick />} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="staff" fill="var(--color-staff)" isAnimationActive={false} radius={4} />
            <Bar dataKey="units" fill="var(--color-units)" isAnimationActive={false} radius={4} />
          </BarChart>
        </ChartContainer>
      </ChartCard>

      <ChartCard
        className="md:col-span-2"
        title="Todas as unidades"
        description="Funcionários de cada unidade do Estado. A cor indica o município."
      >
        <div className="mb-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
          {municipalityNames.map((name) => (
            <span className="inline-flex items-center gap-1.5" key={name}>
              <span
                className="size-2 rounded-[2px]"
                style={{ backgroundColor: municipalityColor(name, municipalityNames) }}
              />
              {name}
            </span>
          ))}
        </div>
        <ChartContainer className="aspect-auto w-full" config={unitStaffConfig} style={{ height: unitHeight }}>
          <BarChart data={stats.units} layout="vertical" margin={{ top: 0, right: 12, left: 4, bottom: 0 }}>
            <CartesianGrid horizontal={false} />
            <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="name" width={220} tickLine={false} axisLine={false} tick={<NameTick />} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="staff" isAnimationActive={false} radius={4}>
              {stats.units.map((unit) => (
                <Cell fill={municipalityColor(unit.municipality, municipalityNames)} key={unit.id} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </ChartCard>

      <ChartCard
        className="md:col-span-2"
        title="Verificação por unidade"
        description="Percentagem de salários confirmados por duas fontes, em cada unidade."
      >
        <ChartContainer className="aspect-auto w-full" config={unitVerifiedConfig} style={{ height: unitHeight }}>
          <BarChart data={stats.units} layout="vertical" margin={{ top: 0, right: 12, left: 4, bottom: 0 }}>
            <CartesianGrid horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="name" width={220} tickLine={false} axisLine={false} tick={<NameTick />} />
            <ChartTooltip content={<ChartTooltipContent valueFormatter={(value) => `${value}%`} />} />
            <Bar dataKey="verified" fill="var(--color-verified)" isAnimationActive={false} radius={4} />
          </BarChart>
        </ChartContainer>
      </ChartCard>
    </div>
  );
}
