import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { PurchasePayload, Ticket } from "@/types/Ticket";
import * as QRCode from "qrcode";
import { resend } from "@/lib/resend";
import { renderPurchaseEmail } from "@/lib/emailPurchaseTemplate";
import { generateTicketPdf } from "@/lib/generateTicketPdf";

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
          console.error("Sin stock");
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

    const { data: event } = await supabaseAdmin
      .from("events")
      .select("title, description, location, starts_at, ends_at")
      .eq("id", eventId)
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

    // generar PDFs por ticket
    const attachments = await Promise.all(
      insertedTickets.map(async (ticket, index) => {
        const ticketType = ticketTypes.find(
          (t) => t.id === ticket.ticket_type_id,
        );

        const pdfBytes = await generateTicketPdf({
          ticketId: `Ref: ${ticket.qr_code}`,
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

        const sanitize = (text: string) =>
          text
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "");

        const fileName = `${sanitize(event?.title || "alter_ego")}_${sanitize(name)}_${index + 1}.pdf`;

        return {
          filename: fileName,
          content: Buffer.from(pdfBytes),
        };
      }),
    );

    // email
    const html = renderPurchaseEmail({
      name,
    });

    const { data, error: emailError } = await resend.emails.send({
      from: "ALTER EGO <tickets@alteregoexperience.org>",
      to: email,
      subject: "ALTER EGO - Tus entradas",
      html,
      attachments,
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

    // DEBUG DESARROLLO → ver PDF directamente
    if (process.env.NODE_ENV === "development" && attachments.length > 0) {
      return new NextResponse(attachments[0].content, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${attachments[0].filename}"`,
        },
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
