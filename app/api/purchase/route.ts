import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { PurchasePayload, Ticket } from "@/types/Ticket";
import * as QRCode from "qrcode";
import { resend } from "@/lib/resend";
import { renderPurchaseEmail } from "@/lib/emailPurchaseTemplate";

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

export async function POST(req: Request) {
  try {
    const body: PurchasePayload = await req.json();

    const { eventId, buyer, items } = body;

    if (!eventId || !buyer || !items?.length) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const { name, birthdate, email, phone } = buyer;

    if (!name || !birthdate || !email || !phone) {
      return NextResponse.json(
        { error: "Datos comprador incompletos" },
        { status: 400 },
      );
    }

    // validar edad
    const age = calculateAge(birthdate);

    if (age < 18) {
      return NextResponse.json(
        { error: "Debes ser mayor de 18 años" },
        { status: 400 },
      );
    }

    // obtener ticket types
    const ticketTypeIds = items.map((i) => i.ticketTypeId);

    const { data: ticketTypes, error: ticketError } = await supabaseAdmin
      .from("event_ticket_types")
      .select("*")
      .in("id", ticketTypeIds);

    if (ticketError || !ticketTypes) {
      return NextResponse.json(
        { error: "Error obteniendo tickets" },
        { status: 500 },
      );
    }

    // validar stock
    for (const item of items) {
      const ticket = ticketTypes.find((t) => t.id === item.ticketTypeId);

      if (!ticket) continue;

      if (ticket.stock !== null) {
        const available = ticket.stock - (ticket.sold || 0);

        if (item.quantity > available) {
          return NextResponse.json(
            { error: "Stock insuficiente" },
            { status: 400 },
          );
        }
      }
    }

    // calcular total
    let total = 0;

    for (const item of items) {
      const ticket = ticketTypes.find((t) => t.id === item.ticketTypeId);

      if (!ticket) continue;

      total += ticket.price * item.quantity;
    }

    // crear order
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        event_id: eventId,
        buyer_name: name,
        buyer_birthdate: birthdate,
        buyer_email: email,
        buyer_phone: phone,
        total_amount: total,
        status: "completed",
      })
      .select()
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Error creando order" },
        { status: 500 },
      );
    }

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
      return NextResponse.json(
        { error: "Error creando tickets" },
        { status: 500 },
      );
    }

    const ticketsWithQr = await Promise.all(
      insertedTickets.map(async (ticket) => {
        const svg = await QRCode.toString(ticket.qr_code, { type: "svg" });

        const qr = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

        return {
          ...ticket,
          qr,
        };
      }),
    );

    // Envio de email
    const html = renderPurchaseEmail({
      name,
      tickets: ticketsWithQr,
    });

    // console.log(html);
    const { data, error: emailError } = await resend.emails.send({
      from: "ALTER EGO <tickets@alteregoexperience.org>",
      to: "a.ego.experience@gmail.com",
      subject: "ALTER EGO - Tus entradas",
      html,
    });

    if (emailError) {
      console.error("EMAIL ERROR:", emailError);
    } else {
      console.log("EMAIL SENT:", data);
    }

    // actualizar sold
    for (const item of items) {
      await supabaseAdmin.rpc("increment_ticket_sold", {
        ticket_id: item.ticketTypeId,
        qty: item.quantity,
      });
    }

    return NextResponse.json({
      success: true,
      order,
      tickets: ticketsWithQr,
    });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
