import Stripe from "stripe";

import { renderPurchaseEmail } from "@/lib/emailPurchaseTemplate";
import { formatTicketEventDateTime } from "@/lib/formatTicketEventDateTime";
import { generateTicketPdf } from "@/lib/generateTicketPdf";
import { resend } from "@/lib/resend";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type TicketTypeRelation = {
  name: string | null;
  price: number | null;
};

type TicketRow = {
  id: string;
  qr_code: string;
  used: boolean;
  used_at: string | null;
  created_at: string;
  event_ticket_types: TicketTypeRelation | TicketTypeRelation[] | null;
};

type TicketOrderReference = {
  id: string;
  order_id: string;
  event_id: string;
};

function firstRelation<T>(value: T | T[] | null) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

export function sanitizeFilePart(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function parseAttendeeNames(metadata: Stripe.Metadata | null) {
  if (!metadata) return [];

  const chunksCount = Number(metadata.attendeeNamesChunks ?? 0);

  if (!Number.isInteger(chunksCount) || chunksCount <= 0) {
    return [];
  }

  const serializedAttendeeNames = Array.from(
    { length: chunksCount },
    (_, index) => metadata[`attendeeNames_${index}`] ?? "",
  ).join("");
  const attendeeNames = JSON.parse(serializedAttendeeNames);

  if (!Array.isArray(attendeeNames)) {
    return [];
  }

  return attendeeNames.filter(
    (attendeeName): attendeeName is string =>
      typeof attendeeName === "string" && attendeeName.trim().length > 0,
  );
}

async function getAttendeeNames(stripeCheckoutSessionId: string | null) {
  if (!stripeCheckoutSessionId) return [];

  try {
    const session = await stripe.checkout.sessions.retrieve(
      stripeCheckoutSessionId,
    );

    return parseAttendeeNames(session.metadata);
  } catch (error) {
    console.error("Error obteniendo nombres de asistentes de Stripe:", error);
    return [];
  }
}

export async function getOrderTicketDetails(orderId: string) {
  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select(
      `
      id,
      event_id,
      buyer_name,
      buyer_email,
      buyer_phone,
      total_amount,
      status,
      created_at,
      fulfilled_at,
      stripe_checkout_session_id
    `,
    )
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    throw new Error("Orden no encontrada");
  }

  const { data: event, error: eventError } = await supabaseAdmin
    .from("events")
    .select("id, title, location, starts_at, ends_at")
    .eq("id", order.event_id)
    .single();

  if (eventError || !event) {
    throw new Error("Evento no encontrado");
  }

  const { data: tickets, error: ticketsError } = await supabaseAdmin
    .from("tickets")
    .select(
      `
      id,
      qr_code,
      used,
      used_at,
      created_at,
      event_ticket_types (
        name,
        price
      )
    `,
    )
    .eq("order_id", order.id)
    .eq("event_id", order.event_id)
    .order("created_at", { ascending: true });

  if (ticketsError) {
    throw new Error(ticketsError.message);
  }

  const ticketRows = (tickets ?? []) as unknown as TicketRow[];
  const attendeeNames = await getAttendeeNames(order.stripe_checkout_session_id);

  return {
    order,
    event,
    tickets: ticketRows.map((ticket, index) => {
      const ticketType = firstRelation(ticket.event_ticket_types);
      const holderName =
        index === 0
          ? order.buyer_name
          : attendeeNames[index]?.trim() || order.buyer_name;

      return {
        id: ticket.id,
        qrCode: ticket.qr_code,
        used: ticket.used,
        usedAt: ticket.used_at,
        createdAt: ticket.created_at,
        holderName,
        ticketType: ticketType?.name ?? "Entrada",
        price: Number(ticketType?.price ?? 0),
        ticketNumber: index + 1,
      };
    }),
  };
}

async function generateTicketPdfFromOrder(
  details: Awaited<ReturnType<typeof getOrderTicketDetails>>,
  detail: Awaited<ReturnType<typeof getOrderTicketDetails>>["tickets"][number],
) {
  const eventName = details.event.title ?? "ALTER EGO";
  const eventLocation = details.event.location ?? "";
  const { eventDate, eventTime } = formatTicketEventDateTime(
    details.event.starts_at,
    details.event.ends_at,
  );
  const pdfBytes = await generateTicketPdf({
    ticketId: detail.qrCode,
    buyerName: detail.holderName,
    buyerEmail: details.order.buyer_email,
    buyerPhone: details.order.buyer_phone,
    purchaserName:
      detail.holderName === details.order.buyer_name
        ? undefined
        : details.order.buyer_name,
    eventName,
    eventLocation,
    eventDate,
    eventTime,
    price: detail.price,
    ticketType: detail.ticketType,
    ticketNumber: detail.ticketNumber,
    totalTickets: details.tickets.length,
  });

  return {
    fileName: `${sanitizeFilePart(eventName)}_${sanitizeFilePart(detail.holderName)}_${detail.ticketNumber}.pdf`,
    pdfBytes,
  };
}

export async function generateExistingTicketPdf(ticketId: string) {
  const { data: ticket, error } = await supabaseAdmin
    .from("tickets")
    .select("id, order_id, event_id")
    .eq("id", ticketId)
    .single();

  if (error || !ticket) {
    throw new Error("Ticket no encontrado");
  }

  const ticketReference = ticket as unknown as TicketOrderReference;
  const details = await getOrderTicketDetails(ticketReference.order_id);
  const detail = details.tickets.find((item) => item.id === ticketId);

  if (!detail || details.event.id !== ticketReference.event_id) {
    throw new Error("Ticket no encontrado en la orden");
  }

  return generateTicketPdfFromOrder(details, detail);
}

export async function resendOrderTickets(orderId: string) {
  const details = await getOrderTicketDetails(orderId);
  const recipient = details.order.buyer_email?.trim();

  if (!recipient) {
    throw new Error("La compra no tiene un email de destinatario");
  }

  if (details.tickets.length === 0) {
    throw new Error("La compra no tiene entradas asociadas");
  }

  const attachments = await Promise.all(
    details.tickets.map(async (ticket) => {
      const { fileName, pdfBytes } = await generateTicketPdfFromOrder(
        details,
        ticket,
      );

      return {
        filename: fileName,
        content: Buffer.from(pdfBytes),
      };
    }),
  );

  const { error } = await resend.emails.send({
    from: "ALTER EGO <tickets@alteregoexperience.org>",
    to: recipient,
    subject: "ALTER EGO - Tus entradas",
    html: renderPurchaseEmail({ name: details.order.buyer_name }),
    attachments,
  });

  if (error) {
    console.error("Error reenviando entradas de la orden:", error);
    throw new Error("No se pudieron reenviar las entradas");
  }

  return {
    recipient,
    ticketCount: details.tickets.length,
  };
}
