import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const { eventId, email } = await req.json();
    const normalizedEmail = String(email ?? "").trim().toLowerCase();

    if (!eventId || !emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: "Introduce un email valido" },
        { status: 400 },
      );
    }

    const { data: event, error: eventError } = await supabaseAdmin
      .from("events")
      .select("id, is_visible, ticket_sales_start_at")
      .eq("id", eventId)
      .single();

    if (eventError || !event || event.is_visible !== true) {
      return NextResponse.json(
        { error: "Evento no disponible" },
        { status: 404 },
      );
    }

    if (
      !event.ticket_sales_start_at ||
      new Date(event.ticket_sales_start_at) <= new Date()
    ) {
      return NextResponse.json(
        {
          error: "La venta de entradas ya esta disponible",
          code: "SALE_ALREADY_OPEN",
        },
        { status: 400 },
      );
    }

    const { data: existingReminder, error: existingError } =
      await supabaseAdmin
        .from("ticket_sale_reminders")
        .select("id")
        .eq("event_id", eventId)
        .eq("email", normalizedEmail)
        .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        { error: existingError.message },
        { status: 500 },
      );
    }

    if (existingReminder) {
      return NextResponse.json({ success: true });
    }

    const { error } = await supabaseAdmin.from("ticket_sale_reminders").insert({
      event_id: eventId,
      email: normalizedEmail,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "No se pudo guardar el recordatorio" },
      { status: 500 },
    );
  }
}
