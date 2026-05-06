import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

type EventParticipantRow = {
  points: number;
  participants:
    | {
        id: string;
        name: string;
        instagram: string | null;
      }
    | Array<{
        id: string;
        name: string;
        instagram: string | null;
      }>
    | null;
};

function firstRelation<T>(value: T | T[] | null) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const { searchParams } = new URL(req.url);
  const order = searchParams.get("order") === "name" ? "name" : "points";

  const { data: event, error: eventError } = await supabaseAdmin
    .from("events")
    .select("id")
    .eq("slug", slug)
    .single();

  if (eventError || !event) {
    return NextResponse.json(
      { error: "Evento no encontrado" },
      { status: 404 },
    );
  }

  const { data, error } = await supabaseAdmin
    .from("event_participants")
    .select(
      `
      points,
      participants (
        id,
        name,
        instagram
      )
    `,
    )
    .eq("event_id", event.id)
    .order("points", { ascending: false })
    .limit(500);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const participants = ((data ?? []) as unknown as EventParticipantRow[])
    .map((row) => {
      const participant = firstRelation(row.participants);

      if (!participant) return null;

      return {
        id: participant.id,
        name: participant.name,
        instagram: participant.instagram ?? "",
        points: row.points,
      };
    })
    .filter((participant) => participant !== null);

  if (order === "name") {
    participants.sort((a, b) => a.name.localeCompare(b.name, "es"));
  } else {
    participants.sort((a, b) => b.points - a.points);
  }

  return NextResponse.json({
    eventId: event.id,
    participants,
  });
}
