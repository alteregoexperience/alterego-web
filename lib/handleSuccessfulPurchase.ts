import { renderPurchaseEmail } from "@/lib/emailPurchaseTemplate";
import { formatTicketEventDateTime } from "@/lib/formatTicketEventDateTime";
import { generateTicketPdf } from "@/lib/generateTicketPdf";
import { resend } from "@/lib/resend";
import {
  getPaidStripePurchase,
  type PaidStripePurchase,
} from "@/lib/stripePurchase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type FulfilledOrder = {
  id: string;
  event_id: string;
  total_amount: number;
  status: string;
  created_at: string;
  fulfilled_at: string | null;
  ticket_email_pending: boolean;
  ticket_email_sent_at: string | null;
  tickets: { count: number }[];
};

type FulfilledTicket = {
  id: string;
  ticket_type_id: string;
  qr_code: string;
  holder_name: string | null;
};

export type PurchaseResult = {
  orderId?: string;
  status: "unpaid" | "pending" | "sent" | "issued";
};

async function findOrder(sessionId: string) {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select(
      "id,event_id,total_amount,status,created_at,fulfilled_at,ticket_email_pending,ticket_email_sent_at,tickets(count)",
    )
    .or(
      `stripe_checkout_session_id.eq.${sessionId},stripe_session_id.eq.${sessionId}`,
    )
    .maybeSingle();
  if (error) throw new Error(`Error consultando el pedido: ${error.message}`);
  return data as FulfilledOrder | null;
}

async function registerPaidOrder(purchase: PaidStripePurchase) {
  let order = await findOrder(purchase.sessionId);
  if (!order) {
    // Persistir el pago antes de PDFs/email permite retomar cualquier fallo.
    const { error } = await supabaseAdmin.from("orders").insert({
      event_id: purchase.eventId,
      buyer_name: purchase.buyer.name,
      buyer_birthdate: purchase.buyer.birthdate,
      buyer_email: purchase.buyer.email,
      buyer_phone: purchase.buyer.phone,
      total_amount: purchase.totalAmount,
      status: "paid",
      stripe_checkout_session_id: purchase.sessionId,
      stripe_session_id: purchase.sessionId,
      stripe_payment_intent_id: purchase.paymentIntentId,
      ticket_email_pending: true,
    });
    // La restriccion unica resuelve entregas simultaneas de la misma sesion.
    if (error && error.code !== "23505")
      throw new Error(`Error registrando el pago: ${error.message}`);
    order = await findOrder(purchase.sessionId);
  }
  if (
    !order ||
    order.event_id !== purchase.eventId ||
    order.status !== "paid" ||
    Math.round(Number(order.total_amount) * 100) !==
      Math.round(purchase.totalAmount * 100)
  ) {
    throw new Error("El pedido existente no coincide con el pago de Stripe");
  }
  return order;
}

export async function handleSuccessfulPurchase(
  sessionId: string,
): Promise<PurchaseResult> {
  const purchase = await getPaidStripePurchase(sessionId);
  if (!purchase) return { status: "unpaid" };
  return fulfillPaidPurchase(purchase);
}

export async function fulfillPaidPurchase(
  purchase: PaidStripePurchase,
): Promise<PurchaseResult> {
  const { eventId, buyer, items, attendeeNames = [], sessionId } = purchase;
  const order = await registerPaidOrder(purchase);
  const expectedTickets = items.reduce((sum, item) => sum + item.quantity, 0);
  const hasAllTickets = order.tickets?.[0]?.count === expectedTickets;
  if (order.ticket_email_sent_at && hasAllTickets)
    return { orderId: order.id, status: "sent" };
  // La entrega de compras historicas es desconocida: no reenviarlas en masa.
  if (!order.ticket_email_pending && order.fulfilled_at && hasAllTickets) {
    return { orderId: order.id, status: "issued" };
  }

  const startedAt = new Date().toISOString();
  const lockedUntil = new Date(Date.now() + 5 * 60_000).toISOString();
  const { data: claimed, error: claimError } = await supabaseAdmin
    .from("orders")
    .update({
      ticket_email_pending: true,
      fulfillment_error: null,
      fulfillment_last_attempt_at: startedAt,
      fulfillment_locked_until: lockedUntil,
    })
    .eq("id", order.id)
    .is("ticket_email_sent_at", null)
    .or(
      `fulfillment_locked_until.is.null,fulfillment_locked_until.lt.${startedAt}`,
    )
    .select("id")
    .maybeSingle();
  if (claimError)
    throw new Error(`Error reservando el procesamiento: ${claimError.message}`);
  if (!claimed) return { orderId: order.id, status: "pending" };

  try {
    const { data: fulfillment, error: fulfillmentError } =
      await supabaseAdmin.rpc("fulfill_stripe_purchase", {
        p_event_id: eventId,
        p_buyer_name: buyer.name,
        p_buyer_birthdate: buyer.birthdate,
        p_buyer_email: buyer.email,
        p_buyer_phone: buyer.phone,
        p_stripe_checkout_session_id: sessionId,
        p_items: items,
      });
    if (fulfillmentError)
      throw new Error(`Error emitiendo entradas: ${fulfillmentError.message}`);
    const fulfilled = fulfillment as {
      order?: FulfilledOrder;
      tickets?: FulfilledTicket[];
    } | null;
    if (
      fulfilled?.order?.id !== order.id ||
      !Array.isArray(fulfilled.tickets) ||
      fulfilled.tickets.length !== expectedTickets ||
      fulfilled.tickets.some(
        (ticket) => !ticket.id || !ticket.qr_code || !ticket.ticket_type_id,
      )
    ) {
      throw new Error(
        "La emision no ha devuelto todas las entradas de la compra",
      );
    }
    const tickets = fulfilled.tickets;
    const [eventResult, typesResult] = await Promise.all([
      supabaseAdmin
        .from("events")
        .select("title,location,starts_at,ends_at")
        .eq("id", eventId)
        .single(),
      supabaseAdmin
        .from("event_ticket_types")
        .select("id,name")
        .in(
          "id",
          items.map((item) => item.ticketTypeId),
        ),
    ]);
    if (eventResult.error || !eventResult.data)
      throw new Error("Error obteniendo el evento para las entradas");
    if (typesResult.error || !typesResult.data)
      throw new Error("Error obteniendo los tipos de entrada");
    const event = eventResult.data;
    const { eventDate, eventTime } = formatTicketEventDateTime(
      event.starts_at,
      event.ends_at,
    );
    const documentDate = new Date(
      fulfilled.order.fulfilled_at ?? fulfilled.order.created_at,
    );
    const holderNames = tickets.map(
      (ticket, i) =>
        ticket.holder_name?.trim() ||
        (i === 0 ? buyer.name : attendeeNames[i]?.trim() || buyer.name),
    );
    const updates = await Promise.all(
      tickets.map((ticket, i) =>
        ticket.holder_name
          ? Promise.resolve({ error: null })
          : supabaseAdmin
              .from("tickets")
              .update({ holder_name: holderNames[i] })
              .eq("id", ticket.id)
              .is("holder_name", null),
      ),
    );
    if (updates.some((result) => result.error))
      throw new Error("Error guardando los titulares de las entradas");

    const prices = new Map(
      items.map((item, i) => [item.ticketTypeId, purchase.unitPrices[i]]),
    );
    const sanitize = (text: string) =>
      text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
    const attachments = await Promise.all(
      tickets.map(async (ticket, i) => {
        const type = typesResult.data.find(
          (candidate) => candidate.id === ticket.ticket_type_id,
        );
        const price = prices.get(ticket.ticket_type_id);
        if (!type || price === undefined)
          throw new Error("Tipo de entrada no encontrado para el PDF");
        const bytes = await generateTicketPdf({
          ticketId: ticket.qr_code,
          buyerName: holderNames[i],
          buyerEmail: buyer.email,
          buyerPhone: buyer.phone,
          purchaserName: holderNames[i] === buyer.name ? undefined : buyer.name,
          eventName: event.title ?? "ALTER EGO",
          eventLocation: event.location ?? "",
          eventDate,
          eventTime,
          price,
          ticketType: type.name ?? "Entrada",
          ticketNumber: i + 1,
          totalTickets: tickets.length,
          documentDate,
        });
        return {
          filename: `${sanitize(event.title ?? "alter_ego")}_${sanitize(holderNames[i])}_${i + 1}.pdf`,
          content: Buffer.from(bytes),
        };
      }),
    );
    const { data: email, error: emailError } = await resend.emails.send(
      {
        from: "ALTER EGO <tickets@alteregoexperience.org>",
        to: buyer.email,
        subject: "ALTER EGO - Tus entradas",
        html: renderPurchaseEmail({ name: buyer.name }),
        attachments,
      },
      { idempotencyKey: `stripe-checkout-${sessionId}` },
    );
    if (emailError || !email?.id)
      throw new Error(
        `Error enviando las entradas: ${emailError?.message ?? "sin confirmacion de Resend"}`,
      );

    const { data: saved, error: saveError } = await supabaseAdmin
      .from("orders")
      .update({
        ticket_email_pending: false,
        ticket_email_sent_at: new Date().toISOString(),
        ticket_email_id: email.id,
        fulfillment_error: null,
        fulfillment_locked_until: null,
      })
      .eq("id", order.id)
      .eq("fulfillment_locked_until", lockedUntil)
      .select("id")
      .maybeSingle();
    if (saveError || !saved)
      throw new Error(
        "El correo fue aceptado, pero falta guardar su confirmacion",
      );
    return { orderId: order.id, status: "sent" };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error procesando la compra";
    const { error: saveError } = await supabaseAdmin
      .from("orders")
      .update({
        ticket_email_pending: true,
        fulfillment_error: message.slice(0, 1000),
        fulfillment_locked_until: null,
      })
      .eq("id", order.id)
      .eq("fulfillment_locked_until", lockedUntil);
    if (saveError)
      console.error(
        "Error registrando incidencia de compra:",
        order.id,
        saveError.code,
      );
    throw error;
  }
}
