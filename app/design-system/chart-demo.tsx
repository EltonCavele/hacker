"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

const config = {
  salaries: {
    label: "Salários",
    theme: { light: "var(--chart-5)", dark: "var(--chart-1)" },
  },
} satisfies ChartConfig;

const data = [
  { municipality: "Chiúre", salaries: 12 },
  { municipality: "KaMpfumo", salaries: 8 },
  { municipality: "Marracuene", salaries: 21 },
];

export function ChartDemo() {
  return (
    <ChartContainer className="aspect-video w-full max-w-lg" config={config}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="municipality" tickLine={false} axisLine={false} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="salaries" fill="var(--color-salaries)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
