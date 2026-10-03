import { NextResponse, type NextRequest } from "next/server";

/**
 * Cheap gate for the admin area: no session cookie, no admin page.
 * The real check (session exists and is valid) runs in each admin page/action via requireStaff().
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();
  if (!request.cookies.has("sessao")) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
