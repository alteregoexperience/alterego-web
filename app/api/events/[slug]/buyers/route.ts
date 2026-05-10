import { NextResponse } from "next/server";

import { checkAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type TicketRelation = {
  name: string | null;
};

type TicketRow = {
  order_id: string;
  used: boolean;
  ticket_type: TicketRelation | TicketRelation[] | null;
};

type BuyerOrderRow = {
  id: string;
  buyer_name: string;
  buyer_birthdate: string;
  buyer_email: string;
  buyer_phone: string;
  total_amount: number;
  status: string;
  created_at: string;
  fulfilled_at: string | null;
  stripe_checkout_session_id: string | null;
};

function firstRelation<T>(value: T | T[] | null) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const isAuth = await checkAuth();

  if (!isAuth) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { slug } = await params;
  const { searchParams } = new URL(req.url);
  const includeAllStatuses = searchParams.get("status") === "all";

  const { data: event, error: eventError } = await supabaseAdmin
    .from("events")
    .select("id, title")
    .eq("slug", slug)
    .single();

  if (eventError || !event) {
    return NextResponse.json(
      { error: "Evento no encontrado" },
      { status: 404 },
    );
  }

  let ordersQuery = supabaseAdmin
    .from("orders")
    .select(
      `
      id,
      buyer_name,
      buyer_birthdate,
      buyer_email,
      buyer_phone,
      total_amount,
      status,
      created_at,
      fulfilled_at,
      stripe_checkout_session_id
    `,
    )
    .eq("event_id", event.id)
    .order("created_at", { ascending: false })
    .limit(1000);

  if (!includeAllStatuses) {
    ordersQuery = ordersQuery.eq("status", "paid");
  }

  const { data: orders, error: ordersError } = await ordersQuery;

  if (ordersError) {
    return NextResponse.json({ error: ordersError.message }, { status: 500 });
  }

  const orderRows = (orders ?? []) as BuyerOrderRow[];
  const orderIds = orderRows.map((order) => order.id);

  const { data: tickets, error: ticketsError } = orderIds.length
    ? await supabaseAdmin
        .from("tickets")
        .select(
          `
          order_id,
          used,
          ticket_type:event_ticket_types (
            name
          )
        `,
        )
        .eq("event_id", event.id)
        .in("order_id", orderIds)
    : { data: [], error: null };

  if (ticketsError) {
    return NextResponse.json({ error: ticketsError.message }, { status: 500 });
  }

  const ticketsByOrderId = ((tickets ?? []) as unknown as TicketRow[]).reduce<
    Record<string, { count: number; used: number; ticketTypes: Record<string, number> }>
  >((acc, ticket) => {
    const bucket = acc[ticket.order_id] ?? {
      count: 0,
      used: 0,
      ticketTypes: {},
    };
    const ticketType = firstRelation(ticket.ticket_type);
    const ticketName = ticketType?.name ?? "Entrada";

    bucket.count += 1;
    bucket.used += ticket.used ? 1 : 0;
    bucket.ticketTypes[ticketName] = (bucket.ticketTypes[ticketName] ?? 0) + 1;
    acc[ticket.order_id] = bucket;

    return acc;
  }, {});

  const buyers = orderRows.map((order) => {
    const summary = ticketsByOrderId[order.id] ?? {
      count: 0,
      used: 0,
      ticketTypes: {},
    };

    return {
      ...order,
      ticket_count: summary.count,
      used_ticket_count: summary.used,
      ticket_types: Object.entries(summary.ticketTypes).map(
        ([name, quantity]) => ({
          name,
          quantity,
        }),
      ),
    };
  });

  return NextResponse.json({
    event: {
      id: event.id,
      title: event.title,
    },
    buyers,
    totals: {
      orders: buyers.length,
      tickets: buyers.reduce((acc, buyer) => acc + buyer.ticket_count, 0),
      revenue: buyers.reduce(
        (acc, buyer) => acc + Number(buyer.total_amount ?? 0),
        0,
      ),
      usedTickets: buyers.reduce(
        (acc, buyer) => acc + buyer.used_ticket_count,
        0,
      ),
    },
  });
}
