import { checkReadiness } from "@/lib/health";

export const dynamic = "force-dynamic";

/** Readiness probe: 200 only when PostgreSQL and Redis answer. Use it for load balancer / orchestrator checks. */
export async function GET() {
  const { ready, checks } = await checkReadiness();
  return Response.json(
    { status: ready ? "ready" : "unavailable", checks },
    { status: ready ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
