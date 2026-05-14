import Stripe from "stripe";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { handleSuccessfulPurchase } from "@/lib/handleSuccessfulPurchase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

function parseAttendeeNames(metadata: Stripe.Metadata) {
  const chunksCount = Number(metadata.attendeeNamesChunks ?? 0);

  if (!Number.isInteger(chunksCount) || chunksCount <= 0) {
    return undefined;
  }

  const serializedAttendeeNames = Array.from(
    { length: chunksCount },
    (_, index) => metadata[`attendeeNames_${index}`] ?? "",
  ).join("");
  const attendeeNames = JSON.parse(serializedAttendeeNames);

  if (!Array.isArray(attendeeNames)) {
    return undefined;
  }

  return attendeeNames.filter(
    (attendeeName): attendeeName is string =>
      typeof attendeeName === "string" && attendeeName.trim().length > 0,
  );
}

export async function POST(req: Request) {
  const body = await req.text();
  const sig = (await headers()).get("stripe-signature");

  if (!sig) {
    return new Response("No signature", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error("❌ Signature error:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const sessionId = session.id;
    const metadata = session.metadata;

    if (!metadata) {
      console.error("❌ No metadata");
      return new Response("No metadata", { status: 400 });
    }

    try {
      // evitar duplicados
      const { data: existing } = await supabaseAdmin
        .from("orders")
        .select("id")
        .eq("stripe_checkout_session_id", sessionId)
        .maybeSingle();

      if (existing) {
        console.log("Ya procesado:", sessionId);
        return new Response("ok", { status: 200 });
      }

      await handleSuccessfulPurchase({
        eventId: metadata.eventId,
        buyer: {
          name: metadata.buyerName,
          birthdate: metadata.buyerBirthdate,
          email: metadata.buyerEmail,
          phone: metadata.buyerPhone,
        },
        items: JSON.parse(metadata.items),
        attendeeNames: parseAttendeeNames(metadata),
        sessionId,
      });

      console.log("Compra procesada:", sessionId);
    } catch (err) {
      console.error("Error procesando compra:", err);
      return new Response("Error handled", { status: 200 });
    }
  }

  return new Response("ok", { status: 200 });
}
