import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const sessionId = new URL(req.url).searchParams.get("session_id") ?? "";
  const response = (status: string, code = 200) =>
    NextResponse.json(
      { status },
      { status: code, headers: { "Cache-Control": "no-store" } },
    );
  if (!/^cs_(live|test)_[a-zA-Z0-9]+$/.test(sessionId))
    return response("invalid", 400);
  try {
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("status,fulfilled_at,ticket_email_pending,ticket_email_sent_at")
      .eq("stripe_checkout_session_id", sessionId)
      .maybeSingle();
    if (error) throw new Error("No se pudo consultar el pedido");
    if (order?.status === "paid") {
      if (order.ticket_email_sent_at) return response("sent");
      if (order.fulfilled_at && !order.ticket_email_pending)
        return response("issued");
      return response("processing");
    }
    // Verificar solo el estado; esta pagina nunca crea pedidos ni cobra.
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return response(
      session.payment_status === "paid" ? "processing" : "unpaid",
    );
  } catch {
    return response("unavailable", 503);
  }
}
