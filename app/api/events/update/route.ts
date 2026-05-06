import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkAuth } from "@/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  const isAuth = await checkAuth();

  if (!isAuth) {
    return new Response("Unauthorized", { status: 401 });
  }

  const {
    id,
    title,
    starts_at,
    ends_at,
    location,
    description,
    ticket_sales_start_at,
    is_visible,
  } = await req.json();

  if (!id) {
    return NextResponse.json(
      { error: "ID de evento obligatorio" },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from("events")
    .update({
      title: title?.trim(),
      starts_at,
      ends_at: ends_at || null,
      location: location || null,
      description: description || null,
      ticket_sales_start_at: ticket_sales_start_at || null,
      is_visible: Boolean(is_visible),
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
