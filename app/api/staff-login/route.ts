import { NextResponse } from "next/server"

export async function POST(req: Request) {

  const { user, pass } = await req.json()

  if (
    user === process.env.ADMIN_STAFF_USER &&
    pass === process.env.ADMIN_STAFF_PASSWORD
  ) {
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ ok: false }, { status: 401 })
}