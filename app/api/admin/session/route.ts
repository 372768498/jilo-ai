import { NextRequest, NextResponse } from "next/server";

import { ADMIN_SESSION_COOKIE, hasValidAdminKey } from "@/lib/admin-auth";

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 8,
};

export async function POST(request: NextRequest) {
  const adminKey = process.env.ADMIN_KEY;

  if (!adminKey) {
    return NextResponse.json({ error: "ADMIN_KEY not configured" }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  const providedKey = body?.adminKey;

  if (!hasValidAdminKey(providedKey, adminKey)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, adminKey, COOKIE_OPTIONS);
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, "", { ...COOKIE_OPTIONS, maxAge: 0 });
  return response;
}
