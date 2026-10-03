import { NextResponse } from "next/server";
import { getSession } from "@/features/auth/queries";
import { UploadRejectedError, finalizeUploadForUser, finalizeUploadSchema } from "@/features/storage/service";
import { RATE_LIMITS, enforceRateLimit } from "@/lib/rate-limit";

/** Second step of an upload: checks the stored object and returns its permanent key. */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const limited = await enforceRateLimit("upload-complete", session.user.id, RATE_LIMITS.userWrite);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = finalizeUploadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    return NextResponse.json(await finalizeUploadForUser(session.user.id, parsed.data.key));
  } catch (error) {
    if (error instanceof UploadRejectedError) {
      return NextResponse.json({ error: error.reason }, { status: error.reason === "missing" ? 404 : 422 });
    }
    throw error;
  }
}
