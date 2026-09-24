import { NextResponse } from "next/server";

import { checkAuth } from "@/lib/auth";
import { getEventDeletionCutoff } from "@/lib/eventDeletion";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  const isAuth = await checkAuth();

  if (!isAuth) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { eventId } = await req.json();

  if (!eventId) {
    return NextResponse.json({ error: "eventId requerido" }, { status: 400 });
  }

  const { data: event, error } = await supabaseAdmin
    .from("events")
    .update({ deleted_at: null })
    .eq("id", eventId)
    .not("deleted_at", "is", null)
    .gt("deleted_at", getEventDeletionCutoff().toISOString())
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!event) {
    return NextResponse.json(
      { error: "El evento no existe o ya ha vencido su periodo de retencion" },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true });
}
