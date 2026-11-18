import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

type EventParticipantRow = {
  points: number;
  participant:
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
    .is("deleted_at", null)
    .single();

  if (eventError || !event) {
    return NextResponse.json(
      { error: "Evento no encontrado" },
      { status: 404 },
    );
  }

  const query = () => supabaseAdmin
    .from("event_participants")
    .select(
      `
      points,
      participant:participants!event_participants_participant_id_fkey (
        id,
        name,
        instagram
      )
    `,
    )
    .eq("event_id", event.id)
    .order("points", { ascending: false })
    .order("id", { ascending: true });

  const data: EventParticipantRow[] = [];
  // La lista de gestión debe mostrar también los imports de más de 500 nombres.
  const pageSize = order === "name" ? 1000 : 500;
  for (let offset = 0; ; offset += pageSize) {
    const result = await query().range(offset, offset + pageSize - 1);
    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }
    const rows = (result.data ?? []) as unknown as EventParticipantRow[];
    data.push(...rows);
    if (order !== "name" || rows.length < pageSize) break;
  }

  const participants = data
    .map((row) => {
      const participant = firstRelation(row.participant);

      if (!participant) return null;

      return {
        id: participant.id,
        name: participant.name,
        instagram: participant.instagram ?? "",
        points: row.points,
      };
    })
    .filter(
      (
        participant,
      ): participant is {
        id: string;
        name: string;
        instagram: string;
        points: number;
      } => participant !== null,
    );

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
