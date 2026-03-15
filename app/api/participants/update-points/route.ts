import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {

  const { id, delta } = await req.json()

  if (!id || !delta) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const { data, error } = await supabase
    .rpc("increment_points", {
      participant_id: id,
      delta_points: delta
    })

  if (error) {
    return NextResponse.json({ error }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}