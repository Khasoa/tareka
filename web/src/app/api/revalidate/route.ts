import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  authorizeRevalidationRequest,
  parseRevalidationPayload,
} from "@/lib/insights/onDemandRevalidation";

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;

  if (!secret?.trim()) {
    return NextResponse.json(
      { ok: false, error: "Revalidation is not configured." },
      { status: 503 },
    );
  }

  if (
    !authorizeRevalidationRequest(
      request.headers.get("authorization"),
      secret,
    )
  ) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized." },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const payload = parseRevalidationPayload(body);
  if (!payload) {
    return NextResponse.json(
      { ok: false, error: "Invalid revalidation payload or disallowed paths." },
      { status: 400 },
    );
  }

  const revalidated: string[] = [];
  for (const path of payload.paths) {
    revalidatePath(path);
    revalidated.push(path);
  }

  return NextResponse.json({
    ok: true,
    revalidated,
    slug: payload.slug ?? null,
  });
}
