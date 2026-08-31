import { NextResponse } from "next/server";

/** Temporary debug ingest for landasan sticky jitter (session 5402e1). Remove after fix. */
export async function POST(request: Request) {
  if (request.headers.get("x-debug-session-id") !== "5402e1") {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  let payload: unknown = null;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  console.log("[debug-5402e1]", JSON.stringify(payload));
  return NextResponse.json({ ok: true });
}
