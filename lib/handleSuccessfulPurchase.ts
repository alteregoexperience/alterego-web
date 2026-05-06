import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { PurchasePayload, Ticket } from "@/types/Ticket";
import { resend } from "@/lib/resend";
import { renderPurchaseEmail } from "@/lib/emailPurchaseTemplate";
import { generateTicketPdf } from "@/lib/generateTicketPdf";

export async function handleSuccessfulPurchase({
  eventId,
  buyer,
  items,
  sessionId,
}: PurchasePayload & { sessionId: string }) {
  const { name, birthdate, email, phone } = buyer;

  function calculateAge(birthdate: string) {
    const today = new Date();
    const birth = new Date(birthdate);

    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  }

  // seguridad extra
  if (calculateAge(birthdate) < 18) {
    throw new Error("Menor de edad");
  }

  // obtener tickets
  const ticketTypeIds = items.map((i) => i.ticketTypeId);

  const { data: ticketTypes, error: ticketError } = await supabaseAdmin
    .from("event_ticket_types")
    .select("*")
    .in("id", ticketTypeIds);

  if (ticketError || !ticketTypes) {
    throw new Error("Error obteniendo tickets");
  }

  // validar stock
  for (const item of items) {
    const ticket = ticketTypes.find((t) => t.id === item.ticketTypeId);

    if (!ticket) continue;

    if (ticket.stock !== null) {
      const available = ticket.stock - (ticket.sold || 0);

      if (item.quantity > available) {
        throw new Error("Stock insuficiente");
      }
    }
  }

  // total
  let total = 0;

  for (const item of items) {
    const ticket = ticketTypes.find((t) => t.id === item.ticketTypeId);
    if (!ticket) continue;

    total += ticket.price * item.quantity;
  }

  // INSERT CORRECTO
  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .insert({
      event_id: eventId,
      buyer_name: name,
      buyer_birthdate: birthdate,
      buyer_email: email,
      buyer_phone: phone,
      total_amount: total,
      status: "paid",
      stripe_checkout_session_id: sessionId,
      stripe_session_id: sessionId,
      fulfilled_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (orderError || !order) {
    console.error("ORDER ERROR:", orderError);
    throw new Error("Error creando order");
  }

  const { data: event } = await supabaseAdmin
    .from("events")
    .select("title, location, starts_at, ends_at")
    .eq("id", eventId)
    .single();

  const ticketsToInsert: Omit<
    Ticket,
    "id" | "used" | "used_at" | "created_at"
  >[] = [];

  // generar tickets
  for (const item of items) {
    for (let i = 0; i < item.quantity; i++) {
      ticketsToInsert.push({
        order_id: order.id,
        event_id: eventId,
        ticket_type_id: item.ticketTypeId,
        qr_code: crypto.randomUUID(),
      });
    }
  }

  const { data: insertedTickets, error: ticketsError } = await supabaseAdmin
    .from("tickets")
    .insert(ticketsToInsert)
    .select();

  if (ticketsError || !insertedTickets) {
    throw new Error("Error creando tickets");
  }

  // actualizar sold
  for (const item of items) {
    const { error: incrementError } = await supabaseAdmin.rpc(
      "increment_ticket_sold",
      {
        p_ticket_type_id: item.ticketTypeId,
        p_qty: item.quantity,
      },
    );

    if (incrementError) {
      console.error("ERROR ACTUALIZANDO SOLD:", incrementError);
      throw new Error("Error actualizando entradas vendidas");
    }
  }

  // PDFs
  const attachments = await Promise.all(
    insertedTickets.map(async (ticket, index) => {
      const ticketType = ticketTypes.find(
        (t) => t.id === ticket.ticket_type_id,
      );

      const pdfBytes = await generateTicketPdf({
        ticketId: ticket.qr_code,
        buyerName: name,
        buyerEmail: email,
        buyerPhone: phone,
        eventName: event?.title,
        eventLocation: event?.location,
        eventDate: new Date(event?.starts_at).toLocaleDateString("es-ES"),
        eventTime: `${new Date(event?.starts_at).toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
        })} - ${new Date(event?.ends_at).toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
        })}`,
        price: ticketType?.price || 0,
        ticketType: ticketType?.name || "",
        ticketNumber: index + 1,
        totalTickets: insertedTickets.length,
      });

      return {
        filename: `ticket_${event?.title.toLowerCase()}_${index + 1}.pdf`,
        content: Buffer.from(pdfBytes),
      };
    }),
  );

  // email
  await resend.emails.send({
    from: "ALTER EGO <tickets@alteregoexperience.org>",
    to: email,
    subject: "ALTER EGO - Tus entradas",
    html: renderPurchaseEmail({ name }),
    attachments,
  });

  return order;
}
