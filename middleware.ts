import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ADMIN_SESSION_COOKIE, hasValidAdminKey } from "@/lib/admin-auth";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/en", request.url));
  }

  const needsAdminAuth =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/admin") ||
    pathname === "/api/health";

  if (needsAdminAuth && pathname !== "/admin/login") {
    const adminKey = process.env.ADMIN_KEY;
    const headerKey = request.headers.get("x-admin-key");
    const cookieKey = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const authorized =
      hasValidAdminKey(headerKey, adminKey) ||
      hasValidAdminKey(cookieKey, adminKey);

    if (!authorized) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/(zh|en)/:path*", "/admin/:path*", "/api/admin/:path*", "/api/health"],
};
