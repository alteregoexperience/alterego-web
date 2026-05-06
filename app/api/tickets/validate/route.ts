import { NextResponse } from "next/server";

import { checkAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type TicketValidationPayload = {
  eventId?: string;
  qrCode?: string;
};

type TicketRow = {
  id: string;
  event_id: string;
  qr_code: string;
  used: boolean;
  used_at: string | null;
  event_ticket_types: {
    name: string;
  } | null;
  orders: {
    buyer_name: string;
    buyer_email: string;
    buyer_phone: string;
  } | null;
};

type TicketQueryRow = Omit<TicketRow, "event_ticket_types" | "orders"> & {
  event_ticket_types: TicketRow["event_ticket_types"][] | null;
  orders: TicketRow["orders"][] | null;
};

function normalizeQrCode(value: string) {
  return value
    .trim()
    .replace(/^ref:\s*/i, "")
    .trim();
}

function firstRelation<T>(value: T[] | T | null | undefined) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function normalizeTicketRow(ticket: TicketQueryRow): TicketRow {
  return {
    ...ticket,
    event_ticket_types: firstRelation(ticket.event_ticket_types),
    orders: firstRelation(ticket.orders),
  };
}

function ticketInfo(ticket: TicketRow, usedAt?: string | null) {
  return {
    qrCode: ticket.qr_code,
    usedAt: usedAt ?? ticket.used_at,
    ticketType: ticket.event_ticket_types?.name ?? "Entrada",
    buyerName: ticket.orders?.buyer_name ?? "",
    buyerEmail: ticket.orders?.buyer_email ?? "",
    buyerPhone: ticket.orders?.buyer_phone ?? "",
  };
}

export async function POST(req: Request) {
  const isAuth = await checkAuth();

  if (!isAuth) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = (await req.json()) as TicketValidationPayload;
  const eventId = body.eventId?.trim();
  const qrCode = normalizeQrCode(String(body.qrCode ?? ""));

  if (!eventId || !qrCode) {
    return NextResponse.json(
      { status: "invalid", message: "QR incompleto" },
      { status: 400 },
    );
  }

  const { data: ticket, error } = await supabaseAdmin
    .from("tickets")
    .select(
      `
      id,
      event_id,
      qr_code,
      used,
      used_at,
      event_ticket_types ( name ),
      orders ( buyer_name, buyer_email, buyer_phone )
    `,
    )
    .eq("qr_code", qrCode)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!ticket) {
    return NextResponse.json({
      status: "invalid",
      message: "Entrada no encontrada",
    });
  }

  const typedTicket = normalizeTicketRow(ticket as unknown as TicketQueryRow);

  if (typedTicket.event_id !== eventId) {
    return NextResponse.json({
      status: "invalid",
      message: "Entrada de otro evento",
      ticket: ticketInfo(typedTicket),
    });
  }

  if (typedTicket.used) {
    return NextResponse.json({
      status: "used",
      message: "Entrada ya utilizada",
      ticket: ticketInfo(typedTicket),
    });
  }

  const now = new Date().toISOString();

  const { data: updatedTicket, error: updateError } = await supabaseAdmin
    .from("tickets")
    .update({
      used: true,
      used_at: now,
    })
    .eq("id", typedTicket.id)
    .eq("used", false)
    .select("used_at")
    .maybeSingle();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (!updatedTicket) {
    const { data: refreshedTicket } = await supabaseAdmin
      .from("tickets")
      .select(
        `
        id,
        event_id,
        qr_code,
        used,
        used_at,
        event_ticket_types ( name ),
        orders ( buyer_name, buyer_email, buyer_phone )
      `,
      )
      .eq("id", typedTicket.id)
      .single();

    const refreshed = refreshedTicket
      ? normalizeTicketRow(refreshedTicket as unknown as TicketQueryRow)
      : null;

    return NextResponse.json({
      status: "used",
      message: "Entrada ya utilizada",
      ticket: refreshed ? ticketInfo(refreshed) : ticketInfo(typedTicket),
    });
  }

  return NextResponse.json({
    status: "valid",
    message: "Entrada valida",
    ticket: ticketInfo(typedTicket, updatedTicket.used_at),
  });
}
