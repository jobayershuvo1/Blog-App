import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { ROLE_RANK, ROLES } from "@/lib/constants";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  const isAdmin = pathname.startsWith("/admin");
  const isDashboard = pathname.startsWith("/dashboard");

  if (!isAdmin && !isDashboard) return NextResponse.next();

  // Not signed in → send to login with callback.
  if (!token) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  const rank = ROLE_RANK[(token.role as keyof typeof ROLE_RANK) ?? ROLES.READER] ?? 0;

  // /admin requires moderator+ ; /dashboard requires author+
  if (isAdmin && rank < ROLE_RANK[ROLES.MODERATOR]) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  if (isDashboard && rank < ROLE_RANK[ROLES.AUTHOR]) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"],
};
