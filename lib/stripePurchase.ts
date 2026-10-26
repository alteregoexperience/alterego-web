import type Stripe from "stripe";

import { stripe } from "@/lib/stripe";
import type { PurchasePayload } from "@/types/Ticket";

export type PaidStripePurchase = PurchasePayload & {
  sessionId: string;
  paymentIntentId: string | null;
  totalAmount: number;
  unitPrices: number[];
};

// Los nombres son auxiliares: un nombre antiguo mal serializado no debe
// impedir emitir una compra pagada. Se conserva el comprador como alternativa.
function attendeeNames(metadata: Stripe.Metadata) {
  try {
    const count = Number(metadata.attendeeNamesChunks ?? 0);
    if (!Number.isInteger(count) || count < 1 || count > 40) return [];
    const value: unknown = JSON.parse(
      Array.from(
        { length: count },
        (_, i) => metadata[`attendeeNames_${i}`] ?? "",
      ).join(""),
    );
    return Array.isArray(value)
      ? value.map((name) => (typeof name === "string" ? name.trim() : ""))
      : [];
  } catch {
    return [];
  }
}

export async function getPaidStripePurchase(
  sessionId: string,
): Promise<PaidStripePurchase | null> {
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  // completed tambien puede llegar antes del cobro de un metodo diferido.
  if (
    session.mode !== "payment" ||
    session.status !== "complete" ||
    session.payment_status !== "paid"
  ) {
    return null;
  }

  const metadata = session.metadata;
  if (!metadata?.eventId || !metadata.items)
    throw new Error("La compra pagada no contiene los datos del evento");
  const parsed: unknown = JSON.parse(metadata.items);
  if (!Array.isArray(parsed) || parsed.length === 0)
    throw new Error("La compra pagada no contiene entradas");
  const items = parsed.map((item) => {
    if (
      !item ||
      typeof item.ticketTypeId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        item.ticketTypeId,
      ) ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity <= 0
    )
      throw new Error("Las entradas de Stripe no son validas");
    return {
      ticketTypeId: item.ticketTypeId as string,
      quantity: item.quantity as number,
    };
  });

  const lines: Stripe.LineItem[] = [];
  for await (const line of stripe.checkout.sessions.listLineItems(sessionId, {
    limit: 100,
  }))
    lines.push(line);
  if (
    lines.length !== items.length ||
    lines.some((line, i) => line.quantity !== items[i].quantity)
  ) {
    throw new Error(
      "Las cantidades cobradas por Stripe no coinciden con las entradas",
    );
  }
  if (
    session.currency !== "eur" ||
    !Number.isSafeInteger(session.amount_total) ||
    Number(session.amount_total) < 0
  ) {
    throw new Error("Importe o moneda de Stripe no validos");
  }
  const buyer = {
    name: metadata.buyerName?.trim().replace(/\s+/g, " "),
    birthdate: metadata.buyerBirthdate,
    email: metadata.buyerEmail?.trim(),
    phone: metadata.buyerPhone ?? "",
  };
  if (!buyer.name || !buyer.birthdate || !buyer.email)
    throw new Error("Faltan datos del comprador en Stripe");

  return {
    eventId: metadata.eventId,
    buyer,
    items,
    attendeeNames: attendeeNames(metadata),
    sessionId,
    paymentIntentId:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : (session.payment_intent?.id ?? null),
    totalAmount: Number(session.amount_total) / 100,
    // Precio cobrado, independiente de cambios posteriores en el catalogo.
    unitPrices: lines.map(
      (line, i) => line.amount_total / items[i].quantity / 100,
    ),
  };
}
