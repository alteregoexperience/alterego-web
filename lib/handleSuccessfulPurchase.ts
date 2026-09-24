import { renderPurchaseEmail } from "@/lib/emailPurchaseTemplate";
import { formatTicketEventDateTime } from "@/lib/formatTicketEventDateTime";
import { generateTicketPdf } from "@/lib/generateTicketPdf";
import { resend } from "@/lib/resend";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { PurchasePayload } from "@/types/Ticket";

type FulfilledOrder = {
  id: string;
  created_at: string;
  fulfilled_at: string | null;
};

type FulfilledTicket = {
  id: string;
  order_id: string;
  event_id: string;
  ticket_type_id: string;
  qr_code: string;
  created_at: string;
};

type FulfillmentResult = {
  order: FulfilledOrder;
  tickets: FulfilledTicket[];
};

function isFulfillmentResult(value: unknown): value is FulfillmentResult {
  if (!value || typeof value !== "object") return false;

  const result = value as Partial<FulfillmentResult>;

  return (
    Boolean(result.order?.id) &&
    Array.isArray(result.tickets) &&
    result.tickets.every(
      (ticket) =>
        Boolean(ticket?.id) &&
        Boolean(ticket?.ticket_type_id) &&
        Boolean(ticket?.qr_code),
    )
  );
}

export async function handleSuccessfulPurchase({
  eventId,
  buyer,
  items,
  attendeeNames,
  sessionId,
}: PurchasePayload & { sessionId: string }) {
  const { name, birthdate, email, phone } = buyer;
  const buyerName = name.trim().replace(/\s+/g, " ");
  const normalizedAttendeeNames = Array.isArray(attendeeNames)
    ? attendeeNames.map((attendeeName) =>
        attendeeName.trim().replace(/\s+/g, " "),
      )
    : [];

  function calculateAge(value: string) {
    const today = new Date();
    const birth = new Date(value);

    let age = today.getFullYear() - birth.getFullYear();
    const month = today.getMonth() - birth.getMonth();

    if (
      month < 0 ||
      (month === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age;
  }

  if (calculateAge(birthdate) < 18) {
    throw new Error("Menor de edad");
  }

  if (
    !eventId ||
    !sessionId ||
    !buyerName ||
    !birthdate ||
    !email ||
    !phone ||
    !items.length ||
    items.some(
      (item) =>
        !item.ticketTypeId ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0,
    )
  ) {
    throw new Error("Datos de compra no validos");
  }

  // La RPC ejecuta order, tickets y sold en una sola transaccion y devuelve
  // los registros existentes cuando Stripe reintenta la misma sesion.
  const { data: fulfillment, error: fulfillmentError } =
    await supabaseAdmin.rpc("fulfill_stripe_purchase", {
      p_event_id: eventId,
      p_buyer_name: buyerName,
      p_buyer_birthdate: birthdate,
      p_buyer_email: email,
      p_buyer_phone: phone,
      p_stripe_checkout_session_id: sessionId,
      p_items: items,
    });

  if (fulfillmentError || !isFulfillmentResult(fulfillment)) {
    console.error("PURCHASE FULFILLMENT ERROR:", fulfillmentError);
    throw new Error("Error completando la compra");
  }

  const { order, tickets: insertedTickets } = fulfillment;
  const ticketTypeIds = [...new Set(items.map((item) => item.ticketTypeId))];

  const [eventResult, ticketTypesResult] = await Promise.all([
    supabaseAdmin
      .from("events")
      .select("title, location, starts_at, ends_at")
      .eq("id", eventId)
      .single(),
    supabaseAdmin
      .from("event_ticket_types")
      .select("id, name, price")
      .in("id", ticketTypeIds),
  ]);

  if (eventResult.error || !eventResult.data) {
    throw new Error("Error obteniendo el evento para las entradas");
  }

  if (ticketTypesResult.error || !ticketTypesResult.data) {
    throw new Error("Error obteniendo los tipos de entrada");
  }

  const event = eventResult.data;
  const ticketTypes = ticketTypesResult.data;
  const eventName = event.title ?? "ALTER EGO";
  const eventLocation = event.location ?? "";
  const { eventDate, eventTime } = formatTicketEventDateTime(
    event.starts_at,
    event.ends_at,
  );
  const ticketHolderNames = Array.from(
    { length: insertedTickets.length },
    (_, index) =>
      index === 0 ? buyerName : normalizedAttendeeNames[index] || buyerName,
  );
  const documentDate = new Date(order.fulfilled_at ?? order.created_at);

  const sanitize = (text: string) =>
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

  const attachments = await Promise.all(
    insertedTickets.map(async (ticket, index) => {
      const ticketType = ticketTypes.find(
        (candidate) => candidate.id === ticket.ticket_type_id,
      );

      if (!ticketType) {
        throw new Error("Tipo de entrada no encontrado para el PDF");
      }

      const ticketHolderName = ticketHolderNames[index] || buyerName;
      const pdfBytes = await generateTicketPdf({
        ticketId: ticket.qr_code,
        buyerName: ticketHolderName,
        buyerEmail: email,
        buyerPhone: phone,
        purchaserName:
          ticketHolderName === buyerName ? undefined : buyerName,
        eventName,
        eventLocation,
        eventDate,
        eventTime,
        price: Number(ticketType.price ?? 0),
        ticketType: ticketType.name ?? "",
        ticketNumber: index + 1,
        totalTickets: insertedTickets.length,
        documentDate,
      });

      return {
        filename: `${sanitize(eventName)}_${sanitize(ticketHolderName)}_${index + 1}.pdf`,
        content: Buffer.from(pdfBytes),
      };
    }),
  );

  const { error: emailError } = await resend.emails.send(
    {
      from: "ALTER EGO <tickets@alteregoexperience.org>",
      to: email,
      subject: "ALTER EGO - Tus entradas",
      html: renderPurchaseEmail({ name: buyerName }),
      attachments,
    },
    {
      idempotencyKey: `stripe-checkout-${sessionId}`,
    },
  );

  if (emailError) {
    console.error("PURCHASE EMAIL ERROR:", emailError);
    throw new Error("Error enviando las entradas");
  }

  return order;
}
