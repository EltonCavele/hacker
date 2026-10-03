import { NextResponse } from "next/server";
import { getSession } from "@/features/auth/queries";
import { createUploadUrlForUser, uploadRequestSchema } from "@/features/storage/service";
import { RATE_LIMITS, enforceRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const limited = await enforceRateLimit("upload", session.user.id, RATE_LIMITS.userWrite);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = uploadRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid upload request" }, { status: 400 });
  }

  const upload = await createUploadUrlForUser(session.user.id, parsed.data);
  return NextResponse.json(upload);
}
