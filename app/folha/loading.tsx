import { Skeleton } from "@/components/ui/skeleton";

export default function FolhaLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="A carregar">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-40 w-full rounded-2xl" />
      <Skeleton className="h-40 w-full rounded-2xl" />
    </div>
  );
}
