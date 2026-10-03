import { EmptyState } from "@/components/ui/empty-state";
import { PhotoCapture } from "@/features/folha/components/photo-capture";
import { prisma } from "@/lib/db/client";

export default async function FotoPage({ params }: { params: Promise<{ drawId: string }> }) {
  const { drawId } = await params;
  const draw = await prisma.folhaDraw.findUnique({ where: { id: drawId }, include: { employee: true } });
  if (!draw) return <EmptyState title="Sorteio não encontrado" description="Esta pessoa já não está na lista deste mês." />;
  return <PhotoCapture drawId={draw.id} name={draw.employee.name} />;
}
