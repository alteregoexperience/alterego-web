import { NextResponse } from "next/server";

import { checkAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

async function requireAuth() {
  const isAuth = await checkAuth();

  if (!isAuth) {
    return new Response("Unauthorized", { status: 401 });
  }

  return null;
}

export async function GET(req: Request) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "slug requerido" }, { status: 400 });
  }

  const { data: event, error: eventError } = await supabaseAdmin
    .from("events")
    .select("id")
    .eq("slug", slug)
    .single();

  if (eventError || !event) {
    return NextResponse.json(
      { error: "Evento no encontrado" },
      { status: 404 },
    );
  }

  const { data: tickets, error: ticketsError } = await supabaseAdmin
    .from("event_ticket_types")
    .select("*")
    .eq("event_id", event.id)
    .order("order_index", { ascending: true });

  if (ticketsError) {
    return NextResponse.json({ error: ticketsError.message }, { status: 500 });
  }

  return NextResponse.json({
    eventId: event.id,
    tickets: tickets ?? [],
  });
}

export async function POST(req: Request) {
  const authError = await requireAuth();
  if (authError) return authError;

  const body = await req.json();

  if (!body.eventId || !body.name) {
    return NextResponse.json(
      { error: "eventId y name son obligatorios" },
      { status: 400 },
    );
  }

  const { error } = await supabaseAdmin.from("event_ticket_types").insert({
    event_id: body.eventId,
    name: String(body.name).trim(),
    description: body.description || null,
    price: Number(body.price),
    stock: body.unlimited ? null : Number(body.stock),
    sold: 0,
    status: "active",
    order_index: Number(body.orderIndex ?? 0),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(req: Request) {
  const authError = await requireAuth();
  if (authError) return authError;

  const body = await req.json();

  if (Array.isArray(body.orderUpdates)) {
    for (const update of body.orderUpdates) {
      const { error } = await supabaseAdmin
        .from("event_ticket_types")
        .update({ order_index: Number(update.order_index) })
        .eq("id", update.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  }

  if (!body.id) {
    return NextResponse.json({ error: "id requerido" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("event_ticket_types")
    .update({
      name: String(body.name ?? "").trim(),
      description: body.description || null,
      price: Number(body.price),
      stock: body.unlimited ? null : Number(body.stock),
    })
    .eq("id", body.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "id requerido" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("event_ticket_types")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
