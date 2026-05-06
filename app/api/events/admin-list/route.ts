import { NextResponse } from "next/server";

import { checkAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const isAuth = await checkAuth();

  if (!isAuth) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: events, error: eventsError } = await supabaseAdmin
    .from("events")
    .select(
      `
      id,
      title,
      slug,
      starts_at,
      ends_at,
      ticket_sales_start_at,
      is_visible
    `,
    )
    .order("starts_at", { ascending: true });

  if (eventsError) {
    return NextResponse.json({ error: eventsError.message }, { status: 500 });
  }

  const eventIds = (events ?? []).map((event) => event.id);

  const { data: eventParticipants, error: participantsError } = eventIds.length
    ? await supabaseAdmin
        .from("event_participants")
        .select("event_id")
        .in("event_id", eventIds)
    : { data: [], error: null };

  if (participantsError) {
    return NextResponse.json(
      { error: participantsError.message },
      { status: 500 },
    );
  }

  const { data: ticketTypes, error: ticketTypesError } = eventIds.length
    ? await supabaseAdmin
        .from("event_ticket_types")
        .select("event_id, sold")
        .in("event_id", eventIds)
    : { data: [], error: null };

  if (ticketTypesError) {
    return NextResponse.json(
      { error: ticketTypesError.message },
      { status: 500 },
    );
  }

  const soldByEventId = (ticketTypes ?? []).reduce<Record<string, number>>(
    (acc, ticketType) => {
      if (!ticketType.event_id) return acc;

      acc[ticketType.event_id] =
        (acc[ticketType.event_id] ?? 0) + Number(ticketType.sold ?? 0);

      return acc;
    },
    {},
  );

  const participantsByEventId = (eventParticipants ?? []).reduce<
    Record<string, number>
  >((acc, participant) => {
    if (!participant.event_id) return acc;

    acc[participant.event_id] = (acc[participant.event_id] ?? 0) + 1;

    return acc;
  }, {});

  return NextResponse.json({
    events: (events ?? []).map((event) => ({
      ...event,
      event_participants: [
        {
          count: participantsByEventId[event.id] ?? 0,
        },
      ],
      sold_tickets: soldByEventId[event.id] ?? 0,
    })),
  });
}
