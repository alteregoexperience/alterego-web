import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { handleSuccessfulPurchase } from "@/lib/handleSuccessfulPurchase";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("No signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object as Stripe.Checkout.Session;
    try {
      await handleSuccessfulPurchase(session.id);
    } catch (error) {
      console.error("Error procesando compra:", session.id, error);
      // Stripe reintenta. Ademas, el cron recupera pagos y correos pendientes.
      return new Response("Error processing purchase", { status: 500 });
    }
  }
  return new Response("ok", { status: 200 });
}
