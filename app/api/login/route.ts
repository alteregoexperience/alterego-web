import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { user, pass } = await req.json();

  if (
    user === process.env.ADMIN_STAFF_USER &&
    pass === process.env.ADMIN_STAFF_PASSWORD
  ) {
    const res = NextResponse.json({ ok: true });

    res.cookies.set("auth", "true", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 60 * 60 * 8, // 8 horas
      path: "/",
    });

    return res;
  }

  return NextResponse.json({ ok: false }, { status: 401 });
}
