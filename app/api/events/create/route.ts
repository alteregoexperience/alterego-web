import { NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

function generateSlug(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function POST(req: Request) {
  const isAuth = await checkAuth();

  if (!isAuth) {
    return new Response("Unauthorized", { status: 401 });
  }

  const {
    title,
    starts_at,
    ends_at,
    location,
    description,
    ticket_sales_start_at,
    cover_image_url,
  } = await req.json();

  if (!title || !starts_at) {
    return NextResponse.json(
      { error: "Título y fecha son obligatorios" },
      { status: 400 },
    );
  }

  const slugBase = generateSlug(title);

  // comprobar slug duplicado
  let slug = slugBase;
  let counter = 1;

  while (true) {
    const { data } = await supabase
      .from("events")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (!data) break;

    slug = `${slugBase}-${counter}`;
    counter++;
  }

  const { error } = await supabase.from("events").insert({
    title: title.trim(),
    slug,
    starts_at,
    ends_at: ends_at || null,
    location: location || null,
    description: description || null,
    ticket_sales_start_at: ticket_sales_start_at || new Date().toISOString(),
    cover_image_url: cover_image_url || null,
    status: "upcoming",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
