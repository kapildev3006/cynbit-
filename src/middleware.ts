import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dev-only-secret-change-in-production-min-32-chars!"
);

const SESSION_COOKIE_NAME = "cynbit_session";

/**
 * Edge middleware that validates JWT session cookie for /admin and /api/admin routes.
 * Runs on Edge runtime using Web Crypto via jose.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public access to login page and authentication endpoints
  if (
    pathname === "/admin/login" ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Check for admin pages or admin APIs
  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");

  if (!isAdminPage && !isAdminApi) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    if (isAdminApi) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    // Role guard: Member users cannot access admin forms or settings
    if (payload.role === "MEMBER") {
      if (pathname.startsWith("/admin/forms") || pathname.startsWith("/admin/settings")) {
        if (isAdminApi) {
          return NextResponse.json(
            { error: "Access denied. Administrator privileges required." },
            { status: 403 }
          );
        }
        return NextResponse.redirect(new URL("/admin/inquiries", req.url));
      }
    }

    // Attach user headers for downstream route handlers
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-user-id", String(payload.userId));
    requestHeaders.set("x-user-email", String(payload.email));
    requestHeaders.set("x-user-role", String(payload.role));

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch {
    // Token invalid or expired
    if (isAdminApi) {
      return NextResponse.json({ error: "Session expired or invalid." }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
