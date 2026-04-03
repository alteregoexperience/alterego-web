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

  const { eventId } = await req.json();

  if (!eventId) {
    return NextResponse.json({ error: "eventId requerido" }, { status: 400 });
  }

  // borrar relaciones primero
  await supabase.from("event_participants").delete().eq("event_id", eventId);

  // borrar evento
  const { error } = await supabase.from("events").delete().eq("id", eventId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
