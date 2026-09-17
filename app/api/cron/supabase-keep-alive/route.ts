import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET no configurado" },
      { status: 500 },
    );
  }

  if (req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Hobby allows one run per day; make a few real, read-only DB requests.
    // force-dynamic prevents caching, and an empty events table is also valid.
    for (let query = 0; query < 3; query++) {
      const { error } = await supabaseAdmin
        .from("events")
        .select("id")
        .limit(1)
        .abortSignal(AbortSignal.timeout(10_000));

      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("SUPABASE KEEP-ALIVE ERROR:", error);
    return NextResponse.json(
      { error: "No se pudo completar la actividad de Supabase" },
      { status: 500 },
    );
  }
}
