import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  const { name, instagram } = await req.json();

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

  const { error } = await supabase.from("participants").insert({
    name: normalizedName,
    instagram: normalizedInstagram,
    points: 0,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
