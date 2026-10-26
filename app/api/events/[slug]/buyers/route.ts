import { NextResponse } from "next/server";

import { checkAuth } from "@/lib/auth";
import { getAttendeeNames } from "@/lib/adminOrderTickets";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type TicketRelation = {
  name: string | null;
};

type TicketRow = {
  id: string;
  order_id: string;
  holder_name: string | null;
  used: boolean;
  created_at: string;
  ticket_type: TicketRelation | TicketRelation[] | null;
};

type TicketHolderSearchItem = {
  ticketId: string;
  orderId: string;
  holderName: string;
  ticketType: string;
  ticketNumber: number;
  used: boolean;
  buyerName: string;
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
  ticket_email_pending: boolean;
  fulfillment_error: string | null;
  stripe_checkout_session_id: string | null;
};

function firstRelation<T>(value: T | T[] | null) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<void>,
) {
  let nextIndex = 0;
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (nextIndex < items.length) {
        const item = items[nextIndex];
        nextIndex += 1;
        await task(item);
      }
    },
  );

  await Promise.all(workers);
}

async function buildTicketHolderIndex(
  orders: BuyerOrderRow[],
  tickets: TicketRow[],
) {
  const ticketsByOrderId = tickets.reduce<Record<string, TicketRow[]>>(
    (acc, ticket) => {
      (acc[ticket.order_id] ??= []).push(ticket);
      return acc;
    },
    {},
  );
  const attendeeNamesByOrderId = new Map<string, string[]>();
  const ordersNeedingStripe = orders.filter((order) => {
    const orderTickets = ticketsByOrderId[order.id] ?? [];

    return (
      Boolean(order.stripe_checkout_session_id) &&
      orderTickets.length > 1 &&
      orderTickets.some((ticket) => !ticket.holder_name?.trim())
    );
  });

  await runWithConcurrency(ordersNeedingStripe, 8, async (order) => {
    const attendeeNames = await getAttendeeNames(
      order.stripe_checkout_session_id,
    );

    attendeeNamesByOrderId.set(order.id, attendeeNames);
  });

  const holderIndex: TicketHolderSearchItem[] = [];
  const missingHolderUpdates: Array<{ id: string; holderName: string }> = [];

  for (const order of orders) {
    const orderTickets = (ticketsByOrderId[order.id] ?? []).sort((left, right) =>
      left.created_at.localeCompare(right.created_at),
    );
    const attendeeNames = attendeeNamesByOrderId.get(order.id) ?? [];

    orderTickets.forEach((ticket, index) => {
      const storedHolderName = ticket.holder_name?.trim() ?? "";
      const legacyHolderName =
        index === 0
          ? order.buyer_name
          : attendeeNames[index]?.trim() ||
            (!order.stripe_checkout_session_id ? order.buyer_name : "");
      const holderName = storedHolderName || legacyHolderName;

      if (!holderName) return;

      const ticketType = firstRelation(ticket.ticket_type);

      holderIndex.push({
        ticketId: ticket.id,
        orderId: order.id,
        holderName,
        ticketType: ticketType?.name ?? "Entrada",
        ticketNumber: index + 1,
        used: ticket.used,
        buyerName: order.buyer_name,
      });

      if (!storedHolderName) {
        missingHolderUpdates.push({ id: ticket.id, holderName });
      }
    });
  }

  await runWithConcurrency(missingHolderUpdates, 12, async (ticket) => {
    const { error } = await supabaseAdmin
      .from("tickets")
      .update({ holder_name: ticket.holderName })
      .eq("id", ticket.id)
      .is("holder_name", null);

    if (error) {
      console.error("Error guardando titular historico:", error);
    }
  });

  return holderIndex;
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
  const includeTicketHolders =
    searchParams.get("includeTicketHolders") === "1";

  const { data: event, error: eventError } = await supabaseAdmin
    .from("events")
    .select("id, title")
    .eq("slug", slug)
    .is("deleted_at", null)
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
      ticket_email_pending,
      fulfillment_error,
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
          id,
          order_id,
          holder_name,
          used,
          created_at,
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

  const ticketRows = (tickets ?? []) as unknown as TicketRow[];
  const ticketHolders = includeTicketHolders
    ? await buildTicketHolderIndex(orderRows, ticketRows)
    : [];

  const ticketsByOrderId = ticketRows.reduce<
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
    ...(includeTicketHolders ? { ticketHolders } : {}),
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
