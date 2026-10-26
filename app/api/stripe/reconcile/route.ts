import { NextResponse } from "next/server";
import { reconcileStripePurchases } from "@/lib/reconcileStripePurchases";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    const result = await reconcileStripePurchases();
    return NextResponse.json(result, {
      status: result.failed || !result.scanComplete ? 503 : 200,
    });
  } catch (error) {
    console.error("Error conciliando compras Stripe:", error);
    return NextResponse.json(
      { error: "No se pudo completar la conciliacion" },
      { status: 500 },
    );
  }
}
