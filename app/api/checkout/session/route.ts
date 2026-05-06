import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { stripe } from "@/lib/stripe";
import { getBaseUrl } from "@/lib/getBaseUrl";
import { PurchasePayload } from "@/types/Ticket";

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

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone: string) {
  return /^(\+34|0034)?[6-9]\d{8}$/.test(phone.replace(/\s/g, ""));
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

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Email no válido" }, { status: 400 });
    }

    if (!isValidPhone(phone)) {
      return NextResponse.json(
        { error: "Teléfono no válido" },
        { status: 400 },
      );
    }

    const age = calculateAge(birthdate);

    if (age < 18) {
      return NextResponse.json(
        { error: "Debes ser mayor de 18 años" },
        { status: 400 },
      );
    }

    const ticketTypeIds = items.map((item) => item.ticketTypeId);

    const { data: ticketTypes, error: ticketTypesError } = await supabaseAdmin
      .from("event_ticket_types")
      .select("*")
      .in("id", ticketTypeIds);

    if (ticketTypesError || !ticketTypes) {
      return NextResponse.json(
        { error: "Error obteniendo tipos de entrada" },
        { status: 500 },
      );
    }

    if (ticketTypes.length !== ticketTypeIds.length) {
      return NextResponse.json(
        { error: "Algunas entradas no existen" },
        { status: 400 },
      );
    }

    const { data: event, error: eventError } = await supabaseAdmin
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: "Evento no encontrado" },
        { status: 404 },
      );
    }

    const now = new Date();

    const salesStart = event.ticket_sales_start_at
      ? new Date(event.ticket_sales_start_at)
      : null;

    const salesEnd = event.ends_at
      ? new Date(event.ends_at)
      : new Date(event.starts_at);

    const isTicketingOpen =
      (!salesStart || now >= salesStart) && now <= salesEnd;

    if (!isTicketingOpen) {
      return NextResponse.json(
        { error: "La venta de entradas no está disponible" },
        { status: 400 },
      );
    }

    if (event.ticket_sales_start_at) {
      const salesStart = new Date(event.ticket_sales_start_at);
      const now = new Date();

      if (now < salesStart) {
        return NextResponse.json(
          { error: "La venta de entradas aún no ha comenzado" },
          { status: 400 },
        );
      }
    }

    let totalAmount = 0;

    const lineItems: {
      price_data: {
        currency: string;
        product_data: {
          name: string;
          description?: string;
        };
        unit_amount: number;
      };
      quantity: number;
    }[] = [];

    for (const item of items) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        return NextResponse.json(
          { error: "Cantidad no válida" },
          { status: 400 },
        );
      }

      const ticketType = ticketTypes.find((t) => t.id === item.ticketTypeId);

      if (!ticketType) {
        return NextResponse.json(
          { error: "Tipo de entrada no encontrado" },
          { status: 400 },
        );
      }

      if (ticketType.event_id !== eventId) {
        return NextResponse.json(
          { error: "Hay entradas que no pertenecen a este evento" },
          { status: 400 },
        );
      }

      if (ticketType.status !== "active") {
        return NextResponse.json(
          { error: `La entrada "${ticketType.name}" no está disponible` },
          { status: 400 },
        );
      }

      if (ticketType.stock !== null) {
        const available = ticketType.stock - (ticketType.sold || 0);

        if (item.quantity > available) {
          return NextResponse.json(
            { error: `Stock insuficiente para "${ticketType.name}"` },
            { status: 400 },
          );
        }
      }

      totalAmount += ticketType.price * item.quantity;

      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: {
            name: `${event.title} - ${ticketType.name}`,
            description: ticketType.description || undefined,
          },
          unit_amount: Math.round(Number(ticketType.price) * 100),
        },
        quantity: item.quantity,
      });
    }

    const baseUrl = getBaseUrl();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancel`,
      payment_method_types: ["card"],
      line_items: lineItems,
      customer_email: email,
      billing_address_collection: "auto",
      metadata: {
        eventId,
        buyerName: name,
        buyerBirthdate: birthdate,
        buyerEmail: email,
        buyerPhone: phone,
        items: JSON.stringify(items),
        totalAmount: totalAmount.toString(),
      },
      payment_intent_data: {
        metadata: {
          eventId,
          buyerEmail: email,
        },
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "No se pudo crear la sesión de pago" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    console.error("CHECKOUT SESSION ERROR:", error);

    return NextResponse.json(
      { error: "Error interno creando la sesión de pago" },
      { status: 500 },
    );
  }
}
