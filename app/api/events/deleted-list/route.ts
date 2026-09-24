import { NextResponse } from "next/server";

import { checkAuth } from "@/lib/auth";
import {
  getEventDeletionCutoff,
  getEventPurgeDate,
} from "@/lib/eventDeletion";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const isAuth = await checkAuth();

  if (!isAuth) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: events, error } = await supabaseAdmin
    .from("events")
    .select("id, title, slug, starts_at, deleted_at")
    .not("deleted_at", "is", null)
    .gt("deleted_at", getEventDeletionCutoff().toISOString())
    .order("deleted_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    events: (events ?? []).map((event) => {
      const purgeAt = getEventPurgeDate(event.deleted_at as string);

      return {
        ...event,
        purge_at: purgeAt.toISOString(),
        days_remaining: Math.max(
          0,
          Math.ceil((purgeAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
        ),
      };
    }),
  });
}
