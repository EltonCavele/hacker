export const dynamic = "force-dynamic";

/** Liveness probe: the process is up and serving requests. Touches no dependency, so it never flaps. */
export function GET() {
  return Response.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
}
