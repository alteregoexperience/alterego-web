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
  const { name, instagram, slug } = await req.json();

  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!event) {
    return NextResponse.json(
      { error: "Evento no encontrado" },
      { status: 404 },
    );
  }

  if (!name || !name.trim()) {
    return NextResponse.json(
      { error: "El nombre es obligatorio" },
      { status: 400 },
    );
  }

  const normalizedName = name.trim();

  let normalizedInstagram: string | null = null;

  const ig = (instagram ?? "").trim();

  if (ig !== "") {
    const formatted = ig.startsWith("@") ? ig : `@${ig}`;
    normalizedInstagram = formatted.toLowerCase();
  }

  // comprobar duplicado EXACTO nombre + instagram

  let query = supabase
    .from("participants")
    .select("id")
    .eq("name", normalizedName);

  if (normalizedInstagram) {
    query = query.eq("instagram", normalizedInstagram);
  } else {
    query = query.is("instagram", null);
  }

  const { data: existing } = await query.limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json(
      { error: "Este participante ya existe" },
      { status: 409 },
    );
  }

  const { data: inserted, error: insertError } = await supabase
    .from("participants")
    .insert({
      name: normalizedName,
      instagram: normalizedInstagram,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const { error: relationError } = await supabase
    .from("event_participants")
    .insert({
      event_id: event.id,
      participant_id: inserted.id,
      points: 0,
    });

  if (relationError) {
    return NextResponse.json({ error: relationError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
