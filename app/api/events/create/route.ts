import { NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type InitialTicketType = {
  name?: string;
  description?: string;
  price?: string | number;
  stock?: string | number;
  unlimited?: boolean;
};

function generateSlug(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function POST(req: Request) {
  const isAuth = await checkAuth();

  if (!isAuth) {
    return new Response("Unauthorized", { status: 401 });
  }

  const {
    title,
    starts_at,
    ends_at,
    location,
    description,
    ticket_sales_start_at,
    ticket_sales_start_now,
    initial_ticket_types,
    cover_image_url,
    is_visible,
  } = await req.json();

  if (!title || !starts_at) {
    return NextResponse.json(
      { error: "Titulo y fecha son obligatorios" },
      { status: 400 },
    );
  }

  const initialTicketTypes = Array.isArray(initial_ticket_types)
    ? (initial_ticket_types as InitialTicketType[])
    : [];

  const salesStart = ticket_sales_start_now
    ? new Date().toISOString()
    : ticket_sales_start_at || new Date().toISOString();

  if (ticket_sales_start_now && initialTicketTypes.length === 0) {
    return NextResponse.json(
      {
        error:
          "Si la venta se abre ahora, debes crear al menos un tipo de entrada",
      },
      { status: 400 },
    );
  }

  const normalizedTicketTypes = initialTicketTypes.map((ticket, index) => ({
    name: String(ticket.name ?? "").trim(),
    description: String(ticket.description ?? "").trim() || null,
    price: Number(ticket.price),
    stock: ticket.unlimited ? null : Number(ticket.stock),
    sold: 0,
    status: "active",
    order_index: index,
  }));

  for (const ticket of normalizedTicketTypes) {
    if (!ticket.name || Number.isNaN(ticket.price) || ticket.price < 0) {
      return NextResponse.json(
        { error: "Revisa nombre y precio de las entradas" },
        { status: 400 },
      );
    }

    if (
      ticket.stock !== null &&
      (!Number.isInteger(ticket.stock) || ticket.stock < 0)
    ) {
      return NextResponse.json(
        { error: "El stock de las entradas debe ser un numero valido" },
        { status: 400 },
      );
    }
  }

  const slugBase = generateSlug(title);

  // comprobar slug duplicado
  let slug = slugBase;
  let counter = 1;

  while (true) {
    const { data } = await supabaseAdmin
      .from("events")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (!data) break;

    slug = `${slugBase}-${counter}`;
    counter++;
  }

  const { data: event, error } = await supabaseAdmin
    .from("events")
    .insert({
      title: title.trim(),
      slug,
      starts_at,
      ends_at: ends_at || null,
      location: location || null,
      description: description || null,
      ticket_sales_start_at: salesStart,
      cover_image_url: cover_image_url || null,
      status: "upcoming",
      is_visible: Boolean(is_visible),
    })
    .select("id")
    .single();

  if (error || !event) {
    return NextResponse.json(
      { error: error?.message || "No se pudo crear el evento" },
      { status: 500 },
    );
  }

  if (normalizedTicketTypes.length > 0) {
    const { error: ticketTypesError } = await supabaseAdmin
      .from("event_ticket_types")
      .insert(
        normalizedTicketTypes.map((ticket) => ({
          ...ticket,
          event_id: event.id,
        })),
      );

    if (ticketTypesError) {
      await supabaseAdmin.from("events").delete().eq("id", event.id);

      return NextResponse.json(
        { error: ticketTypesError.message },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ success: true });
}
