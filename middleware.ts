import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAuthToken } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("auth")?.value;

  if (
    !(await verifyAuthToken(token)) &&
    req.nextUrl.pathname.startsWith("/gestion")
  ) {
    const loginUrl = new URL("/login", req.url);

    loginUrl.searchParams.set(
      "redirect",
      req.nextUrl.pathname + req.nextUrl.search,
    );

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/gestion/:path*"],
};
