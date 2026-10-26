import { handleSuccessfulPurchase } from "@/lib/handleSuccessfulPurchase";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Los reintentos de Stripe cubren los fallos inmediatos. Esta conciliacion
// cubre tambien notificaciones perdidas y envios pendientes de dias anteriores.
export async function reconcileStripePurchases(budgetMs = 50_000) {
  const deadline = Date.now() + budgetMs;
  const attempted = new Set<string>();
  const result = {
    sent: 0,
    failed: 0,
    pending: 0,
    scanned: 0,
    scanComplete: false,
  };
  async function process(sessionId: string) {
    if (attempted.has(sessionId)) return;
    attempted.add(sessionId);
    try {
      const purchase = await handleSuccessfulPurchase(sessionId);
      if (purchase.status === "sent") result.sent++;
      if (purchase.status === "pending") result.pending++;
    } catch (error) {
      result.failed++;
      console.error("Compra pendiente de recuperar:", sessionId, error);
    }
  }

  const { data: pending, error: pendingError } = await supabaseAdmin
    .from("orders")
    .select("stripe_checkout_session_id")
    .eq("status", "paid")
    .eq("ticket_email_pending", true)
    .not("stripe_checkout_session_id", "is", null)
    .order("fulfillment_last_attempt_at", { ascending: true, nullsFirst: true })
    .limit(100);
  if (pendingError)
    throw new Error(
      `Error consultando compras pendientes: ${pendingError.message}`,
    );
  for (const order of pending ?? []) {
    if (Date.now() >= deadline) return result;
    await process(order.stripe_checkout_session_id);
  }

  let startingAfter: string | undefined;
  do {
    if (Date.now() >= deadline) return result;
    const page = await stripe.checkout.sessions.list({
      status: "complete",
      created: { gte: Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60 },
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    const sessions = page.data.filter(
      (session) =>
        session.payment_status === "paid" &&
        session.metadata?.eventId &&
        session.metadata?.items,
    );
    const ids = sessions.map((session) => session.id);
    const { data: orders, error } = ids.length
      ? await supabaseAdmin
          .from("orders")
          .select(
            "stripe_checkout_session_id,stripe_session_id,fulfilled_at,ticket_email_pending,tickets(count)",
          )
          .in("stripe_checkout_session_id", ids)
      : { data: [], error: null };
    if (error)
      throw new Error(`Error conciliando pagos de Stripe: ${error.message}`);
    for (const session of sessions) {
      if (Date.now() >= deadline) return result;
      result.scanned++;
      const order = orders?.find(
        (candidate) =>
          candidate.stripe_checkout_session_id === session.id ||
          candidate.stripe_session_id === session.id,
      );
      let expected = 0;
      try {
        expected = JSON.parse(session.metadata!.items).reduce(
          (sum: number, item: { quantity: number }) => sum + item.quantity,
          0,
        );
      } catch {
        /* El procesador registra el error con el identificador de Stripe. */
      }
      if (
        !order ||
        order.ticket_email_pending ||
        !order.fulfilled_at ||
        order.tickets?.[0]?.count !== expected
      ) {
        await process(session.id);
      }
    }
    if (!page.has_more) {
      result.scanComplete = true;
      return result;
    }
    startingAfter = page.data.at(-1)?.id;
  } while (startingAfter);
  return result;
}
