import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ADMIN_SESSION_COOKIE, hasValidAdminKey } from "@/lib/admin-auth";

// Dead tool slugs from the duplicate cleanup → their canonical slug.
// 301-redirect so any indexed/linked dupe URL lands on the kept page.
const TOOL_SLUG_REDIRECTS: Record<string, string> = {
  "dalle-3": "dall-e-3",
  "leonardo-ai": "leonardoai",
  "copyai": "copy-ai",
  "removebg": "remove-bg",
  "otterai": "otter-ai",
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/en", request.url));
  }

  const toolMatch = pathname.match(/^\/(en|zh)\/tools\/([^/]+)\/?$/);
  if (toolMatch) {
    const canonical = TOOL_SLUG_REDIRECTS[toolMatch[2]];
    if (canonical) {
      return NextResponse.redirect(
        new URL(`/${toolMatch[1]}/tools/${canonical}`, request.url),
        301,
      );
    }
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
