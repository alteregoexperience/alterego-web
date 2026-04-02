import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAuth } from "@/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  const isAuth = await checkAuth();

  if (!isAuth) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id, delta, eventId } = await req.json();

  if (!id || typeof delta !== "number" || !eventId) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { error } = await supabase.rpc("increment_event_points", {
    p_participant_id: id,
    p_delta_points: delta,
    p_event_id: eventId,
  });

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
