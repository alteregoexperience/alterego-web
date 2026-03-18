import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const auth = req.cookies.get("auth")?.value;

  if (!auth && req.nextUrl.pathname.startsWith("/gestion")) {
    const loginUrl = new URL("/login", req.url);

    // 👇 guardas destino original
    loginUrl.searchParams.set("redirect", req.nextUrl.pathname);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
