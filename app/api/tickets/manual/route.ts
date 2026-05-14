import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";

import { checkAuth } from "@/lib/auth";
import { generateTicketPdf } from "@/lib/generateTicketPdf";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Ticket } from "@/types/Ticket";

type ManualTicketPayload = {
  eventId?: string;
  ticketTypeId?: string;
  quantity?: number;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
};

const sanitizeFilePart = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

export async function POST(req: Request) {
  const isAuth = await checkAuth();

  if (!isAuth) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = (await req.json()) as ManualTicketPayload;
    const eventId = body.eventId?.trim();
    const ticketTypeId = body.ticketTypeId?.trim();
    const quantity = Number(body.quantity ?? 1);
    const buyerName = body.buyerName?.trim().replace(/\s+/g, " ") ?? "";
    const buyerEmail = body.buyerEmail?.trim() ?? "";
    const buyerPhone = body.buyerPhone?.trim() ?? "";

    if (!eventId || !ticketTypeId || !buyerName) {
      return NextResponse.json(
        { error: "Evento, tipo de entrada y nombre son obligatorios" },
        { status: 400 },
      );
    }

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
      return NextResponse.json(
        { error: "La cantidad debe estar entre 1 y 50" },
        { status: 400 },
      );
    }

    const { data: event, error: eventError } = await supabaseAdmin
      .from("events")
      .select("id, title, location, starts_at, ends_at")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: "Evento no encontrado" },
        { status: 404 },
      );
    }

    const { data: ticketType, error: ticketTypeError } = await supabaseAdmin
      .from("event_ticket_types")
      .select("id, event_id, name, price, stock, sold, status")
      .eq("id", ticketTypeId)
      .eq("event_id", eventId)
      .single();

    if (ticketTypeError || !ticketType) {
      return NextResponse.json(
        { error: "Tipo de entrada no encontrado" },
        { status: 404 },
      );
    }

    if (ticketType.status && ticketType.status !== "active") {
      return NextResponse.json(
        { error: "Este tipo de entrada no esta activo" },
        { status: 400 },
      );
    }

    if (ticketType.stock !== null) {
      const available = Number(ticketType.stock) - Number(ticketType.sold ?? 0);

      if (quantity > available) {
        return NextResponse.json(
          { error: "Stock insuficiente" },
          { status: 400 },
        );
      }
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        event_id: eventId,
        buyer_name: buyerName,
        buyer_birthdate: "1900-01-01",
        buyer_email: buyerEmail,
        buyer_phone: buyerPhone,
        total_amount: 0,
        status: "paid",
        fulfilled_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Error creando la orden manual" },
        { status: 500 },
      );
    }

    const ticketsToInsert: Omit<
      Ticket,
      "id" | "used" | "used_at" | "created_at"
    >[] = Array.from({ length: quantity }, () => ({
      order_id: order.id,
      event_id: eventId,
      ticket_type_id: ticketTypeId,
      qr_code: crypto.randomUUID(),
    }));

    const { data: insertedTickets, error: ticketsError } = await supabaseAdmin
      .from("tickets")
      .insert(ticketsToInsert)
      .select("id, ticket_type_id, qr_code");

    if (ticketsError || !insertedTickets) {
      return NextResponse.json(
        { error: "Error creando las entradas" },
        { status: 500 },
      );
    }

    const { error: incrementError } = await supabaseAdmin.rpc(
      "increment_ticket_sold",
      {
        p_ticket_type_id: ticketTypeId,
        p_qty: quantity,
      },
    );

    if (incrementError) {
      return NextResponse.json(
        { error: "Entradas creadas, pero no se pudo actualizar el stock" },
        { status: 500 },
      );
    }

    const mergedPdf = await PDFDocument.create();
    const eventDate = new Date(event.starts_at).toLocaleDateString("es-ES");
    const startTime = new Date(event.starts_at).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const endTime = event.ends_at
      ? new Date(event.ends_at).toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";
    const eventTime = endTime ? `${startTime} - ${endTime}` : startTime;

    for (const [index, ticket] of insertedTickets.entries()) {
      const ticketPdfBytes = await generateTicketPdf({
        ticketId: ticket.qr_code,
        buyerName,
        buyerEmail,
        buyerPhone,
        eventName: event.title,
        eventLocation: event.location ?? "",
        eventDate,
        eventTime,
        price: Number(ticketType.price ?? 0),
        ticketType: ticketType.name,
        ticketNumber: index + 1,
        totalTickets: insertedTickets.length,
      });

      const ticketPdf = await PDFDocument.load(ticketPdfBytes);
      const pages = await mergedPdf.copyPages(
        ticketPdf,
        ticketPdf.getPageIndices(),
      );

      pages.forEach((page) => mergedPdf.addPage(page));
    }

    const pdfBytes = await mergedPdf.save();
    const fileName = `${sanitizeFilePart(event.title || "alter_ego")}_${sanitizeFilePart(buyerName)}_${quantity}_entradas.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Error inesperado generando entradas manuales" },
      { status: 500 },
    );
  }
}
